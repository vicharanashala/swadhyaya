"use client";

// SiteProctorController — runs the detector suite for the whole app.
//
// Mounted inside ProctorGate, so by the time this renders the camera and
// microphone are already live and shared through ProctorMediaProvider.
// That inverts the old design, which asked for consent, stored a
// preference, and then tried to start a camera that might never arrive:
//
//   • There is no enable/disable preference any more. Monitoring is a
//     precondition for the app rendering at all, so a "proctoring off"
//     branch would be unreachable. Presence of a live stream is consent.
//   • There is no separate microphone grant. The gate acquires audio and
//     video together, so voice detection always runs.
//   • This component no longer calls getUserMedia. It consumes the one
//     stream the provider owns, which is why there is a single recording
//     indicator rather than three.
//
// Detectors and the violation types they raise:
//   useProctor           focus / tab / clipboard / devtools / idle
//   useFaceDetection     no_face, multiple_faces, looking_away
//   useFaceRecognition   face_mismatch  (only once registered)
//   useBlurDetection     blur_detected
//   useVoiceDetection    voice_detected
//   useCameraIntegrity   camera_blocked, motion_detected
//
// Every violation is written twice: to the server, where the student
// cannot reach it, and to localStorage so the student's own panel stays
// responsive when the network is slow. Snapshot bytes only fall back to
// localStorage if the upload failed.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getOrCreateSiteSession,
  type Attempt,
  isProctoringEnabled,
  listAttempts,
  logViolation,
  type ViolationInput,
  type Violation,
} from "@/lib/proctoring";
import {
  closeRemoteAttempt,
  openRemoteAttempt,
  reportRemoteViolation,
  sendRemoteHeartbeat,
} from "@/lib/proctor-client";
import { useOptionalProctorMedia } from "./ProctorMediaProvider";
import { useFaceDetection } from "./useFaceDetection";
import { useFaceRecognition } from "./useFaceRecognition";
import { useBlurDetection } from "./useBlurDetection";
import { useVoiceDetection } from "./useVoiceDetection";
import { useCameraIntegrity } from "./useCameraIntegrity";
import { useProctor } from "./useProctor";
import { ProctorFloatingPanel } from "./ProctorFloatingPanel";
import {
  VibeStyleAnomalyOverlay,
  deriveActiveAnomaly,
} from "./VibeStyleAnomalyOverlay";
import { ShieldCheck } from "lucide-react";

const SESSION_CONCEPT = "_session";

/** How long the full-screen alert stays up. The overlay runs its own
 *  timer on the same value. */
const ANOMALY_DISPLAY_MS = 5000;

/** Minimum gap between full-screen alerts.
 *
 *  Recording and interrupting are deliberately decoupled. Every anomaly
 *  is still logged, but a genuinely persistent condition — a student who
 *  has stepped away — produces a violation every few seconds, and
 *  re-arming a 5 s takeover that often means it never visibly closes.
 *  The alert is a nudge; the evidence trail is the record. */
const OVERLAY_COOLDOWN_MS = 15_000;

/** Types that warrant uploading a camera still as evidence. Clipboard
 *  and focus events don't — a photo of someone's face proves nothing
 *  about a copy/paste, and capturing one anyway is gratuitous. */
const EVIDENCE_TYPES = new Set([
  "no_face",
  "multiple_faces",
  "face_mismatch",
  "camera_blocked",
  "motion_detected",
]);

export function SiteProctorController() {
  // Optional, not strict: when NEXT_PUBLIC_PROCTORING is off ProctorGate
  // is a pass-through and no provider exists. The strict hook threw
  // there, which broke the build for non-proctoring deployments.
  const media = useOptionalProctorMedia();
  const live = Boolean(media?.healthy);

  // Hooks below run unconditionally (rules of hooks), so they need a
  // real ref object even on the no-provider path. They're all disabled
  // via `enabled: live` in that case and never dereference it.
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = media?.videoRef ?? fallbackVideoRef;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [, forceTick] = useState(0);

  const attemptIdRef = useRef<string | null>(null);
  useEffect(() => {
    attemptIdRef.current = attempt?.id ?? null;
  }, [attempt]);

  // 1-Hz tick for the panel's live timer.
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => forceTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [live]);

  const refreshAttempt = useCallback(() => {
    const sessions = listAttempts().filter(
      (a) => a.conceptId === SESSION_CONCEPT && a.status === "active",
    );
    setAttempt(sessions[0] ?? null);
  }, []);

  // ───────────────────────────────────────────────────────────────────
  // Open the session as soon as media goes live.
  // ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!live || !isProctoringEnabled()) return;
    if (attemptIdRef.current) return;

    getOrCreateSiteSession();
    // Best-effort: a failed open just means this session is local-only.
    void openRemoteAttempt(SESSION_CONCEPT);
    refreshAttempt();
  }, [live, refreshAttempt]);

  // ───────────────────────────────────────────────────────────────────
  // The single violation sink every detector feeds.
  // ───────────────────────────────────────────────────────────────────
  const record = useCallback(
    async (input: ViolationInput) => {
      const id = attemptIdRef.current;
      if (!id) return;

      const snapshot = EVIDENCE_TYPES.has(input.type)
        ? (media?.captureFrame() ?? undefined)
        : undefined;

      // Server first — that copy is the one the student can't delete.
      const uploaded = await reportRemoteViolation({
        type: input.type,
        severity: input.severity,
        durationMs: input.durationMs,
        context: input.context,
        snapshot,
      });

      // Mirror locally, keeping image bytes only when the upload failed
      // so localStorage isn't duplicating evidence already on disk.
      logViolation(id, { ...input, snapshot: uploaded ? undefined : snapshot });
      refreshAttempt();
    },
    [media, refreshAttempt],
  );

  // Detectors debounce internally; this guards against two different
  // detectors reporting the same condition in the same instant.
  const lastByType = useRef<Record<string, number>>({});
  const onAnomaly = useCallback(
    (a: { type: ViolationInput["type"]; severity: number }) => {
      const now = Date.now();
      if (now - (lastByType.current[a.type] ?? 0) < 3000) return;
      lastByType.current[a.type] = now;
      void record({ type: a.type, severity: a.severity });
    },
    [record],
  );

  // ───────────────────────────────────────────────────────────────────
  // Detector suite — all reading the one shared stream.
  // ───────────────────────────────────────────────────────────────────
  const face = useFaceDetection({
    videoRef,
    enabled: live,
    onAnomaly,
    onFaceCount: setFaceCount,
  });

  const recognition = useFaceRecognition({
    videoRef,
    enabled: live,
    onAnomaly,
  });

  useBlurDetection({
    videoRef,
    enabled: live,
    onAnomaly,
  });

  useVoiceDetection({
    stream: media?.stream ?? null,
    enabled: live,
    onAnomaly,
  });

  useCameraIntegrity({
    videoRef,
    stream: media?.stream ?? null,
    enabled: live,
    onAnomaly,
  });

  useProctor({ attempt, onViolation: refreshAttempt });

  // ───────────────────────────────────────────────────────────────────
  // Server heartbeat — lets the dashboard tell a live session from one
  // whose browser was closed without ending cleanly.
  // ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => void sendRemoteHeartbeat(), 10_000);
    return () => window.clearInterval(id);
  }, [live]);

  // Close the server attempt when the tab goes away. `pagehide` fires in
  // cases `beforeunload` misses, notably the bfcache path on iOS.
  useEffect(() => {
    const onHide = () => void closeRemoteAttempt("abandoned");
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  // Explicit overlay lifecycle rather than a time-derived memo.
  //
  // This used to be useMemo(() => deriveActiveAnomaly(...), [attempt]).
  // deriveActiveAnomaly compares against Date.now(), so its result
  // changes as time passes and not only when `attempt` does — keyed on
  // [attempt] the memo froze the instant violations stopped arriving and
  // pinned the alert open permanently.
  const [overlayViolation, setOverlayViolation] = useState<Violation | null>(
    null,
  );
  const lastOverlayAtRef = useRef(0);

  useEffect(() => {
    if (!attempt) return;
    const latest = deriveActiveAnomaly(attempt.violations, ANOMALY_DISPLAY_MS);
    if (!latest || latest.id === overlayViolation?.id) return;
    const now = Date.now();
    if (now - lastOverlayAtRef.current < OVERLAY_COOLDOWN_MS) return;
    lastOverlayAtRef.current = now;
    setOverlayViolation(latest);
  }, [attempt, overlayViolation?.id]);

  if (!live || !attempt) return null;

  return (
    <>
      <ProctorFloatingPanel
        attempt={attempt}
        stream={media?.stream ?? null}
        cameraRunning={live}
        cameraError={face.error}
        faceCount={faceCount}
        detectorBackend={face.backend}
        identityStatus={
          recognition.registered
            ? recognition.isMatch === null
              ? "checking"
              : recognition.isMatch
                ? "verified"
                : "mismatch"
            : "unregistered"
        }
      />
      <VibeStyleAnomalyOverlay
        violation={overlayViolation}
        dismissMs={ANOMALY_DISPLAY_MS}
        onAck={() => setOverlayViolation(null)}
        stream={media?.stream ?? null}
        cameraRunning={live}
        faceCount={faceCount}
      />
    </>
  );
}

// Re-export so callers don't need to know the underlying module path.
export { ShieldCheck };
