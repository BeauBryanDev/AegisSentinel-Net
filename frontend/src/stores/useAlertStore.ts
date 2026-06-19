
import { create } from "zustand";
import type {
    AlertLevel,
    DetectionSummary,
    EventRead,
    HealthResponse,
} from "../types";
import {
    getHealth,
    listDetections,
    listEvents,
    type DetectionListParams,
    type EventListParams,
} from "../services/api";


/*
 * Alert store.
 * Manages dashboard data: recent detections, events, threat level,
 * and KPI counters. Combines REST polling with live stream state.
 *
 */


interface AlertState {
    // System health
    health: HealthResponse | null;
    healthLoading: boolean;

    // Detections (REST: /api/v1/detections/)
    detections: DetectionSummary[];
    detectionsLoading: boolean;

    // Events (REST: /api/v1/events/)
    events: EventRead[];
    eventsLoading: boolean;

    // Live threat level (derived from the stream store's latest frame)
    threatLevel: AlertLevel;

    // KPI counters for the dashboard cards
    kpi: {
        violenceCount: number;
        weaponCount: number;
        personsCount: number;
    };

    // Actions
    fetchHealth: () => Promise<void>;
    fetchDetections: (params?: DetectionListParams) => Promise<void>;
    fetchEvents: (params?: EventListParams) => Promise<void>;
    setThreatLevel: (level: AlertLevel) => void;
    updateKpi: (frame: {
        detection_type: string;
        weapon_detected: boolean;
        persons_count: number;
    }) => void;
    reset: () => void;
}


export const useAlertStore = create<AlertState>()((set) => ({
    //   Initial state  
    health: null,
    healthLoading: false,

    detections: [],
    detectionsLoading: false,

    events: [],
    eventsLoading: false,

    threatLevel: "low",

    kpi: {
        violenceCount: 0,
        weaponCount: 0,
        personsCount: 0,
    },

    //  Actions  

    fetchHealth: async () => {

        set({ healthLoading: true });

        try {

            const health = await getHealth();
            set({ health, healthLoading: false });

        } catch (err) {

            console.error("[AlertStore] Failed to fetch health:", err);
            set({ healthLoading: false });
        }
    },

    fetchDetections: async (params = {}) => {
        set({ detectionsLoading: true });

        try {
            const detections = await listDetections(params);

            set({ detections, detectionsLoading: false });

        } catch (err) {

            console.error("[AlertStore] Failed to fetch detections:", err);
            set({ detectionsLoading: false });
        }
    },

    fetchEvents: async (params = {}) => {

        set({ eventsLoading: true });

        try {
            const events = await listEvents(params);
            set({ events, eventsLoading: false });

        } catch (err) {

            console.error("[AlertStore] Failed to fetch events:", err);
            set({ eventsLoading: false });
        }
    },

    setThreatLevel: (level) => {
        set({ threatLevel: level });
    },

    /**
     * Called every frame from the stream to keep KPI counters
     * and threat level in sync with the live inference.
     */
    updateKpi: (frame) => {
        set((s) => ({
            kpi: {
                violenceCount:
                    frame.detection_type === "violence"
                        ? s.kpi.violenceCount + 1
                        : s.kpi.violenceCount,
                weaponCount:
                    frame.weapon_detected
                        ? s.kpi.weaponCount + 1
                        : s.kpi.weaponCount,
                personsCount: frame.persons_count,
            },
        }));
    },

    reset: () => {
        set({
            detections: [],
            events: [],
            threatLevel: "low",
            kpi: { violenceCount: 0, weaponCount: 0, personsCount: 0 },
        });
    },
}));

