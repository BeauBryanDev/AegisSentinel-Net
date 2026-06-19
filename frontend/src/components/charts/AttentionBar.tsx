import { useStreamStore } from "../../stores/useStreamStore";

const NUM_CELLS = 16;

function attentionColor(w: number): string {
  const intensity = Math.min(w * 6, 1);
  const r = 255;
  const g = Math.round(255 * (1 - intensity));
  const a = 0.2 + intensity * 0.8;
  return `rgba(${r}, ${g}, 0, ${a})`;
}

export default function AttentionBar() {
  const frame = useStreamStore((s) => s.frame);
  const attention = frame?.attention ?? null;

  let maxIdx = -1;
  if (attention) {
    maxIdx = attention.reduce(
      (best, w, i) => (w > attention[best] ? i : best),
      0
    );
  }

  return (
    <div className="hud-panel p-4">
      <p className="hud-label mb-2">Live Attention</p>
      <div className="flex gap-[2px]">
        {Array.from({ length: NUM_CELLS }, (_, i) => {
          const weight = attention?.[i] ?? 0;
          const isMax = attention !== null && i === maxIdx;
          return (
            <div
              key={i}
              style={{
                height: 40,
                flex: 1,
                background: attention ? attentionColor(weight) : "#1A1C21",
                border: isMax ? "1px solid #FF2B3A" : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="flex mt-1">
        {Array.from({ length: NUM_CELLS }, (_, i) => (
          <span
            key={i}
            className="text-silver-300"
            style={{ flex: 1, textAlign: "center", fontSize: 10 }}
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
