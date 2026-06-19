/** Response from GET /api/v1/health */
export interface HealthResponse {
    status: "ok" | "degraded";
    app_name: string;
    env: string;
    /** True when all three models (violence, pose, weapons) are loaded */
    models: boolean;
    /** ISO 8601 UTC */
    timestamp: string;
}

/**
 * Dashboard query parameters for paginated list endpoints.
 * Used by detections, events, and recordings list calls.
 */
export interface PaginationParams {
    limit?: number;
    offset?: number;
}
