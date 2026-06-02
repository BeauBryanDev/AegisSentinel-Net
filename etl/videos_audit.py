import os
import json
import subprocess
import pandas as pd
from pathlib import Path
from tabulate import tabulate
from datetime import datetime
 
# ============================================================
# CONFIGURACION
# ============================================================

# Set the base directory to ~/Downloads/Aegis
DOWNLOADS = Path.home() / "Downloads" / "Aegis"

# Directorios a auditar (dentro de DOWNLOADS)
# El script los busca recursivamente, no importa la estructura interna
DATASET_DIRS = [
    "RWF_2000",
    "hockeyFights",
    "Peliculas",
    "standardVideos1",
    "standardVideos2",
    "REAL_LIFE_VIOLENCE",
    "fight_detection_cctv",
]
 
OUTPUT_DIR = DOWNLOADS / "aegis_audit"
OUTPUT_CSV = OUTPUT_DIR / "audit_full.csv"
OUTPUT_REPORT = OUTPUT_DIR / "audit_report.txt"
OUTPUT_WARNINGS = OUTPUT_DIR / "audit_warnings.txt"
 
# Extensiones de video validas
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
 
# Palabras clave para inferir label desde el path del directorio
VIOLENCE_KEYWORDS = {
    "fight", "violence", "violent", "fights",
    "train_fight", "val_fight", "hockey"
}
NO_VIOLENCE_KEYWORDS = {
    "nonfight", "nonviolent", "no_violence", "non_violent",
    "noviolence", "no-violence", "nofight", "no_fight",
    "train_nonfight", "val_nonfight"
}
 
 
# ============================================================
# INFERENCIA DE LABEL DESDE PATH
# ============================================================
 
def infer_label(video_path: Path) -> str:
    """
    Infiere el label (Violence / No-Violence) desde los nombres
    de los directorios padres del video.
 
    Estrategia: revisa todos los componentes del path desde el
    directorio hoja hacia arriba. El primer match gana.
    """
    parts = [p.lower() for p in video_path.parts]
 
    for part in reversed(parts):
        # Limpiar separadores y variantes
        clean = part.replace("-", "").replace("_", "").replace(" ", "")
 
        for kw in NO_VIOLENCE_KEYWORDS:
            kw_clean = kw.replace("-", "").replace("_", "")
            if kw_clean in clean:
                return "No-Violence"
 
        for kw in VIOLENCE_KEYWORDS:
            kw_clean = kw.replace("-", "").replace("_", "")
            if kw_clean in clean:
                return "Violence"
 
    return "Unknown"
 
 
def infer_split(video_path: Path) -> str:
    """Infiere si el video es de train o val desde el path."""
    parts = [p.lower() for p in video_path.parts]
    for part in parts:
        if "val" in part:
            return "val"
        if "train" in part:
            return "train"
    return "all"
 
 
# ============================================================
# EXTRACCION DE METADATOS CON FFPROBE
# ============================================================
 
def get_video_metadata(video_path: Path) -> dict:
    """
    Usa ffprobe para extraer metadatos del video sin decodificar frames.
    Retorna un diccionario con los campos relevantes.
    Tiempo por video: ~50-100ms.
    """
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        str(video_path)
    ]
 
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=15
        )
 
        if result.returncode != 0:
            return {"error": f"ffprobe error: {result.stderr[:100]}"}
 
        data = json.loads(result.stdout)
 
        # Extraer stream de video (ignorar audio)
        video_stream = None
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                video_stream = stream
                break
 
        if not video_stream:
            return {"error": "no video stream found"}
 
        fmt = data.get("format", {})
 
        # Calcular FPS desde r_frame_rate (ej: "30000/1001" -> 29.97)
        fps_raw = video_stream.get("r_frame_rate", "0/1")
        try:
            num, den = fps_raw.split("/")
            fps = round(int(num) / int(den), 2) if int(den) != 0 else 0.0
        except (ValueError, ZeroDivisionError):
            fps = 0.0
 
        # Duracion: priorizar format sobre stream (mas confiable)
        duration = float(fmt.get("duration", 0) or
                         video_stream.get("duration", 0) or 0)
 
        # Numero de frames: calcular desde duracion x fps si nb_frames no existe
        nb_frames_raw = video_stream.get("nb_frames", "")
        if nb_frames_raw and nb_frames_raw.isdigit():
            nb_frames = int(nb_frames_raw)
        else:
            nb_frames = int(duration * fps) if fps > 0 else 0
 
        return {
            "duration_sec":  round(duration, 2),
            "fps":           fps,
            "width":         int(video_stream.get("width", 0)),
            "height":        int(video_stream.get("height", 0)),
            "codec":         video_stream.get("codec_name", "unknown"),
            "nb_frames":     nb_frames,
            "size_mb":       round(int(fmt.get("size", 0)) / (1024 * 1024), 2),
            "bitrate_kbps":  round(int(fmt.get("bit_rate", 0)) / 1000, 1),
            "error":         None,
        }
 
    except subprocess.TimeoutExpired:
        return {"error": "ffprobe timeout"}
    except json.JSONDecodeError:
        return {"error": "ffprobe json parse error"}
    except Exception as e:
        return {"error": str(e)[:100]}
 
 
# ============================================================
# SCAN RECURSIVO DE DIRECTORIOS
# ============================================================
 
def scan_dataset(dataset_name: str, dataset_path: Path) -> list:
    """
    Recorre recursivamente el directorio y audita cada video encontrado.
    Retorna lista de diccionarios con todos los metadatos.
    """
    records = []
    video_files = [
        p for p in dataset_path.rglob("*")
        if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS
    ]
 
    total = len(video_files)
    print(f"\n[{dataset_name}] {total} videos encontrados en {dataset_path}")
 
    for i, video_path in enumerate(sorted(video_files), 1):
        if i % 100 == 0 or i == total:
            print(f"  [{dataset_name}] Procesando {i}/{total}...")
 
        meta = get_video_metadata(video_path)
        label = infer_label(video_path)
        split = infer_split(video_path)
 
        record = {
            "dataset":       dataset_name,
            "split":         split,
            "label":         label,
            "filename":      video_path.name,
            "relative_path": str(video_path.relative_to(DOWNLOADS)),
            "extension":     video_path.suffix.lower(),
            **meta,
        }
        records.append(record)
 
    return records
 
 
# ============================================================
# GENERACION DEL REPORTE
# ============================================================
 
def generate_report(df: pd.DataFrame) -> str:
    """Genera un reporte estadistico legible por dataset."""
    lines = []
    lines.append("=" * 70)
    lines.append("AegisSentinel-Net — Dataset Audit Report")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 70)
 
    # Resumen global
    df_clean = df[df["error"].isna()]
    lines.append(f"\nTOTAL VIDEOS FOUND    : {len(df):,}")
    lines.append(f"VIDEOS WITH ERRORS    : {df['error'].notna().sum():,}")
    lines.append(f"VIDEOS OK             : {len(df_clean):,}")
 
    lines.append(f"\nLABEL DISTRIBUTION:")
    label_counts = df["label"].value_counts()
    for label, count in label_counts.items():
        pct = count / len(df) * 100
        lines.append(f"  {label:<20}: {count:>5} videos ({pct:.1f}%)")
 
    # Estadisticas por dataset
    lines.append("\n" + "=" * 70)
    lines.append("STATISTICS BY DATASET")
    lines.append("=" * 70)
 
    for dataset_name in df["dataset"].unique():
        sub = df[df["dataset"] == dataset_name]
        sub_clean = sub[sub["error"].isna()]
 
        lines.append(f"\n--- {dataset_name} ---")
        lines.append(f"  Total videos   : {len(sub):,}")
        lines.append(f"  Errors         : {sub['error'].notna().sum():,}")
 
        # Label distribution
        label_dist = sub["label"].value_counts()
        for label, count in label_dist.items():
            lines.append(f"  {label:<20}: {count:,}")
 
        if len(sub_clean) == 0:
            lines.append("  (no valid videos for statistics)")
            continue
 
        # Duracion
        dur = sub_clean["duration_sec"]
        lines.append(f"\n  DURATION (seconds):")
        lines.append(f"    min    : {dur.min():.1f}s")
        lines.append(f"    max    : {dur.max():.1f}s")
        lines.append(f"    mean   : {dur.mean():.1f}s")
        lines.append(f"    median : {dur.median():.1f}s")
        lines.append(f"    total  : {dur.sum() / 60:.1f} minutes")
 
        # FPS
        fps = sub_clean["fps"]
        lines.append(f"\n  FPS:")
        lines.append(f"    min    : {fps.min():.1f}")
        lines.append(f"    max    : {fps.max():.1f}")
        lines.append(f"    mean   : {fps.mean():.1f}")
 
        fps_dist = sub_clean["fps"].round(0).value_counts().head(5)
        lines.append(f"    distribution (top 5): {fps_dist.to_dict()}")
 
        # Resolucion
        lines.append(f"\n  RESOLUTION:")
        res_dist = (
            sub_clean["width"].astype(str) + "x" + sub_clean["height"].astype(str)
        ).value_counts().head(5)
        for res, count in res_dist.items():
            lines.append(f"    {res:<15}: {count:,} videos")
 
        # Tamano
        size = sub_clean["size_mb"]
        lines.append(f"\n  FILE SIZE (MB):")
        lines.append(f"    min    : {size.min():.1f} MB")
        lines.append(f"    max    : {size.max():.1f} MB")
        lines.append(f"    mean   : {size.mean():.1f} MB")
        lines.append(f"    total  : {size.sum():.0f} MB ({size.sum()/1024:.1f} GB)")
 
        # Frames
        frames = sub_clean["nb_frames"]
        lines.append(f"\n  FRAMES PER VIDEO:")
        lines.append(f"    min    : {frames.min():.0f}")
        lines.append(f"    max    : {frames.max():.0f}")
        lines.append(f"    mean   : {frames.mean():.0f}")
 
        # Codec
        codec_dist = sub_clean["codec"].value_counts()
        lines.append(f"\n  CODECS: {codec_dist.to_dict()}")
 
    # Outliers globales: videos muy cortos o muy largos
    lines.append("\n" + "=" * 70)
    lines.append("OUTLIERS — Videos con duracion fuera de rango [2s, 35s]")
    lines.append("=" * 70)
    outliers = df_clean[
        (df_clean["duration_sec"] < 2.0) |
        (df_clean["duration_sec"] > 35.0)
    ][["dataset", "label", "filename", "duration_sec", "fps", "size_mb"]]
 
    if len(outliers) > 0:
        lines.append(f"\n{len(outliers)} outliers encontrados:")
        lines.append(tabulate(
            outliers.head(30),
            headers="keys",
            tablefmt="simple",
            showindex=False
        ))
    else:
        lines.append("\nNingun outlier encontrado. Todos los videos en rango normal.")
 
    # Videos con label Unknown
    lines.append("\n" + "=" * 70)
    lines.append("VIDEOS CON LABEL DESCONOCIDO")
    lines.append("=" * 70)
    unknown = df[df["label"] == "Unknown"][
        ["dataset", "filename", "relative_path"]
    ]
    if len(unknown) > 0:
        lines.append(f"\n{len(unknown)} videos sin label inferible:")
        lines.append(tabulate(
            unknown.head(20),
            headers="keys",
            tablefmt="simple",
            showindex=False
        ))
    else:
        lines.append("\nTodos los videos tienen label inferido correctamente.")
 
    return "\n".join(lines)
 
 
# ============================================================
# MAIN
# ============================================================
 
def main():
    print("=" * 70)
    print("AegisSentinel-Net — Dataset Audit")
    print("=" * 70)
 
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
 
    all_records = []
    missing_dirs = []
 
    for dataset_name in DATASET_DIRS:
        dataset_path = DOWNLOADS / dataset_name
 
        if not dataset_path.exists():
            print(f"\n[WARNING] Directorio no encontrado: {dataset_path}")
            print(f"          Si aun no descargaste {dataset_name}, ignoralo por ahora.")
            missing_dirs.append(dataset_name)
            continue
 
        records = scan_dataset(dataset_name, dataset_path)
        all_records.extend(records)
 
    if not all_records:
        print("\n[ERROR] No se encontraron videos. Verifica los directorios.")
        return
 
    # Construir DataFrame
    df = pd.DataFrame(all_records)
 
    # Asegurar que columnas de error existan
    if "error" not in df.columns:
        df["error"] = None
 
    # Guardar CSV completo
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    print(f"\n[OK] CSV guardado: {OUTPUT_CSV}")
    print(f"     Total registros: {len(df):,}")
 
    # Generar reporte
    report = generate_report(df)
    with open(OUTPUT_REPORT, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[OK] Reporte guardado: {OUTPUT_REPORT}")
 
    # Guardar warnings separados
    warnings_df = df[df["error"].notna()]
    if len(warnings_df) > 0:
        warnings_df.to_csv(OUTPUT_WARNINGS, index=False, encoding="utf-8")
        print(f"[WARN] {len(warnings_df)} videos con errores: {OUTPUT_WARNINGS}")
 
    if missing_dirs:
        print(f"\n[INFO] Directorios no encontrados (descargar despues): {missing_dirs}")
 
    # Preview en consola
    print("\n" + "=" * 70)
    print("RESUMEN RAPIDO")
    print("=" * 70)
    print(report[:2000])  # Primeras lineas del reporte en consola
 
    print(f"\n[DONE] Auditoria completa.")
    print(f"       Revisa el reporte completo en: {OUTPUT_REPORT}")
 
 
if __name__ == "__main__":
    main()