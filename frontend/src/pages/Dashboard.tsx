import AttentionBar from "../components/charts/AttentionBar";
import ViolenceTimeline from "../components/charts/ViolenceTimeline";
import AttentionHeatmap from "../components/charts/AttentionHeatmap";
import ProbDistribution from "../components/charts/ProbDistribution";

export default function Dashboard() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <AttentionBar />
      <ViolenceTimeline />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AttentionHeatmap />
        <ProbDistribution />
      </div>
    </section>
  );
}
