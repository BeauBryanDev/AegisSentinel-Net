import { useEffect, useState } from "react";

/*
 * Top bar. Mirrors the mockup header:
 * brand block on the left, ONLINE status + live clock on the right.
 * The AI core / uptime segments from the desktop mockup will be added
 * when the system status endpoint exists in the backend.
 */
export default function Header() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("en-US", { hour12: false });
  const date = now
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-silver-700 bg-void/90 backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Shield logo asset will replace this placeholder block */}
          <div
            className="h-8 w-8 shrink-0 border border-silver-300 bg-panel"
            style={{ clipPath: "polygon(50% 0, 100% 25%, 100% 70%, 50% 100%, 0 70%, 0 25%)" }}
            aria-hidden="true"
          />
          <div className="leading-tight">
            <h1 className="text-sm font-bold tracking-wide text-silver-50 lg:text-base">
              AegisSentinel-Net
            </h1>
            <p className="hidden text-[10px] uppercase tracking-[0.2em] text-silver-300 sm:block">
              AI Threat Detection System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-online">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-online" />
            ONLINE
          </span>
          <div className="text-right leading-tight">
            <p className="text-sm font-bold tabular-nums text-silver-50">{time}</p>
            <p className="text-[10px] tracking-widest text-silver-300">{date}</p>
          </div>
        </div>
      </div>
    </header>
  );
}