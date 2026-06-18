# AegisSentinel-Net — Frontend Visualization Roadmap

## Three features from the PoC that impressed the Dean

All three features feed from the same WebSocket payload that already
exists in `stream_service.py`. No backend changes needed.

```typescript
// Every frame produces this payload via ws://localhost:8000/ws/stream
{
  "violence_prob":        number | null,   // feeds Feature 1 + 3
  "violence_prob_smooth": number | null,   // feeds Feature 1 (smoothed curve)
  "attention":            number[] | null, // feeds Feature 2 (16 floats)
  "alert_level":          string,          // "low" | "medium" | "high" | "critical"
  "engine_awake":         boolean,         // true when IoU trigger is active
  "frame_number":         number,
  "frame_time":           string,          // ISO timestamp
  ...
}
```

---

## Feature 1 — Violence Detection Timeline

**What it does:** Real-time line chart showing violence probability over time.
Red zones above threshold, green zones below. The hero visual of the dashboard.

**Component:** `src/components/charts/ViolenceTimeline.tsx`

**Library:** Recharts (`<AreaChart>`)

**Data flow:**

```
WebSocket frame
  -> useWebSocket hook extracts violence_prob_smooth
  -> appends to circular buffer (last 300 points = ~60s)
  -> Recharts re-renders the chart
```

**State shape:**

```typescript
interface TimelinePoint {
  frameNumber: number;
  time: string;            // "HH:mm:ss" for x-axis labels
  prob: number;            // 0 when engine sleeps
  smooth: number;          // smoothed value from backend
  isAwake: boolean;        // engine_awake flag
}

// Buffer: max 300 points, older points shift out
const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
```

**Visual specs (cyberpunk palette):**

- Background: `#0a0a0a`
- Smoothed line: `#4ADE80` (terminal green) stroke width 2
- Raw probability: `#444444` stroke width 1, opacity 0.5
- Threshold line: `#FF2B3A` dashed at y=0.62
- Area above threshold: `rgba(255, 43, 58, 0.15)` fill
- Area below threshold: `rgba(74, 222, 128, 0.05)` fill
- Engine asleep zones: `rgba(255, 255, 255, 0.03)` background
- Axis labels: `#888888`
- Grid lines: `#1a1a1a`

**Recharts config notes:**

- `<AreaChart>` with two `<Area>` elements (raw + smooth)
- `<ReferenceLine y={0.62}>` for threshold
- `isAnimationActive={false}` to avoid lag at 30fps updates
- Update the chart every 5 frames, not every frame (6 updates/sec is smooth enough)

**Priority:** HIGH — this is the main visual of the dashboard.

---

## Feature 2 — Temporal Attention Heatmap

**What it does:** Shows which of the 16 frames the model considers most relevant
for violence detection. Updates live when the engine is awake.

**Two sub-components:**

### 2a — Live Attention Bar: `src/components/charts/AttentionBar.tsx`

A row of 16 cells that light up with each inference.
Simple, lightweight, always visible next to the stream.

```
Frame: [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]...[ 15 ]
Color:  dim  dim  dim  HOT  HOT  MAX  HOT  dim  dim      dim
```

**Implementation:** 16 `<div>` elements with dynamic background color.

```typescript
// Color interpolation: weight -> rgba
function attentionColor(w: number): string {
  const intensity = Math.min(w * 6, 1);  // normalize, max weight ~0.16
  const r = 255;
  const g = Math.round(255 * (1 - intensity));
  const a = 0.2 + intensity * 0.8;
  return `rgba(${r}, ${g}, 0, ${a})`;
}
```

**Visual specs:**

- Cell height: 40px
- Cell gap: 2px
- Inactive (engine asleep): all cells `#1a1a1a`
- Active: orange-to-red gradient based on weight
- Border on max-weight cell: `1px solid #FF2B3A`
- Label below cells: frame index 0-15 in `#555555` font size 10px

**State:** No accumulated state. Directly maps `attention` array from payload.

### 2b — History Heatmap: `src/components/charts/AttentionHeatmap.tsx`

A 2D matrix (30 rows x 16 cols) rendered on `<canvas>`.
Accumulates the last 30 inference results. This is what melted the Dean.

**Data flow:**

```
WebSocket frame with attention !== null
  -> push attention array to matrix buffer (max 30 rows)
  -> redraw canvas (480 rectangles, < 1ms)
```

**State shape:**

```typescript
// Matrix: 30 rows (latest inferences) x 16 cols (frame positions)
const [heatmapData, setHeatmapData] = useState<number[][]>([]);
// maxlen = 30, newest at bottom
```

**Canvas rendering:**

```typescript
const CELL_W = 24;  // px per column
const CELL_H = 12;  // px per row
// Total canvas: 384 x 360 px

function drawHeatmap(ctx: CanvasRenderingContext2D, data: number[][]) {
  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < 16; col++) {
      ctx.fillStyle = attentionColor(data[row][col]);
      ctx.fillRect(col * CELL_W, row * CELL_H, CELL_W - 1, CELL_H - 1);
    }
  }
}
```

**Visual specs:**

- Canvas background: `#0a0a0a`
- Color scale: black (0) -> orange (mid) -> red (high) -> white (max)
- Y-axis label: "Window index" in `#888888`
- X-axis label: "Frame position (0-15)" in `#888888`

**Priority:** HIGH — this is the "wow factor" differentiator.

---

## Feature 3 — Probability Distribution

**What it does:** Histogram showing the distribution of violence probabilities
across all inferences in the session. Bimodal shape (peaks near 0 and near 1)
proves the model discriminates well.

**Component:** `src/components/charts/ProbDistribution.tsx`

**Library:** Recharts (`<BarChart>`)

**Data flow:**

```
WebSocket frame with violence_prob !== null
  -> increment the corresponding bucket
  -> Recharts re-renders the histogram
```

**State shape:**

```typescript
const NUM_BUCKETS = 20;  // 0.00-0.05, 0.05-0.10, ..., 0.95-1.00

interface DistBucket {
  range: string;      // "0.00-0.05"
  noFight: number;    // count below threshold
  fight: number;      // count above threshold
}

const [distribution, setDistribution] = useState<DistBucket[]>(
  Array.from({ length: NUM_BUCKETS }, (_, i) => ({
    range: `${(i * 0.05).toFixed(2)}-${((i + 1) * 0.05).toFixed(2)}`,
    noFight: 0,
    fight: 0,
  }))
);
```

**Update logic per frame:**

```typescript
if (violence_prob !== null) {
  const idx = Math.min(Math.floor(violence_prob * NUM_BUCKETS), NUM_BUCKETS - 1);
  const field = violence_prob >= THRESHOLD ? 'fight' : 'noFight';
  setDistribution(prev => {
    const next = [...prev];
    next[idx] = { ...next[idx], [field]: next[idx][field] + 1 };
    return next;
  });
}
```

**Visual specs:**

- NoFight bars: `#4ADE80` (green)
- Fight bars: `#FF2B3A` (red)
- Threshold line: white dashed vertical at bucket index 12 (0.60-0.65)
- Background: `#0a0a0a`
- Axis: `#888888`
- Stacked bars with slight opacity difference

**When to show:**

- During stream: update live but show as secondary panel (bottom or collapsed)
- Session summary: show prominently after stream ends with full data

**Priority:** MEDIUM — impressive with enough data, weak in short demos.

---

## Component Tree

```
src/
  components/
    stream/
      StreamView.tsx          <- main layout: video + panels
      VideoCanvas.tsx         <- renders camera feed + bounding boxes + skeletons
    charts/
      ViolenceTimeline.tsx    <- Feature 1
      AttentionBar.tsx        <- Feature 2a (live bar)
      AttentionHeatmap.tsx    <- Feature 2b (history canvas)
      ProbDistribution.tsx    <- Feature 3
    alerts/
      AlertBanner.tsx         <- FIGHT / WEAPON / CONTACT banner
      AlertLevel.tsx          <- color-coded badge (low/medium/high/critical)
    layout/
      Header.tsx
      Sidebar.tsx
  hooks/
    useWebSocket.ts           <- WebSocket connection + reconnect logic
    useStreamData.ts          <- processes payload, updates all chart states
  types/
    stream.ts                 <- TypeScript interfaces for the WS payload
  pages/
    DashboardPage.tsx         <- live stream + all three charts
    HistoryPage.tsx           <- past recordings + session summaries
```

---

## Suggested Dashboard Layout (Mobile-First)

```
+------------------------------------------+
|  HEADER: AegisSentinel-Net  |  LIVE  |   |
+------------------------------------------+
|                                          |
|          VIDEO CANVAS                    |
|    (camera feed + skeletons + boxes)     |
|                                          |
+------------------------------------------+
|  [FIGHT]  [WEAPON]  [CONTACT]  badges   |
+------------------------------------------+
|  ATTENTION BAR  [ 0 ][ 1 ]...[ 15 ]     |  <- Feature 2a
+------------------------------------------+
|                                          |
|  VIOLENCE TIMELINE (Recharts AreaChart)  |  <- Feature 1
|  prob vs time, red/green zones           |
|                                          |
+------------------------------------------+
|  ATTENTION HEATMAP  |  PROB DISTRIBUTION |  <- Feature 2b + 3
|  (canvas 30x16)     |  (Recharts bars)  |
+------------------------------------------+
```

Desktop: video on the left (60%), charts stacked on the right (40%).
Mobile: everything stacked vertically as shown above.

---

## Implementation Order

1. `useWebSocket.ts` + `types/stream.ts` — connection foundation
2. `VideoCanvas.tsx` — verify stream works before adding charts
3. `ViolenceTimeline.tsx` — the hero chart, immediate visual impact
4. `AttentionBar.tsx` — lightweight, adds "AI thinking" feel
5. `AttentionHeatmap.tsx` — the Dean killer, canvas rendering
6. `ProbDistribution.tsx` — session summary complement
7. `AlertBanner.tsx` — ties the visual together with alert state

---

## Performance Notes

- Update charts every 5 frames (6 Hz), not every frame (30 Hz)
- `isAnimationActive={false}` on all Recharts components
- AttentionHeatmap uses `<canvas>`, not SVG (480 rects in <1ms)
- Timeline buffer capped at 300 points (older data shifts out)
- Distribution accumulates all session data (no cap, grows with time)
- Use `requestAnimationFrame` for canvas redraws, not `useEffect` on every state change
