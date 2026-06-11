import { Outlet } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";

/*
 * App shell. Mobile-first:
 * - Base (phone): Header on top, content fills, BottomNav fixed at bottom.
 * - lg and up (desktop): Sidebar appears on the left, BottomNav hides.
 *
 * pb-20 on <main> reserves space for the fixed BottomNav on mobile.
 * safe-area padding is handled inside BottomNav for notched phones.
 */
export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-3 pb-24 lg:p-6 lg:pb-6 max-w-screen-2xl">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}