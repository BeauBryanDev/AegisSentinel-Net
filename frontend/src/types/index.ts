
// WebSocket stream (real-time inference)
export type {
    AlertLevel,
    DetectionType,
    PersonDetection,
    ContactPair,
    WeaponDetection,
    WeaponClass,
    FramePayload,
    FrameError,
    StreamMessage,
} from "./stream";

export { isFramePayload } from "./stream";

// REST: Detections
export type {
    DetectionRead,
    DetectionSummary,
    WeaponClassData,
    WeaponsDataMap,
} from "./detections";

// REST: Events (alerts/incidents)
export type {
    EventType,
    EventSeverity,
    EventRead,
    EventUpdate,
} from "./alerts";

// REST: Recordings (stream sessions)
export type {
    RecordingStatus,
    RecordingRead,
    RecordingWithStats,
} from "./recordings";

// REST: Health and metrics
export type {
    HealthResponse,
    PaginationParams,
} from "./metrics";

// Pose constants
export type { Keypoint, CocoKeypointName } from "./pose";

export { COCO_KEYPOINTS, SKELETON_CONNECTIONS } from "./pose";