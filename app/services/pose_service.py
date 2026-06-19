import logging
 
import numpy as np
import onnxruntime as ort
 
from app.core.config import get_settings
from app.utils.iou_utils import check_contact_trigger
from app.utils.preprocess import preprocess_yolo, scale_box_to_original


logger = logging.getLogger("aegis.pose")
settings = get_settings()

# Tasks:
#   1. Detect persons and their 17 COCO keypoints per frame.
#   2. Report bounding boxes in ORIGINAL frame coordinates.
#   3. Evaluate the contact trigger (IoU between person pairs).
#
# Output of YOLOv11-pose ONNX (exported from ultralytics):
#   shape (1, 56, 8400)
#   56 = 4 box (cx, cy, w, h) + 1 conf + 17 keypoints * 3 (x, y, conf)


CONF_THRESHOLD = 0.45   # min confidence to keep a person detection
IOU_NMS        = 0.45   # NMS threshold to merge duplicate boxes
N_KEYPOINTS    = 17     # COCO body keypoints
 
 
class PoseService:
    """
    Person + keypoints detector with contact-trigger logic.
    Stateless between frames: safe to share across connections.
    """
 
    def __init__(self, session: ort.InferenceSession):
        self.session    = session
        self.input_name = session.get_inputs()[0].name
 
    def detect(self, frame_bgr: np.ndarray) -> dict:
        """
        Runs pose detection on a single BGR frame.
 
        Returns:
            {
              "persons": [
                {
                  "person_id": 0,
                  "bbox": [x1, y1, x2, y2],   # original frame coords
                  "confidence": 0.91,
                  "keypoints": [[x, y, conf], ...]  # 17 points
                }
              ],
              "persons_count": int,
              "contact": bool,
              "contact_pairs": [{"person_a", "person_b", "iou"}],
            }
        """
        tensor, meta = preprocess_yolo(frame_bgr)
        output = self.session.run(None, {self.input_name: tensor})[0]
 
        persons = self._parse_output(output, meta)
 
        contact, pairs = check_contact_trigger(
            persons,
            iou_threshold=settings.contact_iou_threshold,
        )
 
        return {
            "persons":        persons,
            "persons_count":  len(persons),
            "contact":        contact,
            "contact_pairs":  pairs,
        }
 
    #   internal 
 
    def _parse_output(self, output: np.ndarray, meta: dict) -> list:
        """
        Parses raw YOLO output (1, 56, 8400) into person dicts.
        Applies confidence filter and NMS, then maps boxes and
        keypoints back to original frame coordinates.
        """
        preds = output[0].T    # (8400, 56)
        confs = preds[:, 4]
 
        keep = confs >= CONF_THRESHOLD
        preds = preds[keep]
        
        if preds.shape[0] == 0:
            return []
 
        # cx, cy, w, h -> x1, y1, x2, y2 (letterbox space)
        boxes_xywh = preds[:, :4]
        boxes = np.empty_like(boxes_xywh)
        boxes[:, 0] = boxes_xywh[:, 0] - boxes_xywh[:, 2] / 2
        boxes[:, 1] = boxes_xywh[:, 1] - boxes_xywh[:, 3] / 2
        boxes[:, 2] = boxes_xywh[:, 0] + boxes_xywh[:, 2] / 2
        boxes[:, 3] = boxes_xywh[:, 1] + boxes_xywh[:, 3] / 2
 
        scores = preds[:, 4]
        kpts   = preds[:, 5:].reshape(-1, N_KEYPOINTS, 3)
 
        keep_idx = self._nms(boxes, scores, IOU_NMS)
 
        persons = []
        for rank, idx in enumerate(keep_idx):
            bbox_orig = scale_box_to_original(boxes[idx].tolist(), meta)
 
            # Map keypoints back to original coordinates
            kp = kpts[idx].copy()
            kp[:, 0] = (kp[:, 0] - meta["pad_left"]) / meta["scale"]
            kp[:, 1] = (kp[:, 1] - meta["pad_top"])  / meta["scale"]
 
            persons.append({
                "person_id":  rank,
                "bbox":       bbox_orig,
                "confidence": round(float(scores[idx]), 3),
                "keypoints":  np.round(kp, 1).tolist(),
            })
 
        return persons
 
    #   internal - trigger logic for inference engine
    @staticmethod
    def _nms(boxes: np.ndarray, scores: np.ndarray, iou_thr: float) -> list:
        """Standard non-maximum suppression. Returns kept indices."""
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