"use client";

// useBlurDetection — ported from vibe's BlurDetector.tsx + its worker.
//
// Wires the `blur_detected` violation type, which until now was declared
// in lib/proctoring.ts and rendered by the overlay but never actually
// emitted by anything.
//
// Follows vibe's dwell logic rather than firing on the first blurry
// frame: a camera can go briefly soft while autofocus hunts, so the
// frame has to stay below threshold for SUSTAIN_MS before it counts.

import { useEffect, useRef, useState } from "react";

export interface BlurDetectionOpts {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onAnomaly?: (a: { type: "blur_detected"; severity: number }) => void;
  /** ms between samples. Defaults to 1000. */
  intervalMs?: number;
  /** Laplacian variance below this is "blurry". vibe used 250. */
  threshold?: number;
}

export interface BlurDetection {
  isBlurry: boolean | null;
  variance: number | null;
}

/** How long the frame must stay blurry before it's reported. */
const SUSTAIN_MS = 5000;
/** Don't re-report the same sustained blur more than this often. */
const REPORT_COOLDOWN_MS = 30_000;
/** Analysis resolution — enough for an edge-energy statistic. */
const SAMPLE_W = 160;

export function useBlurDetection(opts: BlurDetectionOpts): BlurDetection {
  const { videoRef, enabled, onAnomaly, intervalMs = 1000, threshold = 250 } = opts;

  const [isBlurry, setIsBlurry] = useState<boolean | null>(null);
  const [variance, setVariance] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const blurStartRef = useRef<number | null>(null);
  const lastReportRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./workers/blurDetector.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      return;
    }
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<{ isBlurry: boolean; variance: number }>) => {
      const { isBlurry: blurry, variance: v } = event.data;
      setIsBlurry(blurry);
      setVariance(v);

      if (!blurry) {
        blurStartRef.current = null;
        return;
      }

      const now = Date.now();
      if (blurStartRef.current === null) {
        blurStartRef.current = now;
        return;
      }
      if (
        now - blurStartRef.current >= SUSTAIN_MS &&
        now - lastReportRef.current >= REPORT_COOLDOWN_MS
      ) {
        lastReportRef.current = now;
        blurStartRef.current = null;
        onAnomalyRef.current?.({ type: "blur_detected", severity: 1 });
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      blurStartRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const tick = () => {
      const video = videoRef.current;
      const worker = workerRef.current;
      if (!worker || !video || video.readyState < 2) return;
      if (!video.videoWidth || !video.videoHeight) return;

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }
      const h = Math.max(
        2,
        Math.round((SAMPLE_W * video.videoHeight) / video.videoWidth),
      );
      canvas.width = SAMPLE_W;
      canvas.height = h;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, SAMPLE_W, h);

      try {
        const imageData = ctx.getImageData(0, 0, SAMPLE_W, h);
        worker.postMessage({ imageData, threshold });
      } catch {
        // getImageData throws on a tainted canvas; the stream is
        // same-origin so this shouldn't happen, but don't kill the loop.
      }
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, threshold, videoRef]);

  return { isBlurry, variance };
}
