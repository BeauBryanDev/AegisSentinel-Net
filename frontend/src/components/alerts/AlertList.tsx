import type { EventRead } from "../../types";
import AlertItem from "./AlertItem";
import SectionContainer from "../layout/SectionContainer";
import Badge from "../ui/Badge";
import { useAlertStore } from "../../stores/useAlertStore";

interface AlertListProps {
  /** Override the store's events (e.g. for a filtered view). Defaults to useAlertStore. */
  events?: EventRead[];
  /** Override the store's loading flag. */
  loading?: boolean;
  title?: string;
  onSelect?: (event: EventRead) => void;
  /** Cap visible rows; the rest still count toward the panel but are hidden */
  limit?: number;
}

/**
 * Recent Threats feed panel. Mirrors the mockup's right-rail threat list:
 * a scrollable stack of AlertItem rows inside a HUD panel frame.
 * Reads live from useAlertStore by default — drop it into any page with
 * no wiring required, same pattern as the chart components + useStreamStore.
 */
export default function AlertList({
  events,
  loading,
  title = "Recent Threats",
  onSelect,
  limit,
}: AlertListProps) {
  const storeEvents = useAlertStore((s) => s.events);
  const storeLoading = useAlertStore((s) => s.eventsLoading);

  const resolvedEvents = events ?? storeEvents;
  const resolvedLoading = loading ?? storeLoading;

  const openCount = resolvedEvents.filter((e) => e.ended_at === null).length;
  const visible = typeof limit === "number" ? resolvedEvents.slice(0, limit) : resolvedEvents;

  return (
    <SectionContainer
      title={title}
      actions={
        openCount > 0 ? (
          <Badge tone="threat" dot>
            {openCount} Open
          </Badge>
        ) : (
          <Badge tone="online" dot>
            Clear
          </Badge>
        )
      }
    >
      {resolvedLoading && (
        <p className="px-3 py-4 text-center text-xs text-silver-300">Loading threats…</p>
      )}

      {!resolvedLoading && visible.length === 0 && (
        <p className="px-3 py-4 text-center text-xs text-silver-300">No threats recorded.</p>
      )}

      {!resolvedLoading && visible.length > 0 && (
        <div className="flex max-h-80 flex-col divide-y divide-silver-900 overflow-y-auto">
          {visible.map((event) => (
            <AlertItem key={event.id} event={event} onClick={onSelect} />
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
