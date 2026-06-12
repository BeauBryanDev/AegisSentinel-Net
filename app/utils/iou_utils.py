# Geometry Helper Functions

import numpy as np


def compute_iou(box_a: list, box_b: list) -> float:
    """
    Computes Intersection over Union between two bounding boxes.
    Box format: [x1, y1, x2, y2]
    Returns a float in [0.0, 1.0].
    """
    x_left   = max(box_a[0], box_b[0])
    y_top    = max(box_a[1], box_b[1])
    x_right  = min(box_a[2], box_b[2])
    y_bottom = min(box_a[3], box_b[3])
 
    if x_right < x_left or y_bottom < y_top:
        # No overlap
        return 0.0
 
    intersection = (x_right - x_left) * (y_bottom - y_top)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union  = area_a + area_b - intersection
 
    return intersection / union if union > 0 else 0.0
 
 
def check_contact_trigger(detections: list,
                          iou_threshold: float = 0.40) -> tuple:
    """
    Checks whether any pair of detected persons is in physical contact.
 
    Args:
        detections    : list of dicts with 'bbox' and 'person_id' keys
        iou_threshold : minimum IoU to consider two persons in contact
 
    Returns:
        (trigger_bool, contact_pairs)
        trigger_bool  : True if at least one pair overlaps >= threshold
        contact_pairs : list of {"person_a", "person_b", "iou"} dicts
    """
    contact_pairs = []
 
    for i in range(len(detections)):
        for j in range(i + 1, len(detections)):
            iou = compute_iou(
                detections[i]["bbox"],
                detections[j]["bbox"],
            )
            if iou >= iou_threshold:
                contact_pairs.append({
                    "person_a": detections[i]["person_id"],
                    "person_b": detections[j]["person_id"],
                    "iou":      round(iou, 3),
                })
                
 
    return len(contact_pairs) > 0, contact_pairs
 
 
 