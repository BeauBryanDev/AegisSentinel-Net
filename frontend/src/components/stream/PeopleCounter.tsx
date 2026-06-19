
import { useStreamStore } from "../../stores/useStreamStore";
/*
 * PeopleCounter
 * Shows the number of persons detected in the current frame.
 * Positioned as a badge overlay on the live stream.
 */

export default function PeopleCounter() {
    const count = useStreamStore((s) => s.frame?.persons_count ?? 0);

    return (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded bg-void/70 px-3 py-1.5 backdrop-blur-sm">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4 text-silver-300"
                aria-hidden="true"
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-sm font-bold tabular-nums text-silver-50">
                {count}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-silver-300">
                People
            </span>
        </div>
    );
}
