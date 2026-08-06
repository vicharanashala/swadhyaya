"use client";

// ProctorConsentModal — Vibe-style centered modal popup that fires
// before a proctored attempt starts. Replaces the inline "consent
// card" with a proper dialog that demands explicit consent.
//
// Behavior:
//   • Renders only while isOpen=true; closes via "I consent" or
//     "Take test without proctoring" (the latter skips monitoring).
//   • Backdrop click is captured (NOT dismissable by accident — proctoring
//     is a deliberate choice).
//   • Body summarises what gets recorded vs NOT recorded (mirror of what
//     the old inline card showed, formatted for a modal).
//   • Pressing Escape shows a confirm-discard prompt rather than
//     silently closing (no accidental skip).

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ProctorConsentModalProps {
  isOpen: boolean;
  conceptId: string;
  onConsent: () => void;
  onSkip: () => void;
  /** When true, the "I consent" action also writes the global
   *  preference 'swadhyaya-proctoring-default' = 'always'. Used when
   *  the user has selected "ask each time" globally — the modal stays
   *  but tapping consent remembers "always" on this browser. */
  lockInOnConsent?: boolean;
}

const TRACKED_LIST: { icon: string; label: string }[] = [
  { icon: "⏱", label: "Window/tab focus (when the page loses focus)" },
  { icon: "🖱", label: "Right-click, copy, paste, cut" },
  { icon: "💤", label: "Idle time longer than 5 minutes" },
  { icon: "🛠", label: "DevTools open (best-effort detection)" },
  { icon: "⌛", label: "Test start/end time + duration" },
];

const UNTRACKED_LIST: { icon: string; label: string }[] = [
  { icon: "📷", label: "Camera / microphone (always OFF)" },
  { icon: "⌨", label: "Keystrokes or the answer you type" },
  { icon: "🖼", label: "Screenshots or screen-recording" },
  { icon: "🌐", label: "Any web activity outside this tab" },
  { icon: "👤", label: "Your identity — data stays in this browser only" },
];

export function ProctorConsentModal({
  isOpen,
  conceptId,
  onConsent,
  onSkip,
  lockInOnConsent,
}: ProctorConsentModalProps) {
  const [showEscapeWarn, setShowEscapeWarn] = useState(false);
  const consentRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState<"tracked" | "untracked" | null>(
    "tracked",
  );

  // When the modal opens, focus the primary consent action.
  useEffect(() => {
    if (isOpen) {
      setShowEscapeWarn(false);
      const t = window.setTimeout(() => consentRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  // Escape handling — DON'T silently close. Show a confirm-discard
  // banner if the user tries.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowEscapeWarn(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proctor-consent-title"
      aria-describedby="proctor-consent-body"
      onClick={(e) => {
        // Backdrop click — trap; don't dismiss accidentally.
        if (e.target === e.currentTarget) {
          setShowEscapeWarn(true);
        }
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-[a11y-fade_180ms_ease]"
    >

      <div className="w-full max-w-lg bg-card border border-line rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55)] overflow-hidden animate-[a11y-slide_200ms_ease] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center">
            <ShieldCheck size={20} className="text-accent" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="proctor-consent-title"
              className="font-serif text-xl text-ink leading-tight"
            >
              Proctored attempt for{" "}
              <span className="text-accent">{conceptId}</span>
            </h2>
            <p className="text-xs text-faint mt-0.5">
              Vibe-style opt-in. Click below to start.
            </p>
          </div>
        </div>

        {/* Body — scrollable so the policy stays readable on small screens */}
        <div
          id="proctor-consent-body"
          className="px-6 py-4 overflow-y-auto text-sm leading-relaxed text-dim space-y-4"
        >
          <p>
            You can take the test <strong className="text-ink">with</strong> or{" "}
            <strong className="text-ink">without</strong> proctoring. Proctoring is
            fully opt-in &mdash; we never start monitoring unless you press{" "}
            <em>I consent</em> below.
          </p>

          <div>
            <button
              type="button"
              onClick={() => setExpanded((v) => (v === "tracked" ? null : "tracked"))}
              className="w-full flex items-center justify-between text-left text-xs font-medium text-ink hover:text-accent transition"
              aria-expanded={expanded === "tracked"}
            >
              <span className="inline-flex items-center gap-1.5">
                <Eye size={12} aria-hidden="true" />
                What gets recorded
              </span>
              {expanded === "tracked" ? (
                <ChevronUp size={14} aria-hidden="true" />
              ) : (
                <ChevronDown size={14} aria-hidden="true" />
              )}
            </button>
            {expanded === "tracked" && (
              <ul className="mt-2 grid gap-1 text-xs">
                {TRACKED_LIST.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-canvas/60 border border-line/40"
                  >
                    <span aria-hidden="true" className="text-accent shrink-0">
                      {row.icon}
                    </span>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() =>
                setExpanded((v) => (v === "untracked" ? null : "untracked"))
              }
              className="w-full flex items-center justify-between text-left text-xs font-medium text-ink hover:text-accent transition"
              aria-expanded={expanded === "untracked"}
            >
              <span className="inline-flex items-center gap-1.5">
                <EyeOff size={12} aria-hidden="true" />
                What is NOT recorded
              </span>
              {expanded === "untracked" ? (
                <ChevronUp size={14} aria-hidden="true" />
              ) : (
                <ChevronDown size={14} aria-hidden="true" />
              )}
            </button>
            {expanded === "untracked" && (
              <ul className="mt-2 grid gap-1 text-xs">
                {UNTRACKED_LIST.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-canvas/60 border border-line/40"
                  >
                    <span aria-hidden="true" className="text-faint shrink-0">
                      {row.icon}
                    </span>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-[11px] text-faint border-t border-line pt-3 leading-relaxed">
            <strong className="text-dim">Why opt in?</strong> A proctored attempt
            gives the same browser visibility a teacher would have in a
            classroom. Without it, your attempt is just local &mdash; no one
            on the network can see it.
          </p>

          {showEscapeWarn && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-warn/10 border border-warn/40 rounded p-2.5 text-[11px] text-warn"
            >
              <AlertTriangle
                size={14}
                aria-hidden="true"
                className="shrink-0 mt-0.5"
              />
              <span>
                Pick an option below &mdash; the modal won&apos;t close on its
                own.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-line bg-elev/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            ref={consentRef}
            type="button"
            onClick={() => {
              // Persist the user's "always proctor" choice so the next
              // Test-tab visit doesn't ask again. The "Skip" path
              // doesn't write — the user can still flip to "never" via
              // the bottom-left global pill.
              if (lockInOnConsent) {
                try {
                  window.localStorage.setItem(
                    "swadhyaya-proctoring-default",
                    "always",
                  );
                } catch {
                  /* ignore */
                }
              }
              onConsent();
            }}
            className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-canvas font-medium inline-flex items-center justify-center gap-1.5 hover:bg-accent/90 transition"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            I consent — start proctored attempt
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 rounded-lg border border-line text-dim hover:text-ink hover:bg-elev transition inline-flex items-center justify-center gap-1.5"
          >
            <ShieldX size={14} aria-hidden="true" />
            Take test without proctoring
          </button>
        </div>
      </div>
    </div>
  );
}
