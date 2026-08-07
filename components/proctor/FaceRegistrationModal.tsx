"use client";

// FaceRegistrationModal — the enrolment step for identity verification,
// modelled on vibe's FaceRegistrationModal but reduced from ~900 lines
// to the part that matters: capture a few frames, average the
// descriptors, store them locally.
//
// Averaging several samples is what makes the reference stable — a
// single frame bakes in whatever the lighting and head angle happened to
// be at that instant, and every later comparison inherits that bias.
//
// The descriptor never leaves the device (see useFaceRecognition), so
// this modal is explicit that enrolment is local and skippable.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { useCamera } from "./useCamera";
import {
  clearFaceRegistration,
  computeDescriptor,
  saveFaceRegistration,
} from "./useFaceRecognition";

const SAMPLES = 5;
const SAMPLE_GAP_MS = 700;

interface FaceRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}

type Phase = "idle" | "capturing" | "done" | "error";

export function FaceRegistrationModal({
  open,
  onClose,
  onRegistered,
}: FaceRegistrationModalProps) {
  const camera = useCamera({ autostart: false, context: "face registration" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [captured, setCaptured] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (open) {
      cancelRef.current = false;
      void camera.start();
    } else {
      cancelRef.current = true;
      camera.stop();
      setPhase("idle");
      setCaptured(0);
      setMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const register = useCallback(async () => {
    const video = camera.videoRef.current;
    if (!video) return;

    setPhase("capturing");
    setCaptured(0);
    setMessage(null);

    const descriptors: Float32Array[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      if (cancelRef.current) return;
      try {
        const d = await computeDescriptor(video);
        if (d) {
          descriptors.push(d);
          setCaptured(descriptors.length);
        }
      } catch {
        setPhase("error");
        setMessage(
          "Could not load the identity models. Run `pnpm run setup:models` and try again.",
        );
        return;
      }
      await new Promise((r) => setTimeout(r, SAMPLE_GAP_MS));
    }

    if (descriptors.length < 3) {
      setPhase("error");
      setMessage(
        `Only captured ${descriptors.length} of ${SAMPLES} readings. Make sure your face is clearly lit and centred, then try again.`,
      );
      return;
    }

    // Element-wise mean across samples.
    const mean = new Float32Array(128);
    for (const d of descriptors) {
      for (let i = 0; i < 128; i++) mean[i]! += d[i]!;
    }
    for (let i = 0; i < 128; i++) mean[i]! /= descriptors.length;

    saveFaceRegistration(mean);
    setPhase("done");
    setMessage(`Registered from ${descriptors.length} readings.`);
    onRegistered?.();
  }, [camera.videoRef, onRegistered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="face-reg-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-dim" />
            <div>
              <h2 id="face-reg-title" className="font-serif text-lg text-ink">
                Register your face
              </h2>
              <p className="mt-1 text-sm text-dim">
                Lets proctoring tell you apart from someone else sitting in
                your place.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-dim transition hover:bg-line/40 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="relative overflow-hidden rounded-xl border border-line bg-ink/5">
            <video
              ref={camera.videoRef}
              className="h-56 w-full scale-x-[-1] object-cover"
              muted
              playsInline
            />
            {phase === "capturing" && (
              <div className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 text-center text-xs text-paper">
                Hold still — {captured}/{SAMPLES} readings
              </div>
            )}
          </div>

          {camera.error && (
            <p className="mt-3 text-sm text-red-600">{camera.error}</p>
          )}
          {message && (
            <p
              className={`mt-3 text-sm ${
                phase === "error" ? "text-red-600" : "text-dim"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-4 rounded-lg bg-line/20 px-3 py-2 text-xs leading-relaxed text-dim">
            Your face is converted to 128 numbers and stored{" "}
            <strong className="text-ink">only in this browser</strong>. The
            image is never uploaded, and the numbers are never sent to the
            server — proctoring reports only whether a later frame matched.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={() => {
              clearFaceRegistration();
              setPhase("idle");
              setCaptured(0);
              setMessage("Registration cleared.");
            }}
            className="rounded-lg px-3 py-2 text-sm text-dim transition hover:text-ink"
          >
            Clear registration
          </button>
          {phase === "done" ? (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90"
            >
              <Check className="h-4 w-4" />
              Done
            </button>
          ) : (
            <button
              onClick={() => void register()}
              disabled={phase === "capturing" || !camera.isRunning}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
            >
              {phase === "capturing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {phase === "capturing" ? "Capturing…" : "Register face"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
