import { useAlertStore } from "../../stores/useAlertStore";
import type { AlertLevel } from "../../types";



interface LevelStyle {
    label: string;
    subtitle: string;
    color: string;
    /** Arc fill percentage 0-1 */
    fill: number;
    /** Glow filter intensity */
    glow: boolean;
}




const LEVEL_STYLES: Record<AlertLevel, LevelStyle> = {
    low: {
        label: "LOW",
        subtitle: "All Clear",
        color: "#8A8F99",   // silver-300
        fill: 0.15,
        glow: false,
    },
    medium: {
        label: "MED",
        subtitle: "Threat Detected",
        color: "#FFB020",   // warn
        fill: 0.45,
        glow: false,
    },
    high: {
        label: "HIGH",
        subtitle: "Threat Detected",
        color: "#FF2B3A",   // threat
        fill: 0.75,
        glow: true,
    },
    critical: {
        label: "CRIT",
        subtitle: "Critical Threat",
        color: "#FF2B3A",   // threat
        fill: 1.0,
        glow: true,
    },
};


// SVG arc constants
const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = 62;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ARC_SPAN = 0.75;
const ARC_LENGTH = CIRCUMFERENCE * ARC_SPAN;



export default function ThreatLevelGauge() {
    const threatLevel = useAlertStore((s) => s.threatLevel);
    const style = LEVEL_STYLES[threatLevel];

    // How much of the 270-degree arc to fill
    const filledLength = ARC_LENGTH * style.fill;
    const emptyLength = ARC_LENGTH - filledLength;

    return (
        <div className="hud-panel flex flex-col items-center p-4">
            <p className="hud-label mb-3 self-start">Threat Level</p>

            <div className="relative">
                <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    className="block"
                    aria-label={`Threat level: ${style.label}`}
                    role="img"
                >
                    {/* Glow filter for high/critical */}
                    {style.glow && (
                        <defs>
                            <filter id="threat-glow">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                    )}

                    {/* Background track (dim silver arc) */}
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke="#1A1C21"
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
                        strokeDashoffset={-CIRCUMFERENCE * 0.125}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${CENTER} ${CENTER})`}
                    />

                    {/* Filled arc */}
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke={style.color}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={`${filledLength} ${emptyLength + (CIRCUMFERENCE - ARC_LENGTH)}`}
                        strokeDashoffset={-CIRCUMFERENCE * 0.125}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${CENTER} ${CENTER})`}
                        filter={style.glow ? "url(#threat-glow)" : undefined}
                        className="transition-all duration-500 ease-out"
                    />

                    {/* Tick marks at arc endpoints */}
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS + 10}
                        fill="none"
                        stroke="#2A2D34"
                        strokeWidth="1"
                        strokeDasharray="2 8"
                        strokeDashoffset={-CIRCUMFERENCE * 0.125}
                        transform={`rotate(-90 ${CENTER} ${CENTER})`}
                    />

                    {/* Center text: level label */}
                    <text
                        x={CENTER}
                        y={CENTER - 6}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={style.color}
                        fontSize="28"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono, monospace"
                        letterSpacing="0.1em"
                        className="transition-colors duration-500"
                    >
                        {style.label}
                    </text>

                    {/* Subtitle */}
                    <text
                        x={CENTER}
                        y={CENTER + 18}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#8A8F99"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        letterSpacing="0.15em"
                    >
                        {style.subtitle.toUpperCase()}
                    </text>
                </svg>

                {/* Pulsing ring for critical */}
                {threatLevel === "critical" && (
                    <div
                        className="absolute inset-0 rounded-full animate-threat-pulse pointer-events-none"
                        aria-hidden="true"
                    />
                )}
            </div>
        </div>
    );
}
