"use client";

// useFaceDetection — real face detection, ported from vibe's
// useCameraProcessor + FaceDetectorWorker + FaceDetectors triple.
//
// This replaces an earlier YCbCr skin-tone heuristic that counted
// warm-coloured pixels and mapped the ratio to a face count
// (<2% ⇒ "nobody", >40% ⇒ "two people"). That could not actually
// count faces: a beige wall read as a second person, and a dark-skinned
// or dimly-lit student read as absent. Those are the two failure modes
// you least want in a tool that accuses people of cheating.
//
// Now a MediaPipe short-range detector runs on TF.js inside a Web
// Worker, and the count is the number of boxes it returns.
//
// Anomalies are only raised after a run of consecutive confirming
// frames (CONFIRM_FRAMES). A single frame where someone reaches for a
// glass of water is not misconduct, and at 3 fps a one-frame trigger
// would fire constantly.

import { useCallback, useEffect, useRef, useState } from "react";
import { isLookingAway, type DetectedFace } from "@/lib/proctor-vision";

export type FaceAnomalyType = "no_face" | "multiple_faces" | "looking_away";

export type { DetectedFace };

export interface FaceDetectionOpts {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onAnomaly?: (anomaly: { type: FaceAnomalyType; severity: number }) => void;
  onFaceCount?: (count: number) => void;
  /** ms between samples. Defaults to 333 (~3 fps, matching vibe). */
  intervalMs?: number;
}

export interface FaceDetection {
  faceCount: number | null;
  isReady: boolean;
  /** "webgl" | "cpu" once the model is up, null before. */
  backend: string | null;
  error: string | null;
}

/** Camera + model need a few seconds before frames are trustworthy. */
const GRACE_MS = 8000;
/** Consecutive frames that must agree before an anomaly is raised. */
const CONFIRM_FRAMES = 3;

export function useFaceDetection(opts: FaceDetectionOpts): FaceDetection {
  const { videoRef, enabled, onAnomaly, onFaceCount, intervalMs = 333 } = opts;

  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [backend, setBackend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const modelReadyRef = useRef(false);
  const graceRef = useRef(false);
  const inFlightRef = useRef(false);
  const streakRef = useRef<Record<FaceAnomalyType, number>>({
    no_face: 0,
    multiple_faces: 0,
    looking_away: 0,
  });

  const onAnomalyRef = useRef(onAnomaly);
  const onFaceCountRef = useRef(onFaceCount);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
    onFaceCountRef.current = onFaceCount;
  });

  // Raise an anomaly only once a streak reaches CONFIRM_FRAMES, then
  // reset so it can fire again if the condition persists.
  const bump = useCallback((type: FaceAnomalyType, severity: number) => {
    const next = streakRef.current[type] + 1;
    streakRef.current[type] = next;
    if (next >= CONFIRM_FRAMES) {
      streakRef.current[type] = 0;
      onAnomalyRef.current?.({ type, severity });
    }
  }, []);

  const clearStreak = useCallback((type: FaceAnomalyType) => {
    streakRef.current[type] = 0;
  }, []);

  // ── Worker lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let worker: Worker;
    try {
      worker = new Worker(
        new URL("./workers/faceDetector.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch (e) {
      setError(`face detection worker failed to start: ${String(e)}`);
      return;
    }
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as {
        type: string;
        backend?: string;
        message?: string;
        faces?: DetectedFace[];
        count?: number;
      };

      if (data.type === "MODEL_READY") {
        modelReadyRef.current = true;
        setBackend(data.backend ?? null);
        setError(null);
        return;
      }

      if (data.type === "ERROR") {
        setError(data.message ?? "face detection failed");
        inFlightRef.current = false;
        return;
      }

      if (data.type === "DETECTION_RESULT") {
        inFlightRef.current = false;
        const faces = data.faces ?? [];
        const count = faces.length;
        setFaceCount(count);
        onFaceCountRef.current?.(count);

        if (graceRef.current) return;

        if (count === 0) {
          bump("no_face", 2);
          clearStreak("multiple_faces");
          clearStreak("looking_away");
        } else if (count > 1) {
          bump("multiple_faces", 3);
          clearStreak("no_face");
          clearStreak("looking_away");
        } else {
          clearStreak("no_face");
          clearStreak("multiple_faces");
          if (isLookingAway(faces[0]!)) bump("looking_away", 1);
          else clearStreak("looking_away");
        }
      }
    };

    worker.onerror = () => setError("face detection worker crashed");

    worker.postMessage({
      type: "INIT",
      modelUrl: `${window.location.origin}/models/face-detection-short/model.json`,
      maxFaces: 5,
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
      modelReadyRef.current = false;
      inFlightRef.current = false;
      setBackend(null);
    };
  }, [enabled, bump, clearStreak]);

  // ── Grace period ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      graceRef.current = false;
      return;
    }
    graceRef.current = true;
    setIsReady(false);
    const t = window.setTimeout(() => {
      graceRef.current = false;
      setIsReady(true);
    }, GRACE_MS);
    return () => window.clearTimeout(t);
  }, [enabled]);

  // ── Frame pump ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const worker = workerRef.current;
      const video = videoRef.current;
      // Skip while a previous frame is still being processed — on the
      // CPU backend inference can exceed the interval, and queuing
      // frames would spiral.
      if (!worker || !modelReadyRef.current || inFlightRef.current) return;
      if (!video || video.readyState < 2) return;
      if (!video.videoWidth || !video.videoHeight) return;

      try {
        // Downscale before handing the frame over: the detector runs at
        // 128×128 internally, so a full 480p bitmap is wasted copying.
        const bitmap = await createImageBitmap(video, {
          resizeWidth: 320,
          resizeHeight: Math.round((320 * video.videoHeight) / video.videoWidth),
          resizeQuality: "low",
        });
        if (cancelled) {
          bitmap.close();
          return;
        }
        inFlightRef.current = true;
        worker.postMessage({ type: "DETECT_FACES", image: bitmap }, [bitmap]);
      } catch {
        inFlightRef.current = false;
      }
    };

    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, intervalMs, videoRef]);

  return { faceCount, isReady, backend, error };
}
