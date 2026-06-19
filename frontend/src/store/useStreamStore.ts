import { create } from "zustand";
import {
    StreamSocket,
    type ConnectionState,
    type StreamSocketCallbacks,
} from "../services/websocket";
import type { FramePayload } from "../types";



interface StreamState {
    // WebSocket
    connectionState: ConnectionState;
    /** Latest frame payload from the backend inference pipeline */
    frame: FramePayload | null;
    /** Cumulative count of frames processed this session */
    framesReceived: number;

    // Camera
    /** The browser MediaStream from getUserMedia */
    mediaStream: MediaStream | null;
    /** True while getUserMedia is resolving */
    cameraLoading: boolean;
    /** Error message if camera access fails */
    cameraError: string | null;
    /** Which camera to request: "environment" (back) or "user" (front) */
    facingMode: "environment" | "user";

    // Actions
    connectWs: () => void;
    disconnectWs: () => void;
    sendFrame: (jpeg: Blob | ArrayBuffer) => void;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    toggleCamera: () => Promise<void>;

}

let socket: StreamSocket | null = null;

function getSocket(callbacks: StreamSocketCallbacks) {
    if (!socket) {
        socket = new StreamSocket(callbacks);
    } else {
        socket.updateCallbacks(callbacks);
    }
    return socket;
}


export const useStreamStore = create<StreamState>()((set, get) => ({
    // -- Initial state --
    connectionState: "disconnected",
    frame: null,
    framesReceived: 0,

    mediaStream: null,
    cameraLoading: false,
    cameraError: null,
    facingMode: "environment",

    // -- WebSocket actions --

    connectWs: () => {
        const ws = getSocket({
            onFrame: (payload) => {
                set((s) => ({
                    frame: payload,
                    framesReceived: s.framesReceived + 1,
                }));
            },
            onStateChange: (connectionState) => {
                set({ connectionState });
            },
            onError: (error) => {
                console.warn("[StreamStore] Backend frame error:", error);
            },
            onDisconnect: () => {
                set({ frame: null });
            },
        });

        ws.connect();
    },

    disconnectWs: () => {
        socket?.disconnect();
        set({ connectionState: "disconnected", frame: null, framesReceived: 0 });
    },

    sendFrame: (jpeg) => {
        socket?.sendFrame(jpeg);
    },

    // -- Camera actions --

    startCamera: async () => {
        // Stop any existing stream first
        get().stopCamera();

        set({ cameraLoading: true, cameraError: null });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: get().facingMode },
                    // Target 640x480 to keep JPEG size manageable over WS.
                    // The actual resolution depends on the device.
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });

            set({ mediaStream: stream, cameraLoading: false });
        } catch (err) {
            const message =
                err instanceof DOMException
                    ? err.name === "NotAllowedError"
                        ? "Camera permission denied. Please allow camera access."
                        : err.name === "NotFoundError"
                            ? "No camera found on this device."
                            : `Camera error: ${err.message}`
                    : "Failed to access camera.";

            set({ cameraError: message, cameraLoading: false });
            console.error("[StreamStore] Camera error:", err);
        }
    },

    stopCamera: () => {
        const { mediaStream } = get();
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
            set({ mediaStream: null });
        }
    },

    toggleCamera: async () => {
        const next = get().facingMode === "environment" ? "user" : "environment";
        set({ facingMode: next });
        // Restart with new facing mode
        await get().startCamera();
    },
}));



