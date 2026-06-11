import { NavLink } from "react-router-dom";
import { NAV_ITEMS, NavIcon } from "./nav";

/*
 * Desktop sidebar. Hidden below lg (mobile uses BottomNav).
 * Active item gets the bright HUD treatment like the mockup's
 * highlighted DASHBOARD entry.
 */
export default function Sidebar() {
  return (
    <aside className="hidden w-52 shrink-0 border-r border-silver-700 lg:block">
      <nav className="sticky top-14 flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
                isActive
                  ? "hud-panel hud-panel--bright text-silver-50"
                  : "text-silver-300 hover:bg-panel-raised hover:text-silver-100",
              ].join(" ")
            }
          >
            <NavIcon d={item.icon} className="h-4 w-4 shrink-0" />
            <span className="relative">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}