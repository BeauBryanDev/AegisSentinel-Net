import { useCallback, useEffect, useState } from "react";
import { listEvents } from "../services/api";
import { useAlertStore } from "../stores/useAlertStore";
import { useStreamStore } from "../stores/useStreamStore";
import type { EventRead, EventType } from "../types";


const TYPE_PREFIX: Record<EventType, { tag: string; cls: string }> = {

    fight: { tag: "FIGHT", cls: "text-threat" },
    weapon: { tag: "WEAPON", cls: "text-warn" },
    contact: { tag: "CONTACT", cls: "text-silver-100" },
    system: { tag: "SYSTEM", cls: "text-online" },
};

const SEVERITY_CLS: Record<string, string> = {

    low: "text-silver-500",
    medium: "text-warn",
    high: "text-threat",
    critical: "text-threat font-bold",
};

const PAGE_SIZE = 50;


export default function SystemLogs() {

    const [events, setEvents] = useState<EventRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");

    const health = useAlertStore((s) => s.health);
    const fetchHealth = useAlertStore((s) => s.fetchHealth);
    const connectionState = useStreamStore((s) => s.connectionState);

    const fetchPage = useCallback(
        async (reset: boolean) => {
            setLoading(true);
            try {
                const currentOffset = reset ? 0 : offset;
                const data = await listEvents({
                    limit: PAGE_SIZE,
                    offset: currentOffset,
                    event_type: typeFilter === "all" ? undefined : typeFilter,
                });

                if (reset) {
                    setEvents(data);
                    setOffset(data.length);
                } else {
                    setEvents((prev) => [...prev, ...data]);
                    setOffset((prev) => prev + data.length);
                }

                setHasMore(data.length === PAGE_SIZE);
            } catch (err) {
                console.error("[SystemLogs] Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        },
        [offset, typeFilter],
    );

    useEffect(() => {
        fetchHealth();
        fetchPage(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeFilter]);

    return (
        <div className="flex flex-col gap-3">
            {/*   Header + Filters   */}
            <div className="hud-panel flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 lg:px-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                    System Logs
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-silver-500">
                        Filter
                    </span>
                    {(["all", "fight", "weapon", "contact", "system"] as const).map(
                        (t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={
                                    "border px-2 py-0.5 text-[10px] uppercase tracking-widest transition-colors " +
                                    (typeFilter === t
                                        ? "border-silver-50 text-silver-50"
                                        : "border-silver-700 text-silver-500 hover:border-silver-300 hover:text-silver-300")
                                }
                                type="button"
                            >
                                {t}
                            </button>
                        ),
                    )}
                </div>
            </div>

            {/*   System status header   */}
            <div className="hud-panel px-3 py-2.5 lg:px-4">
                <p className="hud-label mb-2">System Status</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <StatusLine
                        label="AI Core"
                        value={health?.status === "ok" ? "ONLINE" : health?.status ?? "UNKNOWN"}
                        ok={health?.status === "ok"}
                    />
                    <StatusLine
                        label="Models"
                        value={health?.models ? "LOADED" : "NOT LOADED"}
                        ok={health?.models === true}
                    />
                    <StatusLine
                        label="Stream"
                        value={connectionState.toUpperCase()}
                        ok={connectionState === "connected"}
                    />
                    <StatusLine
                        label="Environment"
                        value={health?.env?.toUpperCase() ?? "UNKNOWN"}
                        ok={true}
                    />
                </div>
            </div>

            {/*  Terminal log  */}
            <div className="hud-panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-silver-700 px-3 py-2 lg:px-4">
                    <p className="text-[10px] uppercase tracking-widest text-silver-500">
                        Event Log — {events.length} entries
                    </p>
                    <span className="text-[9px] tabular-nums text-silver-700">
                        {health?.app_name ?? "aegis-sentinel-net"}
                    </span>
                </div>

                <div className="max-h-[60vh] overflow-y-auto bg-void p-3 lg:p-4">
                    {/* Log entries */}
                    <div className="space-y-0.5 font-mono text-xs">
                        {events.map((event) => (
                            <LogEntry key={event.id} event={event} />
                        ))}

                        {!loading && events.length === 0 && (
                            <p className="text-silver-500">
                                <span className="select-none text-silver-700">{"> "}</span>
                                No log entries match the current filter.
                            </p>
                        )}

                        {loading && (
                            <p className="text-silver-500 animate-pulse">
                                <span className="select-none text-silver-700">{"> "}</span>
                                Loading entries...
                            </p>
                        )}
                    </div>
                </div>

                {/* Load more footer */}
                {!loading && hasMore && (
                    <div className="border-t border-silver-700 px-3 py-2 lg:px-4">
                        <button
                            onClick={() => fetchPage(false)}
                            className="text-[10px] uppercase tracking-widest text-silver-500 transition-colors hover:text-silver-50"
                            type="button"
                        >
                            {">"} load more entries...
                        </button>
                    </div>
                )}

                {!loading && !hasMore && events.length > 0 && (
                    <div className="border-t border-silver-700 px-3 py-2 lg:px-4">
                        <p className="text-[10px] text-silver-700">
                            {">"} end of log
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}


function LogEntry({ event }: { event: EventRead }) {
    const typeInfo = TYPE_PREFIX[event.event_type] ?? TYPE_PREFIX.system;
    const sevCls = SEVERITY_CLS[event.severity] ?? "text-silver-500";
    const time = formatTimestamp(event.started_at);
    const isOpen = event.ended_at === null;

    return (
        <div className="flex flex-wrap gap-x-1 leading-relaxed">
            {/* Prompt */}
            <span className="select-none text-silver-700">{">"}</span>

            {/* Timestamp */}
            <span className="tabular-nums text-silver-500">[{time}]</span>

            {/* Event type tag */}
            <span className={"font-bold " + typeInfo.cls}>{typeInfo.tag}</span>

            {/* Severity */}
            <span className={sevCls}>({event.severity})</span>

            {/* Camera */}
            <span className="text-silver-500">{event.camera_id ?? "CAM-01"}</span>

            {/* Description or status */}
            <span className="text-silver-300">
                {event.description
                    ? event.description
                    : isOpen
                        ? "Event in progress"
                        : "Event closed"}
            </span>

            {/* Duration for closed events */}
            {!isOpen && event.ended_at && (
                <span className="text-silver-700">
                    [{formatDuration(event.started_at, event.ended_at)}]
                </span>
            )}

            {/* Open indicator */}
            {isOpen && (
                <span className="text-warn">*ACTIVE*</span>
            )}

            {/* Event ID */}
            <span className="text-silver-700">id:{event.id}</span>
        </div>
    );
}


function StatusLine({
    label,
    value,
    ok,
}: {
    label: string;
    value: string;
    ok: boolean;
}) {
    return (
        <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-silver-500">
                {label}:
            </span>
            <span
                className={
                    "text-xs font-bold " + (ok ? "text-online" : "text-silver-500")
                }
            >
                {value}
            </span>
        </div>
    );
}

function formatTimestamp(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return "--:--:--";
    }
}

function formatDuration(startIso: string, endIso: string): string {
    try {
        const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
        if (ms < 0) return "--";
        const secs = Math.floor(ms / 1000);
        if (secs < 60) return `${secs}s`;
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins}m${remSecs}s`;
    } catch {
        return "--";
    }
}


