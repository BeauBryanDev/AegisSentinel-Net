// Single source of truth for navigation.
// Icons are temporary inline SVG paths (24x24 viewBox, stroke-based).
// They will be replaced by the project SVG assets in src/assets later.

export interface NavItem {
  path: string;
  label: string;
  // SVG path data, stroke style, viewBox 0 0 24 24
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" },
  { path: "/stream", label: "Live Stream", icon: "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4.5 4.5a10.5 10.5 0 0 0 0 15M19.5 4.5a10.5 10.5 0 0 1 0 15" },
  { path: "/detections", label: "Detections", icon: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4" },
  { path: "/weapons", label: "Weapons", icon: "M3 9h14l4 2-4 2H9v4H6v-4H3zM6 13v-2" },
  { path: "/reports", label: "Reports", icon: "M6 2h9l5 5v15H6zM15 2v5h5M9 12h6M9 16h6" },
  { path: "/metrics", label: "Metrics", icon: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
  { path: "/alerts", label: "Alerts", icon: "M12 3 2 21h20zM12 10v5M12 18v.5" },
  { path: "/logs", label: "System Logs", icon: "M5 3h14v18H5zM9 7h6M9 11h6M9 15h4" },
  { path: "/settings", label: "Settings", icon: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" },
];

export function NavIcon({ d, className }: { d: string; className?: string }) {
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
      <path d={d} />
    </svg>
  );
}