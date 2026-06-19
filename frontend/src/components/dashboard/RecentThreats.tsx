
import { useAlertStore } from "../../stores/useAlertStore";
import type { EventRead, EventSeverity, EventType } from "../../types";

import fightIcon from "../../assets/fight.svg";
import gunIcon from "../../assets/gun.svg";
import shieldIcon from "../../assets/safe_shield.svg";
import sentinelIcon from "../../assets/sentinel.svg";



const SEVERITY_COLORS: Record<EventSeverity, string> = {
    low: "text-silver-300",
    medium: "text-warn",
    high: "text-threat",
    critical: "text-threat",
};

const SEVERITY_RING: Record<EventSeverity, string> = {
    low: "border-silver-500",
    medium: "border-warn",
    high: "border-threat",
    critical: "border-threat",
};

const EVENT_LABELS: Record<EventType, string> = {
    fight: "Fight Detected",
    weapon: "Weapon Detected",
    contact: "Contact Detected",
    system: "System Alert",
};


const EVENT_ICONS: Record<EventType, string> = {
    fight: fightIcon,
    weapon: gunIcon,
    contact: shieldIcon,
    system: sentinelIcon,
};


interface RecentThreatsProps {
    /** Max items to display (default 6) */
    limit?: number;
}


function ThreatEntry({ event }: { event: EventRead }) {
    const severityColor = SEVERITY_COLORS[event.severity];
    const severityRing = SEVERITY_RING[event.severity];
    const label = EVENT_LABELS[event.event_type] ?? event.event_type;
    const iconSrc = EVENT_ICONS[event.event_type] ?? EVENT_ICONS.system;

    const time = formatTime(event.started_at);

    return (
        <div className="flex items-start gap-2.5 border-b border-silver-900 pb-2 last:border-0 last:pb-0">
            {/* Event icon: light circular backing keeps the dark-filled
                brand SVGs visible against the panel background */}
            <div
                className={
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-silver-50 " +
                    severityRing
                }
            >
                <img src={iconSrc} alt="" className="h-4 w-4" aria-hidden="true" />
            </div>

            {/* Event details */}
            <div className="min-w-0 flex-1">
                <p className={"text-xs font-bold uppercase tracking-wide " + severityColor}>
                    {label}
                </p>
                <p className="text-[10px] text-silver-500">
                    {event.camera_id ?? "CAM-01"}
                    {event.description && (
                        <span className="text-silver-500"> &mdash; {event.description}</span>
                    )}
                </p>
            </div>

            {/* Timestamp */}
            <span className="shrink-0 text-[10px] tabular-nums text-silver-500">
                {time}
            </span>
        </div>
    );
}



function formatTime(iso: string): string {
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


export default function RecentThreats({ limit = 6 }: RecentThreatsProps) {
    const events = useAlertStore((s) => s.events);
    const eventsLoading = useAlertStore((s) => s.eventsLoading);

    const visible = events.slice(0, limit);

    return (
        <div className="hud-panel p-3 lg:p-4">
            <p className="hud-label mb-3">Recent Threats</p>

            {eventsLoading && visible.length === 0 && (
                <p className="text-xs text-silver-500 animate-pulse">
                    Loading events...
                </p>
            )}

            {!eventsLoading && visible.length === 0 && (
                <p className="text-xs text-silver-500">
                    No incidents recorded.
                </p>
            )}

            <div className="space-y-2">
                {visible.map((event) => (
                    <ThreatEntry key={event.id} event={event} />
                ))}
            </div>

            {events.length > limit && (
                <p className="mt-3 text-right text-[10px] uppercase tracking-widest text-silver-500">
                    View All &rarr;
                </p>
            )}
        </div>
    );
}


