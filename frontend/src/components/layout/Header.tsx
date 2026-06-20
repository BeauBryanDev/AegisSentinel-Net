import { useEffect, useState } from "react";
import aegisEmblem from "../../assets/aegis_sentinel.webp";

/*
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
    <header className="sticky top-0 z-40 w-full overflow-hidden border-b border-silver-700 bg-void/90 backdrop-blur">
      <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Shield emblem */}
          <img
            src={aegisEmblem}
            alt="AegisSentinel-Net emblem"
            className="h-9 w-9 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-24 lg:w-24"
            style={{
              filter: "drop-shadow(0 0 14px rgba(232,236,242,0.35)) drop-shadow(0 0 5px rgba(232,236,242,0.2))",
            }}
          />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-bold tracking-wide text-silver-50 sm:text-lg lg:text-2xl">
              AegisSentinel-Net
            </h1>
            <p className="hidden truncate text-[11px] uppercase tracking-[0.2em] text-silver-300 sm:block sm:text-[13px] lg:text-[16px]">
              AI Threat Detection System
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-online sm:text-sm lg:text-base">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-online animate-pulse sm:h-2.5 sm:w-2.5" />
            <span className="hidden sm:inline">ONLINE</span>
          </span>
          <div className="text-right leading-tight">
            <p className="text-[11px] font-bold tabular-nums text-silver-50 sm:text-sm">{time}</p>
            <p className="hidden text-[12px] tracking-widest text-silver-300 uppercase sm:block">{date}</p>
          </div>
        </div>
      </div>
    </header>
  );
}