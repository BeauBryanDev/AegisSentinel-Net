import type { FramePayload, StreamMessage } from "../types";
import { isFramePayload } from "../types";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export interface StreamSocketCallbacks {
    /** Fired every time a valid FramePayload arrives from the backend */
    onFrame?: (payload: FramePayload) => void;
    /** Fired when the backend sends an error message (e.g. invalid_frame) */
    onError?: (error: string) => void;
    /** Fired when connection state changes */
    onStateChange?: (state: ConnectionState) => void;
    /** Fired on unexpected close (before automatic reconnect attempt) */
    onDisconnect?: () => void;
}

// Config 

function buildWSUrl(): string {

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname;
    const port = window.location.port;
    return `${proto}://${host}:${port}/ws/stream`;
}

// Reconnect logic

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // 1 second
const RECONNECT_MAX_MS = 16_000;

// Main class

export class StreamSocket {

    private ws: WebSocket | null = null;
    private callbacks: StreamSocketCallbacks;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isClosing = false;

    constructor(callbacks: StreamSocketCallbacks) {
        this.callbacks = callbacks;
    }

    connect(): void {
        if (this.ws) {
            console.warn("[WS] Already connected or connecting");
            return;
        }

        this.isClosing = false;
        this.reconnectAttempts = 0;
        this.connectInternal();
    }

    private connectInternal(): void {
        const url = buildWSUrl();
        console.log("[WS] Connecting to", url);
        this.callbacks.onStateChange?.("connecting");

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("[WS] Connected");
            this.callbacks.onStateChange?.("connected");
            this.reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as StreamMessage;
                this.handleMessage(data);
            } catch (err) {
                console.error("[WS] Failed to parse message", err);
            }
        };

        ws.onerror = (error) => {
            console.error("[WS] Error", error);
            this.ws = null;
            this.callbacks.onStateChange?.("disconnected");
            this.callbacks.onDisconnect?.();
            this.scheduleReconnect();
        };

        ws.onclose = (event) => {
            console.log("[WS] Closed", event.code, event.reason);
            this.ws = null;
            this.callbacks.onStateChange?.("disconnected");
            this.callbacks.onDisconnect?.();

            if (!this.isClosing) {
                this.scheduleReconnect();
            }
        };

        this.ws = ws;
    }

    private handleMessage(data: StreamMessage): void {

        if (data.type === "frame") {

            if (isFramePayload(data.payload)) {

                this.callbacks.onFrame?.(data.payload);

            } else {
                console.warn("[WS] Invalid frame payload", data.payload);
                this.callbacks.onError?.("invalid_frame");
            }

        } else if (data.type === "error") {

            console.error("[WS] Backend error", data.error);
            this.callbacks.onError?.(data.error);

        } else {
            console.warn("[WS] Unknown message type", data);
        }
    }

    updateCallbacks(callbacks: Partial<StreamSocketCallbacks>): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    sendFrame(jpeg: Blob | ArrayBuffer): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn("[WS] Cannot send frame, socket not open");
            return;
        }
        this.ws.send(jpeg);
    }


    private scheduleReconnect(): void {
        if (this.isClosing) return;
        this.clearReconnectTimer();

        this.reconnectAttempts++;

        if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {

            console.error("[WS] Max reconnect attempts reached");
            return;
        }

        const delay = RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.connectInternal();
        }, delay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    close(): void {
        this.isClosing = true;

        if (this.reconnectTimer) {

            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {

            this.ws.close();
            this.ws = null;
        }

        this.callbacks.onStateChange?.("disconnected");
    }
    getState(): ConnectionState {
        if (!this.ws) return "disconnected";
        return this.ws.readyState === WebSocket.OPEN ? "connected" : "connecting";
    }
}