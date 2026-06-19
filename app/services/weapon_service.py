import logging
 
import numpy as np
import onnxruntime as ort
 
from app.utils.preprocess import preprocess_yolo, scale_box_to_original
 
logger = logging.getLogger("aegis.weapons")
 
CONF_THRESHOLD = 0.55
IOU_NMS        = 0.45
 
CLASS_NAMES = {0: "gun", 1: "knife", 2: "rifle", 3: "heavy_weapon"}

# Classes (custom training): 0=gun, 1=knife, 2=rifle, 3=heavy weapon
# Output of YOLOv8 detect ONNX: shape (1, 4 + n_classes, 8400)
#
# Note: model trained with mAP 0.68 — experimental module.
# Confidence threshold is set higher (0.55) to compensate
# for the weaker model and reduce false positives.

class WeaponService:
    """
    Weapon detector. Stateless between frames.
    """
 
    def __init__(self, session: ort.InferenceSession):
        self.session    = session
        self.input_name = session.get_inputs()[0].name
 
    def detect(self, frame_bgr: np.ndarray) -> dict:
        """
        Runs weapon detection on a single BGR frame.
 
        Returns:
            {
              "weapon_detected": bool,
              "weapons": [
                {"class": "gun", "confidence": 0.87, "bbox": [x1,y1,x2,y2]}
              ],
              "weapons_data": {       # JSONB-ready summary per class
                "gun":   {"detected": true,  "confidence": 0.87, "bbox": [...]},
                "knife": {"detected": false, "confidence": 0.0,  "bbox": null},
                "rifle": {"detected": false, "confidence": 0.0,  "bbox": null}
                "heavy_weapon": {"detected": false, "confidence": 0.0,  "bbox": null}
              }
            }
        """
        tensor, meta = preprocess_yolo(frame_bgr)
        output = self.session.run(None, {self.input_name: tensor})[0]
 
        detections = self._parse_output(output, meta)
 
        # Build the JSONB-ready per-class summary
        weapons_data = {
            name: {"detected": False, "confidence": 0.0, "bbox": None}
            
            for name in CLASS_NAMES.values()
        }
        for det in detections:
            
            cls = det["class"]
            
            if det["confidence"] > weapons_data[cls]["confidence"]:
                
                weapons_data[cls] = {
                    "detected":   True,
                    "confidence": det["confidence"],
                    "bbox":       det["bbox"],
                }
 
        return {
            "weapon_detected": len(detections) > 0,
            "weapons":         detections,
            "weapons_data":    weapons_data,
        }
 
    #   internal
 
    def _parse_output(self, output: np.ndarray, meta: dict) -> list:
        """
        Parses raw YOLOv8 output (1, 4+nc, 8400) into weapon dicts.
        """
        preds = output[0].T     # (8400, 4 + nc)
        boxes_xywh  = preds[:, :4]
        class_confs = preds[:, 4:]    # (8400, nc)
 
        class_ids = class_confs.argmax(axis=1)
        scores    = class_confs.max(axis=1)
 
        keep = scores >= CONF_THRESHOLD
        if not keep.any():
            return []
 
        boxes_xywh = boxes_xywh[keep]
        class_ids  = class_ids[keep]
        scores     = scores[keep]
 
        boxes = np.empty_like(boxes_xywh)
        boxes[:, 0] = boxes_xywh[:, 0] - boxes_xywh[:, 2] / 2
        boxes[:, 1] = boxes_xywh[:, 1] - boxes_xywh[:, 3] / 2
        boxes[:, 2] = boxes_xywh[:, 0] + boxes_xywh[:, 2] / 2
        boxes[:, 3] = boxes_xywh[:, 1] + boxes_xywh[:, 3] / 2
 
        keep_idx = self._nms(boxes, scores, IOU_NMS)
 
        detections = []
        
        for idx in keep_idx:
            
            detections.append({
                "class":      CLASS_NAMES.get(int(class_ids[idx]), "unknown"),
                "confidence": round(float(scores[idx]), 3),
                "bbox":       scale_box_to_original(boxes[idx].tolist(), meta),
            })
 
        return detections
    
 
    @staticmethod
    def _nms(boxes: np.ndarray, scores: np.ndarray, iou_thr: float) -> list:
        
        x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
        
        areas = (x2 - x1) * (y2 - y1)
        
        order = scores.argsort()[::-1]
 
        keep = []
        
        while order.size > 0:
            
            i = order[0]
            
            keep.append(int(i))
 
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
 
            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            
            inter = w * h
            
            iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-9)
 
            order = order[1:][iou <= iou_thr]
            
 
        return keep