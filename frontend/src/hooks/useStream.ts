import { useCallback, useEffect, useRef, useState } from "react";
import { useStreamStore } from "../stores/useStreamStore";

interface UseStreamOptions {
  /** Frames per second to send to the backend (default 10) */
  targetFps?: number;
  /** JPEG compression quality 0.0 - 1.0 (default 0.5) */
  jpegQuality?: number;
}

interface VideoDims {
  width: number;
  height: number;
}

/**
 * Owns the full capture pipeline for the live stream page:
 *  - binds the camera MediaStream (from useStreamStore) to a <video> element
 *  - tracks native video dimensions for DetectionOverlay's canvas sizing
 *  - runs a requestAnimationFrame capture loop: draw video frame -> <canvas>
 *    -> JPEG -> sendFrame() over the WebSocket
 *  - throttled to targetFps, skips capture while the tab is hidden
 *
 * Render <video ref={videoRef} onPlaying={handlePlaying} onResize={handlePlaying} />
 * for the visible feed and <canvas ref={canvasRef} className="hidden" /> for
 * the capture buffer. Only runs the loop while there's a camera stream and
 * the socket is connected.
 */
export function useStream({ targetFps = 10, jpegQuality = 0.5 }: UseStreamOptions = {}) {
  const mediaStream = useStreamStore((s) => s.mediaStream);
  const connectionState = useStreamStore((s) => s.connectionState);
  const sendFrame = useStreamStore((s) => s.sendFrame);
  const frame = useStreamStore((s) => s.frame);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const [dims, setDims] = useState<VideoDims>({ width: 640, height: 480 });

  // Bind the camera MediaStream to the <video> element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = mediaStream;
  }, [mediaStream]);

  const handlePlaying = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDims({ width: video.videoWidth, height: video.videoHeight });
    }
  }, []);

  // rAF capture loop: draw -> JPEG -> sendFrame(), only while streaming
  useEffect(() => {
    const active = mediaStream !== null && connectionState === "connected";
    if (!active) return;

    const interval = 1000 / targetFps;
    let stopped = false;
    let lastCapture = 0;

    const loop = (timestamp: number) => {
      if (stopped) return;

      // Schedule next frame first so the loop stays alive even if we skip below
      rafRef.current = requestAnimationFrame(loop);

      // Skip capture while the tab is hidden (saves battery/bandwidth)
      if (document.hidden) return;

      const elapsed = timestamp - lastCapture;
      if (elapsed < interval) return;
      lastCapture = timestamp - (elapsed % interval);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) sendFrame(blob);
        },
        "image/jpeg",
        jpegQuality,
      );
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [mediaStream, connectionState, targetFps, jpegQuality, sendFrame]);

  return { videoRef, canvasRef, dims, handlePlaying, frame, connectionState, mediaStream };
}
