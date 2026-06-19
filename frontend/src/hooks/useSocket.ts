import { useEffect } from "react";
import { useStreamStore } from "../stores/useStreamStore";

/**
 * Connects the stream WebSocket for the lifetime of the calling component
 * and disconnects on unmount. Thin lifecycle wrapper around useStreamStore —
 * mount this once near the top of whichever page owns the live stream

 */
export function useSocket() {
  const connectWs = useStreamStore((s) => s.connectWs);
  const disconnectWs = useStreamStore((s) => s.disconnectWs);
  const connectionState = useStreamStore((s) => s.connectionState);

  useEffect(() => {
    connectWs();
    return () => disconnectWs();
  }, [connectWs, disconnectWs]);

  return { connectionState };
}
