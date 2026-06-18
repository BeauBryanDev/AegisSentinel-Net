import { Link } from "react-router-dom";

/*
 * Placeholder: requires JWT auth in FastAPI backend.
 * Backend hooks: app/core/security.py, app/routers/auth.py
 */
export default function Login() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="hud-label mb-4">Operator Login</p>
      <div className="hud-panel p-8 w-full max-w-sm">
        <p className="text-sm text-silver-300">
          Authentication module pending deployment.
        </p>
        <p className="mt-2 text-xs text-silver-500">
          Backend: app/core/security.py + app/routers/auth.py
        </p>
      </div>
      <Link
        to="/"
        className="mt-6 text-xs uppercase tracking-[0.2em] text-silver-300 hover:text-silver-50"
      >
        Return to Base
      </Link>
    </div>
  );
}