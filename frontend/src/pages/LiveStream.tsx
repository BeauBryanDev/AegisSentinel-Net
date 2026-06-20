import { useEffect, useRef } from "react";
import { useStreamStore } from "../stores/useStreamStore";
import { useAlertStore } from "../stores/useAlertStore";
import { useStream } from "../hooks/useStream";
import { useSocket } from "../hooks/useSocket";
import DetectionOverlay from "../components/stream/DetectionOverlay";
import StreamControls from "../components/stream/StreamControls";
import PeopleCounter from "../components/stream/PeopleCounter";
import AttentionBar from "../components/charts/AttentionBar";
import ViolenceTimeline from "../components/charts/ViolenceTimeline";
import AttentionHeatmap from "../components/charts/AttentionHeatmap";
import ProbDistribution from "../components/charts/ProbDistribution";
import type { AlertLevel } from "../types";


// Alert level Visual Mapping 

const ALERT_STYLES: Record<AlertLevel, { label: string; color: string; bg: string }> = {
    low: { label: "LOW", color: "text-silver-300", bg: "bg-silver-700" },
    medium: { label: "MEDIUM", color: "text-warn", bg: "bg-warn/10" },
    high: { label: "HIGH", color: "text-threat", bg: "bg-threat/10" },
    critical: { label: "CRITICAL", color: "text-threat", bg: "bg-threat/20" },
};

//Components


export default function LiveStream() {

    const containerRef = useRef<HTMLDivElement>(null);

    // WebSocket lifecycle: connect on mount, disconnect on unmount
    const { connectionState } = useSocket();

    // Capture pipeline: video binding, dims tracking, rAF capture -> sendFrame()
    const { videoRef, canvasRef, dims, handlePlaying, frame, mediaStream } =
        useStream({ targetFps: 10, jpegQuality: 0.5 });

    // Store selectors
    const startCamera = useStreamStore((s) => s.startCamera);
    const stopCamera = useStreamStore((s) => s.stopCamera);
    const cameraLoading = useStreamStore((s) => s.cameraLoading);
    const cameraError = useStreamStore((s) => s.cameraError);
    const framesReceived = useStreamStore((s) => s.framesReceived);
    const setThreatLevel = useAlertStore((s) => s.setThreatLevel);
    const updateKpi = useAlertStore((s) => s.updateKpi);


    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);


    useEffect(() => {
        if (!frame) return;
        setThreatLevel(frame.alert_level);
        updateKpi({
            detection_type: frame.detection_type,
            weapon_detected: frame.weapon_detected,
            persons_count: frame.persons_count,
        });
    }, [frame, setThreatLevel, updateKpi]);

    //  Derived state

    const alertLevel = frame?.alert_level ?? "low";
    const alertStyle = ALERT_STYLES[alertLevel];
    const isStreaming = connectionState === "connected" && mediaStream !== null;

    return (
        <div className="flex flex-col gap-3">
            {/* ---- Stream panel ---- */}
            <section className="hud-panel hud-panel--bright overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-silver-700 px-3 py-2 lg:px-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                            Live Stream
                        </h2>
                        <span className="text-[10px] uppercase tracking-widest text-silver-300">
                            {frame?.camera_id ?? "CAM-01"} // Main Entrance
                        </span>
                    </div>
                    {isStreaming && (
                        <div className="flex items-center gap-1.5">
                            <span className="hud-live-dot" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-threat">
                                Live
                            </span>
                        </div>
                    )}
                </div>

                {/* Video container */}
                <div
                    ref={containerRef}
                    className="hud-scanlines relative aspect-video w-full bg-void"
                >
                    {/* Loading state */}
                    {cameraLoading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                            <p className="text-sm text-silver-300 animate-pulse">
                                Initializing camera feed...
                            </p>
                        </div>
                    )}

                    {/* Error state */}
                    {cameraError && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="h-8 w-8 text-threat"
                                aria-hidden="true"
                            >
                                <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            </svg>
                            <p className="text-center text-sm text-silver-300">
                                {cameraError}
                            </p>
                            <button
                                onClick={startCamera}
                                className="border border-silver-500 px-4 py-1.5 text-xs uppercase tracking-widest text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
                                type="button"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Idle state: no camera, no error */}
                    {!cameraLoading && !cameraError && !mediaStream && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                            <p className="text-sm text-silver-500">
                                Camera feed offline
                            </p>
                            <button
                                onClick={startCamera}
                                className="border border-silver-500 px-4 py-1.5 text-xs uppercase tracking-widest text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
                                type="button"
                            >
                                Start Camera
                            </button>
                        </div>
                    )}

                    {/* Active stream layers */}
                    {mediaStream && (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onPlaying={handlePlaying}
                                onResize={handlePlaying}
                                className="h-full w-full object-contain bg-void"
                            />
                            <DetectionOverlay
                                videoWidth={dims.width}
                                videoHeight={dims.height}
                            />
                            <PeopleCounter />
                            <StreamControls containerRef={containerRef} />

                            {/* Alert level badge (top-right) */}
                            <div
                                className={
                                    "absolute top-3 right-3 z-10 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm " +
                                    alertStyle.bg + " " + alertStyle.color
                                }
                            >
                                {alertStyle.label}
                            </div>
                        </>
                    )}

                    {/* Capture buffer (invisible, drawn into by useStream's rAF loop) */}
                    <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

                    {/* HUD corner brackets */}
                    <div className="hud-corners absolute inset-2 pointer-events-none" />
                </div>
            </section>

            {/* -  Telemetry strip  */}
            <section className="hud-panel flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2.5 lg:px-4">
                <TelemetryItem
                    label="Status"
                    value={connectionState.toUpperCase()}
                    color={
                        connectionState === "connected"
                            ? "text-online"
                            : connectionState === "connecting"
                                ? "text-warn"
                                : "text-silver-500"
                    }
                />
                <TelemetryItem
                    label="Alert"
                    value={alertStyle.label}
                    color={alertStyle.color}
                />
                <TelemetryItem
                    label="Violence Prob"
                    value={
                        frame?.violence_prob_smooth != null
                            ? `${Math.round(frame.violence_prob_smooth * 100)}%`
                            : "--"
                    }
                    color={
                        frame?.is_violence ? "text-threat" : "text-silver-100"
                    }
                />
                <TelemetryItem
                    label="Engine"
                    value={frame?.engine_awake ? "AWAKE" : "IDLE"}
                    color={frame?.engine_awake ? "text-online" : "text-silver-500"}
                />
                <TelemetryItem
                    label="Weapons"
                    value={frame?.weapon_detected ? "DETECTED" : "CLEAR"}
                    color={frame?.weapon_detected ? "text-threat" : "text-silver-300"}
                />
                <TelemetryItem
                    label="Frames"
                    value={String(framesReceived)}
                    color="text-silver-300"
                />
            </section>

            {/* ---- Analytics: live attention bar ---- */}
            <AttentionBar />

            {/* ---- Analytics: violence probability timeline ---- */}
            <ViolenceTimeline />

            {/* ---- Analytics: attention heatmap + probability distribution ---- */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                <AttentionHeatmap />
                <ProbDistribution />
            </div>
        </div>
    );
}

// Sub-components                               

function TelemetryItem({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-silver-500">
                {label}
            </span>
            <span className={"text-xs font-bold tabular-nums " + color}>
                {value}
            </span>
        </div>
    );
}
