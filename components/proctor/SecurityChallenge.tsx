"use client";

// SecurityChallenge — ported from tenali's SecurityChallenge.jsx.
//
// Every 3–5 minutes the proctoring system fires a small interactive
// challenge. Pass and the session continues. Fail — wrong answer,
// timeout — and the attempt is logged as a violation with the same
// severity as a tab switch.
//
// Three challenge types:
//   number  — type a 2-digit number
//   shape   — click the matching shape from a row
//   color   — click the matching color from a row
//
// Why: even with continuous face/blur/motion detection, a determined
// student can play a video of themselves in front of the camera and
// answer questions. A presence challenge breaks that loop — the
// interaction has to happen on the live page, with timing constraints
// that pre-recorded video can't reliably satisfy.
//
// Auto-shown on the page. The modal is dismissable only after timeout
// or answer; background dismissals don't exist.

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

interface SecurityChallengeOpts {
  enabled: boolean;
  onPass?: () => void;
  onFail?: (a: { type: "challenge_failed"; severity: number }) => void;
}

const SHAPES = ["●", "■", "▲", "◆"];
const SHAPE_NAMES: Record<string, string> = {
  "●": "circle",
  "■": "square",
  "▲": "triangle",
  "◆": "diamond",
};
const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"];
const COLOR_NAMES: Record<string, string> = {
  "#ef4444": "red",
  "#22c55e": "green",
  "#3b82f6": "blue",
  "#eab308": "yellow",
};

const ANSWER_TIMEOUT_MS = 30_000;
const INTERVAL_MIN_MS = 3 * 60_000;
const INTERVAL_JITTER_MS = 2 * 60_000;

type Challenge =
  | { type: "number"; prompt: string; answer: number }
  | { type: "shape"; prompt: string; options: string[]; answer: string }
  | {
      type: "color";
      prompt: string;
      options: string[];
      answer: string;
    };

export function SecurityChallenge({
  enabled,
  onPass,
  onFail,
}: SecurityChallengeOpts) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<"pass" | "fail" | null>(null);
  const scheduleRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const onPassRef = useRef(onPass);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onPassRef.current = onPass;
    onFailRef.current = onFail;
  });

  const fire = useCallback(() => {
    const pick = Math.random();
    let next: Challenge;
    if (pick < 0.4) {
      next = {
        type: "number",
        prompt: "Type the number shown:",
        answer: Math.floor(Math.random() * 90) + 10,
      };
    } else if (pick < 0.7) {
      const correct = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
      next = {
        type: "shape",
        prompt: `Click the ${SHAPE_NAMES[correct]}`,
        options: SHAPES,
        answer: SHAPE_NAMES[correct]!,
      };
    } else {
      const correct = COLORS[Math.floor(Math.random() * COLORS.length)]!;
      next = {
        type: "color",
        prompt: `Click the ${COLOR_NAMES[correct]}`,
        options: COLORS,
        answer: COLOR_NAMES[correct]!,
      };
    }
    setText("");
    setResult(null);
    setChallenge(next);

    timeoutRef.current = window.setTimeout(() => {
      setResult("fail");
      window.setTimeout(() => {
        setChallenge(null);
        onFailRef.current?.({ type: "challenge_failed", severity: 2 });
      }, 1200);
    }, ANSWER_TIMEOUT_MS);
  }, []);

  const schedule = useCallback(() => {
    scheduleRef.current = window.setTimeout(fire, INTERVAL_MIN_MS + Math.random() * INTERVAL_JITTER_MS);
  }, [fire]);

  useEffect(() => {
    if (!enabled) return;
    schedule();
    return () => {
      if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [enabled, schedule]);

  const submit = useCallback(
    (answer?: string) => {
      if (!challenge) return;
      const candidate = answer !== undefined ? answer : text;
      let correct = false;
      if (challenge.type === "number") {
        correct = candidate.trim() === String(challenge.answer);
      } else {
        correct = candidate.toLowerCase() === challenge.answer;
      }
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

      setResult(correct ? "pass" : "fail");
      window.setTimeout(() => {
        setChallenge(null);
        if (correct) {
          onPassRef.current?.();
          schedule();
        } else {
          onFailRef.current?.({ type: "challenge_failed", severity: 2 });
          schedule();
        }
      }, 1200);
    },
    [challenge, text, schedule],
  );

  if (!challenge) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sec-challenge-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-accent/40 bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <h2 id="sec-challenge-title" className="font-serif text-lg">
            Security check
          </h2>
        </div>

        <p className="mt-3 text-sm text-dim">
          A random prompt — pass it to continue. You have 30 seconds.
        </p>

        {challenge.type === "number" && (
          <>
            <div className="mt-5 text-center font-mono text-3xl text-ink">
              {challenge.answer}
            </div>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Type the number"
              className="mt-3 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-center font-mono text-lg text-ink outline-none focus:border-accent"
            />
            <button
              onClick={() => submit()}
              className="mt-3 w-full rounded-lg bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90"
            >
              Verify
            </button>
          </>
        )}

        {challenge.type === "shape" && (
          <div className="mt-5 grid grid-cols-4 gap-3">
            {challenge.options.map((s) => (
              <button
                key={s}
                onClick={() => submit(SHAPE_NAMES[s])}
                className="rounded-xl border border-line bg-canvas p-4 text-4xl text-ink transition hover:border-accent"
                aria-label={SHAPE_NAMES[s]}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {challenge.type === "color" && (
          <div className="mt-5 grid grid-cols-4 gap-3">
            {challenge.options.map((c) => (
              <button
                key={c}
                onClick={() => submit(COLOR_NAMES[c])}
                aria-label={COLOR_NAMES[c]}
                className="aspect-square rounded-xl border border-line transition hover:border-accent"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {result && (
          <p
            className={`mt-4 text-center text-sm ${
              result === "pass" ? "text-correct" : "text-warn"
            }`}
          >
            {result === "pass"
              ? "✓ Verified"
              : "✗ Failed — this has been recorded"}
          </p>
        )}
      </div>
    </div>
  );
}
