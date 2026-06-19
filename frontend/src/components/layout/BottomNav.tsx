import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./Nav";

/*
 * Mobile bottom navigation, mirrors the mockup's icon bar.
 * Hidden on lg and up (desktop uses Sidebar).
 * pb-[env(safe-area-inset-bottom)] keeps icons above the iPhone home bar.
 */
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-silver-700 bg-void/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-between overflow-x-auto px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                [
                  "flex min-w-[44px] flex-1 flex-col items-center gap-0.5 py-2",
                  isActive ? "text-silver-50" : "text-silver-300",
                ].join(" ")
              }
              aria-label={item.label}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={
                      "h-5 w-5 " +
                      (isActive ? "drop-shadow-[0_0_6px_rgba(232,236,242,0.5)]" : "")
                    }
                  />
                  <span
                    className={
                      "h-0.5 w-5 " + (isActive ? "bg-silver-50" : "bg-transparent")
                    }
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}