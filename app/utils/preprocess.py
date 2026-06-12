import cv2
import numpy as np
 
from app.core.config import get_settings
 
settings = get_settings()
 
# Preprocessing utilities for model inputs and outputs.
# ImageNet normalization is applied to the training data.
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
 
YOLO_SIZE = 640

# Each model expects a different input:
#   ViolenceDetector : 224x224, ImageNet mean/std, CHW float32
#   YOLO pose/weapons: 640x640 letterbox, /255 only, CHW float32


def preprocess_violence(frame_bgr: np.ndarray) -> np.ndarray:
    """
    Preprocess a BGR frame for the ViolenceDetector.
    Identical pipeline to the training ETL.
 
    Returns float32 array (3, 224, 224).
    """
    size = settings.img_size
 
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (size, size),
                               interpolation=cv2.INTER_AREA)
 
    frame_float = frame_resized.astype(np.float32) / 255.0
    frame_norm  = (frame_float - IMAGENET_MEAN) / IMAGENET_STD
 
    return frame_norm.transpose(2, 0, 1)
 
 
def preprocess_yolo(frame_bgr: np.ndarray) -> tuple:
    """
    Preprocess a BGR frame for YOLO models (pose and weapons).
    Letterbox resize to 640x640 preserving aspect ratio.
 
    Returns:
        tensor : float32 array (1, 3, 640, 640)
        meta   : dict with scale and padding to map detections
                 back to original frame coordinates
    """
    h0, w0 = frame_bgr.shape[:2]
 
    # Scale preserving aspect ratio
    scale = min(YOLO_SIZE / h0, YOLO_SIZE / w0)
    new_w, new_h = int(round(w0 * scale)), int(round(h0 * scale))
 
    resized = cv2.resize(frame_bgr, (new_w, new_h),
                         interpolation=cv2.INTER_LINEAR)
 
    # Letterbox padding (gray 114, YOLO convention)
    pad_w = YOLO_SIZE - new_w
    pad_h = YOLO_SIZE - new_h
    top,  bottom = pad_h // 2, pad_h - pad_h // 2
    left, right  = pad_w // 2, pad_w - pad_w // 2
 
    padded = cv2.copyMakeBorder(
        resized, top, bottom, left, right,
        cv2.BORDER_CONSTANT, value=(114, 114, 114),
    )
 
    # BGR -> RGB, /255, HWC -> CHW, add batch dim
    rgb    = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
    tensor = rgb.astype(np.float32) / 255.0
    tensor = tensor.transpose(2, 0, 1)[np.newaxis, :]
 
    meta = {
        "scale": scale,
        "pad_left": left,
        "pad_top": top,
        "orig_w": w0,
        "orig_h": h0,
    }
    return tensor, meta
 
 
def scale_box_to_original(box: list, meta: dict) -> list:
    """
    Maps a box [x1, y1, x2, y2] from 640x640 letterbox space
    back to original frame coordinates.
    """
    x1 = (box[0] - meta["pad_left"]) / meta["scale"]
    y1 = (box[1] - meta["pad_top"])  / meta["scale"]
    x2 = (box[2] - meta["pad_left"]) / meta["scale"]
    y2 = (box[3] - meta["pad_top"])  / meta["scale"]
 
    # Clamp to frame bounds
    x1 = max(0.0, min(x1, meta["orig_w"]))
    y1 = max(0.0, min(y1, meta["orig_h"]))
    x2 = max(0.0, min(x2, meta["orig_w"]))
    y2 = max(0.0, min(y2, meta["orig_h"]))
 
    return [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)]
 