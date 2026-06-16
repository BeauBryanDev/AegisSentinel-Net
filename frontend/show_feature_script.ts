// Frontend: buffer circular de 60 segundos de telemetria
const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  setTimeline(prev => [
    ...prev.slice(-300),   // mantener ultimos 300 puntos (~60s con stride)
    { time: data.frame_number, prob: data.violence_prob ?? 0 }
  ]);
};
// <LineChart data={timeline}> con area roja sobre threshold


// 16 divs con background interpolado segun peso
{attention?.map((w, i) => (
  <div key={i} style={{
    backgroundColor: `rgba(255, ${Math.round(255*(1-w*6))}, 0, ${0.3+w*4})`,
    height: '40px', flex: 1
  }}/>
))}


