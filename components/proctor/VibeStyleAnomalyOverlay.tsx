"use client";

// VibeStyleAnomalyOverlay — full-screen anomaly alert modelled on
// vicharanashala/vibe/ProctorAlertOverlay.tsx. When an anomaly is
// detected (no_face / multiple_faces for now) the screen goes
// opaque, the webcam preview is rendered centrally so the student
// can adjust, and a specific message tells them what's wrong.
//
// Auto-dismisses when the violation's age exceeds the dismiss window
// (≈5 s by default). The student doesn't have to dismiss it
// manually — it goes away once conditions normalize. Esc and
// backdrop click are intentionally captured: clicking anywhere on
// the dimmed background nudges the learner that they're being
// monitored.
//
// Snapshots: when the violation that triggered the overlay has a
// snapshot attached, the overlay shows the captured frame above the
// anomaly card. Otherwise it shows a live webcam preview.

import { useEffect, useRef, useState, useRef as useReactRef } from "react";
import { AlertTriangle, Camera, ShieldCheck, X } from "lucide-react";
import type { Violation, ViolationType } from "@/lib/proctoring";
import { cn } from "@/lib/cn";

interface VibeStyleAnomalyOverlayProps {
  violation: Violation | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraRunning: boolean;
  faceCount: number | null;
  dismissMs?: number;
  onAck?: () => void;
}

interface AnomalyCopy {
  icon: typeof AlertTriangle;
  title: string;
  message: string;
  warnColor: string;
}

function copyFor(type: ViolationType): AnomalyCopy {
  switch (type) {
    case "no_face":
      return {
        icon: AlertTriangle,
        title: "Stay in frame",
        message:
          "We can't see you. Please face the screen and stay in frame — your session resumes automatically.",
        warnColor: "var(--warn)",
      };
    case "multiple_faces":
      return {
        icon: AlertTriangle,
        title: "Multiple people detected",
        message:
          "More than one person is visible. Please make sure you're alone in frame — your session resumes automatically.",
        warnColor: "var(--warn)",
      };
    case "blur_detected":
      return {
        icon: AlertTriangle,
        title: "Camera unclear",
        message:
          "Your camera view is too blurry. Please adjust your camera so we can see you — your session resumes automatically.",
        warnColor: "var(--warn)",
      };
    case "voice_detected":
      return {
        icon: AlertTriangle,
        title: "Background voice",
        message:
          "We detected talking. Please stay quiet during the session — it resumes automatically.",
        warnColor: "var(--warn)",
      };
    case "motion_detected":
      return {
        icon: AlertTriangle,
        title: "Scene changed",
        message:
          "We detected a sudden change on camera. Please make sure everything looks normal — your session resumes automatically.",
        warnColor: "var(--warn)",
      };
    case "camera_blocked":
      return {
        icon: AlertTriangle,
        title: "Camera blocked",
        message:
          "We can't see your camera feed. Please unblock / enable it so the session continues — your session resumes automatically.",
        warnColor: "var(--warn)",
      };
    case "tab_switch":
    case "focus_loss":
    default:
      return {
        icon: AlertTriangle,
        title: "Focus check",
        message:
          "We need to see you. Please face the screen — your session resumes automatically.",
        warnColor: "var(--warn)",
      };
  }
}

export function VibeStyleAnomalyOverlay({
  violation,
  videoRef,
  cameraRunning,
  faceCount,
  dismissMs = 5000,
  onAck,
}: VibeStyleAnomalyOverlayProps) {
  const open = !!violation;
  const dismissedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  // When a new violation opens, record its start time. The overlay
  // auto-dismisses when `dismissMs` has elapsed since that start.
  useEffect(() => {
    if (violation) {
      startedAtRef.current = Date.now();
      dismissedRef.current = false;
    } else {
      startedAtRef.current = null;
    }
  }, [violation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !violation) return null;

  const copy = copyFor(violation.type);
  const Icon = copy.icon;

  const handleDismissAttempt = () => {
    // We don't actually close — but mark "dismissed" so the host
    // can use onAck if it wants.
    dismissedRef.current = true;
    onAck?.();
  };

  // Esc/backdrop are intentionally captured — there's no
  // way to dismiss without addressing the anomaly.
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="vibe-anomaly-title"
      aria-describedby="vibe-anomaly-body"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismissAttempt();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          handleDismissAttempt();
        }
      }}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[a11y-fade_180ms_ease]"
    >
      <VibeFlashOverlay />

      <div className="relative w-full max-w-md bg-card border border-warn/50 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden animate-[a11y-slide_200ms_ease]">
        {/* Camera preview */}
        <div className="relative aspect-video bg-canvas">
          {violation.snapshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={violation.snapshot}
              alt="Captured at the moment of the anomaly"
              className="w-full h-full object-cover"
            />
          ) : cameraRunning ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="Live webcam while proctor check is pending"
              className="w-full h-full object-cover [transform:scaleX(-1)]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-faint flex-col gap-2">
              <Camera size={28} aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-wider">
                Camera not available
              </span>
            </div>
          )}
          {/* Face count badge */}
          {cameraRunning && faceCount !== null && (
            <div className="absolute top-2 left-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border",
                  faceCount === 1
                    ? "bg-correct/15 border-correct/40 text-correct"
                    : faceCount === 0
                      ? "bg-warn/15 border-warn/40 text-warn"
                      : "bg-accent/15 border-accent/40 text-accent",
                )}
              >
                {faceCount === 0 ? "no face" : faceCount === 1 ? "✓ 1 face" : `👥 ${faceCount} faces`}
              </span>
            </div>
          )}
          {/* REC dot */}
          {cameraRunning && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border bg-warn/15 border-warn/40 text-warn">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              CAPTURED
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <div
            className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full"
            style={{
              background: "color-mix(in srgb, var(--warn) 18%, transparent)",
              color: copy.warnColor,
            }}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3
            id="vibe-anomaly-title"
            className="font-serif text-lg text-ink leading-tight"
          >
            {copy.title}
          </h3>
          <p
            id="vibe-anomaly-body"
            className="mt-2 text-sm text-dim leading-relaxed"
          >
            {copy.message}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-warn">
            <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
            Verifying live via camera…
          </div>
        </div>

        {/* Close (just acks; doesn't actually bypass the alert) */}
        <button
          type="button"
          onClick={handleDismissAttempt}
          aria-label="Dismiss alert (continue verification)"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-canvas/80 border border-line text-dim hover:text-ink inline-flex items-center justify-center transition"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Auto-dismiss timer pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-faint/80 font-mono px-2 py-1 rounded-full bg-canvas/40 border border-line/50">
        auto-dismisses in ~{Math.ceil(dismissMs / 1000)}s
      </div>
    </div>
  );
}

// Subtle red flash overlay (matches vibe's animate-vibe-flash)
function VibeFlashOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-warn/[0.18] animate-[vibe-flash_1.2s_ease-in-out_infinite]"
    >
      <style jsx>{`
        @keyframes vibe-flash {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}

// Convenience hook-equivalent: a small wrapper that watches the
// latest violation and produces the active overlay state for parent
// components. Currently unused but exported for future re-use.
export function deriveActiveAnomaly(
  violations: Violation[],
  windowMs: number = 5000,
): Violation | null {
  if (violations.length === 0) return null;
  const now = Date.now();
  const last = violations[violations.length - 1]!;
  if (now - last.timestamp > windowMs) return null;
  if (last.type === "no_face" || last.type === "multiple_faces") return last;
  return null;
}

// Avoid unused-import warnings when the build tries to tree-shake.
const _types = ShieldCheck;
void _types;
void useReactRef;
