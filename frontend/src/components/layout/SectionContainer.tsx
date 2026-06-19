import type { ReactNode } from "react";

interface SectionContainerProps {
  title?: string;
  /** Top-right slot for actions, badges, or a live indicator */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use the bright HUD border instead of the default dim one */
  bright?: boolean;
}

/**
 * Standard HUD panel wrapper for page sections (charts, tables, lists).
 * Keeps the clipped-corner / silver-border frame consistent across pages
 * without every page re-declaring the .hud-panel + header markup.
 */
export default function SectionContainer({
  title,
  actions,
  children,
  className,
  bright = false,
}: SectionContainerProps) {
  return (
    <section
      className={["hud-panel", bright ? "hud-panel--bright" : "", "p-4", className ?? ""].join(
        " "
      )}
    >
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <p className="hud-label">{title}</p>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
