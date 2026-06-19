
import type { AlertLevel, DetectionType } from "./stream";

/** Full detection record (GET /api/v1/detections/:id) */
export interface DetectionRead {
    id: number;
    recording_id: number | null;
    user_id: number | null;

    detection_type: DetectionType;
    alert_level: AlertLevel;

    violence_confidence: number | null;
    violence_triggered: boolean;
    attention_weights: number[] | null;

    weapons_data: WeaponsDataMap | null;
    weapon_detected: boolean;

    pose_data: Record<string, unknown> | null;
    persons_count: number | null;
    contact_iou: number | null;

    camera_id: string | null;
    /** ISO 8601 UTC */
    frame_time: string;
    frame_number: number;
    snapshot: string | null;

    /** ISO 8601 UTC */
    created_at: string;
}

/** Lightweight version for dashboard lists (GET /api/v1/detections/) */
export interface DetectionSummary {
    id: number;
    detection_type: DetectionType;
    alert_level: AlertLevel;
    violence_confidence: number | null;
    weapon_detected: boolean;
    persons_count: number | null;
    camera_id: string | null;
    /** ISO 8601 UTC */
    frame_time: string;
    /** ISO 8601 UTC */
    created_at: string;
}

/**
 * Per-class weapon summary stored in detections.weapons_data JSONB.
 * Shape from WeaponService.detect() -> weapons_data dict.
 */
export interface WeaponClassData {
    detected: boolean;
    confidence: number;
    bbox: [number, number, number, number] | null;
}

export type WeaponsDataMap = Record<string, WeaponClassData>;
