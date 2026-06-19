
interface KPICardProps {
    /** SVG element rendered inside the icon circle */
    icon: React.ReactNode;
    /** Primary metric value */
    value: number | string;
    /** Metric label below the value */
    label: string;
    /** Percentage change vs last 24h. Positive = up, negative = down. Null hides the trend. */
    delta?: number | null;
    /** Visual variant: "default" silver, "threat" red, "online" green */
    variant?: "default" | "threat" | "online";
}


const VARIANT_STYLES = {
    default: {
        ring: "border-silver-500",
        icon: "text-silver-300",
        value: "text-silver-50",
    },
    threat: {
        ring: "border-threat",
        icon: "text-threat",
        value: "text-threat",
    },
    online: {
        ring: "border-online",
        icon: "text-online",
        value: "text-online",
    },
};

export default function KPICard({
    icon,
    value,
    label,
    delta = null,
    variant = "default",
}: KPICardProps) {
    const styles = VARIANT_STYLES[variant];

    return (
        <div className="hud-panel flex items-center gap-3 p-3 lg:gap-4 lg:p-4">
            {/* Icon circle */}
            <div
                className={
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border lg:h-12 lg:w-12 " +
                    styles.ring
                }
            >
                <div className={"h-5 w-5 lg:h-6 lg:w-6 " + styles.icon}>
                    {icon}
                </div>
            </div>

            {/* Metric content */}
            <div className="min-w-0 flex-1">
                <p className={"text-2xl font-bold tabular-nums leading-none lg:text-3xl " + styles.value}>
                    {value}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-silver-300 lg:text-[11px]">
                    {label}
                </p>
            </div>

            {/* Trend delta */}
            {delta !== null && (
                <div className="shrink-0 text-right">
                    <p
                        className={
                            "text-xs font-bold tabular-nums " +
                            (delta > 0
                                ? "text-threat"
                                : delta < 0
                                    ? "text-online"
                                    : "text-silver-500")
                        }
                    >
                        {delta > 0 ? "\u2191" : delta < 0 ? "\u2193" : "\u2014"}{" "}
                        {Math.abs(delta)}%
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-silver-500">
                        vs last 24h
                    </p>
                </div>
            )}
        </div>
    );
}
