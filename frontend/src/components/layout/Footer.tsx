import Badge from "../ui/Badge";

/*
 * Console footer. Not present in the Sentinel_Dashboard.png mockup —
 * designed to close out the HUD aesthetic: a tracked-out brand tagline
 * (echoing the dashboard's "FORGED BY INTELLIGENCE. PROTECTING HUMANITY."
 * strip), a live system-health badge, and build/version info.
 * Hidden on mobile (BottomNav owns that real estate); visible lg+.
 */
export default function Footer() {
  return (
    <footer className="hidden border-t border-silver-700 bg-void/90 lg:block">
      <div className="flex items-center justify-between px-6 py-3">
        <p className="text-[10px] uppercase tracking-[0.25em] text-silver-300">
          AegisSentinel&#8209;Net &middot; Forged by Intelligence. Protecting Humanity.
        </p>

        <div className="flex items-center gap-4">
          <Badge tone="online" dot>
            All Systems Nominal
          </Badge>
          <span className="text-[10px] tracking-[0.2em] text-silver-300">
            v0.1.0&nbsp;MVP
          </span>
        </div>
      </div>
    </footer>
  );
}
