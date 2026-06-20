import { useAlertStore } from "../../stores/useAlertStore";
import { useStreamStore } from "../../stores/useStreamStore";


export default function SystemFeed() {

    const health = useAlertStore((s) => s.health);
    const connectionState = useStreamStore((s) => s.connectionState);
    const framesReceived = useStreamStore((s) => s.framesReceived);

    // Build status lines from live state
    const lines: { text: string; ok: boolean }[] = [
        {
            text: `AI CORE: ${health?.status === "ok" ? "ONLINE" : health?.status === "degraded" ? "DEGRADED" : "OFFLINE"}`,
            ok: health?.status === "ok",
        },
        {
            text: `MODELS: ${health?.models ? "LOADED" : "NOT LOADED"}`,
            ok: health?.models === true,
        },
        {
            text: `STREAM: ${connectionState.toUpperCase()}`,
            ok: connectionState === "connected",
        },
        {
            text: `FRAMES: ${framesReceived}`,
            ok: true,
        },
        {
            text: `DATABASE: ${health ? "SYNCED" : "UNKNOWN"}`,
            ok: health !== null,
        },
        {
            text: `ENV: ${health?.env?.toUpperCase() ?? "UNKNOWN"}`,
            ok: true,
        },
        {
            text: "SYSTEMS: " + (health?.status === "ok" && connectionState === "connected" ? "NOMINAL" : "STANDBY"),
            ok: health?.status === "ok" && connectionState === "connected",
        },
        {
            text: `UPTIME: ${health ? "ACTIVE" : "--"}`,
            ok: health !== null,
        },
    ];

    return (
        <div className="hud-panel flex h-full flex-col p-3 lg:p-4">
            <p className="hud-label text-lg mb-3">System Feed</p>

            {/* Status grid — 2 columns, rows expand to fill available space */}
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 content-start">
                {lines.map((line) => (
                    <div
                        key={line.text}
                        className="flex items-start gap-1.5 py-1"
                    >
                        <span
                            className={
                                "mt-px h-1.5 w-1.5 shrink-0 rounded-full " +
                                (line.ok ? "bg-online" : "bg-silver-400")
                            }
                        />
                        <p
                            className={
                                "text-sm font-mono leading-tight " +
                                (line.ok ? "text-silver-100" : "text-silver-400")
                            }
                        >
                            {line.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* Slogan footer — pinned to bottom */}
            <div className="mt-4 border-t border-silver-700 pt-3">
                <p className="text-center text-[16px] uppercase tracking-[0.3em] text-silver-500">
                    We See. We Protect. We Never Sleep.
                </p>
            </div>
        </div>
    );
}
