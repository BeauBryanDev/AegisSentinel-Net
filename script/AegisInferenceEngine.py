import numpy as np
import onnxruntime as ort
from collections import deque

class AegisInferenceEngine:
    """
    Motor de inferencia con activación condicional.
    El modelo ONNX está siempre en memoria pero solo
    ejecuta forward pass cuando hay trigger de contacto.
    """

    def __init__(self, onnx_path: str, n_frames: int = 16):
        self.n_frames     = n_frames
        self.frame_buffer = deque(maxlen=n_frames)
        self.is_triggered = False
        self.frames_since_trigger = 0
        self.COOLDOWN_FRAMES = 30  # frames de espera tras una inferencia

        # Cargar modelo una sola vez al inicio
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        self.session = ort.InferenceSession(onnx_path, providers=providers)
        self.input_name = self.session.get_inputs()[0].name

    def add_frame(self, frame_preprocessed: np.ndarray,
                  contact_detected: bool) -> dict | None:
        """
        Agrega frame al buffer y decide si ejecutar inferencia.

        Retorna resultado de inferencia o None si el modelo está dormido.
        """
        self.frame_buffer.append(frame_preprocessed)

        # Activar trigger
        if contact_detected:
            self.is_triggered = True
            self.frames_since_trigger = 0

        # Cooldown: mantener activo N frames después del último contacto
        if self.is_triggered:
            self.frames_since_trigger += 1
            if self.frames_since_trigger > self.COOLDOWN_FRAMES:
                self.is_triggered = False

        # Ejecutar inferencia solo si hay trigger y buffer lleno
        if self.is_triggered and len(self.frame_buffer) == self.n_frames:
            return self._run_inference()

        return None

    def _run_inference(self) -> dict:
        clip   = np.stack(list(self.frame_buffer), axis=0)
        clip   = clip[np.newaxis, :].astype(np.float32)
        output = self.session.run(None, {self.input_name: clip})

        logit   = output[0][0][0]
        prob    = float(1 / (1 + np.exp(-logit)))
        attn    = output[1][0]

        return {
            "violence_prob": prob,
            "is_violence":   prob >= 0.62,
            "attention":     attn,
        }