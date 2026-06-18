import { Link } from "react-router-dom";

/*
 * Home / Hero
 * Fullscreen landing page. No navigation chrome (PublicLayout).
 * Purpose: explain the product, impress, and funnel to /dashboard.
 * Aesthetic: cyberpunk military console, silver neon, black void.
 */
export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(232,236,242,1) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(232,236,242,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Radial glow behind the shield */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, rgba(232,236,242,0.6), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Shield emblem */}
      <div className="relative mb-8">
        <div
          className="mx-auto h-24 w-20 border-2 border-silver-300 bg-panel lg:h-32 lg:w-28"
          style={{
            clipPath: "polygon(50% 0, 100% 22%, 100% 65%, 50% 100%, 0 65%, 0 22%)",
          }}
          aria-hidden="true"
        />
        {/* Glow ring around shield */}
        <div
          className="absolute -inset-4 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(200,204,212,0.3), transparent 70%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Title block */}
      <h1 className="relative text-3xl font-bold tracking-wider text-silver-50 lg:text-5xl">
        AegisSentinel-Net
      </h1>
      <p className="mt-3 text-xs uppercase tracking-[0.35em] text-silver-300 lg:text-sm">
        AI Threat Detection System
      </p>

      {/* Tagline */}
      <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-silver-300/70 lg:text-xs">
        Real-Time &bull; Intelligent &bull; Relentless
      </p>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4">
        <span className="h-px w-12 bg-silver-500 lg:w-20" />
        <span className="h-1.5 w-1.5 rotate-45 border border-silver-500" />
        <span className="h-px w-12 bg-silver-500 lg:w-20" />
      </div>

      {/* Mission board */}
      <div className="mt-8 max-w-lg">
        <p className="hud-label mb-4">Mission Briefing</p>
        <p className="text-sm leading-relaxed text-silver-300 lg:text-base">
          AegisSentinel-Net is a real-time AI-powered surveillance platform
          that detects violent behavior, identifies weapons, and tracks human
          pose in live video streams. Powered by deep learning models running
          on edge devices, the system provides instant threat assessment and
          automated alert dispatch to security operators.
        </p>
      </div>

      {/* Detection capabilities */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs uppercase tracking-[0.2em] text-silver-300">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-threat" />
          Violence Detection
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-warn" />
          Weapon Recognition
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-online" />
          Pose Estimation
        </div>
      </div>

      {/* CTA */}
      <Link
        to="/dashboard"
        className="group relative mt-12 inline-block"
      >
        <span
          className="relative z-10 inline-flex items-center gap-3 border border-silver-300 bg-panel px-8 py-3 text-sm font-bold uppercase tracking-[0.25em] text-silver-50 transition-all duration-300 hover:border-silver-50 hover:shadow-hud-bright"
          style={{
            clipPath:
              "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
          }}
        >
          Enter Command Center
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </Link>

      {/* Slogan */}
      <p className="mt-16 text-[10px] uppercase tracking-[0.4em] text-silver-500 lg:text-xs">
        We See. We Protect. We Never Sleep.
      </p>

      {/* Version footer */}
      <p className="absolute bottom-4 text-[9px] tracking-widest text-silver-700">
        AegisSentinel-Net v1.0.0 &mdash; Sentinel Defense Systems
      </p>
    </div>
  );
}