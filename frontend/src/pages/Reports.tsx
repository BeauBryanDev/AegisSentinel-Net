import { useEffect, useMemo, useState } from "react";
import { listDetections, listEvents } from "../services/api";
import { useAlertStore } from "../stores/useAlertStore";
import type { DetectionSummary, EventRead, AlertLevel } from "../types";



export default function Reports() {
    const [detections, setDetections] = useState<DetectionSummary[]>([]);
    const [events, setEvents] = useState<EventRead[]>([]);
    const [loading, setLoading] = useState(true);

    const health = useAlertStore((s) => s.health);
    const fetchHealth = useAlertStore((s) => s.fetchHealth);

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
                console.error("[Reports] Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [fetchHealth]);

    // -- 7-day aggregation --
    const report = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentDets = detections.filter(
            (d) => new Date(d.created_at) >= sevenDaysAgo,
        );
        const recentEvents = events.filter(
            (e) => new Date(e.created_at) >= sevenDaysAgo,
        );

        const violenceCount = recentDets.filter((d) => d.detection_type === "violence").length;
        const weaponCount = recentDets.filter((d) => d.weapon_detected).length;
        const contactCount = recentDets.filter((d) => d.detection_type === "contact").length;

        const alertBreakdown: Record<AlertLevel, number> = {
            low: 0, medium: 0, high: 0, critical: 0,
        };
        for (const d of recentDets) {
            alertBreakdown[d.alert_level]++;
        }

        const fightEvents = recentEvents.filter((e) => e.event_type === "fight").length;
        const weaponEvents = recentEvents.filter((e) => e.event_type === "weapon").length;
        const openEvents = recentEvents.filter((e) => e.ended_at === null).length;

        const avgConfidence = recentDets
            .filter((d) => d.violence_confidence != null)
            .reduce((sum, d, _, arr) => sum + (d.violence_confidence ?? 0) / arr.length, 0);

        // Daily breakdown
        const dailyCounts: { date: string; count: number; violence: number; weapons: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStr = day.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayDets = recentDets.filter((d) => {
                const t = new Date(d.created_at);
                return t >= dayStart && t < dayEnd;
            });

            dailyCounts.push({
                date: dayStr,
                count: dayDets.length,
                violence: dayDets.filter((d) => d.detection_type === "violence").length,
                weapons: dayDets.filter((d) => d.weapon_detected).length,
            });
        }

        return {
            period: {
                from: sevenDaysAgo.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                to: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            },
            totalDetections: recentDets.length,
            violenceCount,
            weaponCount,
            contactCount,
            alertBreakdown,
            totalEvents: recentEvents.length,
            fightEvents,
            weaponEvents,
            openEvents,
            avgConfidence,
            dailyCounts,
        };
    }, [detections, events]);

    const handleExportPdf = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="hud-panel flex h-48 items-center justify-center">
                <p className="text-xs text-silver-500 animate-pulse">
                    Generating report...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 lg:gap-4">
            {/* ---- Header + Export ---- */}
            <div className="hud-panel flex items-center justify-between px-3 py-2.5 lg:px-4 print:hidden">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver-50">
                    Operational Report
                </h2>
                <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 border border-silver-300 px-4 py-1.5 text-[10px] uppercase tracking-widest text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
                    type="button"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                    >
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
                    </svg>
                    Export PDF
                </button>
            </div>

            {/* ---- Report content (printable) ---- */}
            <div id="report-content" className="print:bg-white print:text-black print:p-8">
                {/* Report header */}
                <div className="hud-panel p-4 print:border print:border-gray-300 print:bg-white">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-silver-50 print:text-black">
                                AegisSentinel-Net
                            </h3>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-silver-300 print:text-gray-600">
                                Operational Summary Report
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-silver-500 print:text-gray-500">
                                Period
                            </p>
                            <p className="text-xs font-bold tabular-nums text-silver-100 print:text-black">
                                {report.period.from} — {report.period.to}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={"inline-block h-1.5 w-1.5 rounded-full " + (health?.status === "ok" ? "bg-online" : "bg-silver-500")} />
                        <span className="text-[10px] uppercase tracking-widest text-silver-300 print:text-gray-600">
                            System: {health?.status?.toUpperCase() ?? "UNKNOWN"}
                        </span>
                    </div>
                </div>

                {/* Overview stats */}
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
                    <ReportStat label="Total Detections" value={report.totalDetections} />
                    <ReportStat label="Violence Events" value={report.violenceCount} accent="text-threat print:text-red-600" />
                    <ReportStat label="Weapon Detections" value={report.weaponCount} accent="text-warn print:text-orange-600" />
                    <ReportStat label="Contact Triggers" value={report.contactCount} />
                </div>

                {/* Alert breakdown */}
                <div className="mt-3 hud-panel p-4 print:border print:border-gray-300 print:bg-white">
                    <p className="hud-label mb-3 print:text-gray-500">Alert Level Breakdown</p>
                    <div className="grid grid-cols-4 gap-3">
                        <AlertStat label="Low" value={report.alertBreakdown.low} cls="text-silver-300 print:text-gray-600" />
                        <AlertStat label="Medium" value={report.alertBreakdown.medium} cls="text-warn print:text-orange-600" />
                        <AlertStat label="High" value={report.alertBreakdown.high} cls="text-threat print:text-red-600" />
                        <AlertStat label="Critical" value={report.alertBreakdown.critical} cls="text-threat print:text-red-600" />
                    </div>
                </div>

                {/* Event summary */}
                <div className="mt-3 hud-panel p-4 print:border print:border-gray-300 print:bg-white">
                    <p className="hud-label mb-3 print:text-gray-500">Incident Summary</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <ReportStat label="Total Incidents" value={report.totalEvents} />
                        <ReportStat label="Fight Incidents" value={report.fightEvents} accent="text-threat print:text-red-600" />
                        <ReportStat label="Weapon Incidents" value={report.weaponEvents} accent="text-warn print:text-orange-600" />
                        <ReportStat label="Open (Unresolved)" value={report.openEvents} accent="text-warn print:text-orange-600" />
                    </div>
                </div>

                {/* Model performance */}
                <div className="mt-3 hud-panel p-4 print:border print:border-gray-300 print:bg-white">
                    <p className="hud-label mb-3 print:text-gray-500">Model Performance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-silver-500 print:text-gray-500">
                            Avg Violence Confidence
                        </span>
                        <span className="text-sm font-bold tabular-nums text-silver-50 print:text-black">
                            {Math.round(report.avgConfidence * 100)}%
                        </span>
                    </div>
                </div>

                {/* Daily breakdown table */}
                <div className="mt-3 hud-panel overflow-hidden print:border print:border-gray-300 print:bg-white">
                    <p className="hud-label px-4 pt-4 pb-2 print:text-gray-500">Daily Breakdown</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-silver-700 print:border-gray-300">
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-silver-500 print:text-gray-500">Date</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-silver-500 print:text-gray-500">Detections</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-silver-500 print:text-gray-500">Violence</th>
                                    <th className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-silver-500 print:text-gray-500">Weapons</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.dailyCounts.map((day) => (
                                    <tr
                                        key={day.date}
                                        className="border-b border-silver-900 print:border-gray-200"
                                    >
                                        <td className="px-4 py-1.5 text-xs tabular-nums text-silver-100 print:text-black">
                                            {day.date}
                                        </td>
                                        <td className="px-4 py-1.5 text-xs tabular-nums text-silver-100 print:text-black">
                                            {day.count}
                                        </td>
                                        <td className="px-4 py-1.5 text-xs tabular-nums text-threat print:text-red-600">
                                            {day.violence}
                                        </td>
                                        <td className="px-4 py-1.5 text-xs tabular-nums text-warn print:text-orange-600">
                                            {day.weapons}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Report footer */}
                <div className="mt-4 text-center">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-silver-700 print:text-gray-400">
                        AegisSentinel-Net v1.0.0 — Sentinel Defense Systems
                    </p>
                    <p className="mt-1 text-[8px] tabular-nums text-silver-700 print:text-gray-400">
                        Generated: {new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                </div>
            </div>
        </div>
    );
}


// Inner Components


function ReportStat({
    label,
    value,
    accent = "text-silver-50 print:text-black",
}: {
    label: string;
    value: number;
    accent?: string;
}) {
    return (
        <div className="hud-panel flex flex-col items-center p-3 print:border print:border-gray-200 print:bg-white">
            <span className={"text-xl font-bold tabular-nums " + accent}>
                {value}
            </span>
            <span className="mt-1 text-center text-[9px] uppercase tracking-[0.12em] text-silver-500 print:text-gray-500">
                {label}
            </span>
        </div>
    );
}

function AlertStat({
    label,
    value,
    cls,
}: {
    label: string;
    value: number;
    cls: string;
}) {
    return (
        <div className="text-center">
            <span className={"block text-lg font-bold tabular-nums " + cls}>
                {value}
            </span>
            <span className="text-[9px] uppercase tracking-[0.12em] text-silver-500 print:text-gray-500">
                {label}
            </span>
        </div>
    );
}


