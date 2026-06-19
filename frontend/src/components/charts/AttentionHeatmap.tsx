import { useEffect, useRef, useState } from "react";
import { useStreamStore } from "../../stores/useStreamStore";

const MAX_ROWS = 30;
const NUM_COLS = 16;
const CELL_W = 24;
const CELL_H = 12;

function attentionColor(w: number): string {
  const intensity = Math.min(w * 6, 1);
  const r = 255;
  const g = Math.round(255 * (1 - intensity));
  const a = 0.2 + intensity * 0.8;
  return `rgba(${r}, ${g}, 0, ${a})`;
}

export default function AttentionHeatmap() {
  const frame = useStreamStore((s) => s.frame);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!frame?.attention) return;
    setMatrix((prev) => {
      const updated = [...prev, frame.attention as number[]];
      return updated.length > MAX_ROWS
        ? updated.slice(updated.length - MAX_ROWS)
        : updated;
    });
  }, [frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0C0D10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        ctx.fillStyle = attentionColor(matrix[row][col]);
        ctx.fillRect(col * CELL_W, row * CELL_H, CELL_W - 1, CELL_H - 1);
      }
    }
  }, [matrix]);

  return (
    <div className="hud-panel p-4">
      <p className="hud-label mb-2">Temporal Attention Heatmap</p>
      <canvas
        ref={canvasRef}
        width={NUM_COLS * CELL_W}
        height={MAX_ROWS * CELL_H}
        style={{ background: "#0C0D10", width: "100%", maxWidth: NUM_COLS * CELL_W }}
      />
      <div className="flex justify-between mt-1 hud-label" style={{ fontSize: 10 }}>
        <span>Frame position (0-15)</span>
        <span>Window index ↓</span>
      </div>
    </div>
  );
}
