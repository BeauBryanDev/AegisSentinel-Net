import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";


export interface DonutSegment {
    name: string;
    value: number;
    color: string;
}


interface DonutChartProps {

    title: string;

    data: DonutSegment[];

    centerValue: string | number;

    centerLabel?: string;

    animate?: boolean;
}


export default function DonutChart({
    title,
    data,
    centerValue,
    centerLabel,
    animate = false,
}: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="hud-panel p-3 lg:p-4">
            <p className="hud-label mb-3">{title}</p>

            {total === 0 ? (
                <div className="flex h-48 items-center justify-center">
                    <p className="text-[10px] uppercase tracking-widest text-silver-500">
                        No data available
                    </p>
                </div>
            ) : (
                <>
                    {/* Chart area */}
                    <div className="relative mx-auto h-44 w-44 lg:h-52 lg:w-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="85%"
                                    dataKey="value"
                                    stroke="#050507"
                                    strokeWidth={2}
                                    isAnimationActive={animate}
                                >
                                    {data.map((segment) => (
                                        <Cell key={segment.name} fill={segment.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<DonutTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center label */}
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold tabular-nums text-silver-50 lg:text-3xl">
                                {centerValue}
                            </span>
                            {centerLabel && (
                                <span className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-silver-300">
                                    {centerLabel}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                        {data.map((segment) => {
                            const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
                            return (
                                <div key={segment.name} className="flex items-center gap-1.5">
                                    <span
                                        className="inline-block h-2 w-2 shrink-0"
                                        style={{ backgroundColor: segment.color }}
                                    />
                                    <span className="text-[10px] text-silver-300">
                                        {segment.name}
                                    </span>
                                    <span className="text-[10px] font-bold tabular-nums text-silver-50">
                                        {pct}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}


interface TooltipPayloadItem {
    name: string;
    value: number;
    payload: DonutSegment;
}

function DonutTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: TooltipPayloadItem[];
}) {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0];

    return (
        <div className="border border-silver-500 bg-void/95 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-widest text-silver-300">
                {item.name}
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: item.payload.color }}>
                {item.value}
            </p>
        </div>
    );
}


