
export type EventType = "fight" | "weapon" | "contact" | "system";

export type EventSeverity = "low" | "medium" | "high" | "critical";

/** Full event record (GET /api/v1/events/:id, list, PATCH) */
export interface EventRead {
    id: number;
    recording_id: number | null;
    detection_id: number | null;
    user_id: number | null;

    event_type: EventType;
    severity: EventSeverity;
    description: string | null;
    camera_id: string | null;

    /** ISO 8601 UTC */
    started_at: string;
    /** ISO 8601 UTC, null while event is still open */
    ended_at: string | null;
    /** ISO 8601 UTC */
    created_at: string;
}

/** Payload for PATCH /api/v1/events/:id */
export interface EventUpdate {
    ended_at?: string;
    description?: string;
    severity?: EventSeverity;
}
