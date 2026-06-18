import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-silver-700">404</p>
      <p className="mt-4 hud-label">Signal Lost</p>
      <p className="mt-2 text-sm text-silver-300">
        The requested sector does not exist in this system.
      </p>
      <Link
        to="/"
        className="mt-8 border border-silver-500 px-6 py-2 text-xs uppercase tracking-[0.2em] text-silver-300 transition-colors hover:border-silver-50 hover:text-silver-50"
      >
        Return to Base
      </Link>
    </div>
  );
}