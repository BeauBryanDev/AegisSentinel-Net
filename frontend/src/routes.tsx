import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import LiveStream from "./pages/LiveStream";
import Detections from "./pages/Detections";
import Weapons from "./pages/Weapons";
import Reports from "./pages/Reports";
import Metrics from "./pages/Metrics";
import Alerts from "./pages/Alerts";
import SystemLogs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

 
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "stream", element: <LiveStream /> },
      { path: "detections", element: <Detections /> },
      { path: "weapons", element: <Weapons /> },
      { path: "reports", element: <Reports /> },
      { path: "metrics", element: <Metrics /> },
      { path: "alerts", element: <Alerts /> },
      { path: "logs", element: <SystemLogs /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);