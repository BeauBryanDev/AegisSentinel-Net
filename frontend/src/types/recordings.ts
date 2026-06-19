
import type { AlertLevel } from "./stream";
/*
 * REST API recording types.
 * It matches: app/schemas/recordings.py
 * Endpoints: GET /api/v1/recordings/, GET /api/v1/recordings/:id
 */
export type RecordingStatus = "active" | "completed" | "error";

/** Recording session (GET /api/v1/recordings/) */
export interface RecordingRead {
    id: number;
    user_id: number | null;
    camera_id: string | null;
    status: RecordingStatus;
    /** ISO 8601 UTC */
    started_at: string;
    /** ISO 8601 UTC, null while session is active */
    ended_at: string | null;
    /** ISO 8601 UTC */
    created_at: string;
}

/** Recording with aggregate counters (GET /api/v1/recordings/:id) */
export interface RecordingWithStats extends RecordingRead {
    total_detections: number;
    total_events: number;
    max_alert_level: AlertLevel | null;
}