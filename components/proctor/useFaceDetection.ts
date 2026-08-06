"use client";

// useFaceDetection — Tenali-style skin-tone presence probe. Captures
// frames from the camera video stream on a 2 s tick and runs a
// lightweight YCbCr skin-tone count to flag "no face" / "multiple
// faces" anomalies.
//
// We don't load any ML model — that keeps the bundle small and the
// predictions deterministic across browsers. The video element is
// already in the DOM (the camera hook attaches the stream), so this
// hook just reads frames off it via a small offscreen <canvas>.

import { useCallback, useEffect, useRef, useState } from "react";

export interface FaceDetectionOpts {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onAnomaly?: (anomaly: { type: "no_face" | "multiple_faces"; severity: number }) => void;
  onFaceCount?: (count: number) => void;
  /** ms between samples. Defaults to 2000. */
  intervalMs?: number;
}

export interface FaceDetection {
  faceCount: number | null;
  isReady: boolean;
}

const SKIN_LOW = 0.02; // <2% skin-tone pixels → no face
const SKIN_HIGH = 0.4; // >40% skin-tone pixels → possible multiple faces

// YCbCr skin-tone range. Limited to skin hue; mid-saturation walls let
// us avoid false positives on backgrounds that happen to be warm.
function ycbcrSkinCount(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return y > 80 && cb > 85 && cb < 135 && cr > 135 && cr < 180;
}

export function useFaceDetection(opts: FaceDetectionOpts): FaceDetection {
  const { videoRef, enabled, onAnomaly, onFaceCount, intervalMs = 2000 } = opts;
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const onAnomalyRef = useRef(onAnomaly);
  const onFaceCountRef = useRef(onFaceCount);
  const graceRef = useRef(false);

  // Keep latest callbacks in refs so the detection interval doesn't
  // re-bind every render.
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
    onFaceCountRef.current = onFaceCount;
  });

  // Grace period after enabling — Vibe's pattern. Camera + browser
  // need a few seconds before frames are clean.
  useEffect(() => {
    if (enabled) {
      graceRef.current = true;
      setIsReady(false);
      const t = window.setTimeout(() => {
        graceRef.current = false;
        setIsReady(true);
      }, 8000);
      return () => window.clearTimeout(t);
    } else {
      setIsReady(false);
    }
  }, [enabled]);

  const detect = useCallback(() => {
    if (!enabled || graceRef.current) return;
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;

    let canvas = document.getElementById(
      "__proctor_face_canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "__proctor_face_canvas";
      canvas.width = 160;
      canvas.height = 120;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      // Cross-origin video can't be sampled; we're using same-origin.
      return;
    }
    const data = imageData.data;
    let skin = 0;
    let sampled = 0;
    for (let i = 0; i < data.length; i += 16) {
      sampled++;
      if (ycbcrSkinCount(data[i]!, data[i + 1]!, data[i + 2]!)) skin++;
    }
    const ratio = skin / Math.max(1, sampled);

    let count = 1;
    if (ratio < SKIN_LOW) count = 0;
    else if (ratio > SKIN_HIGH) count = 2;

    setFaceCount(count);
    onFaceCountRef.current?.(count);
    if (count === 0) {
      onAnomalyRef.current?.({ type: "no_face", severity: 2 });
    } else if (count > 1) {
      onAnomalyRef.current?.({ type: "multiple_faces", severity: 2 });
    }
  }, [enabled, videoRef]);

  useEffect(() => {
    if (!enabled) return;
    const t = window.setInterval(detect, intervalMs);
    return () => window.clearInterval(t);
  }, [enabled, intervalMs, detect]);

  return { faceCount, isReady };
}
