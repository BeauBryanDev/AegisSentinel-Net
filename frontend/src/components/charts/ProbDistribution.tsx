import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStreamStore } from "../../stores/useStreamStore";

const NUM_BUCKETS = 20;
const THRESHOLD = 0.62;

interface DistBucket {
  range: string;
  noFight: number;
  fight: number;
}

function initialBuckets(): DistBucket[] {
  return Array.from({ length: NUM_BUCKETS }, (_, i) => ({
    range: `${(i * 0.05).toFixed(2)}-${((i + 1) * 0.05).toFixed(2)}`,
    noFight: 0,
    fight: 0,
  }));
}

export default function ProbDistribution() {
  const frame = useStreamStore((s) => s.frame);
  const [distribution, setDistribution] = useState<DistBucket[]>(initialBuckets);

  useEffect(() => {
    const prob = frame?.violence_prob;
    if (prob === null || prob === undefined) return;

    const idx = Math.min(Math.floor(prob * NUM_BUCKETS), NUM_BUCKETS - 1);
    const field = prob >= THRESHOLD ? "fight" : "noFight";

    setDistribution((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: next[idx][field] + 1 };
      return next;
    });
  }, [frame]);

  return (
    <div className="hud-panel p-4">
      <p className="hud-label mb-2">Probability Distribution</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={distribution} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1A1C21" strokeDasharray="3 3" />
          <XAxis dataKey="range" stroke="#8A8F99" tick={{ fontSize: 9 }} interval={1} />
          <YAxis stroke="#8A8F99" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#0C0D10", border: "1px solid #3A3D45" }}
            labelStyle={{ color: "#8A8F99" }}
          />
          <ReferenceLine x={initialBuckets()[12].range} stroke="#E8ECF2" strokeDasharray="4 4" />
          <Bar dataKey="noFight" stackId="dist" fill="#4ADE80" fillOpacity={0.85} isAnimationActive={false} />
          <Bar dataKey="fight" stackId="dist" fill="#FF2B3A" fillOpacity={0.85} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
