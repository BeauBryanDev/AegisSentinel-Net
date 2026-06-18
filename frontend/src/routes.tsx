import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AppShell from "./layouts/AppShell";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import LiveStream from "./pages/LiveStream";
import Detections from "./pages/Detections";
import WeaponsHistory from "./pages/WeaponsHistory";
import Reports from "./pages/Reports";
import Metrics from "./pages/Metrics";
import Alerts from "./pages/Alerts";
import SystemLogs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

/*
 * Route structure:
 *
 * PublicLayout (no nav chrome, fullscreen)
 *   /          -> Home hero landing
 *   /login     -> Login placeholder (future JWT)
 *   /signup    -> SignUp placeholder (future JWT)
 *
 * AppShell (Header + Sidebar/BottomNav)
 *   /dashboard -> Dashboard (KPIs, charts, system status)
 *   /stream    -> LiveStream (camera capture + detections)
 *   /detections-> Detection history log
 *   /weapons   -> Weapon detection history
 *   /reports   -> Generated reports
 *   /metrics   -> Model performance metrics
 *   /alerts    -> Alert management
 *   /logs      -> System event logs
 *   /settings  -> Configuration
 *   /profile   -> UserProfile placeholder (future JWT)
 *
 * When JWT auth is implemented:
 *   - Rename AppShell to ProtectedLayout
 *   - Add auth guard: if (!token) Navigate to /login
 *   - Add redirect: if authenticated on /login, Navigate to /dashboard
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <SignUp /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/stream", element: <LiveStream /> },
      { path: "/detections", element: <Detections /> },
      { path: "/weapons", element: <WeaponsHistory /> },
      { path: "/reports", element: <Reports /> },
      { path: "/metrics", element: <Metrics /> },
      { path: "/alerts", element: <Alerts /> },
      { path: "/logs", element: <SystemLogs /> },
      { path: "/settings", element: <Settings /> },
      { path: "/profile", element: <UserProfile /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);