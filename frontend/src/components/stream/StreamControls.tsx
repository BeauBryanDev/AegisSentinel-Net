
import { useCallback, useRef } from "react";
import { useStreamStore } from "../../stores/useStreamStore";

interface StreamControlsProps {
    /** The container element to fullscreen (the stream wrapper, not the video) */
    containerRef: React.RefObject<HTMLDivElement | null>;
}

/*
 * Positioned inside the stream container, overlaid on the video.
 */


export default function StreamControls({ containerRef }: StreamControlsProps) {

    const toggleCamera = useStreamStore((s) => s.toggleCamera);
    const connectionState = useStreamStore((s) => s.connectionState);
    const facingMode = useStreamStore((s) => s.facingMode);
    const isFullscreen = useRef(false);

    const handleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        if (!document.fullscreenElement) {
            el.requestFullscreen?.().catch(() => {
                // Fullscreen not supported or blocked by browser
            });
            isFullscreen.current = true;
        } else {
            document.exitFullscreen?.();
            isFullscreen.current = false;
        }
    }, [containerRef]);

    return (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
            {/* Connection state */}
            <div className="flex items-center gap-1.5 rounded bg-void/70 px-2 py-1 text-[10px] uppercase tracking-widest backdrop-blur-sm">
                <span
                    className={
                        "inline-block h-1.5 w-1.5 rounded-full " +
                        (connectionState === "connected"
                            ? "bg-online"
                            : connectionState === "connecting"
                                ? "bg-warn animate-pulse"
                                : "bg-silver-500")
                    }
                />
                <span className="text-silver-300">{connectionState}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                {/* Toggle camera facing */}
                <button
                    onClick={toggleCamera}
                    className="flex h-9 w-9 items-center justify-center rounded border border-silver-500 bg-void/70 text-silver-300 backdrop-blur-sm transition-colors hover:border-silver-50 hover:text-silver-50 active:bg-panel-raised"
                    aria-label={
                        facingMode === "environment"
                            ? "Switch to front camera"
                            : "Switch to back camera"
                    }
                    type="button"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                        aria-hidden="true"
                    >
                        <path d="M16 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                        <path d="M12 18h.01" />
                        <path d="M8 1h8M15 6l-3 3-3-3" />
                    </svg>
                </button>

                {/* Fullscreen */}
                <button
                    onClick={handleFullscreen}
                    className="flex h-9 w-9 items-center justify-center rounded border border-silver-500 bg-void/70 text-silver-300 backdrop-blur-sm transition-colors hover:border-silver-50 hover:text-silver-50 active:bg-panel-raised"
                    aria-label="Toggle fullscreen"
                    type="button"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                        aria-hidden="true"
                    >
                        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
