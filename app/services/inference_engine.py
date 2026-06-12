import logging
from collections import deque
 
import numpy as np
import onnxruntime as ort
 
from app.core.config import get_settings
 
logger = logging.getLogger("aegis.inference")
settings = get_settings()
 
 
class AegisInferenceEngine:
    """
    Conditional violence inference over a live frame stream.
 
    The model session lives in core/session.py and is shared
    across connections. This class only holds per-stream state:
    the frame buffer and the trigger/cooldown flags.
    """
 
    def __init__(self, session: ort.InferenceSession):
        
        self.session    = session
        self.input_name = session.get_inputs()[0].name
 
        self.n_frames        = settings.n_frames
        self.threshold       = settings.violence_threshold
        self.cooldown_frames = settings.cooldown_frames
 
        self.frame_buffer = deque(maxlen=self.n_frames)
        self.is_triggered = False
        self.frames_since_trigger = 0
        
 
    def add_frame(self,
                  frame_preprocessed: np.ndarray,
                  contact_detected: bool) -> dict | None:
        """
        Adds a preprocessed frame to the buffer and decides whether
        to run inference.
 
        Args:
            frame_preprocessed : float32 array (3, 224, 224),
                                 ImageNet-normalized
            contact_detected   : True when pose service reports
                                 IoU >= contact threshold
 
        Returns:
            Inference result dict, or None while the model sleeps.
        """
        self.frame_buffer.append(frame_preprocessed)
 
        # Arm the trigger on contact
        if contact_detected:
            self.is_triggered = True
            self.frames_since_trigger = 0
 
        # Cooldown: stay awake N frames after the last contact
        if self.is_triggered:
            self.frames_since_trigger += 1
            if self.frames_since_trigger > self.cooldown_frames:
                self.is_triggered = False
                logger.debug("Cooldown expired, engine back to sleep")
 
        # Run inference only when triggered and buffer is full
        if self.is_triggered and len(self.frame_buffer) == self.n_frames:
            return self._run_inference()
 
        return None
 
    def reset(self) -> None:
        """Clears buffer and trigger state. Call on stream restart."""
        self.frame_buffer.clear()
        self.is_triggered = False
        self.frames_since_trigger = 0
 
    def _run_inference(self) -> dict:
        clip = np.stack(list(self.frame_buffer), axis=0)
        clip = clip[np.newaxis, :].astype(np.float32)
 
        output = self.session.run(None, {self.input_name: clip})
 
        logit = output[0][0][0]
        prob  = float(1 / (1 + np.exp(-logit)))
        attn  = output[1][0].tolist()
 
        return {
            "violence_prob": prob,
            "is_violence":   prob >= self.threshold,
            "attention":     attn,
        }
 