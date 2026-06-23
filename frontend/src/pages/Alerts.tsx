import { useCallback, useEffect, useState } from "react";
import { listEvents, updateEvent } from "../services/api";
import type { EventRead, EventType, EventSeverity } from "../types";

import fightIcon from "../assets/fight.svg";
import gunIcon from "../assets/gun.svg";
import manIcon from "../assets/man.svg";
import dashboardIcon from "../assets/dashboard.svg";


const SEVERITY_STYLE: Record<EventSeverity, { cls: string }> = {

    low: { cls: "border-silver-500 text-silver-300" },
    medium: { cls: "border-warn text-warn" },
    high: { cls: "border-threat text-threat" },
    critical: { cls: "border-threat text-threat bg-threat/10" },
};

const TYPE_STYLE: Record<EventType, { label: string; cls: string; icon: string }> = {

    fight: { label: "FIGHT", cls: "text-threat", icon: fightIcon },
    weapon: { label: "WEAPON", cls: "text-warn", icon: gunIcon },
    contact: { label: "CONTACT", cls: "text-silver-100", icon: manIcon },
    system: {
        label: "SYSTEM", cls: "text-silver-500", icon: dashboardIcon
    }

};


const PAGE_SIZE = 30;


export default function Alerts() {
    // Function to fetch events from the API
    const [events, setEvents] = useState<EventRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

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
                console.error("[Alerts] Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        },
        [offset, typeFilter],
    );

    useEffect(() => {
        fetchPage(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeFilter]);

    // Close an open event
    const handleClose = useCallback(async (id: number) => {
        try {
            const updated = await updateEvent(id, {
                ended_at: new Date().toISOString(),
            });
            setEvents((prev) =>
                prev.map((e) => (e.id === id ? updated : e)),
            );
        } catch (err) {
            console.error("[Alerts] Failed to close event:", err);
        }
    }, []);

    // Client-side status filter
    const filtered = events.filter((e) => {
        if (statusFilter === "open") return e.ended_at === null;
        if (statusFilter === "closed") return e.ended_at !== null;
        return true;
    });

    // Counts
    const openCount = events.filter((e) => e.ended_at === null).length;
    const closedCount = events.filter((e) => e.ended_at !== null).length;

    return (
        <div className="flex flex-col gap-3">
            {/* Header + Filters */}
            <div className="hud-panel flex flex-col gap-3 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:px-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                        Alert Management
                    </h2>
                    <div className="flex items-center gap-3">
                        <CountBadge label="Open" value={openCount} cls="text-warn" />
                        <CountBadge label="Closed" value={closedCount} cls="text-silver-500" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Type filter */}
                    <span className="text-[10px] uppercase tracking-widest text-silver-500">
                        Type
                    </span>
                    {(["all", "fight", "weapon", "contact", "system"] as const).map(
                        (t) => (
                            <FilterBtn
                                key={t}
                                label={t}
                                active={typeFilter === t}
                                onClick={() => setTypeFilter(t)}
                            />
                        ),
                    )}

                    <span className="mx-1 h-4 w-px bg-silver-700" />

                    {/* Status filter */}
                    <span className="text-[10px] uppercase tracking-widest text-silver-500">
                        Status
                    </span>
                    {(["all", "open", "closed"] as const).map((s) => (
                        <FilterBtn
                            key={s}
                            label={s}
                            active={statusFilter === s}
                            onClick={() => setStatusFilter(s)}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop table header */}
            <div className="hidden border-b border-silver-700 px-4 py-2 lg:grid lg:grid-cols-12 lg:gap-3">
                <ColHeader className="col-span-1">ID</ColHeader>
                <ColHeader className="col-span-2">Type</ColHeader>
                <ColHeader className="col-span-2">Severity</ColHeader>
                <ColHeader className="col-span-1">Status</ColHeader>
                <ColHeader className="col-span-1">Camera</ColHeader>
                <ColHeader className="col-span-2">Started</ColHeader>
                <ColHeader className="col-span-2">Duration</ColHeader>
                <ColHeader className="col-span-1">Action</ColHeader>
            </div>

            {/* Event rows */}
            <div className="flex flex-col gap-2 lg:gap-0">
                {filtered.map((event) => (
                    <AlertRow
                        key={event.id}
                        event={event}
                        onClose={handleClose}
                    />
                ))}
            </div>

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
                <div className="hud-panel flex h-32 items-center justify-center">
                    <p className="text-xs uppercase tracking-widest text-silver-500">
                        No alerts match the current filters
                    </p>
                </div>
            )}

            {/* Loading / Load more */}
            <div className="flex justify-center py-2">
                {loading ? (
                    <p className="text-xs text-silver-500 animate-pulse">
                        Loading alerts...
                    </p>
                ) : hasMore ? (
                    <button
                        onClick={() => fetchPage(false)}
                        className="border border-silver-500 px-5 py-1.5 text-[10px] uppercase tracking-widest text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
                        type="button"
                    >
                        Load More
                    </button>
                ) : events.length > 0 ? (
                    <p className="text-[10px] uppercase tracking-widest text-silver-700">
                        End of records
                    </p>
                ) : null}
            </div>
        </div>
    );
}



function AlertRow({
    event,
    onClose,
}: {
    event: EventRead;
    onClose: (id: number) => void;
}) {
    const typeStyle = TYPE_STYLE[event.event_type] ?? TYPE_STYLE.system;
    const sevStyle = SEVERITY_STYLE[event.severity];
    const isOpen = event.ended_at === null;
    const started = formatTime(event.started_at);
    const duration = isOpen
        ? "Ongoing"
        : formatDuration(event.started_at, event.ended_at!);

    return (
        <>
            {/* Mobile card */}
            <div
                className={
                    "hud-panel flex flex-col gap-2 p-3 lg:hidden " +
                    (isOpen ? "hud-panel--bright" : "")
                }
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={"h-4 w-4 " + typeStyle.cls}
                            aria-hidden="true"
                        >
                            <path d={typeStyle.icon} />
                        </svg>
                        <span className={"text-xs font-bold uppercase tracking-wide " + typeStyle.cls}>
                            {typeStyle.label}
                        </span>
                        <span className="text-[10px] tabular-nums text-silver-500">
                            #{event.id}
                        </span>
                    </div>
                    <span
                        className={
                            "border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                            sevStyle.cls
                        }
                    >
                        {event.severity.toUpperCase()}
                    </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-silver-300">
                    <span>
                        Status:{" "}
                        <b className={isOpen ? "text-warn" : "text-silver-500"}>
                            {isOpen ? "OPEN" : "CLOSED"}
                        </b>
                    </span>
                    <span>{event.camera_id ?? "CAM-01"}</span>
                    <span>{started}</span>
                    <span>Duration: <b className="text-silver-100">{duration}</b></span>
                </div>

                {event.description && (
                    <p className="text-[10px] text-silver-500">{event.description}</p>
                )}

                {isOpen && (
                    <button
                        onClick={() => onClose(event.id)}
                        className="mt-1 self-end border border-warn px-3 py-1 text-[10px] uppercase tracking-widest text-warn transition-colors hover:bg-warn/10"
                        type="button"
                    >
                        Close Event
                    </button>
                )}
            </div>

            {/* Desktop row */}
            <div
                className={
                    "hidden border-b border-silver-900 px-4 py-2 transition-colors hover:bg-panel-raised lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center " +
                    (isOpen ? "border-l-2 border-l-warn" : "")
                }
            >
                <span className="col-span-1 text-xs tabular-nums text-silver-500">
                    #{event.id}
                </span>
                <span className="col-span-2 flex items-center gap-1.5">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={"h-3.5 w-3.5 " + typeStyle.cls}
                        aria-hidden="true"
                    >
                        <path d={typeStyle.icon} />
                    </svg>
                    <span className={"text-xs font-bold uppercase tracking-wide " + typeStyle.cls}>
                        {typeStyle.label}
                    </span>
                </span>
                <span className="col-span-2">
                    <span
                        className={
                            "inline-block border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                            sevStyle.cls
                        }
                    >
                        {event.severity.toUpperCase()}
                    </span>
                </span>
                <span
                    className={
                        "col-span-1 text-[10px] font-bold uppercase tracking-widest " +
                        (isOpen ? "text-warn" : "text-silver-500")
                    }
                >
                    {isOpen ? "OPEN" : "CLOSED"}
                </span>
                <span className="col-span-1 text-[10px] text-silver-300">
                    {event.camera_id ?? "CAM-01"}
                </span>
                <span className="col-span-2 text-[10px] tabular-nums text-silver-500">
                    {started}
                </span>
                <span className="col-span-2 text-[10px] tabular-nums text-silver-100">
                    {duration}
                </span>
                <span className="col-span-1">
                    {isOpen && (
                        <button
                            onClick={() => onClose(event.id)}
                            className="border border-warn px-2 py-0.5 text-[9px] uppercase tracking-widest text-warn transition-colors hover:bg-warn/10"
                            type="button"
                        >
                            Close
                        </button>
                    )}
                </span>
            </div>
        </>
    );
}

// Sub-components + helpers                                        

function FilterBtn({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={
                "border px-2 py-0.5 text-[10px] uppercase tracking-widest transition-colors " +
                (active
                    ? "border-silver-50 text-silver-50"
                    : "border-silver-700 text-silver-500 hover:border-silver-300 hover:text-silver-300")
            }
            type="button"
        >
            {label}
        </button>
    );
}

function CountBadge({
    label,
    value,
    cls,
}: {
    label: string;
    value: number;
    cls: string;
}) {
    return (
        <div className="flex items-baseline gap-1">
            <span className="text-[9px] uppercase tracking-widest text-silver-500">
                {label}
            </span>
            <span className={"text-sm font-bold tabular-nums " + cls}>{value}</span>
        </div>
    );
}

function ColHeader({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={
                "text-[9px] uppercase tracking-[0.2em] text-silver-500 " +
                (className ?? "")
            }
        >
            {children}
        </span>
    );
}

function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        const date = d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
        });
        const time = d.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        return `${date} ${time}`;
    } catch {
        return "--";
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
        if (mins < 60) return `${mins}m ${remSecs}s`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
    } catch {
        return "--";
    }
}
