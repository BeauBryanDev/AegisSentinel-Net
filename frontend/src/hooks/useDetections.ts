import { useEffect } from "react";
import { useAlertStore } from "../stores/useAlertStore";
import type { DetectionListParams } from "../services/api";

/**
 * Fetches detection history from useAlertStore on mount (and whenever
 * the filter params change), and exposes a refetch() for manual reloads
 */
export function useDetections(params?: DetectionListParams) {
  const detections = useAlertStore((s) => s.detections);
  const loading = useAlertStore((s) => s.detectionsLoading);
  const fetchDetections = useAlertStore((s) => s.fetchDetections);

  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    fetchDetections(params);
  }, [paramsKey]);

  return {
    detections,
    loading,
    refetch: () => fetchDetections(params),
  };
}
