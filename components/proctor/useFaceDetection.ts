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
// Anomalies are raised only when most of a short sliding window agrees
// (see CONFIRM_RATIO). A single frame where someone reaches for a glass
// of water is not misconduct, and at 3 fps a one-frame trigger would
// fire constantly.

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

/** Sliding window used to confirm an anomaly, in frames. */
const WINDOW_FRAMES = 6;
/** Fraction of the window that must agree before the anomaly is raised.
 *
 *  This replaced a strictly-consecutive counter, which turned out to be
 *  brittle in exactly the way that matters: a detector that misses every
 *  other frame — normal for a face at an angle, in poor light, or on the
 *  CPU backend — reset the streak forever and NOTHING was ever reported.
 *  Measured on a flapping feed: 21 candidate frames, 0 anomalies raised.
 *
 *  A ratio over a window tolerates the odd dropped frame while still
 *  refusing to fire on a genuinely ambiguous signal (alternating 0/1
 *  faces scores 0.5 and stays quiet, which is the honest answer). */
const CONFIRM_RATIO = 0.7;

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
  const historyRef = useRef<Record<FaceAnomalyType, boolean[]>>({
    no_face: [],
    multiple_faces: [],
    looking_away: [],
  });

  const onAnomalyRef = useRef(onAnomaly);
  const onFaceCountRef = useRef(onFaceCount);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
    onFaceCountRef.current = onFaceCount;
  });

  // Record this frame's verdict for one anomaly type and raise it once
  // enough of the recent window agrees. Every frame must report every
  // type — including the negative — or the window goes stale.
  const observe = useCallback(
    (type: FaceAnomalyType, anomalous: boolean, severity: number) => {
      const h = historyRef.current[type];
      h.push(anomalous);
      if (h.length > WINDOW_FRAMES) h.shift();
      if (h.length < WINDOW_FRAMES) return;

      const agreeing = h.reduce((n, v) => n + (v ? 1 : 0), 0);
      if (agreeing / h.length >= CONFIRM_RATIO) {
        historyRef.current[type] = [];
        onAnomalyRef.current?.({ type, severity });
      }
    },
    [],
  );

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

        observe("no_face", count === 0, 2);
        observe("multiple_faces", count > 1, 3);
        observe(
          "looking_away",
          count === 1 && isLookingAway(faces[0]!),
          1,
        );
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
  }, [enabled, observe]);

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
