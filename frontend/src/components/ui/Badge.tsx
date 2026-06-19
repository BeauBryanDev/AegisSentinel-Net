import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "online" | "warn" | "threat" | "bright";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-silver-500 text-silver-300",
  online: "border-online/60 text-online",
  warn: "border-warn/60 text-warn",
  threat: "border-threat/60 text-threat",
  bright: "border-silver-300 text-silver-50",
};

const TONE_DOT: Record<BadgeTone, string> = {
  neutral: "bg-silver-300",
  online: "bg-online",
  warn: "bg-warn",
  threat: "bg-threat animate-pulse-live",
  bright: "bg-silver-50",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Show a small status dot before the label */
  dot?: boolean;
  className?: string;
}

/**
 * Small status pill for the HUD console — alert levels, ONLINE/OFFLINE
 * states, weapon classes, etc. Mirrors the mockup's bracketed tag style.
 */
export default function Badge({ children, tone = "neutral", dot = false, className }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 border bg-panel px-2 py-0.5",
        "text-[10px] font-medium uppercase tracking-[0.15em]",
        TONE_CLASSES[tone],
        className ?? "",
      ].join(" ")}
    >
      {dot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />}
      {children}
    </span>
  );
}
