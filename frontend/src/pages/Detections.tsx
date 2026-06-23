import { useCallback, useEffect, useState } from "react";
import { listDetections } from "../services/api";
import type { AlertLevel, DetectionType, DetectionSummary } from "../types";


const ALERT_BADGE: Record<AlertLevel, { text: string; cls: string }> = {
    low: { text: "LOW", cls: "border-silver-500 text-silver-300" },
    medium: { text: "MEDIUM", cls: "border-warn text-warn" },
    high: { text: "HIGH", cls: "border-threat text-threat" },
    critical: { text: "CRITICAL", cls: "border-threat text-threat bg-threat/10" },
};

const TYPE_LABEL: Record<DetectionType, { text: string; cls: string }> = {
    violence: { text: "VIOLENCE", cls: "text-threat" },
    weapon: { text: "WEAPON", cls: "text-warn" },
    contact: { text: "CONTACT", cls: "text-silver-100" },
    normal: { text: "NORMAL", cls: "text-silver-500" },
};

const PAGE_SIZE = 30;


export default function Detections() {

    const [detections, setDetections] = useState<DetectionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState<AlertLevel | "all">("all");

    const fetchPage = useCallback(

        async (reset: boolean) => {

            setLoading(true);
            try {
                const newOffset = reset ? 0 : offset;
                const data = await listDetections({
                    limit: PAGE_SIZE,
                    offset: newOffset,
                    alert_level: filter === "all" ? undefined : filter,
                });

                if (reset) {

                    setDetections(data);
                    setOffset(data.length);

                } else {
                    setDetections((prev) => [...prev, ...data]);
                    setOffset((prev) => prev + data.length);
                }

                setHasMore(data.length === PAGE_SIZE);

            } catch (err) {

                console.error("[Detections] Fetch failed:", err);

            } finally {

                setLoading(false);

            }
        },
        [offset, filter],
    );

    // Initial load + reload on filter change
    useEffect(() => {
        fetchPage(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    return (
        <div className="flex flex-col gap-3">
            {/*  Header + Filters  */}
            <div className="hud-panel flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 lg:px-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                    Detectizn Log
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-silver-500">
                        Filter
                    </span>
                    {(["all", "low", "medium", "high", "critical"] as const).map(
                        (level) => (
                            <button
                                key={level}
                                onClick={() => setFilter(level)}
                                className={
                                    "border px-2 py-0.5 text-[10px] uppercase tracking-widest transition-colors " +
                                    (filter === level
                                        ? "border-silver-50 text-silver-50"
                                        : "border-silver-700 text-silver-500 hover:border-silver-300 hover:text-silver-300")
                                }
                                type="button"
                            >
                                {level}
                            </button>
                        ),
                    )}
                </div>
            </div>

            {/*  Desktop table header (hidden on mobile)  */}
            <div className="hidden border-b border-silver-700 px-4 py-2 lg:grid lg:grid-cols-12 lg:gap-3">
                <ColHeader className="col-span-1">ID</ColHeader>
                <ColHeader className="col-span-2">Type</ColHeader>
                <ColHeader className="col-span-2">Alert</ColHeader>
                <ColHeader className="col-span-2">Violence</ColHeader>
                <ColHeader className="col-span-1">Weapon</ColHeader>
                <ColHeader className="col-span-1">People</ColHeader>
                <ColHeader className="col-span-1">Camera</ColHeader>
                <ColHeader className="col-span-2">Time</ColHeader>
            </div>

            {/*  Detection rows  */}
            <div className="flex flex-col gap-2 lg:gap-0">
                {detections.map((d) => (
                    <DetectionRow key={d.id} detection={d} />
                ))}
            </div>

            {/*  Empty state  */}
            {!loading && detections.length === 0 && (
                <div className="hud-panel flex h-32 items-center justify-center">
                    <p className="text-xs uppercase tracking-widest text-silver-500">
                        No detections found
                    </p>
                </div>
            )}

            {/*  Loading / Load more  */}
            <div className="flex justify-center py-2">
                {loading ? (
                    <p className="text-xs text-silver-500 animate-pulse">
                        Loading detections...
                    </p>
                ) : hasMore ? (
                    <button
                        onClick={() => fetchPage(false)}
                        className="border border-silver-500 px-5 py-1.5 text-[10px] uppercase tracking-widest text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
                        type="button"
                    >
                        Load More
                    </button>
                ) : detections.length > 0 ? (
                    <p className="text-[10px] uppercase tracking-widest text-silver-700">
                        End of records
                    </p>
                ) : null}
            </div>
        </div>
    );
}


// Detection row (card on mobile, table row on desktop)    

function DetectionRow({ detection: d }: { detection: DetectionSummary }) {
    const alertBadge = ALERT_BADGE[d.alert_level];
    const typeLabel = TYPE_LABEL[d.detection_type];
    const time = formatDateTime(d.frame_time);
    const confidence = d.violence_confidence != null
        ? `${Math.round(d.violence_confidence * 100)}%`
        : "--";

    return (
        <>
            {/* Mobile card */}
            <div className="hud-panel flex flex-col gap-2 p-3 lg:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-silver-500">
                            #{d.id}
                        </span>
                        <span className={"text-xs font-bold uppercase tracking-wide " + typeLabel.cls}>
                            {typeLabel.text}
                        </span>
                    </div>
                    <span
                        className={
                            "border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                            alertBadge.cls
                        }
                    >
                        {alertBadge.text}
                    </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-silver-300">
                    <span>Violence: <b className="text-silver-100">{confidence}</b></span>
                    <span>Weapon: <b className={d.weapon_detected ? "text-threat" : "text-silver-100"}>{d.weapon_detected ? "YES" : "NO"}</b></span>
                    <span>People: <b className="text-silver-100">{d.persons_count ?? "--"}</b></span>
                    <span>{d.camera_id ?? "CAM-01"}</span>
                </div>
                <p className="text-[10px] tabular-nums text-silver-500">{time}</p>
            </div>

            {/* Desktop row */}
            <div className="hidden border-b border-silver-900 px-4 py-2 transition-colors hover:bg-panel-raised lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center">
                <span className="col-span-1 text-xs tabular-nums text-silver-500">
                    #{d.id}
                </span>
                <span className={"col-span-2 text-xs font-bold uppercase tracking-wide " + typeLabel.cls}>
                    {typeLabel.text}
                </span>
                <span className="col-span-2">
                    <span
                        className={
                            "inline-block border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                            alertBadge.cls
                        }
                    >
                        {alertBadge.text}
                    </span>
                </span>
                <span className="col-span-2 text-xs tabular-nums text-silver-100">
                    {confidence}
                </span>
                <span className={"col-span-1 text-xs font-bold " + (d.weapon_detected ? "text-threat" : "text-silver-500")}>
                    {d.weapon_detected ? "YES" : "NO"}
                </span>
                <span className="col-span-1 text-xs tabular-nums text-silver-100">
                    {d.persons_count ?? "--"}
                </span>
                <span className="col-span-1 text-[10px] text-silver-300">
                    {d.camera_id ?? "CAM-01"}
                </span>
                <span className="col-span-2 text-[10px] tabular-nums text-silver-500">
                    {time}
                </span>
            </div>
        </>
    );
}


// Helpers                                 

function ColHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={"text-[9px] uppercase tracking-[0.2em] text-silver-500 " + (className ?? "")}>
            {children}
        </span>
    );
}

function formatDateTime(iso: string): string {
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




