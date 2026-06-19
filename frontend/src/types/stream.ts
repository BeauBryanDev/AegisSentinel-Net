
import type { Keypoint } from "./pose";

//  Enums ( from app/models/detections.py)  

export type AlertLevel = "low" | "medium" | "high" | "critical";

export type DetectionType = "violence" | "weapon" | "contact" | "normal";

//  Nested shapes 

/** Single person from PoseService.detect() */
export interface PersonDetection {
    person_id: number;
    /** [x1, y1, x2, y2] in original frame pixel coordinates */
    bbox: [number, number, number, number];
    confidence: number;
    /** 17 COCO keypoints, each [x, y, conf] */
    keypoints: Keypoint[];
}

/** Contact pair from check_contact_trigger() in iou_utils.py */
export interface ContactPair {
    person_a: number;
    person_b: number;
    iou: number;
}

/** Single weapon from WeaponService.detect() */
export interface WeaponDetection {
    class: WeaponClass;
    confidence: number;
    /** [x1, y1, x2, y2] in original frame pixel coordinates */
    bbox: [number, number, number, number];
}

export type WeaponClass = "gun" | "knife" | "rifle" | "heavy_weapon";

//  Main WebSocket frame payload 

/**
 * One frame of telemetry received from the backend.
 * Sent by stream.py -> _build_response(payload) every frame.
 */
export interface FramePayload {
    frame_number: number;
    /** ISO 8601 UTC timestamp */
    frame_time: string;
    camera_id: string;

    // Pose
    persons: PersonDetection[];
    persons_count: number;
    contact: boolean;
    contact_pairs: ContactPair[];

    // Weapons
    weapon_detected: boolean;
    weapons: WeaponDetection[];

    // Violence inference
    /** True when the sliding window engine is actively collecting frames */
    engine_awake: boolean;
    /** Raw violence probability from the model, null when engine is asleep */
    violence_prob: number | null;
    /** True when violence_prob >= threshold */
    is_violence: boolean;
    /** Temporal attention weights from the ResNet50+MLP, null when engine is asleep */
    attention: number[] | null;

    // Alert fusion
    alert_level: AlertLevel;
    detection_type: DetectionType;
    /** 3-frame moving average of violence_prob for smoother UI display */
    violence_prob_smooth: number | null;

    type: "frame";
    payload: FramePayload;
}

/** Error frame sent when the backend receives an invalid JPEG */
export interface FrameError {
    error: "invalid_frame";
    type: "error";
    payload: string;
}

/** Union of possible WebSocket messages from the backend */
export type StreamMessage = FramePayload | FrameError;

/** Helper type guard */
export function isFramePayload(msg: StreamMessage): msg is FramePayload {
    return "frame_number" in msg;
}