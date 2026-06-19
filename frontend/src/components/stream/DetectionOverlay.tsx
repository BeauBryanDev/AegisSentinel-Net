
import { useEffect, useRef } from "react";
import { useStreamStore } from "../../stores/useStreamStore";
import { SKELETON_CONNECTIONS } from "../../types/pose";
import type {
    FramePayload,
    PersonDetection,
    WeaponDetection,
} from "../../types";


/*
 * DetectionOverlay
 * Transparent canvas positioned over the VideoPlayer.
 * Draws bounding boxes, pose skeletons, and weapon detections.
 */


const PERSON_BOX_COLOR = "#C8CCD4";
const PERSON_BOX_THREAT = "#FF2B3A";
const WEAPON_BOX_COLOR = "#FF2B3A";
const KEYPOINT_COLOR = "#FFFFFF";
const KEYPOINT_RADIUS = 3;
const LIMB_COLOR = "#8A8F99";
const LIMB_WIDTH = 1.5;
const BOX_LINE_WIDTH = 1.5;
const LABEL_FONT = "bold 11px JetBrains Mono, monospace";
const LABEL_BG = "rgba(5, 5, 7, 0.7)";
const KEYPOINT_MIN_CONF = 0.3;


interface DetectionOverlayProps {
    /** Native video resolution width (from VideoPlayer onDimensions) */
    videoWidth: number;
    /** Native video resolution height */
    videoHeight: number;
}


function paint(
    canvas: HTMLCanvasElement | null,
    frame: FramePayload | null,
    videoW: number,
    videoH: number,
): void {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure canvas resolution matches video
    if (canvas.width !== videoW && videoW > 0) canvas.width = videoW;
    if (canvas.height !== videoH && videoH > 0) canvas.height = videoH;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!frame) return;

    const isThreat =
        frame.alert_level === "high" || frame.alert_level === "critical";

    // Draw person bounding boxes + skeletons
    for (const person of frame.persons) {
        drawPersonBox(ctx, person, isThreat || frame.is_violence);
        drawSkeleton(ctx, person);
    }

    // Draw weapon bounding boxes
    for (const weapon of frame.weapons) {
        drawWeaponBox(ctx, weapon);
    }

    // Draw contact pairs (highlight IoU overlap)
    if (frame.contact && frame.contact_pairs.length > 0) {
        drawContactIndicator(ctx, frame);
    }
}


function drawPersonBox(
    ctx: CanvasRenderingContext2D,
    person: PersonDetection,
    threat: boolean,
): void {
    const [x1, y1, x2, y2] = person.bbox;
    const color = threat ? PERSON_BOX_THREAT : PERSON_BOX_COLOR;

    ctx.strokeStyle = color;
    ctx.lineWidth = BOX_LINE_WIDTH;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    // Corner accents (HUD style: small L-brackets at corners)
    const cornerLen = Math.min(16, (x2 - x1) * 0.15);
    ctx.lineWidth = 2;
    drawCorner(ctx, x1, y1, cornerLen, 1, 1, color);
    drawCorner(ctx, x2, y1, cornerLen, -1, 1, color);
    drawCorner(ctx, x1, y2, cornerLen, 1, -1, color);
    drawCorner(ctx, x2, y2, cornerLen, -1, -1, color);

    // ID label
    const label = `ID: ${String(person.person_id).padStart(2, "0")}`;
    drawLabel(ctx, label, x1, y1 - 4, color);
}

function drawCorner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    dx: number,
    dy: number,
    color: string,
): void {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + dx * len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * len);
    ctx.stroke();
}

function drawSkeleton(
    ctx: CanvasRenderingContext2D,
    person: PersonDetection,
): void {
    const kps = person.keypoints;
    if (!kps || kps.length < 17) return;

    // Draw limbs (gray axis)
    ctx.strokeStyle = LIMB_COLOR;
    ctx.lineWidth = LIMB_WIDTH;
    ctx.beginPath();

    for (const [from, to] of SKELETON_CONNECTIONS) {
        const kpA = kps[from];
        const kpB = kps[to];
        // Skip if either keypoint has low confidence
        if (kpA[2] < KEYPOINT_MIN_CONF || kpB[2] < KEYPOINT_MIN_CONF) continue;

        ctx.moveTo(kpA[0], kpA[1]);
        ctx.lineTo(kpB[0], kpB[1]);
    }

    ctx.stroke();

    // Draw keypoints (white nodes)
    ctx.fillStyle = KEYPOINT_COLOR;
    for (const kp of kps) {
        if (kp[2] < KEYPOINT_MIN_CONF) continue;

        ctx.beginPath();
        ctx.arc(kp[0], kp[1], KEYPOINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWeaponBox(
    ctx: CanvasRenderingContext2D,
    weapon: WeaponDetection,
): void {
    const [x1, y1, x2, y2] = weapon.bbox;

    ctx.strokeStyle = WEAPON_BOX_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]); // dashed line to distinguish from person boxes
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.setLineDash([]);

    const label = `${weapon.class.toUpperCase()} ${Math.round(weapon.confidence * 100)}%`;
    drawLabel(ctx, label, x1, y1 - 4, WEAPON_BOX_COLOR);
}

function drawContactIndicator(
    ctx: CanvasRenderingContext2D,
    frame: FramePayload,
): void {
    // Highlight the contact region between paired persons
    for (const pair of frame.contact_pairs) {
        const a = frame.persons[pair.person_a];
        const b = frame.persons[pair.person_b];
        if (!a || !b) continue;

        // Draw a subtle connecting line between box centers
        const ax = (a.bbox[0] + a.bbox[2]) / 2;
        const ay = (a.bbox[1] + a.bbox[3]) / 2;
        const bx = (b.bbox[0] + b.bbox[2]) / 2;
        const by = (b.bbox[1] + b.bbox[3]) / 2;

        ctx.strokeStyle = PERSON_BOX_THREAT;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
    }
}

function drawLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
): void {
    ctx.font = LABEL_FONT;
    const metrics = ctx.measureText(text);
    const textH = 14;
    const pad = 4;

    // Background
    ctx.fillStyle = LABEL_BG;
    ctx.fillRect(
        x - 1,
        y - textH - pad,
        metrics.width + pad * 2 + 2,
        textH + pad,
    );

    // Text
    ctx.fillStyle = color;
    ctx.fillText(text, x + pad, y - pad);
}


export default function DetectionOverlay({
    videoWidth,
    videoHeight,
}: DetectionOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Subscribe directly to the store outside React render cycle.
        // This avoids re-rendering the component on every frame (~10/s).
        let prevFrame: FramePayload | null = null;

        const unsubscribe = useStreamStore.subscribe((state) => {
            if (state.frame !== prevFrame) {
                prevFrame = state.frame;
                paint(canvasRef.current, state.frame, videoWidth, videoHeight);
            }
        });

        return unsubscribe;
    }, [videoWidth, videoHeight]);

    return (
        <canvas
            ref={canvasRef}
            width={videoWidth || 640}
            height={videoHeight || 480}
            className="absolute inset-0 h-full w-full pointer-events-none"
            style={{ objectFit: "contain" }}
        />
    );
}

