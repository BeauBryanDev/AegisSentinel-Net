// Single source of truth for navigation.
import type { ComponentType, SVGProps } from "react";
import { Video, Scan, Crosshair, FileText, BarChart3, AlertTriangle, ScrollText, Settings } from "lucide-react";

export interface NavIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<NavIconProps>;
}

/*
 * Dashboard keeps its bespoke quad-grid mark (matches the mockup's
 * grid icon). Every other entry uses the closest semantic match from
 * lucide-react — there is no literal "gun" icon in the set, so Weapons
 * uses Crosshair as the nearest weapon/targeting glyph.
 */
function DashboardIcon({ className }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  );
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: DashboardIcon },
  { path: "/stream", label: "Live Stream", icon: Video },
  { path: "/detections", label: "Detections", icon: Scan },
  { path: "/weapons", label: "Weapons", icon: Crosshair },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/metrics", label: "Metrics", icon: BarChart3 },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/logs", label: "System Logs", icon: ScrollText },
  { path: "/settings", label: "Settings", icon: Settings },
];
