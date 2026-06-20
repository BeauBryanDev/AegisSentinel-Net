import { useEffect, useMemo } from "react";
import { useAlertStore } from "../stores/useAlertStore";
import { useStreamStore } from "../stores/useStreamStore";
import KPICard from "../components/dashboard/KPICard";
import ThreatLevelGauge from "../components/dashboard/ThreatLevelGauge"
import RecentThreats from "../components/dashboard/RecentThreats";
import SystemFeed from "../components/dashboard/SystemFeed";
import type { DonutSegment } from "../components/charts/DonutChart";
import ViolenceTimeline from "../components/charts/ViolenceTimeline";
import DonutChart from "../components/charts/DonutChart";
import ProbDistribution from "../components/charts/ProbDistribution";

import fightIcon from "../assets/fight.svg";
import gunIcon from "../assets/gun.svg";
import shieldIcon from "../assets/man.svg";
//import sentinelIcon from "../assets/sentinel.svg";



function SvgIcon({ src }: { src: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-full bg-silver-50 p-0.5">
      <img src={src} alt="" className="h-full w-full object-contain" aria-hidden="true" />
    </div>
  );
}

const ICON_VIOLENCE = fightIcon;
const ICON_WEAPON = gunIcon;
const ICON_PEOPLE = shieldIcon;


export default function Dashboard() {

  const fetchHealth = useAlertStore((s) => s.fetchHealth);
  const fetchDetections = useAlertStore((s) => s.fetchDetections);
  const fetchEvents = useAlertStore((s) => s.fetchEvents);
  const kpi = useAlertStore((s) => s.kpi);
  const detections = useAlertStore((s) => s.detections);
  const connectionState = useStreamStore((s) => s.connectionState);



  // Fetch REST data on mount
  useEffect(() => {
    fetchHealth();
    fetchDetections({ limit: 50 });
    fetchEvents({ limit: 20 });
  }, [fetchHealth, fetchDetections, fetchEvents]);

  // Determine if stream is providing live data
  const isLive = connectionState === "connected";

  //Detection for Donut Chart
  const behaviorData = useMemo(() => {
    const violence = detections.filter((d) => d.type === "VIOLENCE");
    const weapon = detections.filter((d) => d.type === "WEAPON");
    const person = detections.filter((d) => d.type === "PERSON");
    return [
      { name: "Violence", value: violence.length, color: "#ef4444" },
      { name: "Weapon", value: weapon.length, color: "#f59e0b" },
      { name: "Person", value: person.length, color: "#3b82f6" },
    ];
  }, [detections]);

  const weaponData = useMemo(() => {
    const weapon = detections.filter((d) => d.type === "WEAPON");
    return [
      { name: "Weapon", value: weapon.length, color: "#f59e0b" },
    ];
  }, [detections]);

  const personData = useMemo(() => {
    const person = detections.filter((d) => d.type === "PERSON");
    return [
      { name: "Person", value: person.length, color: "#3b82f6" },
    ];
  }, [detections]);

  const detected = detections.filter((d) => d.weapon_detected).length;
  const clear = detections.length - detected;


  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      {/* ---- Section: KPI cards ---- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <KPICard
          icon={<SvgIcon src={ICON_VIOLENCE} />}
          value={kpi.violenceCount}
          label="Behavior Detection"
          delta={isLive ? null : 0}
          variant={kpi.violenceCount > 0 ? "threat" : "default"}
        />
        <KPICard
          icon={<SvgIcon src={ICON_WEAPON} />}
          value={kpi.weaponCount}
          label="Weapons Detected"
          delta={isLive ? null : 0}
          variant={kpi.weaponCount > 0 ? "threat" : "default"}
        />
        <KPICard
          icon={<SvgIcon src={ICON_PEOPLE} />}
          value={kpi.personsCount}
          label="Total People"
          delta={isLive ? null : 0}
          variant="default"
        />
      </div>

      {/* ---- Section: Threat gauge + Recent threats ---- */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        {/* Threat gauge: 1 col on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1">
          <ThreatLevelGauge />
        </div>
        {/* Recent threats: full on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2">
          <RecentThreats limit={6} />
        </div>
      </div>

      {/*  Donut Charts + System feed ---- */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        {/* Analytics charts: 2/3 on desktop */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
            <DonutChart title="Behavior Analytics (24h)" data={behaviorData} centerValue={kpi.violenceCount} centerLabel="Behavior Detections" />
            <DonutChart title="Weapons Detected (24h)" data={weaponData} centerValue={kpi.weaponCount} centerLabel="Weapon Detections" />
            <DonutChart title="People Detected (24h)" data={personData} centerValue={kpi.personsCount} centerLabel="People Detections" />
            < ProbDistribution />
          </div>
        </div>
        {/* System feed: 1/3 on desktop */}
        <div className="flex flex-col lg:col-span-1">
          <SystemFeed />


        </div>
      </div>
    </div>
  );
}
