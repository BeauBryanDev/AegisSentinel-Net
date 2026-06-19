import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/SideBar";
import BottomNav from "../components/layout/BottomNav";
import Footer from "../components/layout/Footer";

/*
 * AppShell (future ProtectedLayout)
 * Operational layout with full navigation chrome.
 * Mobile-first:
 *   - Base (phone): Header top, content fills, BottomNav fixed at bottom.
 *   - lg+ (desktop): Sidebar left, BottomNav hidden.
 *
 * When JWT auth exists, add a guard here:
 *   const token = useAuthStore(s => s.token);
 *   if (!token) return <Navigate to="/login" replace />;
 */
export default function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-3 pb-24 lg:p-6 lg:pb-6 max-w-screen-2xl">
          <Outlet />
        </main>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}