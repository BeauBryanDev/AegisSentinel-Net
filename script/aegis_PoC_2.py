import yt_dlp

def download_video(url_video):
    # Configuración para descargar la mejor calidad de video y audio combinados
    options = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': '%(title)s.%(ext)s',  # Guarda el archivo con el título del video
    }

    try:
        print("Iniciando la descarga...")
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url_video])
        print("¡Descarga completada con éxito!")
    except Exception as e:
        print(f"Ocurrió un error: {e}")
        
        
VIDEO_URL =  "https://www.youtube.com/watch?v=5QBZ3ZAWxQE"

download_video(VIDEO_URL)

import glob
import os

# Remove any existing .mp4 files from the root content directory
for f in glob.glob('/content/*.mp4'):
    os.remove(f)
print('Cleaned up old video files from /content/')


import cv2
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from pathlib import Path
from collections import deque
from tqdm import tqdm
import time
import warnings

import sys
import warnings

try:
    # Force a clean reload of onnxruntime if it was previously imported
    if 'onnxruntime' in sys.modules:
        del sys.modules['onnxruntime']
    import onnxruntime as ort

    print(f"[OK] ONNX Runtime version: {ort.__version__}")
    print(f"[OK] Available providers: {ort.get_available_providers()}")

except ImportError:
    raise ImportError("pip install onnxruntime-gpu")
except AttributeError as e:
    warnings.warn(f"[WARNING] Failed to get ONNX Runtime version or providers: {e}.")
    
    
from pathlib import Path
import numpy as np # Adding import for np if it's not globally available in this execution context

class AegisONNXModel:
    """
    Wrapper del modelo AegisSentinel exportado a ONNX.
    Maneja la sesion de ONNX Runtime y la inferencia.
    """

    def __init__(self, onnx_path: Path):
        if not onnx_path.exists():
            raise FileNotFoundError(
                f"Modelo no encontrado: {onnx_path}\n"
                f"Verifica que ONNX_PATH en Config apunta al archivo correcto."
            )

        # Configurar providers: GPU si esta disponible, CPU como fallback
        providers = []
        available = ort.get_available_providers()

        if "CUDAExecutionProvider" in available:
            providers.append("CUDAExecutionProvider")
            print("[MODEL] Usando GPU (CUDA)")
        else:
            print("[MODEL] GPU no disponible, usando CPU")

        providers.append("CPUExecutionProvider")

        self.session = ort.InferenceSession(str(onnx_path), providers=providers)
        self.input_name  = self.session.get_inputs()[0].name
        self.output_names = [o.name for o in self.session.get_outputs()]

        print(f"[MODEL] Cargado: {onnx_path.name} ({onnx_path.stat().st_size / 1e6:.1f} MB)")
        print(f"[MODEL] Input : {self.input_name} {self.session.get_inputs()[0].shape}")
        print(f"[MODEL] Outputs: {self.output_names}")

    def predict(self, frames_tensor: np.ndarray) -> tuple:
        """
        Ejecuta inferencia sobre un clip de N frames.

        frames_tensor: numpy array shape (1, N_FRAMES, 3, 224, 224) float32
        Retorna: (violence_prob float, attention_weights array shape (N_FRAMES,))
        """
        outputs = self.session.run(
            self.output_names,
            {self.input_name: frames_tensor}
        )

        # Aplicar sigmoid al logit para obtener probabilidad [0, 1]
        logit        = outputs[0][0][0]
        violence_prob = float(1 / (1 + np.exp(-logit)))

        attention_weights = outputs[1][0]  # shape (N_FRAMES,)

        return violence_prob, attention_weights
 
    
from google.colab import drive

drive.mount('/content/drive', force_remount=False)

try:
    import onnxruntime as ort
    print(f"[OK] ONNX Runtime version: {ort.__version__}")
except ImportError:
    raise ImportError("pip install onnxruntime-gpu")


from pathlib import Path
import numpy as np

class Config:

    ONNX_PATH = Path("/content/drive/MyDrive/AegisSentinel/checkpoints/aegis_sentinel.onnx")
                      #/content/drive/MyDrive/AegisSentinel/checkpoints/aegis_sentinel.onnx

    #VIDEOS_DIR = Path("/content/bar_fight_scence_scott_adkins.mp4")
    VIDEOS_DIR =  Path("/content/")

    OUTPUT_DIR = Path("/content/aegis_poc_results")

    # Parametros de inferencia
    N_FRAMES        = 16      # frames por ventana
    IMG_SIZE        = 224     # resolucion de entrada del modelo
    STRIDE          = 4       # frames de avance entre ventanas (overlap del 50%)
    THRESHOLD       = 0.65    # umbral de clasificacion Violence
    SMOOTH_WINDOW   = 3       # ventanas a promediar para suavizar predicciones


    MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)


    VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
    
    
class AegisONNXModel:
    """
    Wrapper del modelo AegisSentinel exportado a ONNX.
    Maneja la sesion de ONNX Runtime y la inferencia.
    """

    def __init__(self, onnx_path: Path):
        if not onnx_path.exists():
            raise FileNotFoundError(
                f"Modelo no encontrado: {onnx_path}\n"
                f"Verifica que ONNX_PATH en Config apunta al archivo correcto."
            )

        # Configurar providers: GPU si esta disponible, CPU como fallback
        providers = []
        available = ort.get_available_providers()

        if "CUDAExecutionProvider" in available:
            providers.append("CUDAExecutionProvider")
            print("[MODEL] Usando GPU (CUDA)")
        else:
            print("[MODEL] GPU no disponible, usando CPU")

        providers.append("CPUExecutionProvider")

        self.session = ort.InferenceSession(str(onnx_path), providers=providers)
        self.input_name  = self.session.get_inputs()[0].name
        self.output_names = [o.name for o in self.session.get_outputs()]

        print(f"[MODEL] Cargado: {onnx_path.name} ({onnx_path.stat().st_size / 1e6:.1f} MB)")
        print(f"[MODEL] Input : {self.input_name} {self.session.get_inputs()[0].shape}")
        print(f"[MODEL] Outputs: {self.output_names}")

    def predict(self, frames_tensor: np.ndarray) -> tuple:
        """
        Ejecuta inferencia sobre un clip de N frames.

        frames_tensor: numpy array shape (1, N_FRAMES, 3, 224, 224) float32
        Retorna: (violence_prob float, attention_weights array shape (N_FRAMES,))
        """
        outputs = self.session.run(
            self.output_names,
            {self.input_name: frames_tensor}
        )

        # Aplicar sigmoid al logit para obtener probabilidad [0, 1]
        logit        = outputs[0][0][0]
        violence_prob = float(1 / (1 + np.exp(-logit)))

        attention_weights = outputs[1][0]  # shape (N_FRAMES,)

        return violence_prob, attention_weights


def preprocess_frame(frame_bgr: np.ndarray) -> np.ndarray:
    """
    Preprocesa un frame BGR de OpenCV para el modelo.
    Aplica el mismo pipeline que el ETL de entrenamiento.

    Retorna array float32 shape (3, 224, 224) normalizado con ImageNet stats.
    """
    # BGR -> RGB
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    # Resize a 224x224
    frame_resized = cv2.resize(
        frame_rgb,
        (Config.IMG_SIZE, Config.IMG_SIZE),
        interpolation=cv2.INTER_AREA
    )

    # Normalizar a [0, 1]
    frame_float = frame_resized.astype(np.float32) / 255.0

    # Aplicar ImageNet mean/std
    frame_norm = (frame_float - Config.MEAN) / Config.STD

    # HWC -> CHW (formato PyTorch/ONNX)
    frame_chw = frame_norm.transpose(2, 0, 1)

    return frame_chw


def extract_frames_sliding_window(video_path: Path) -> tuple:
    """
    Extrae frames del video usando ventana deslizante con stride,
    optimizando el uso de memoria.

    Retorna:
        windows      : lista de arrays (1, N_FRAMES, 3, 224, 224)
        window_times : lista de timestamps (segundos) del centro de cada ventana
        total_frames : numero total de frames del video
        fps          : FPS del video
        duration     : duracion en segundos
    """
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise ValueError(f"No se pudo abrir el video: {video_path}")

    fps          = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration     = total_frames / fps if fps > 0 else 0

    print(f"\n[VIDEO] {video_path.name}")
    print(f"  FPS         : {fps:.1f}")
    print(f"  Total frames: {total_frames}")
    print(f"  Duracion    : {duration:.1f}s ({duration/60:.1f} min)")

    windows = []
    window_times = []
    current_frame_buffer = deque() # Only keeps Config.N_FRAMES in memory at any time

    frame_idx_in_video = 0 # Tracks the index of the frame being read from the video

    print(f"  Procesando frames con ventana deslizante (memoria eficiente)...")

    for _ in tqdm(range(total_frames), desc="  Reading frames and forming windows", leave=False):
        ret, frame = cap.read()
        if not ret:
            break

        preprocessed_frame = preprocess_frame(frame)
        current_frame_buffer.append(preprocessed_frame)

        # Check if we have enough frames to form a window
        if len(current_frame_buffer) == Config.N_FRAMES:
            # The start index of the current window in the original video stream
            # is `frame_idx_in_video - Config.N_FRAMES + 1`
            window_start_idx = frame_idx_in_video - Config.N_FRAMES + 1

            # Only form a window if its starting index aligns with the stride
            if window_start_idx >= 0 and (window_start_idx % Config.STRIDE == 0):
                # Form the window from the current buffer (it always contains the latest N_FRAMES)
                window = np.stack(list(current_frame_buffer), axis=0)  # (N_FRAMES, 3, 224, 224)
                window = window[np.newaxis, :]                          # (1, N_FRAMES, 3, 224, 224)
                windows.append(window)

                # Calculate the timestamp for the center of this window
                center_frame_actual_idx = window_start_idx + Config.N_FRAMES // 2
                center_time = center_frame_actual_idx / fps
                window_times.append(center_time)

        frame_idx_in_video += 1 # Increment frame index after processing

    cap.release()

    if not windows and frame_idx_in_video > 0: # If no windows were generated but frames were read
        raise ValueError(
            f"Video muy corto: {frame_idx_in_video} frames leidos, "
            f"minimo para una ventana: {Config.N_FRAMES}. No se pudieron generar ventanas."
        )
    elif frame_idx_in_video == 0:
        raise ValueError(f"No se pudieron leer frames del video: {video_path}")

    print(f"  Ventanas generadas: {len(windows)} "
          f"(stride={Config.STRIDE}, N_FRAMES={Config.N_FRAMES})")

    return windows, window_times, frame_idx_in_video, fps, duration



def run_inference(model: AegisONNXModel,
                  windows: list,
                  window_times: list) -> dict:
    """
    Ejecuta inferencia sobre todas las ventanas del video.

    Retorna diccionario con:
        times       : timestamps de cada ventana
        raw_probs   : probabilidades sin suavizar
        smooth_probs: probabilidades suavizadas
        predictions : labels binarios (0/1) suavizados
        attention   : pesos de atencion por ventana
        latencies   : tiempo de inferencia por ventana (ms)
    """
    raw_probs  = []
    attentions = []
    latencies  = []

    print(f"\n[INFERENCE] Procesando {len(windows)} ventanas...")

    for window in tqdm(windows, desc="  Inferencia"):
        t0   = time.time()
        prob, attn = model.predict(window)
        elapsed_ms = (time.time() - t0) * 1000

        raw_probs.append(prob)
        attentions.append(attn)
        latencies.append(elapsed_ms)

    # Suavizado: promedio movil sobre SMOOTH_WINDOW ventanas
    smooth_probs = []
    prob_buffer  = deque(maxlen=Config.SMOOTH_WINDOW)

    for prob in raw_probs:
        prob_buffer.append(prob)
        smooth_probs.append(np.mean(prob_buffer))

    predictions = [1 if p >= Config.THRESHOLD else 0 for p in smooth_probs]

    avg_latency = np.mean(latencies)
    print(f"  Latencia promedio por ventana: {avg_latency:.1f} ms")
    print(f"  FPS efectivo de inferencia   : {100/avg_latency:.1f}")

    return {
        "times":        np.array(window_times),
        "raw_probs":    np.array(raw_probs),
        "smooth_probs": np.array(smooth_probs),
        "predictions":  np.array(predictions),
        "attention":    np.array(attentions),
        "latencies":    np.array(latencies),
    }


def compute_poc_metrics(results: dict, video_name: str) -> dict:
    """Calcula metricas de resumen del video analizado."""
    probs       = results["smooth_probs"]
    predictions = results["predictions"]
    times       = results["times"]

    n_windows    = len(predictions)
    n_violence   = predictions.sum()
    n_noviolence = n_windows - n_violence
    pct_violence = n_violence / n_windows * 100

    # Detectar eventos continuos de violencia
    # Un evento es una secuencia de ventanas consecutivas con prediccion=1
    events = []
    in_event = False
    event_start = 0

    for i, pred in enumerate(predictions):
        if pred == 1 and not in_event:
            in_event    = True
            event_start = i
        elif pred == 0 and in_event:
            in_event = False
            events.append({
                "start_sec": times[event_start],
                "end_sec":   times[i - 1],
                "duration":  times[i - 1] - times[event_start],
                "max_prob":  probs[event_start:i].max(),
            })

    if in_event:
        events.append({
            "start_sec": times[event_start],
            "end_sec":   times[-1],
            "duration":  times[-1] - times[event_start],
            "max_prob":  probs[event_start:].max(),
        })

    metrics = {
        "video":           video_name,
        "n_windows":       n_windows,
        "n_violence":      int(n_violence),
        "n_noviolence":    int(n_noviolence),
        "pct_violence":    round(pct_violence, 2),
        "n_events":        len(events),
        "max_prob":        round(float(probs.max()), 4),
        "mean_prob":       round(float(probs.mean()), 4),
        "avg_latency_ms":  round(float(results["latencies"].mean()), 2),
        "events":          events,
    }

    return metrics


def plot_full_report(results: dict,
                     metrics: dict,
                     video_name: str,
                     save_path: Path):
    """
    Genera el reporte visual completo con 4 graficas:
    1. Probabilidad de violencia a lo largo del tiempo (heatmap + curva)
    2. Comparacion raw vs suavizado
    3. Heatmap de atencion temporal por ventana
    4. Distribucion de probabilidades
    """
    times       = results["times"]
    raw_probs   = results["raw_probs"]
    smooth_probs = results["smooth_probs"]
    predictions = results["predictions"]
    attention   = results["attention"]

    fig = plt.figure(figsize=(18, 14))
    fig.patch.set_facecolor("#0a0a0a")
    fig.suptitle(
        f"AegisSentinel-Net — PoC Report\n{video_name}",
        fontsize=14, fontweight="bold", color="white", y=0.98
    )

    gs = gridspec.GridSpec(3, 2, hspace=0.45, wspace=0.3,
                           top=0.93, bottom=0.06, left=0.08, right=0.96)

    # ---- Grafica 1: Curva de probabilidad con zonas de alerta ----
    ax1 = fig.add_subplot(gs[0, :])
    ax1.set_facecolor("#111111")

    # Zona de fondo por prediccion
    for i in range(len(times) - 1):
        color = "#3d0000" if predictions[i] == 1 else "#001a00"
        ax1.axvspan(times[i], times[i+1], alpha=0.4, color=color, linewidth=0)

    ax1.plot(times, raw_probs, color="#444444", linewidth=1,
             alpha=0.6, label="Raw probability")
    ax1.plot(times, smooth_probs, color="#00ff88", linewidth=2,
             label=f"Smoothed (window={Config.SMOOTH_WINDOW})")
    ax1.axhline(y=Config.THRESHOLD, color="#ff4444", linewidth=1.5,
                linestyle="--", label=f"Threshold ({Config.THRESHOLD})")

    # Marcar eventos de violencia
    for event in metrics["events"]:
        ax1.axvspan(event["start_sec"], event["end_sec"],
                    alpha=0.3, color="#ff0000", linewidth=0)
        ax1.annotate(
            f"FIGHT\n{event['start_sec']:.1f}s",
            xy=(event["start_sec"], Config.THRESHOLD),
            xytext=(event["start_sec"], Config.THRESHOLD + 0.08),
            color="#ff4444", fontsize=7, fontweight="bold",
            arrowprops=dict(arrowstyle="->", color="#ff4444", lw=1)
        )

    ax1.set_xlim(times[0], times[-1])
    ax1.set_ylim(-0.05, 1.10)
    ax1.set_xlabel("Time (seconds)", color="white", fontsize=10)
    ax1.set_ylabel("Violence Probability", color="white", fontsize=10)
    ax1.set_title("Violence Detection Timeline", color="white", fontsize=11)
    ax1.tick_params(colors="white")
    ax1.spines[:].set_color("#333333")
    ax1.legend(loc="upper right", facecolor="#1a1a1a",
               edgecolor="#333333", labelcolor="white", fontsize=9)

    # Stats en el grafico
    stats_text = (
        f"Violence: {metrics['pct_violence']:.1f}%  |  "
        f"Events: {metrics['n_events']}  |  "
        f"Max prob: {metrics['max_prob']:.3f}  |  "
        f"Avg latency: {metrics['avg_latency_ms']:.1f}ms/window"
    )
    ax1.text(0.01, 0.02, stats_text, transform=ax1.transAxes,
             color="#aaaaaa", fontsize=8, verticalalignment="bottom")

    # ---- Grafica 2: Heatmap de probabilidad a lo largo del tiempo ----
    ax2 = fig.add_subplot(gs[1, :])
    ax2.set_facecolor("#111111")

    prob_2d = smooth_probs.reshape(1, -1)
    im = ax2.imshow(
        prob_2d,
        aspect="auto",
        cmap="RdYlGn_r",
        vmin=0, vmax=1,
        extent=[times[0], times[-1], 0, 1],
    )
    ax2.set_yticks([])
    ax2.set_xlabel("Time (seconds)", color="white", fontsize=10)
    ax2.set_title("Violence Probability Heatmap", color="white", fontsize=11)
    ax2.tick_params(colors="white")
    ax2.spines[:].set_color("#333333")

    cbar = plt.colorbar(im, ax=ax2, orientation="vertical", pad=0.01, shrink=0.8)
    cbar.set_label("Probability", color="white", fontsize=8)
    cbar.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="white")

    # ---- Grafica 3: Heatmap de atencion temporal ----
    ax3 = fig.add_subplot(gs[2, 0])
    ax3.set_facecolor("#111111")

    # Mostrar atencion de las primeras 30 ventanas (o todas si son menos)
    n_show    = min(30, len(attention))
    attn_show = attention[:n_show]

    im3 = ax3.imshow(
        attn_show.T,
        aspect="auto",
        cmap="hot",
        vmin=0,
        vmax=attn_show.max(),
    )
    ax3.set_xlabel("Window index", color="white", fontsize=9)
    ax3.set_ylabel("Frame position (0-15)", color="white", fontsize=9)
    ax3.set_title(
        f"Temporal Attention Heatmap\n(first {n_show} windows)",
        color="white", fontsize=10
    )
    ax3.tick_params(colors="white")
    ax3.spines[:].set_color("#333333")

    cbar3 = plt.colorbar(im3, ax=ax3, pad=0.02)
    cbar3.set_label("Attention weight", color="white", fontsize=8)
    cbar3.ax.yaxis.set_tick_params(color="white")
    plt.setp(cbar3.ax.yaxis.get_ticklabels(), color="white")

    # ---- Grafica 4: Distribucion de probabilidades ----
    ax4 = fig.add_subplot(gs[2, 1])
    ax4.set_facecolor("#111111")

    violence_probs   = smooth_probs[predictions == 1]
    noviolence_probs = smooth_probs[predictions == 0]

    bins = np.linspace(0, 1, 25)

    if len(noviolence_probs) > 0:
        ax4.hist(noviolence_probs, bins=bins, color="#00aa44",
                 alpha=0.7, label=f"NoFight (n={len(noviolence_probs)})",
                 edgecolor="#004422")
    if len(violence_probs) > 0:
        ax4.hist(violence_probs, bins=bins, color="#ff3333",
                 alpha=0.7, label=f"Fight (n={len(violence_probs)})",
                 edgecolor="#660000")

    ax4.axvline(x=Config.THRESHOLD, color="white", linewidth=1.5,
                linestyle="--", label=f"Threshold ({Config.THRESHOLD})")
    ax4.set_xlabel("Violence Probability", color="white", fontsize=9)
    ax4.set_ylabel("Window Count", color="white", fontsize=9)
    ax4.set_title("Probability Distribution", color="white", fontsize=10)
    ax4.tick_params(colors="white")
    ax4.spines[:].set_color("#333333")
    ax4.legend(facecolor="#1a1a1a", edgecolor="#333333",
               labelcolor="white", fontsize=8)

    plt.savefig(save_path, dpi=150, bbox_inches="tight",
                facecolor="#0a0a0a", edgecolor="none")
    plt.show()
    print(f"[PLOT] Reporte guardado: {save_path}")
    
    
def print_events_report(metrics: dict):
    """Imprime el reporte de eventos detectados en consola."""
    print("\n" + "=" * 60)
    print(f"REPORTE: {metrics['video']}")
    print("=" * 60)
    print(f"  Ventanas analizadas : {metrics['n_windows']}")
    print(f"  Ventanas Violence   : {metrics['n_violence']} ({metrics['pct_violence']:.1f}%)")
    print(f"  Ventanas NoFight    : {metrics['n_noviolence']}")
    print(f"  Probabilidad maxima : {metrics['max_prob']:.4f}")
    print(f"  Probabilidad media  : {metrics['mean_prob']:.4f}")
    print(f"  Latencia promedio   : {metrics['avg_latency_ms']:.1f} ms/ventana")
    print(f"  Eventos detectados  : {metrics['n_events']}")

    if metrics["events"]:
        print(f"\n  EVENTOS DE VIOLENCIA:")
        for i, event in enumerate(metrics["events"], 1):
            start = event["start_sec"]
            end   = event["end_sec"]
            dur   = event["duration"]
            prob  = event["max_prob"]
            print(f"    Evento {i}: {start:.1f}s -> {end:.1f}s "
                  f"(duracion: {dur:.1f}s, max_prob: {prob:.3f})")
    else:
        print(f"\n  No se detectaron eventos de violencia.")


def analyze_video(model: AegisONNXModel,
                  video_path: Path,
                  output_dir: Path) -> dict:
    """
    Pipeline completo de analisis para un video.
    Retorna el diccionario de metricas.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    video_name = video_path.stem

    # Extraccion de ventanas
    windows, window_times, total_frames, fps, duration = \
        extract_frames_sliding_window(video_path)

    # Inferencia
    results = run_inference(model, windows, window_times)

    # Metricas
    metrics = compute_poc_metrics(results, video_name)

    # Reporte en consola
    print_events_report(metrics)

    # Reporte visual
    plot_path = output_dir / f"{video_name}_report.png"
    plot_full_report(results, metrics, video_name, plot_path)

    # Guardar resultados como CSV para analisis posterior
    df = pd.DataFrame({
        "time_sec":    results["times"],
        "raw_prob":    results["raw_probs"],
        "smooth_prob": results["smooth_probs"],
        "prediction":  results["predictions"],
        "latency_ms":  results["latencies"],
    })
    csv_path = output_dir / f"{video_name}_predictions.csv"
    df.to_csv(csv_path, index=False)
    print(f"[CSV] Predicciones guardadas: {csv_path}")

    return metrics


def run_poc():
    """
    Ejecuta el PoC sobre todos los videos en VIDEOS_DIR.
    """
    print("=" * 60)
    print("AegisSentinel-Net — Proof of Concept")
    print("=" * 60)

    Config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Cargar modelo ONNX
    model = AegisONNXModel(Config.ONNX_PATH)

    # Descubrir videos
    if not Config.VIDEOS_DIR.exists():
        print(f"\n[ERROR] Directorio de videos no encontrado: {Config.VIDEOS_DIR}")
        print(f"[FIX]   Crea el directorio y coloca tus videos ahi:")
        print(f"        !mkdir -p {Config.VIDEOS_DIR}")
        return

    video_files = [
        p for p in Config.VIDEOS_DIR.iterdir()
        if p.suffix.lower() in Config.VIDEO_EXTENSIONS
    ]

    if not video_files:
        print(f"\n[ERROR] No se encontraron videos en {Config.VIDEOS_DIR}")
        print(f"[FIX]   Sube videos con extension: {Config.VIDEO_EXTENSIONS}")
        return

    print(f"\n[SCAN] {len(video_files)} videos encontrados:")
    for vf in video_files:
        size_mb = vf.stat().st_size / 1e6
        print(f"  {vf.name} ({size_mb:.1f} MB)")

    # Analizar cada video
    all_metrics = []
    for video_path in video_files:
        try:
            metrics = analyze_video(model, video_path, Config.OUTPUT_DIR)
            all_metrics.append(metrics)
        except Exception as e:
            print(f"\n[ERROR] {video_path.name}: {e}")
            continue

    # Resumen global si hay multiples videos
    if len(all_metrics) > 1:
        print("\n" + "=" * 60)
        print("RESUMEN GLOBAL")
        print("=" * 60)
        summary_rows = []
        for m in all_metrics:
            summary_rows.append({
                "Video":          m["video"],
                "Violence %":     m["pct_violence"],
                "Events":         m["n_events"],
                "Max Prob":       m["max_prob"],
                "Avg Latency ms": m["avg_latency_ms"],
            })
        summary_df = pd.DataFrame(summary_rows)
        print(summary_df.to_string(index=False))

        summary_path = Config.OUTPUT_DIR / "poc_summary.csv"
        summary_df.to_csv(summary_path, index=False)
        print(f"\n[CSV] Resumen guardado: {summary_path}")

    print(f"\n[DONE] Resultados en: {Config.OUTPUT_DIR}")


