"use client";

// SiteProctorController — the master site-wide proctoring orchestrator.
// Mounted in layout.tsx so it runs on every page once the student has
// opted in. Combines all the lower-level hooks into a coherent
// lifecycle:
//
//   1. Reads `swadhyaya-proctoring-default` and only enables when the
//      student has picked "always" or has an active ethics-consent
//      acceptance on file.
//   2. Spins up the camera (useCamera) once consent is on file.
//   3. Mounts the original useProctor hook for the standard listeners
//      (focus / tab / right-click / copy / paste / cut / devtools).
//   4. Mounts useFaceDetection which streams face-presence anomalies
//      into the same violation log + captures a snapshot for each
//      face-presence violation so the admin can see what the
//      camera saw.
//   5. Renders the floating webcam panel — the "photo" the user
//      wants to see — so the student always has a transparent view
//      of what the system sees.
//   6. Surfaces the latest face-presence anomaly through the
//      Vibe-style full-screen ProctorAlertOverlay so the student
//      sees the same alert Vibe shows.
//
// User can accept the ethics consent by clicking "I Accept" in the
// GlobalProctorBanner first-visit modal. The banner also requests
// the camera so that permission shows up at the moment of consent.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  attemptDuration,
  endSiteSession,
  getOrCreateSiteSession,
  type Attempt,
  isProctoringEnabled,
  listAttempts,
  logViolation,
  type ViolationInput,
  type Violation,
} from "@/lib/proctoring";
import { useCamera } from "./useCamera";
import { useFaceDetection } from "./useFaceDetection";
import { useProctor } from "./useProctor";
import { ProctorFloatingPanel } from "./ProctorFloatingPanel";
import {
  VibeStyleAnomalyOverlay,
  deriveActiveAnomaly,
} from "./VibeStyleAnomalyOverlay";
import { ShieldCheck } from "lucide-react";

const PREF_KEY = "swadhyaya-proctoring-default";
const CONSENT_KEY = "swadhyaya-proctoring-consent";

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
  const [, forceTick] = useState(0);

  useEffect(() => setMounted(true), []);

  // 1-Hz tick for the panel's live timer.
  useEffect(() => {
    if (!enabled) return;
    const t = window.setInterval(() => forceTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [enabled]);

  // ───────────────────────────────────────────────────────────────────
  // Live state: enabled when env is ON, user picked "always", AND they
  // accepted the ethics consent. Mounted in layout, so first render
  // happens before the consent modal closes; the panel stays hidden
  // until acceptance is on file.
  // ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isProctoringEnabled()) return;
    const refresh = () => {
      const pref = readPref();
      const consented = hasConsented();
      const active = pref === "always" && consented;
      if (active && !attempt) {
        getOrCreateSiteSession();
      }
      if (!active && attempt) {
        endSiteSession("completed");
        setAttempt(null);
      }
      setEnabled(active);
      if (active) {
        const sessions = listAttempts().filter(
          (a) => a.conceptId === "_session" && a.status === "active",
        );
        setAttempt(sessions[0] ?? null);
      }
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key && (e.key === PREF_KEY || e.key === CONSENT_KEY)) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("swadhyaya:proctor-consent", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("swadhyaya:proctor-consent", onCustom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ───────────────────────────────────────────────────────────────────
  // Camera (always-mounted so the panel can show the live feed, but
  // only started when enabled). Cleanup on unmount.
  // ───────────────────────────────────────────────────────────────────
  const camera = useCamera({ audio: true, autostart: enabled });

  // ───────────────────────────────────────────────────────────────────
  // Face detection — fires `no_face` / `multiple_faces` anomalies into
  // the live session's violation log.
  // ───────────────────────────────────────────────────────────────────
  const refreshAttempt = useCallback(() => {
    if (!attempt) return;
    const sessions = listAttempts().filter(
      (a) => a.conceptId === "_session" && a.status === "active",
    );
    setAttempt(sessions[0] ?? null);
  }, [attempt]);

  const { isReady: faceReady } = useFaceDetection({
    videoRef: camera.videoRef,
    enabled,
    onAnomaly: (anomaly) => {
      if (!attempt) return;
      // Debounce per type (5 s)
      const recent = attempt.violations.find(
        (v) => v.type === anomaly.type && Date.now() - v.timestamp < 5000,
      );
      if (recent) return;
      // Capture a JPEG snapshot of what the camera saw — persisted
      // alongside the violation in localStorage so the admin can
      // see what triggered the alert (will be uploaded to a server
      // later via /api/proctor/evidence).
      const snapshot = camera.captureFrame();
      const input: ViolationInput = {
        type: anomaly.type,
        severity: anomaly.severity,
        context: snapshot
          ? `snapshot captured (${snapshot.length} chars)`
          : "no camera frame",
        snapshot: snapshot ?? undefined,
      };
      logViolation(attempt.id, input);
      refreshAttempt();
    },
    onFaceCount: (count) => setFaceCount(count),
  });

  // ───────────────────────────────────────────────────────────────────
  // Standard listeners (focus / tab / contextmenu / copy / paste / cut
  // / devtools / long-idle / heartbeat) — the same useProctor hook
  // the test tab uses, but aimed at the site-wide session.
  // ───────────────────────────────────────────────────────────────────
  useProctor({
    attempt,
    onViolation: () => refreshAttempt(),
  });

  // ───────────────────────────────────────────────────────────────────
  // Cleanup — when the user toggles OFF the proctoring preference we
  // close the session cleanly.
  // ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (!enabled) return;
      // Don't end the session on every unmount — the user may navigate
      // between pages; end only when the layout unmounts cleanly.
    };
  }, [enabled]);

  // Derive the "current anomaly" for the Vibe-style overlay — the
  // most recent face-presence violation (no_face / multiple_faces)
  // within the last 5 seconds. Older violations are dismissed.
  // Keep BEFORE the early return so React's rules-of-hooks stay sane.
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
        cameraError={camera.error}
        faceCount={faceCount}
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

// Used by the GlobalProctorBanner when the student clicks
// "I Accept" on the ethics consent: tells the SiteProctorController
// to enable, and writes the consent record.
export function acceptSiteProctoring() {
  markConsented();
  window.dispatchEvent(new CustomEvent("swadhyaya:proctor-consent"));
}

export function declineSiteProctoring() {
  // Recorded so the user is not prompted again.
  try {
    window.localStorage.setItem(CONSENT_KEY, "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("swadhyaya:proctor-consent"));
}

// Re-export so callers don't need to know the underlying module path.
export { ShieldCheck };
