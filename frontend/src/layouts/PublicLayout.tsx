import { Outlet } from "react-router-dom";

/*
 * PublicLayout
 * Clean fullscreen wrapper. No Header, no Sidebar, no BottomNav.
 * Used for: Home hero, Login, SignUp — pages that stand on their own.
 * When JWT auth exists, this layout wraps all unauthenticated routes.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-dvh bg-void">
      <Outlet />
    </div>
  );
}