"use client";

// SiteProctorController — the master site-wide proctoring orchestrator.
// Mounted in layout.tsx so it runs on every page once the student has
// opted in. Combines the detector hooks into a coherent lifecycle:
//
//   1. Reads `swadhyaya-proctoring-default` and only enables when the
//      student has picked "always" and has an ethics-consent acceptance
//      on file.
//   2. Opens a server-side attempt (lib/proctor-client) and a local
//      mirror (lib/proctoring), then spins up the camera.
//   3. Runs the detector suite, each of which reports into one shared
//      violation sink:
//        useProctor           focus / tab / clipboard / devtools / idle
//        useFaceDetection     no_face, multiple_faces, looking_away
//        useFaceRecognition   face_mismatch  (only once registered)
//        useBlurDetection     blur_detected
//        useVoiceDetection    voice_detected (only with mic consent)
//        useCameraIntegrity   camera_blocked, motion_detected
//   4. Renders the floating webcam panel so the student can always see
//      exactly what the system sees.
//   5. Surfaces the newest actionable anomaly through the full-screen
//      overlay.
//
// Every violation is written twice: once to the server, where the
// student cannot reach it, and once to localStorage so the student's own
// panel stays responsive when the network is slow. The snapshot bytes
// only fall back to localStorage if the upload failed.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  endSiteSession,
  getOrCreateSiteSession,
  type Attempt,
  isProctoringEnabled,
  listAttempts,
  logViolation,
  type ViolationInput,
} from "@/lib/proctoring";
import {
  closeRemoteAttempt,
  openRemoteAttempt,
  reportRemoteViolation,
  sendRemoteHeartbeat,
} from "@/lib/proctor-client";
import { useCamera } from "./useCamera";
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

const PREF_KEY = "swadhyaya-proctoring-default";
const CONSENT_KEY = "swadhyaya-proctoring-consent";
const MIC_CONSENT_KEY = "swadhyaya-proctoring-mic-consent";
const SESSION_CONCEPT = "_session";

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

function readPref(): "ask" | "always" | "never" {
  if (typeof window === "undefined") return "ask";
  try {
    const v = window.localStorage.getItem(PREF_KEY);
    return v === "always" || v === "never" ? v : "ask";
  } catch {
    return "ask";
  }
}

function hasConsented(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function hasMicConsent(): boolean {
  try {
    return window.localStorage.getItem(MIC_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

function markConsented() {
  try {
    window.localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function SiteProctorController() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [, forceTick] = useState(0);

  const attemptIdRef = useRef<string | null>(null);
  useEffect(() => {
    attemptIdRef.current = attempt?.id ?? null;
  }, [attempt]);

  useEffect(() => setMounted(true), []);

  // 1-Hz tick for the panel's live timer.
  useEffect(() => {
    if (!enabled) return;
    const t = window.setInterval(() => forceTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [enabled]);

  // ───────────────────────────────────────────────────────────────────
  // Enablement
  // ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !isProctoringEnabled()) return;

    const refresh = () => {
      const active = readPref() === "always" && hasConsented();

      if (active && !attemptIdRef.current) {
        getOrCreateSiteSession();
        // Best-effort: a failed open just means this session is local-only.
        void openRemoteAttempt(SESSION_CONCEPT);
      }
      if (!active && attemptIdRef.current) {
        endSiteSession("completed");
        void closeRemoteAttempt("completed");
        setAttempt(null);
      }

      setEnabled(active);
      setMicEnabled(active && hasMicConsent());

      if (active) {
        const sessions = listAttempts().filter(
          (a) => a.conceptId === SESSION_CONCEPT && a.status === "active",
        );
        setAttempt(sessions[0] ?? null);
      }
    };

    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREF_KEY || e.key === CONSENT_KEY || e.key === MIC_CONSENT_KEY) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("swadhyaya:proctor-consent", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("swadhyaya:proctor-consent", refresh);
    };
  }, [mounted]);

  // ───────────────────────────────────────────────────────────────────
  // Camera. Audio is requested separately by useVoiceDetection so a
  // student who consents to video but not the mic gets exactly that.
  // ───────────────────────────────────────────────────────────────────
  const camera = useCamera({ audio: false, autostart: enabled });

  useEffect(() => {
    if (enabled) void camera.start();
    else camera.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const refreshAttempt = useCallback(() => {
    const sessions = listAttempts().filter(
      (a) => a.conceptId === SESSION_CONCEPT && a.status === "active",
    );
    setAttempt(sessions[0] ?? null);
  }, []);

  // ───────────────────────────────────────────────────────────────────
  // The single violation sink every detector feeds.
  // ───────────────────────────────────────────────────────────────────
  const record = useCallback(
    async (input: ViolationInput) => {
      const id = attemptIdRef.current;
      if (!id) return;

      const snapshot = EVIDENCE_TYPES.has(input.type)
        ? (camera.captureFrame() ?? undefined)
        : undefined;

      // Server first — that copy is the one the student can't delete.
      const uploaded = await reportRemoteViolation({
        type: input.type,
        severity: input.severity,
        durationMs: input.durationMs,
        context: input.context,
        snapshot,
      });

      // Mirror locally. Keep the image bytes only when the upload
      // failed, so localStorage isn't carrying duplicates of evidence
      // that already lives on disk.
      logViolation(id, {
        ...input,
        snapshot: uploaded ? undefined : snapshot,
      });
      refreshAttempt();
    },
    [camera, refreshAttempt],
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
  // Detector suite
  // ───────────────────────────────────────────────────────────────────
  const face = useFaceDetection({
    videoRef: camera.videoRef,
    enabled: enabled && camera.isRunning,
    onAnomaly,
    onFaceCount: setFaceCount,
  });

  const recognition = useFaceRecognition({
    videoRef: camera.videoRef,
    enabled: enabled && camera.isRunning,
    onAnomaly,
  });

  useBlurDetection({
    videoRef: camera.videoRef,
    enabled: enabled && camera.isRunning,
    onAnomaly,
  });

  useVoiceDetection({
    enabled: micEnabled,
    onAnomaly,
  });

  useCameraIntegrity({
    videoRef: camera.videoRef,
    stream: camera.stream,
    enabled: enabled && camera.isRunning,
    onAnomaly,
  });

  // Standard listeners (focus / tab / clipboard / devtools / idle).
  useProctor({ attempt, onViolation: refreshAttempt });

  // ───────────────────────────────────────────────────────────────────
  // Server heartbeat — lets the dashboard tell a live session from one
  // whose browser was closed without ending cleanly.
  // ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => void sendRemoteHeartbeat(), 10_000);
    return () => window.clearInterval(id);
  }, [enabled]);

  // Close the server attempt when the tab goes away. `pagehide` fires in
  // cases `beforeunload` misses, notably the bfcache path on iOS.
  useEffect(() => {
    if (!enabled) return;
    const onHide = () => void closeRemoteAttempt("abandoned");
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [enabled]);

  const activeAnomaly = useMemo(
    () => (attempt ? deriveActiveAnomaly(attempt.violations, 5000) : null),
    [attempt],
  );

  if (!mounted) return null;
  if (!enabled || !attempt) return null;

  return (
    <>
      <ProctorFloatingPanel
        attempt={attempt}
        videoRef={camera.videoRef}
        cameraRunning={camera.isRunning}
        cameraError={camera.error ?? face.error}
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
        violation={activeAnomaly}
        videoRef={camera.videoRef}
        cameraRunning={camera.isRunning}
        faceCount={faceCount}
      />
    </>
  );
}

// Used by the GlobalProctorBanner when the student accepts the ethics
// consent: writes the record and tells the controller to enable.
export function acceptSiteProctoring() {
  markConsented();
  window.dispatchEvent(new CustomEvent("swadhyaya:proctor-consent"));
}

export function declineSiteProctoring() {
  try {
    window.localStorage.setItem(CONSENT_KEY, "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("swadhyaya:proctor-consent"));
}

/** Mic monitoring is a separate, revocable grant from camera monitoring. */
export function setMicrophoneConsent(granted: boolean) {
  try {
    window.localStorage.setItem(MIC_CONSENT_KEY, granted ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("swadhyaya:proctor-consent"));
}

// Re-export so callers don't need to know the underlying module path.
export { ShieldCheck };
