import type { EventRead, EventSeverity, EventType } from "../../types";
import fightIcon from "../../assets/fight.svg";
import gunIcon from "../../assets/gun.svg";
import manIcon from "../../assets/man.svg";
import dashboardIcon from "../../assets/dashboard.svg";
import Badge, { type BadgeTone } from "../ui/Badge";

const SEVERITY_TONE: Record<EventSeverity, BadgeTone> = {
  low: "neutral",
  medium: "warn",
  high: "threat",
  critical: "threat",
};

const TYPE_LABEL: Record<EventType, string> = {
  fight: "Fight Detected",
  weapon: "Weapon Detected",
  contact: "Contact",
  system: "System",
};

/** Maps each event type to its corresponding SVG icon asset. */
const TYPE_ICON: Record<EventType, string> = {
  fight: fightIcon,
  weapon: gunIcon,
  contact: manIcon,
  system: dashboardIcon,
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface AlertItemProps {
  event: EventRead;
  onClick?: (event: EventRead) => void;
}

/**
 * Single row in the Recent Threats feed. Mirrors the mockup's
 * threat-list entries: severity-colored marker, type label,
 * camera/description, and a relative timestamp.
 */
export default function AlertItem({ event, onClick }: AlertItemProps) {
  const tone = SEVERITY_TONE[event.severity];
  const isOpen = event.ended_at === null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      disabled={!onClick}
      className={[
        "flex w-full items-start gap-3 border-l-2 px-3 py-2 text-left transition-colors",
        isOpen ? "border-threat" : "border-silver-700",
        onClick ? "hover:bg-panel-raised cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      {/* Event-type icon */}
      <img
        src={TYPE_ICON[event.event_type]}
        alt={TYPE_LABEL[event.event_type]}
        className="mt-0.5 h-4 w-4 shrink-0 opacity-70"
        aria-hidden="true"
      />

      {/* Live / closed indicator dot */}
      <span
        className={[
          "mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
          isOpen ? "bg-threat animate-pulse-live" : "bg-silver-500",
        ].join(" ")}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-silver-50">
            {TYPE_LABEL[event.event_type]}
          </p>
          <Badge tone={tone}>{event.severity}</Badge>
        </div>

        {event.description && (
          <p className="mt-0.5 truncate text-xs text-silver-300">{event.description}</p>
        )}

        <div className="mt-1 flex items-center gap-2 text-[10px] text-silver-300/70">
          {event.camera_id && <span>{event.camera_id}</span>}
          <span>{timeAgo(event.started_at)}</span>
          {isOpen && <span className="text-threat">OPEN</span>}
        </div>
      </div>
    </button>
  );
}
