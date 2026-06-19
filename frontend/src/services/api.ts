import axios from "axios";

import type {
    HealthResponse,
    DetectionRead,
    DetectionSummary,
    EventRead,
    EventUpdate,
    RecordingRead,
    RecordingWithStats,
    AlertLevel,
    EventType,
    EventSeverity,
    RecordingStatus,
} from "../types";


const api = axios.create({
    baseURL: "/api/v1",
    timeout: 10_000,
    headers: { "Content-Type": "application/json" },
});

//   Request interceptor 
// Placeholder for JWT: when auth is implemented, attach the token here.
// api.interceptors.request.use((config) => {
//   const token = useAuthStore.getState().token;
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });


// Response Interceptor 

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const detail = error.response?.data?.detail;

            // Log structured error for debugging
            console.error(
                `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} -> ${status}`,
                detail ?? error.message,
            );

            // Future: on 401, trigger token refresh or redirect to /login
            // if (status === 401) { useAuthStore.getState().logout(); }
        }

        return Promise.reject(error);
    },
);


// Health
export async function getHealth(): Promise<HealthResponse> {
    const { data } = await api.get<HealthResponse>("/health");
    return data;
}

// Detection 
export interface DetectionListParams {
    //page?: number;
    limit?: number;
    offset?: number;
    alert_level?: AlertLevel;
    recording_id?: number;
}

export async function listDetections(
    params: DetectionListParams = {},
): Promise<DetectionSummary[]> {
    const { data } = await api.get<DetectionSummary[]>("/detections/", {
        params,
    });
    return data;
}

export async function getDetection(id: number): Promise<DetectionRead> {
    const { data } = await api.get<DetectionRead>(`/detections/${id}`);
    return data;
}


// Events 

export interface EventListParams {
    limit?: number;
    offset?: number;
    event_type?: EventType;
    severity?: EventSeverity;
    recording_id?: number;
}

export async function listEvents(
    params: EventListParams = {},
): Promise<EventRead[]> {
    const { data } = await api.get<EventRead[]>("/events/", { params });
    return data;
}

export async function getEvent(id: number): Promise<EventRead> {
    const { data } = await api.get<EventRead>(`/events/${id}`);
    return data;
}

export async function updateEvent(
    id: number,
    body: EventUpdate,
): Promise<EventRead> {
    const { data } = await api.patch<EventRead>(`/events/${id}`, body);
    return data;
}


// Recordings

export interface RecordingListParams {
    limit?: number;
    offset?: number;
    status?: RecordingStatus;
}

export async function listRecordings(
    params: RecordingListParams = {},
): Promise<RecordingRead[]> {
    const { data } = await api.get<RecordingRead[]>("/recordings/", { params });
    return data;
}

export async function getRecording(id: number): Promise<RecordingWithStats> {
    const { data } = await api.get<RecordingWithStats>(`/recordings/${id}`);
    return data;
}

// I must build a StartRecording , StopRecording , DeleteRecording ,  in backend first then bring it here the three new endpoints

export async function startRecording(): Promise<RecordingRead> {
    const { data } = await api.post<RecordingRead>("/recordings/start");
    return data;
}

export async function stopRecording(): Promise<RecordingRead> {
    const { data } = await api.post<RecordingRead>("/recordings/stop");
    return data;
}

export async function deleteRecording(id: number): Promise<RecordingRead> {
    const { data } = await api.delete<RecordingRead>(`/recordings/${id}`);
    return data;
}


export default api;