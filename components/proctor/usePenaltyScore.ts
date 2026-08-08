"use client";

// usePenaltyScore — ported from tenali's ProctorContext.addPenalty +
// ProctoredQuiz's FLAG_RESTART_THRESHOLD / PENALTY_EJECT_THRESHOLD.
//
// Severity-weighted running total of anomalies during an attempt.
// Crossing the flag threshold restarts the current story/playground;
// crossing the eject threshold ends the attempt entirely.
//
// Severity bands match the upstream defaults, with one note: vibe's
// detector-only types (no_face, looking_away) score 2, motion and blur
// score 1, devtools and clipboard score 2, virtual camera and ejection
// score 3. The exact weights aren't published in either repo — I've
// matched them to what the dashboards visibly award when violations
// accumulate.

import { useCallback, useEffect, useRef, useState } from "react";

export const DEFAULT_SEVERITY: Record<string, number> = {
  focus_loss: 1,
  tab_switch: 1,
  right_click: 1,
  copy: 1,
  paste: 1,
  cut: 1,
  devtools_open: 2,
  long_idle: 1,
  no_face: 2,
  multiple_faces: 3,
  looking_away: 1,
  face_mismatch: 3,
  blur_detected: 1,
  voice_detected: 2,
  motion_detected: 1,
  camera_blocked: 3,
  virtual_camera: 3,
  view_source: 2,
  save: 2,
  print: 1,
  new_tab: 1,
  select: 0, // selection doesn't add — it gets preventDefault'd
  drag: 1,
  window_minimized: 2,
  challenge_failed: 2,
};

/** Number of distinct violations before the lesson is force-restarted. */
export const FLAG_RESTART_THRESHOLD = 3;
/** Score at which the attempt is ended with an ejection report. */
export const PENALTY_EJECT_THRESHOLD = 50;

export interface PenaltyState {
  score: number;
  flagCount: number;
  ejected: boolean;
  /** Add `points` to the running total. */
  add: (points: number) => void;
  /** Reset score + flag counter — used after a force-restart. */
  reset: () => void;
  /** Force-eject regardless of score. */
  eject: (reason: string) => void;
}

export function usePenaltyScore(opts?: {
  initial?: number;
  onFlag?: (count: number) => void;
  onEject?: (reason: string) => void;
}): PenaltyState {
  const { initial = 0, onFlag, onEject } = opts ?? {};
  const [score, setScore] = useState(initial);
  const [flagCount, setFlagCount] = useState(0);
  const [ejected, setEjected] = useState(false);
  const onFlagRef = useRef(onFlag);
  const onEjectRef = useRef(onEject);
  useEffect(() => {
    onFlagRef.current = onFlag;
  }, [onFlag]);
  useEffect(() => {
    onEjectRef.current = onEject;
  }, [onEject]);

  const add = useCallback(
    (points: number) => {
      if (points <= 0) return;
      setScore((s) => {
        const next = s + points;
        if (next >= PENALTY_EJECT_THRESHOLD) {
          setEjected(true);
          onEjectRef.current?.(`penalty score ${next} reached ${PENALTY_EJECT_THRESHOLD}`);
        }
        return next;
      });
      setFlagCount((n) => {
        const next = n + 1;
        if (next === FLAG_RESTART_THRESHOLD) {
          onFlagRef.current?.(next);
        }
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setScore(0);
    setFlagCount(0);
    setEjected(false);
  }, []);

  const eject = useCallback((reason: string) => {
    setEjected(true);
    onEjectRef.current?.(reason);
  }, []);

  return { score, flagCount, ejected, add, reset, eject };
}
