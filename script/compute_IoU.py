def compute_iou(box_a: list, box_b: list) -> float:
    """
    Calcula IoU entre dos bounding boxes.
    Formato: [x1, y1, x2, y2]
    """
    x_left   = max(box_a[0], box_b[0])
    y_top    = max(box_a[1], box_b[1])
    x_right  = min(box_a[2], box_b[2])
    y_bottom = min(box_a[3], box_b[3])

    if x_right < x_left or y_bottom < y_top:
        return 0.0

    intersection = (x_right - x_left) * (y_bottom - y_top)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union  = area_a + area_b - intersection

    return intersection / union if union > 0 else 0.0


def check_contact_trigger(detections: list,
                           iou_threshold: float = 0.40) -> tuple:
    """
    Verifica si algún par de personas tiene contacto físico.

    detections: lista de dicts con 'bbox' y 'person_id'
    Retorna: (trigger_bool, lista de pares en contacto)
    """
    contact_pairs = []

    for i in range(len(detections)):
        for j in range(i + 1, len(detections)):
            iou = compute_iou(
                detections[i]["bbox"],
                detections[j]["bbox"]
            )
            if iou >= iou_threshold:
                contact_pairs.append({
                    "person_a": detections[i]["person_id"],
                    "person_b": detections[j]["person_id"],
                    "iou":      round(iou, 3),
                })

    return len(contact_pairs) > 0, contact_pairs