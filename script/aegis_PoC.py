import cv2
import numpy as np

from pathlib import Path

import onnxruntime as ort

# Estadísticas de ImageNet para normalización manual en NumPy
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

from google.colab import drive
drive.mount('/content/drive')

import yt_dlp

def download_video(url_video):
    # download video settings
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
        
VIDEO_URL =  "https://www.youtube.com/watch?v=PFCVMYxoF4E"

download_video(VIDEO_URL)

def preprocess_frame(frame):
    """Procesa un frame individual usando solo OpenCV y NumPy."""
    # BGR -> RGB
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    # Redimensionar
    frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    # Escalar a [0, 1]
    frame = frame.astype(np.float32) / 255.0
    # Normalizar: (N_Pixels - Mean) / Std
    frame = (frame - IMAGENET_MEAN) / IMAGENET_STD
    # HWC -> CHW (Formato que espera la CNN)
    frame = frame.transpose(2, 0, 1)
    return frame


def extract_video_tensor(video_path):
    """Extrae 16 frames distribuidos uniformemente del video."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[ERROR] No se pudo abrir el video: {video_path}")
        return None

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0

    if total_frames < N_FRAMES:
        print(f"[SKIP] Video demasiado corto. Tiene {total_frames} frames, se requieren {N_FRAMES}")
        cap.release()
        return None

    # Distribución uniforme evitando bordes de fade-in/out (5% al 95%)
    start_ms = duration * 0.05 * 1000
    end_ms = duration * 0.95 * 1000
    timestamps_ms = np.linspace(start_ms, end_ms, N_FRAMES)

    processed_frames = []
    for ts in timestamps_ms:
        cap.set(cv2.CAP_PROP_POS_MSEC, ts)
        ret, frame = cap.read()
        if not ret or frame is None:
            # Reemplazo por frame negro si hay error de lectura
            frame = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)

        processed_frames.append(preprocess_frame(frame))

    cap.release()

    #  lista de (3, 224, 224) -> array de (16, 3, 224, 224)
    video_array = np.stack(processed_frames, axis=0)
    #  Batch -> (1, 16, 3, 224, 224)
    video_array = np.expand_dims(video_array, axis=0)
    return video_array


def run_poc(model_path, video_path):
    print("\n" + "="*50)
    print(" AegisSentinel-Net — Live Inferencia PoC")
    print("="*50)

    #   Cargar el motor de inferencia ONNX
    # Usa CPU por defecto. Para GPU, añadir
    session = ort.InferenceSession(str(model_path), providers=['CUDAExecutionProvider'])
    input_name = session.get_inputs()[0].name

    # Extraer y procesar los tensores del video
    print(f"[INFO] Procesando video: {video_path.name}...")
    video_tensor = extract_video_tensor(video_path)
    if video_tensor is None:
        return

    # Correr la inferencia
    print("[INFO] Ejecutando forward pass en ONNX Runtime...")
    raw_outputs = session.run(None, {input_name: video_tensor})
    logit = raw_outputs[0][0][0] # Extraer el valor flotante del logit

    #  Pasar el logit por la función Sigmoide para obtener la probabilidad
    probability = 1 / (1 + np.exp(-logit))

    # Umbral de clasificación (Threshold = 0.5)
    prediction = "VIOLENCIA (Fights)" if probability >= 0.5 else "NORMAL (NoFights)"

    print("\n" + "-"*50)
    print(f" RESULTADO DE LA PREDICCIÓN:")
    print(f"  Clasificación : {prediction}")
    print(f"  Confianza     : {probability * 100:.2f}%")
    print(f"  Raw Logit     : {logit:.4f}")
    print("-"*50 + "\n")
    
    
TEST_VIDEO3 = Path("/content/city_friends.mp4")
TEST_VIDEOS_Yt = [TEST_VIDEO1, TEST_VIDEO2, TEST_VIDEO3]

if MODEL.exists() and TEST_VIDEO3.exists():
    run_poc(MODEL, TEST_VIDEO3)
else:
    print("[ERROR] verificar modelo onnx este en la ruta correcta !")
    
    