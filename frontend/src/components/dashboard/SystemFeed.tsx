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
            text: `FRAMES PROCESSED: ${framesReceived}`,
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
            text: "ALL SYSTEMS " + (health?.status === "ok" && connectionState === "connected" ? "NOMINAL" : "STANDBY"),
            ok: health?.status === "ok" && connectionState === "connected",
        },
    ];

    return (
        <div className="hud-panel p-3 lg:p-4">
            <p className="hud-label mb-3">System Feed</p>
            <div className="space-y-1">
                {lines.map((line) => (
                    <p
                        key={line.text}
                        className={
                            "text-xs font-mono " +
                            (line.ok ? "text-online" : "text-silver-500")
                        }
                    >
                        <span className="text-silver-500 select-none">{"> "}</span>
                        {line.text}
                    </p>
                ))}
            </div>

            {/* Slogan footer */}
            <div className="mt-4 border-t border-silver-700 pt-3">
                <p className="text-[9px] text-center uppercase tracking-[0.3em] text-silver-500">
                    We See. We Protect. We Never Sleep.
                </p>
            </div>
        </div>
    );
}


