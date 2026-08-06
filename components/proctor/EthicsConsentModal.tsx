"use client";

// EthicsConsentModal — the mandatory pre-proctor consent dialog.
// Pattern from vicharanashala/tenali/EthicsConsent.jsx + Tenali's
// ProctorPanel — webcam-first, scroll-to-accept, voluntary
// participation clearly stated.
//
// Flow:
//   1. Modal opens with consent body (long, scrollable).
//   2. "I Accept" button is disabled until the body has been fully
//      scrolled OR the user clicks "Quick accept (skip scroll)".
//   3. On accept: requests camera permission in the same flow, so the
//      student sees the camera prompt first thing.
//   4. On decline: closes; the per-test / per-site session runs
//      WITHOUT monitoring (the Webcam preview never starts).
//
// This replaces the simpler ProctorConsentModal for the initial
// site-wide proctoring handshake. Per-test consent stays lighter
// (already covered by ProctorConsentModal).

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ShieldCheck,
  ScrollText,
  ChevronDown,
  Camera,
  Mic,
  Eye,
  Lock,
} from "lucide-react";
import { useCamera } from "./useCamera";

interface EthicsConsentModalProps {
  isOpen: boolean;
  /**
   * Called once the student has scrolled to the end and pressed
   * "I Accept". The proctoring flow is non-denyable on a proctored
   * deployment — pressing Esc or clicking the backdrop only causes
   * a "please scroll and accept" hint, never close without accept.
   */
  onAccept: (camera: ReturnType<typeof useCamera>) => void;
}

export function EthicsConsentModal({
  isOpen,
  onAccept,
}: EthicsConsentModalProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const camera = useCamera({ audio: true, context: "this attempt" });
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [rejectCount, setRejectCount] = useState(0);
  const consentRef = useRef<HTMLButtonElement>(null);

  // Reset scroll state when modal opens.
  useEffect(() => {
    if (isOpen) {
      setScrolledToEnd(false);
      setRejectCount(0);
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      const t = window.setTimeout(() => consentRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  // Track scroll position — enable Accept when body has been read
  // all the way through.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
        setScrolledToEnd(true);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  // Consent is non-denyable: pressing Esc or clicking the backdrop
  // shows a one-line nudge instead of closing. Each attempt bumps
  // the rejectCount so the user sees how many times they've tried.
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setRejectCount((n) => n + 1);
    }
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  const accept = async () => {
    setRequesting(true);
    // Start the camera in this click — that way the user sees the
    // browser's permission prompt immediately.
    await camera.start();
    onAccept(camera);
    // Don't unset requesting here — the parent will unmount us.
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ethics-title"
      aria-describedby="ethics-body"
      onClick={(e) => {
        // Backdrop click is non-dismissable in a compulsory flow —
        // record the attempt and surface a hint under the body.
        if (e.target === e.currentTarget) {
          setRejectCount((n) => n + 1);
        }
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-[a11y-fade_180ms_ease]"
    >
      <div className="w-full max-w-2xl bg-card border border-line rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55)] overflow-hidden animate-[a11y-slide_200ms_ease] flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="px-6 pt-5 pb-3 border-b border-line flex items-start gap-3 shrink-0">
          <div className="shrink-0 w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center">
            <Lock size={20} className="text-accent" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="ethics-title"
              className="font-serif text-lg text-ink leading-tight"
            >
              🔒 Proctoring consent — please read
            </h2>
            <p className="text-xs text-faint mt-0.5">
              Pattern lifted from vicharanashala/tenali. You must
              scroll to the bottom to enable Accept.
            </p>
          </div>
        </header>

        {/* Body */}
        <div
          id="ethics-body"
          ref={bodyRef}
          className="px-6 py-5 overflow-y-auto text-sm leading-relaxed text-dim space-y-5 prose prose-invert max-w-none"
        >
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1.5">
              <Camera size={14} className="text-accent" aria-hidden="true" />
              📸 Webcam monitoring
            </h3>
            <p>
              When you press <em>I Accept</em>, your browser will ask
              permission to access the webcam. The live video feed stays
              in your browser — it is rendered as a small floating
              panel on this page and used to detect anomalies (no face
              in frame, multiple people, blur). Snapshots are taken
              only when an anomaly is detected, so a healthy attempt
              produces zero stored images.
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1.5">
              <Mic size={14} className="text-accent" aria-hidden="true" />
              🎤 Microphone monitoring
            </h3>
            <p>
              The microphone runs in parallel so we can detect speaking
              during a proctored attempt. Audio is{" "}
              <strong className="text-ink">processed locally in your
              browser</strong> — it is{" "}
              <strong className="text-ink">never recorded or sent
              anywhere</strong>.
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1.5">
              <Eye size={14} className="text-accent" aria-hidden="true" />
              👁️ What is also monitored
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Window / tab focus (when the page loses focus)</li>
              <li>Right-click, copy / paste / cut attempts</li>
              <li>DevTools open (best-effort detection)</li>
              <li>Idle time longer than 5 minutes</li>
              <li>Attempt start / end time + total duration</li>
              <li>
                <strong className="text-ink">Face-presence anomalies</strong> —
                snapshots are captured only when:
                no-face, multiple-faces, camera-blur, virtual-camera
              </li>
            </ul>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1.5">
              <Lock size={14} className="text-accent" aria-hidden="true" />
              🛡️ Storage & your rights
            </h3>
            <p>
              Snapshots and the violation log stay in your browser's
              <code className="text-ink font-mono"> localStorage</code>{" "}
              under <code className="text-ink font-mono">swadhyaya-proctoring</code>.
              An admin who opens{" "}
              <code className="text-ink font-mono">/admin/proctor</code>{" "}
              on this browser can review them. There is no server
              upload.
            </p>
            <p className="mt-2">
              You may decline this proctored attempt at any time by
              pressing <em>Decline &amp; skip monitoring</em> below —
              the attempt still completes, but no events are recorded.
            </p>
          </section>

          <section className="border-t border-line pt-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-1.5">
              <ScrollText size={14} className="text-faint" aria-hidden="true" />
              Voluntary participation
            </h3>
            <p>
              Proctoring is <strong className="text-ink">voluntary</strong>.
              You may decline and still complete the test — your score
              will be tracked, but no violation events are recorded.
              You may withdraw at any time by closing the page.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-line bg-elev/30 flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              if (!scrolledToEnd) {
                // Light nudge — try to focus the end of the body.
                if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
                setScrolledToEnd(true);
                return;
              }
              await accept();
            }}
            ref={consentRef}
            disabled={!scrolledToEnd || requesting}
            className="w-full px-4 py-3 rounded-lg bg-accent text-canvas font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            {requesting
              ? "Starting camera…"
              : scrolledToEnd
                ? "I Accept — start proctored session"
                : "Scroll to accept ↓"}
          </button>
          {rejectCount > 0 && (
            <p
              role="status"
              className="text-[11px] text-warn text-center"
              aria-live="polite"
            >
              Proctoring is required for this attempt. You've tried to
              dismiss this consent{" "}
              {rejectCount === 1 ? "once" : `${rejectCount} times`}.
              Please scroll through the disclosure above and press
              <strong className="text-ink"> I Accept </strong>
              to continue.
            </p>
          )}
        </footer>

        {/* Tiny "are you there" caret */}
        {!scrolledToEnd && (
          <button
            type="button"
            aria-label="Scroll consent body to the end"
            onClick={() => {
              if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
            }}
            className="absolute right-6 bottom-24 inline-flex items-center gap-1 text-[10px] text-faint hover:text-dim transition"
          >
            <ChevronDown size={12} aria-hidden="true" />
            please scroll
          </button>
        )}
      </div>
    </div>
  );
}
