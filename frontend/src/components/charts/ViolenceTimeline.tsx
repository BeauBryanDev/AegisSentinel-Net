import { type FC, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine as ReferenceLineBase,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Props as ReferenceLineProps } from "recharts/types/cartesian/ReferenceLine";
import { useStreamStore } from "../../stores/useStreamStore";

// Recharts v2 types `ReferenceLine` as a class component, which is
// incompatible with @types/react ≥18.3 (stricter `props` requirement).
// Casting to FC restores JSX usability without losing prop types.
const ReferenceLine = ReferenceLineBase as unknown as FC<ReferenceLineProps>;


const MAX_POINTS = 300;
const UPDATE_EVERY_N_FRAMES = 5;
const THRESHOLD = 0.62;

interface TimelinePoint {
  frameNumber: number;
  time: string;
  prob: number;
  smooth: number;
  isAwake: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export default function ViolenceTimeline() {
  const frame = useStreamStore((s) => s.frame);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const frameCounter = useRef(0);

  useEffect(() => {
    if (!frame) return;

    frameCounter.current += 1;
    if (frameCounter.current % UPDATE_EVERY_N_FRAMES !== 0) return;

    setTimeline((prev) => {
      const next: TimelinePoint = {
        frameNumber: frame.frame_number,
        time: formatTime(frame.frame_time),
        prob: frame.violence_prob ?? 0,
        smooth: frame.violence_prob_smooth ?? 0,
        isAwake: frame.engine_awake,
      };
      const updated = [...prev, next];
      return updated.length > MAX_POINTS
        ? updated.slice(updated.length - MAX_POINTS)
        : updated;
    });
  }, [frame]);

  return (
    <div className="hud-panel p-4">
      <p className="hud-label mb-2">Violence Detection Timeline</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={timeline} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="aboveThreshold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF2B3A" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#FF2B3A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="belowThreshold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1A1C21" strokeDasharray="3 3" />
          <XAxis dataKey="time" stroke="#8A8F99" tick={{ fontSize: 10 }} minTickGap={30} />
          <YAxis domain={[0, 1]} stroke="#8A8F99" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#0C0D10", border: "1px solid #3A3D45" }}
            labelStyle={{ color: "#8A8F99" }}
          />
          <ReferenceLine y={THRESHOLD} stroke="#FF2B3A" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="prob"
            stroke="#3A3D45"
            strokeWidth={1}
            strokeOpacity={0.5}
            fill="url(#belowThreshold)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="smooth"
            stroke="#4ADE80"
            strokeWidth={2}
            fill="url(#aboveThreshold)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
