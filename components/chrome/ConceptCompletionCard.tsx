"use client";

// ConceptCompletionCard — replaces the inline result panel in
// ConceptPageClient. Two layouts:
//
//   • passed=true   → amber badge, gradient ring, confetti, next-story CTA
//   • passed=false  → warn ring, retry CTA
//
// Visual notes (Vibe-influenced):
//   • Big circular score ring with a gradient stroke
//   • Number is mono-spaced so the digits line up cleanly
//   • Confetti is themed (warm-brown / orange / gold / cream) and only
//     fires on pass.
//   • Live progress hint under the ring during the brief "checked" animation
//     so the score feels earned rather than stamped on the page.
//
// The host controls confetti via the optional prop — by default we don't
// pull in canvas-confetti here (the story page already calls it). The
// `celebrateWith()` callback is fired once on pass for the host to play
// the confetti.

import Link from "next/link";
import { Sparkles, RotateCcw, ArrowRight, Lock, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface NextConcept {
  id: string;
  title: string;
  short: string;
  phase: number;
  xp: number;
}

const PASS_THRESHOLD = 0.7;

export function ConceptCompletionCard({
  correct,
  total,
  needed,
  passed,
  nextConcept,
  nextUnlocked,
  alreadyDone,
  onCelebrate,
  onContinue,
  onRetake,
  onMarkCompleteOnly,
}: {
  correct: number;
  total: number;
  needed: number;
  passed: boolean;
  nextConcept: NextConcept | null;
  nextUnlocked: boolean;
  alreadyDone: boolean;
  onCelebrate: () => void;
  onContinue: () => void;
  onRetake: () => void;
  onMarkCompleteOnly: () => void;
}) {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  // Ring stroke-dasharray trick. r=54 → circumference ≈ 339.29.
  const r = 54;
  const C = 2 * Math.PI * r;
  const dashOffset = C * (1 - pct / 100);

  // Fire confetti the first time `passed` flips to true.
  if (passed && !alreadyDone) {
    onCelebrate();
  }

  return (
    <div
      className={cn(
        "mt-6 rounded-2xl p-6 sm:p-8 text-center transition",
        passed
          ? "bg-gradient-to-b from-accent/15 via-accent/[0.07] to-card border border-accent/40 shadow-[0_0_24px_-12px_var(--accent)]"
          : "bg-warn/[0.08] border border-warn/40",
      )}
      role="status"
      aria-live="polite"
    >
      {/* Score ring */}
      <div className="relative inline-block">
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          aria-hidden="true"
          className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
        >
          <defs>
            <linearGradient
              id={passed ? "score-ring-pass" : "score-ring-fail"}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              {passed ? (
                <>
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="#ffb300" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="var(--warn)" />
                  <stop offset="100%" stopColor="#e8864a" />
                </>
              )}
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="var(--bg-elev)"
            strokeWidth="10"
          />
          {/* Progress arc — animated via CSS keyframes (see globals) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={`url(#${passed ? "score-ring-pass" : "score-ring-fail"})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            className="score-ring-progress"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={cn(
              "font-serif text-3xl tabular-nums",
              passed ? "text-accent" : "text-warn",
            )}
          >
            {Math.round(pct)}
            <span className="text-base text-faint">%</span>
          </div>
          <div className="text-[10px] text-faint uppercase tracking-wider mt-0.5">
            {correct}/{total}
          </div>
        </div>
      </div>

      {/* Heading */}
      <h3 className="mt-5 font-serif text-2xl text-ink">
        {passed
          ? alreadyDone
            ? "Already locked in"
            : "Verified — locked in"
          : "Below the 70% threshold"}
      </h3>
      <p className="text-sm text-dim mt-2 max-w-md mx-auto">
        {passed ? (
          <>
            You scored{" "}
            <span
              className={cn(
                "font-mono font-semibold",
                alreadyDone ? "text-faint" : "text-accent",
              )}
            >
              {correct}/{total}
            </span>{" "}
            — {alreadyDone
              ? "this story is already complete in your journey."
              : "this concept is now yours."}
          </>
        ) : (
          <>
            You scored{" "}
            <span className="font-mono font-semibold text-warn">
              {correct}/{total}
            </span>{" "}
            ({Math.round(pct)}%) — need at least {needed}/{total} (
            {Math.round(PASS_THRESHOLD * 100)}%) to continue. Re-study the
            story, play with the playground, then retake.
          </>
        )}
      </p>

      {/* Pass — next-story CTA */}
      {passed && nextConcept && (
        <div className="mt-5 mx-auto max-w-md">
          <div className="text-[10px] text-faint uppercase tracking-widest mb-1.5">
            Next story
          </div>
          <div
            className="rounded-lg border border-line bg-card/60 px-4 py-3 text-left"
            aria-label="Next concept preview"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                {nextConcept.id}
              </span>
              <span className="text-[10px] text-faint">
                +{nextConcept.xp} XP
              </span>
              {!nextUnlocked && (
                <span className="ml-auto text-[10px] text-faint inline-flex items-center gap-1">
                  <Lock size={10} aria-hidden="true" /> preview only
                </span>
              )}
              {nextUnlocked && (
                <span className="ml-auto text-[10px] text-correct inline-flex items-center gap-1">
                  <Check size={10} aria-hidden="true" /> unlocked
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-ink">
              {nextConcept.title}
            </div>
            <div className="text-xs text-dim mt-0.5">{nextConcept.short}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {passed ? (
          <>
            {nextConcept &&
              (alreadyDone ? (
                <Link
                  href={`/learn/${nextConcept.id}`}
                  className={cn(
                    "px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition text-base",
                    nextUnlocked
                      ? "bg-ink text-canvas hover:opacity-90 shadow-lg"
                      : "border border-line bg-elev/40 text-dim hover:bg-elev",
                  )}
                >
                  {nextUnlocked
                    ? "Continue to next story"
                    : "Preview next story"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <button
                  onClick={onContinue}
                  className="px-6 py-3 rounded-lg bg-ink text-canvas font-semibold inline-flex items-center gap-2 hover:opacity-90 transition text-base shadow-lg"
                >
                  Continue to next story
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ))}
            <button
              onClick={onMarkCompleteOnly}
              disabled={alreadyDone}
              className="px-4 py-2 rounded text-xs border border-line/50 text-dim hover:bg-elev disabled:opacity-40 transition"
            >
              {alreadyDone ? "Already complete" : "Mark complete only"}
            </button>
          </>
        ) : (
          <button
            onClick={onRetake}
            className="px-6 py-3 rounded-lg bg-ink text-canvas font-semibold inline-flex items-center gap-2 hover:opacity-90 transition text-base shadow-lg"
          >
            Re-study the story & retake
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Curriculum complete */}
      {passed && !nextConcept && (
        <p className="mt-4 text-xs text-accent font-medium inline-flex items-center gap-1.5">
          <Sparkles size={12} aria-hidden="true" />
          You finished the entire curriculum.
        </p>
      )}
    </div>
  );
}

export { PASS_THRESHOLD };
