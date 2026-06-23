import { useCallback, useEffect, useState } from "react";
import { listDetections, getDetection } from "../services/api";
import type { DetectionSummary, DetectionRead, WeaponClassData } from "../types";


const WEAPON_STYLES: Record<string, { label: string; cls: string }> = {
    gun: { label: "GUN", cls: "border-threat text-threat" },
    knife: { label: "KNIFE", cls: "border-warn text-warn" },
    rifle: { label: "RIFLE", cls: "border-silver-100 text-silver-100" },
    heavy_weapon: { label: "HEAVY WEAPON", cls: "border-silver-300 text-silver-300" },
    unknown: { label: "UNKNOWN", cls: "border-silver-500 text-silver-500" },
};

const PAGE_SIZE = 30;


export default function WeaponsHistory() {

    const [items, setItems] = useState<WeaponEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const fetchPage = useCallback(

        async (reset: boolean) => {
            setLoading(true);
            try {
                const currentOffset = reset ? 0 : offset;
                // Fetch a larger batch since we filter client-side
                const data = await listDetections({
                    limit: PAGE_SIZE * 2,
                    offset: currentOffset,
                });

                const weaponDetections = data.filter((d) => d.weapon_detected);

                // Fetch full detail for weapon detections to get weapons_data
                const entries = await Promise.all(
                    weaponDetections.map(async (summary) => {
                        try {
                            const full = await getDetection(summary.id);
                            return buildEntries(summary, full);
                        } catch {
                            return buildEntries(summary, null);
                        }
                    }),
                );

                const flat = entries.flat();

                if (reset) {
                    setItems(flat);
                    setOffset(data.length);
                } else {
                    setItems((prev) => [...prev, ...flat]);
                    setOffset((prev) => prev + data.length);
                }

                setHasMore(data.length === PAGE_SIZE * 2);
            } catch (err) {
                console.error("[WeaponsHistory] Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        },
        [offset],
    );

    useEffect(() => {
        fetchPage(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Stats summary
    const totalWeapons = items.length;
    const gunCount = items.filter((i) => i.weaponType === "gun").length;
    const knifeCount = items.filter((i) => i.weaponType === "knife").length;
    const rifleCount = items.filter((i) => i.weaponType === "rifle").length;

    return (
        <div className="flex flex-col gap-3">
            {/* ---- Header + Stats ---- */}
            <div className="hud-panel px-3 py-2.5 lg:px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                        Weapons History
                    </h2>
                    <div className="flex items-center gap-4">
                        <StatBadge label="Total" value={totalWeapons} cls="text-silver-50" />
                        <StatBadge label="Gun" value={gunCount} cls="text-threat" />
                        <StatBadge label="Knife" value={knifeCount} cls="text-warn" />
                        <StatBadge label="Rifle" value={rifleCount} cls="text-silver-100" />
                    </div>
                </div>
            </div>

            {/*Desktop table header*/}
            <div className="hidden border-b border-silver-700 px-4 py-2 lg:grid lg:grid-cols-10 lg:gap-3">
                <ColHeader className="col-span-1">Detection</ColHeader>
                <ColHeader className="col-span-2">Weapon Type</ColHeader>
                <ColHeader className="col-span-2">Confidence</ColHeader>
                <ColHeader className="col-span-2">Alert Level</ColHeader>
                <ColHeader className="col-span-1">Camera</ColHeader>
                <ColHeader className="col-span-2">Time</ColHeader>
            </div>

            {/* Weapon rows  */}
            <div className="flex flex-col gap-2 lg:gap-0">
                {items.map((item, idx) => (
                    <WeaponRow key={`${item.detectionId}-${item.weaponType}-${idx}`} item={item} />
                ))}
            </div>

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <div className="hud-panel flex h-32 items-center justify-center">
                    <p className="text-xs uppercase tracking-widest text-silver-500">
                        No weapon detections recorded
                    </p>
                </div>
            )}

            {/* Loading / Load more */}
            <div className="flex justify-center py-2">
                {loading ? (
                    <p className="text-xs text-silver-500 animate-pulse">
                        Loading weapon records...
                    </p>
                ) : hasMore ? (
                    <button
                        onClick={() => fetchPage(false)}
                        className="border border-silver-500 px-5 py-1.5 text-[10px] uppercase tracking-widest text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
                        type="button"
                    >
                        Load More
                    </button>
                ) : items.length > 0 ? (
                    <p className="text-[10px] uppercase tracking-widest text-silver-700">
                        End of records
                    </p>
                ) : null}
            </div>
        </div>
    );
}


// Weapon row

interface WeaponEntry {
    detectionId: number;
    weaponType: string;
    confidence: number;
    alertLevel: string;
    cameraId: string;
    frameTime: string;
}

function WeaponRow({ item }: { item: WeaponEntry }) {
    const style = WEAPON_STYLES[item.weaponType] ?? WEAPON_STYLES.unknown;
    const time = formatDateTime(item.frameTime);
    const conf = `${Math.round(item.confidence * 100)}%`;

    return (
        <>
            {/* Mobile card */}
            <div className="hud-panel flex flex-col gap-2 p-3 lg:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-silver-500">
                            #{item.detectionId}
                        </span>
                        <span
                            className={
                                "border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                                style.cls
                            }
                        >
                            {style.label}
                        </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-silver-500">
                        {item.alertLevel}
                    </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-silver-300">
                    <span>Confidence: <b className="text-silver-100">{conf}</b></span>
                    <span>{item.cameraId}</span>
                </div>
                <p className="text-[10px] tabular-nums text-silver-500">{time}</p>
            </div>

            {/* Desktop row */}
            <div className="hidden border-b border-silver-900 px-4 py-2 transition-colors hover:bg-panel-raised lg:grid lg:grid-cols-10 lg:gap-3 lg:items-center">
                <span className="col-span-1 text-xs tabular-nums text-silver-500">
                    #{item.detectionId}
                </span>
                <span className="col-span-2">
                    <span
                        className={
                            "inline-block border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest " +
                            style.cls
                        }
                    >
                        {style.label}
                    </span>
                </span>
                <span className="col-span-2 text-xs tabular-nums text-silver-100">
                    {conf}
                </span>
                <span className="col-span-2 text-[10px] uppercase tracking-widest text-silver-500">
                    {item.alertLevel}
                </span>
                <span className="col-span-1 text-[10px] text-silver-300">
                    {item.cameraId}
                </span>
                <span className="col-span-2 text-[10px] tabular-nums text-silver-500">
                    {time}
                </span>
            </div>
        </>
    );
}

// Helpers 

function buildEntries(

    summary: DetectionSummary,
    full: DetectionRead | null,
): WeaponEntry[] {

    // If I have the full detection with weapons_data,
    // expand each detected weapon class into its own entry
    if (full?.weapons_data) {
        const entries: WeaponEntry[] = [];
        for (const [weaponType, data] of Object.entries(full.weapons_data)) {
            const classData = data as WeaponClassData;
            if (classData.detected) {
                entries.push({
                    detectionId: summary.id,
                    weaponType,
                    confidence: classData.confidence,
                    alertLevel: summary.alert_level,
                    cameraId: summary.camera_id ?? "CAM-01",
                    frameTime: summary.frame_time,
                });
            }
        }
        if (entries.length > 0) return entries;
    }

    // Fallback: no weapons_data detail available
    return [{
        detectionId: summary.id,
        weaponType: "unknown",
        confidence: 0,
        alertLevel: summary.alert_level,
        cameraId: summary.camera_id ?? "CAM-01",
        frameTime: summary.frame_time,
    }];
}

function StatBadge({
    label,
    value,
    cls,
}: {
    label: string;
    value: number;
    cls: string;
}) {
    return (
        <div className="flex items-baseline gap-1.5">
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


