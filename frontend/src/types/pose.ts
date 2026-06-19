
export const COCO_KEYPOINTS = [
    "nose",
    "left_eye",
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
] as const;

export type CocoKeypointName = (typeof COCO_KEYPOINTS)[number];

/** [x, y, confidence] in original frame pixel coordinates. */
export type Keypoint = [number, number, number];

/**
 * Skeleton connections for drawing limbs on the canvas overlay.
 * Each pair is [from_index, to_index] referencing COCO_KEYPOINTS.
 */
export const SKELETON_CONNECTIONS: [number, number][] = [
    // face
    [0, 1],   // nose -> left_eye
    [0, 2],   // nose -> right_eye
    [1, 3],   // left_eye -> left_ear
    [2, 4],   // right_eye -> right_ear
    // shoulders
    [5, 6],   // left_shoulder -> right_shoulder
    [5, 7],   // left_shoulder -> left_elbow
    // elbows
    [7, 9],   // left_elbow -> left_wrist
    [6, 8],   // right_shoulder -> right_elbow
    // wrists
    [8, 10],  // right_elbow -> right_wrist
    // torso
    [5, 11],  // left_shoulder -> left_hip
    [6, 12],  // right_shoulder -> right_hip
    [11, 12], // left_hip -> right_hip
    // legs
    [11, 13], // left_hip -> left_knee
    [13, 15], // left_knee -> left_ankle
    [12, 14], // right_hip -> right_knee
    [14, 16], // right_knee -> right_ankle
];