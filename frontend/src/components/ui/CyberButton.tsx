import type { ButtonHTMLAttributes, ReactNode } from "react";

export type CyberButtonVariant = "default" | "bright" | "threat" | "ghost";

const VARIANT_CLASSES: Record<CyberButtonVariant, string> = {
  default:
    "border-silver-500 text-silver-100 hover:border-silver-300 hover:text-silver-50 hover:shadow-hud",
  bright:
    "border-silver-300 text-silver-50 shadow-hud-bright hover:shadow-hud-bright",
  threat:
    "border-threat/70 text-threat hover:shadow-threat",
  ghost:
    "border-transparent text-silver-300 hover:border-silver-700 hover:text-silver-100",
};

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: CyberButtonVariant;
}

/**
 * Clipped-corner action button matching the HUD panel aesthetic.
 * Same 45deg corner cuts as .hud-panel, but small and clickable.
 */
export default function CyberButton({
  children,
  variant = "default",
  className,
  ...rest
}: CyberButtonProps) {
  return (
    <button
      {...rest}
      className={[
        "relative bg-panel px-4 py-2 font-mono text-xs uppercase tracking-[0.15em]",
        "border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT_CLASSES[variant],
        className ?? "",
      ].join(" ")}
      style={{
        clipPath:
          "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
        ...rest.style,
      }}
    >
      {children}
    </button>
  );
}
