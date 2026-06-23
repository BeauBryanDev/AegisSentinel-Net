import { useEffect, useMemo, useState } from "react";
import { listDetections, listEvents } from "../services/api";
import { useAlertStore } from "../stores/useAlertStore";
import { useStreamStore } from "../stores/useStreamStore";
import type { DetectionSummary, EventRead } from "../types";



export default function Metrics() {

    const [detections, setDetections] = useState<DetectionSummary[]>([]);
    const [events, setEvents] = useState<EventRead[]>([]);
    const [loading, setLoading] = useState(true);

    const health = useAlertStore((s) => s.health);
    const fetchHealth = useAlertStore((s) => s.fetchHealth);
    const connectionState = useStreamStore((s) => s.connectionState);
    const framesReceived = useStreamStore((s) => s.framesReceived);

    useEffect(() => {

        fetchHealth();
        (async () => {
            setLoading(true);
            try {
                const [dets, evts] = await Promise.all([
                    listDetections({ limit: 200 }),
                    listEvents({ limit: 200 }),
                ]);
                setDetections(dets);
                setEvents(evts);
            } catch (err) {
                console.error("[Metrics] Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [fetchHealth]);

    // -- Aggregate metrics --
    const stats = useMemo(() => {
        const violenceCount = detections.filter((d) => d.detection_type === "violence").length;
        const weaponCount = detections.filter((d) => d.weapon_detected).length;
        const contactCount = detections.filter((d) => d.detection_type === "contact").length;

        const avgConfidence = detections
            .filter((d) => d.violence_confidence != null)
            .reduce((sum, d, _, arr) => sum + (d.violence_confidence ?? 0) / arr.length, 0);

        const highAlerts = detections.filter((d) => d.alert_level === "high" || d.alert_level === "critical").length;

        const openEvents = events.filter((e) => e.ended_at === null).length;
        const closedEvents = events.filter((e) => e.ended_at !== null).length;

        const avgDuration = events
            .filter((e) => e.ended_at !== null)
            .reduce((sum, e, _, arr) => {
                const ms = new Date(e.ended_at!).getTime() - new Date(e.started_at).getTime();
                return sum + ms / arr.length;
            }, 0);

        const fightEvents = events.filter((e) => e.event_type === "fight").length;
        const weaponEvents = events.filter((e) => e.event_type === "weapon").length;

        return {
            totalDetections: detections.length,
            violenceCount,
            weaponCount,
            contactCount,
            avgConfidence,
            highAlerts,
            openEvents,
            closedEvents,
            avgDuration,
            fightEvents,
            weaponEvents,
        };
    }, [detections, events]);

    if (loading) {
        return (
            <div className="hud-panel flex h-48 items-center justify-center">
                <p className="text-xs text-silver-500 animate-pulse">
                    Loading metrics...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 lg:gap-4">
            {/*Header  */}
            <div className="hud-panel px-3 py-2.5 lg:px-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                    Performance Metrics
                </h2>
            </div>

            {/* Detection metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
                <MetricCell label="Total Detections" value={stats.totalDetections} />
                <MetricCell label="Violence Events" value={stats.violenceCount} color="text-threat" />
                <MetricCell label="Weapon Detections" value={stats.weaponCount} color="text-warn" />
                <MetricCell label="Contact Triggers" value={stats.contactCount} />
            </div>

            {/* Model metrics */}
            <div className="hud-panel p-3 lg:p-4">
                <p className="hud-label mb-3">Model Performance</p>
                <div className="space-y-3">
                    <MetricBar
                        label="Avg Violence Confidence"
                        value={stats.avgConfidence}
                        color="#FF2B3A"
                    />
                    <MetricBar
                        label="High/Critical Alert Rate"
                        value={stats.totalDetections > 0 ? stats.highAlerts / stats.totalDetections : 0}
                        color="#FFB020"
                    />
                    <MetricBar
                        label="Weapon Detection Rate"
                        value={stats.totalDetections > 0 ? stats.weaponCount / stats.totalDetections : 0}
                        color="#C8CCD4"
                    />
                </div>
            </div>

            {/* System + Event metrics */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                {/* System status */}
                <div className="hud-panel p-3 lg:p-4">
                    <p className="hud-label mb-3">System Status</p>
                    <div className="space-y-2 font-mono text-xs">
                        <SysLine label="AI Core" value={health?.status?.toUpperCase() ?? "UNKNOWN"} ok={health?.status === "ok"} />
                        <SysLine label="Models Loaded" value={health?.models ? "TRUE" : "FALSE"} ok={health?.models === true} />
                        <SysLine label="Stream" value={connectionState.toUpperCase()} ok={connectionState === "connected"} />
                        <SysLine label="Frames Processed" value={String(framesReceived)} ok={true} />
                        <SysLine label="Environment" value={health?.env?.toUpperCase() ?? "N/A"} ok={true} />
                    </div>
                </div>

                {/* Event metrics */}
                <div className="hud-panel p-3 lg:p-4">
                    <p className="hud-label mb-3">Event Analytics</p>
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="Open Events" value={stats.openEvents} color="text-warn" />
                        <MiniStat label="Closed Events" value={stats.closedEvents} color="text-online" />
                        <MiniStat label="Fight Incidents" value={stats.fightEvents} color="text-threat" />
                        <MiniStat label="Weapon Incidents" value={stats.weaponEvents} color="text-warn" />
                        <MiniStat
                            label="Avg Duration"
                            value={formatMs(stats.avgDuration)}
                            color="text-silver-100"
                            isText
                        />
                        <MiniStat
                            label="Total Events"
                            value={events.length}
                            color="text-silver-100"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


// Inner Components


function MetricCell({
    label,
    value,
    color = "text-silver-50",
}: {
    label: string;
    value: number | string;
    color?: string;
}) {
    return (
        <div className="hud-panel flex flex-col items-center p-3 lg:p-4">
            <span className={"text-2xl font-bold tabular-nums lg:text-3xl " + color}>
                {value}
            </span>
            <span className="mt-1 text-center text-[9px] uppercase tracking-[0.15em] text-silver-500">
                {label}
            </span>
        </div>
    );
}

function MetricBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    const pct = Math.min(Math.round(value * 100), 100);

    return (
        <div>
            <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em] text-silver-300">
                    {label}
                </span>
                <span className="text-xs font-bold tabular-nums text-silver-50">
                    {pct}%
                </span>
            </div>
            <div className="h-1.5 w-full bg-silver-900">
                <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

function SysLine({
    label,
    value,
    ok,
}: {
    label: string;
    value: string;
    ok: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-silver-500">
                <span className="select-none text-silver-700">{"> "}</span>
                {label}
            </span>
            <span className={"font-bold " + (ok ? "text-online" : "text-silver-500")}>
                {value}
            </span>
        </div>
    );
}

function MiniStat({
    label,
    value,
    color,
    isText = false,
}: {
    label: string;
    value: number | string;
    color: string;
    isText?: boolean;
}) {
    return (
        <div className="flex flex-col">
            <span className={
                (isText ? "text-sm " : "text-lg tabular-nums ") +
                "font-bold " + color
            }>
                {value}
            </span>
            <span className="text-[9px] uppercase tracking-[0.12em] text-silver-500">
                {label}
            </span>
        </div>
    );
}

function formatMs(ms: number): string {
    if (ms <= 0) return "--";
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    if (mins < 60) return `${mins}m ${rem}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
}
