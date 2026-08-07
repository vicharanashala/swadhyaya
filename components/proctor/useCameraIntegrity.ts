"use client";

// useCameraIntegrity — wires the last two violation types that were
// declared in lib/proctoring.ts but never emitted by anything:
// `camera_blocked` and `motion_detected`.
//
// Corresponds to vibe's cameraIntegrity / VIRTUAL_CAMERA checks, but
// implemented from the stream itself rather than vibe's device-label
// heuristics, which mostly caught OBS by name and were trivially
// defeated by renaming a virtual camera.
//
// Two independent signals off a small luminance thumbnail:
//
//   camera_blocked   The track ended, was muted, or the frame went
//                    essentially flat — near-zero luminance spread is
//                    what a lens cap, a palm, or a taped-over camera
//                    produces. Distinct from blur, which still has
//                    structure, just soft.
//
//   motion_detected  Mean absolute difference against the previous
//                    thumbnail spikes past a threshold: someone swapped
//                    places, a second person walked in, or the camera
//                    was picked up and pointed elsewhere.

import { useEffect, useRef, useState } from "react";
import { lumaStdDev, meanAbsDiff } from "@/lib/proctor-vision";

export type IntegrityAnomaly = "camera_blocked" | "motion_detected";

export interface CameraIntegrityOpts {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  enabled: boolean;
  onAnomaly?: (a: { type: IntegrityAnomaly; severity: number }) => void;
  intervalMs?: number;
}

export interface CameraIntegrity {
  /** Mean absolute luminance delta vs the previous sample, 0–255. */
  motionScore: number | null;
  covered: boolean | null;
}

const SAMPLE_W = 64;
const SAMPLE_H = 48;
/** Luminance std-dev below this means the frame carries no detail. */
const FLAT_STDDEV = 6;
/** Frames of flatness before calling it blocked (~3s at 500ms). */
const COVERED_CONFIRM = 6;
/** Mean abs luminance delta above this is a hard scene change. */
const MOTION_THRESHOLD = 45;
const REPORT_COOLDOWN_MS = 20_000;

export function useCameraIntegrity(
  opts: CameraIntegrityOpts,
): CameraIntegrity {
  const { videoRef, stream, enabled, onAnomaly, intervalMs = 500 } = opts;

  const [motionScore, setMotionScore] = useState<number | null>(null);
  const [covered, setCovered] = useState<boolean | null>(null);

  const prevRef = useRef<Uint8ClampedArray | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flatStreakRef = useRef(0);
  const lastReport = useRef<Record<IntegrityAnomaly, number>>({
    camera_blocked: 0,
    motion_detected: 0,
  });

  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  // ── Track-level signals: ended / muted fire immediately ─────────────
  useEffect(() => {
    if (!enabled || !stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const report = (reason: string) => {
      const now = Date.now();
      if (now - lastReport.current.camera_blocked < REPORT_COOLDOWN_MS) return;
      lastReport.current.camera_blocked = now;
      setCovered(true);
      onAnomalyRef.current?.({ type: "camera_blocked", severity: 3 });
      void reason;
    };

    const onEnded = () => report("track ended");
    const onMute = () => report("track muted");

    track.addEventListener("ended", onEnded);
    track.addEventListener("mute", onMute);
    return () => {
      track.removeEventListener("ended", onEnded);
      track.removeEventListener("mute", onMute);
    };
  }, [enabled, stream]);

  // ── Pixel-level signals: flat frame / scene change ──────────────────
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      prevRef.current = null;
      flatStreakRef.current = 0;
      return;
    }

    const tick = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (!video.videoWidth || !video.videoHeight) return;

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.width = SAMPLE_W;
        canvas.height = SAMPLE_H;
        canvasRef.current = canvas;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);

      let frame: ImageData;
      try {
        frame = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
      } catch {
        return;
      }

      const n = SAMPLE_W * SAMPLE_H;
      const luma = new Uint8ClampedArray(n);
      for (let i = 0; i < n; i++) {
        const o = i * 4;
        luma[i] =
          0.299 * frame.data[o]! +
          0.587 * frame.data[o + 1]! +
          0.114 * frame.data[o + 2]!;
      }
      const stddev = lumaStdDev(luma);

      const now = Date.now();

      // Covered: no structure in the frame at all.
      if (stddev < FLAT_STDDEV) {
        flatStreakRef.current += 1;
        if (
          flatStreakRef.current >= COVERED_CONFIRM &&
          now - lastReport.current.camera_blocked >= REPORT_COOLDOWN_MS
        ) {
          lastReport.current.camera_blocked = now;
          flatStreakRef.current = 0;
          setCovered(true);
          onAnomalyRef.current?.({ type: "camera_blocked", severity: 3 });
        }
      } else {
        flatStreakRef.current = 0;
        setCovered(false);
      }

      // Motion: mean absolute difference against the previous thumbnail.
      const prev = prevRef.current;
      if (prev) {
        const score = meanAbsDiff(luma, prev);
        setMotionScore(score);

        if (
          score > MOTION_THRESHOLD &&
          now - lastReport.current.motion_detected >= REPORT_COOLDOWN_MS
        ) {
          lastReport.current.motion_detected = now;
          onAnomalyRef.current?.({ type: "motion_detected", severity: 1 });
        }
      }
      prevRef.current = luma;
    };

    const id = window.setInterval(tick, intervalMs);
    return () => {
      window.clearInterval(id);
      prevRef.current = null;
    };
  }, [enabled, intervalMs, videoRef]);

  return { motionScore, covered };
}
