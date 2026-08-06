"use client";

// ProctorPanel — student-side proctoring affordance shown inside the
// Test tab. Three modes:
//
//   • consent     — centered modal popup asking the student to opt in
//   • active      — compact status pill + collapsible violation log
//   • finished    — summary card after the attempt ends (success / early)
//                   with the full violation log
//
// Honors the global per-browser default preference stored in
// localStorage under `swadhyaya-proctoring-default`:
//
//   • "always"  → skip the consent, jump straight into active mode
//   • "never"   → render nothing (the test proceeds with no monitoring)
//   • "ask"     → show the modal popup (default for first-time visitors)
//
// Renders a tiny "disabled on this deployment" notice when the env var
// is off.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Square,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  attemptDuration,
  endAttempt,
  type Attempt,
  isProctoringEnabled,
  listAttempts,
  startAttempt,
  VIOLATION_LABEL,
} from "@/lib/proctoring";
import { useProctor } from "./useProctor";
import { ProctorConsentModal } from "./ProctorConsentModal";

interface ProctorPanelProps {
  conceptId: string;
  /** Live status from the parent — when a test passes/fails, we close
   *  the attempt with `result` so the summary has a score. */
  status: "idle" | "running" | "finished";
  result?: { score: number; total: number; passed: boolean };
  /** Notified when an attempt is started so the parent can store the id. */
  onStart?: (id: string) => void;
  onEnd?: () => void;
  /** Existing attempt id to resume — e.g. after a page reload. */
  resumeAttemptId?: string | null;
}

type Mode = "consent" | "active" | "finished";

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

export function ProctorPanel({
  conceptId,
  status,
  result,
  onStart,
  onEnd,
  resumeAttemptId,
}: ProctorPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!isProctoringEnabled()) {
    return <DisabledNotice />;
  }

  return (
    <ProctorBody
      conceptId={conceptId}
      status={status}
      result={result}
      onStart={onStart}
      onEnd={onEnd}
      resumeAttemptId={resumeAttemptId}
    />
  );
}

function ProctorBody({
  conceptId,
  status,
  result,
  onStart,
  onEnd,
  resumeAttemptId,
}: ProctorPanelProps) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [mode, setMode] = useState<Mode>("consent");
  const [showLog, setShowLog] = useState(false);
  const [, forceTick] = useState(0); // 1 Hz re-render for live timer

  // Global per-browser default preference (set by GlobalProctorBanner).
  // Read once on mount; if "always" jump straight into active using
  // the existing site-wide session (or create a new one). If "never"
  // render nothing. If "ask" → show the per-test consent modal.
  const [pref, setPref] = useState<"ask" | "always" | "never">("ask");
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("swadhyaya-proctoring-default");
      const next: "ask" | "always" | "never" =
        v === "always" || v === "never" ? v : "ask";
      setPref(next);
      if (next === "always") {
        // Site-wide proctoring: look for an existing _session attempt
        // first; if none active, create the concept-specific one.
        const sessions = listAttempts().filter(
          (a) => a.conceptId === "_session" && a.status === "active",
        );
        if (sessions.length > 0) {
          setAttempt(sessions[0]!);
          setMode("active");
        } else {
          const a = startAttempt(conceptId);
          setAttempt(a);
          setMode("active");
        }
        setShowLog(false);
      }
      // "never" → render nothing.
    } catch {
      // localStorage disabled — fall back to "ask".
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume on mount if a parent passed an attempt id.
  useEffect(() => {
    if (resumeAttemptId) {
      const existing = listAttempts().find((a) => a.id === resumeAttemptId);
      if (existing && existing.status === "active") {
        setAttempt(existing);
        setMode("active");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeAttemptId]);

  // Move into "finished" mode when the parent says the test completed.
  // Site-wide sessions are NOT ended here — they're sticky until the
  // user opts out, so finishing a test only marks the attempt with a
  // result snapshot.
  useEffect(() => {
    if (status === "finished") {
      if (attempt) {
        const isSession = attempt.conceptId === "_session";
        if (isSession) {
          // Just add the result metadata; don't flip to "finished"
          // state. Site session stays open.
          try {
            const all = listAttempts();
            const idx = all.findIndex((a) => a.id === attempt.id);
            if (idx >= 0) {
              const updated: Attempt = {
                ...all[idx]!,
                result: {
                  score: result?.score ?? 0,
                  total: result?.total ?? 0,
                  passed: !!result?.passed,
                },
              };
              const store = (() => {
                try {
                  return JSON.parse(
                    window.localStorage.getItem("swadhyaya-proctoring") ||
                      '{"attempts":{}}',
                  );
                } catch {
                  return { attempts: {} };
                }
              })();
              store.attempts[attempt.id] = updated;
              window.localStorage.setItem(
                "swadhyaya-proctoring",
                JSON.stringify(store),
              );
            }
          } catch {
            /* ignore */
          }
        } else {
          const ended = endAttempt(
            attempt.id,
            result?.passed ? "completed" : "abandoned",
            result,
          );
          setAttempt(ended);
          onEnd?.();
        }
      }
      setMode("finished");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Heartbeat tick — re-render every second so the live timer updates.
  useEffect(() => {
    if (mode !== "active") return;
    const t = window.setInterval(() => forceTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [mode]);

  const { reportTest } = useProctor({
    attempt: mode === "active" ? attempt : null,
    onViolation: () => {
      // Pull the latest attempt out of localStorage so the pill + log
      // show the incrementing count without re-rendering the whole tree.
      if (!attempt) return;
      const refreshed = listAttempts().find((a) => a.id === attempt.id);
      if (refreshed) setAttempt(refreshed);
    },
  });

  const start = () => {
    // Prefer the sticky site session if one is live; otherwise
    // create a per-concept attempt.
    const sessions = listAttempts().filter(
      (a) => a.conceptId === "_session" && a.status === "active",
    );
    const a = sessions[0] ?? startAttempt(conceptId);
    setAttempt(a);
    setMode("active");
    setShowLog(false);
    onStart?.(a.id);
  };

  const endEarly = () => {
    if (!attempt) return;
    const isSession = attempt.conceptId === "_session";
    if (isSession) {
      // Site-wide session: refuse to end early from Test tab. Just
      // hand the user back to the consent modal so they can continue
      // or opt out via the pill.
      setMode("consent");
      return;
    }
    const ended = endAttempt(attempt.id, "abandoned");
    setAttempt(ended);
    setMode("finished");
    onEnd?.();
  };

  const reset = () => {
    setAttempt(null);
    setMode("consent");
    setShowLog(false);
  };

  if (pref === "never") {
    // User opted out at the site level. Render nothing.
    return null;
  }

  if (mode === "consent") {
    // Vibe-style: a centered modal popup, not a passive inline card.
    // The Test tab is hidden behind this modal until the student
    // explicitly chooses to opt-in or skip.
    //
    // If the global preference was "ask" (still default after first
    // visit), lock the consent in on tap so the next Test tab visit
    // skips the modal entirely.
    const inSessionContext =
      typeof window !== "undefined" &&
      listAttempts().some(
        (a) => a.conceptId === "_session" && a.status === "active",
      );
    return (
      <ProctorConsentModal
        isOpen
        conceptId={inSessionContext ? "_session · site-wide" : conceptId}
        onConsent={start}
        onSkip={reset}
        lockInOnConsent={pref === "ask"}
      />
    );
  }

  if (mode === "finished" && attempt) {
    return (
      <SummaryCard
        attempt={attempt}
        onReset={reset}
        onToggleLog={() => setShowLog((v) => !v)}
        showLog={showLog}
      />
    );
  }

  if (mode === "active" && attempt) {
    return (
      <ActivePill
        attempt={attempt}
        onEndEarly={endEarly}
        onToggleLog={() => setShowLog((v) => !v)}
        showLog={showLog}
        onTest={reportTest}
      />
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Active pill
// ─────────────────────────────────────────────────────────────────

function ActivePill({
  attempt,
  onEndEarly,
  onToggleLog,
  showLog,
  onTest,
}: {
  attempt: Attempt;
  onEndEarly: () => void;
  onToggleLog: () => void;
  showLog: boolean;
  onTest: () => void;
}) {
  const focusedCount = attempt.violations.filter(
    (v) => v.type === "focus_loss" || v.type === "tab_switch",
  ).length;
  const copyishCount = attempt.violations.filter(
    (v) => v.type === "copy" || v.type === "paste" || v.type === "cut",
  ).length;
  const healthy = attempt.violationCount === 0;
  const isSession = attempt.conceptId === "_session";

  const pillStyle: CSSProperties = {
    backdropFilter: "blur(8px)",
  };

  return (
    <div className="space-y-2">
      <div
        style={pillStyle}
        className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 ${
          healthy
            ? "bg-correct/10 border-correct/40 text-correct"
            : "bg-warn/10 border-warn/40 text-warn"
        }`}
        role="status"
        aria-live="polite"
      >
        {healthy ? (
          <ShieldCheck size={16} aria-hidden="true" />
        ) : (
          <ShieldAlert size={16} aria-hidden="true" />
        )}
        <span className="text-xs font-medium">
          {isSession
            ? "Site-wide proctoring active"
            : "Proctored attempt active"}
        </span>
        {isSession && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-current/40 font-mono">
            site-wide
          </span>
        )}
        <span className="text-xs font-mono tabular-nums">
          {fmtDuration(attemptDuration(attempt))}
        </span>
        <span className="text-xs font-mono tabular-nums">
          {attempt.violationCount === 0
            ? "0 violations"
            : `${attempt.violationCount} violation${attempt.violationCount === 1 ? "" : "s"}`}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={onToggleLog}
            aria-expanded={showLog}
            className="text-[11px] px-2.5 py-1 rounded border border-current/40 hover:bg-canvas/40 inline-flex items-center gap-1 transition"
          >
            {showLog ? <EyeOff size={11} /> : <Eye size={11} />}
            {showLog ? "Hide log" : "Show log"}
          </button>
          {!isSession && (
            <button
              onClick={onEndEarly}
              className="text-[11px] px-2.5 py-1 rounded border border-current/40 hover:bg-canvas/40 inline-flex items-center gap-1 transition"
            >
              <Square size={11} aria-hidden="true" />
              End early
            </button>
          )}
          {isSession && (
            <a
              href="/admin/proctor"
              className="text-[11px] px-2.5 py-1 rounded border border-current/40 hover:bg-canvas/40 inline-flex items-center gap-1 transition"
            >
              <Eye size={11} aria-hidden="true" />
              View admin
            </a>
          )}
        </div>
      </div>

      {showLog && (
        <div className="bg-card border border-line rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-line bg-elev/30 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-faint">
              Live violation log
            </span>
            <div className="flex gap-3 text-[10px] text-faint font-mono">
              <span>
                focus:{" "}
                <span className="text-ink">{focusedCount}</span>
              </span>
              <span>
                copy/paste/cut:{" "}
                <span className="text-ink">{copyishCount}</span>
              </span>
            </div>
          </div>
          {attempt.violations.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-faint">
              No violations yet — keep going.
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-line/60">
              {[...attempt.violations].reverse().map((v) => (
                <li
                  key={v.id}
                  className="px-4 py-2 text-xs flex items-start gap-3"
                >
                  <span className="font-mono text-[10px] text-faint tabular-nums shrink-0">
                    {fmtTime(v.timestamp)}
                  </span>
                  <span className="text-ink">
                    {VIOLATION_LABEL[v.type]}
                  </span>
                  {typeof v.durationMs === "number" && v.durationMs > 0 && (
                    <span className="text-faint font-mono text-[10px]">
                      {fmtDuration(v.durationMs)}
                    </span>
                  )}
                  {v.context && (
                    <span className="text-dim text-[10px] truncate font-mono">
                      {v.context}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 border-t border-line bg-elev/20 flex items-center justify-end">
            <button
              onClick={onTest}
              className="text-[10px] text-faint hover:text-ink inline-flex items-center gap-1 transition"
              title="Inject a test violation event (for QA)"
            >
              <Eye size={10} aria-hidden="true" />
              inject test event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────

function SummaryCard({
  attempt,
  onReset,
  onToggleLog,
  showLog,
}: {
  attempt: Attempt;
  onReset: () => void;
  onToggleLog: () => void;
  showLog: boolean;
}) {
  const passed = attempt.result?.passed ?? false;
  const score = attempt.result?.score ?? null;
  const total = attempt.result?.total ?? null;
  const verdict = passed
    ? "Submitted cleanly"
    : attempt.status === "abandoned"
      ? "Ended early"
      : "Finished";

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line bg-elev/30 flex items-center gap-2 flex-wrap">
        {passed ? (
          <ShieldCheck size={16} className="text-correct" aria-hidden="true" />
        ) : (
          <ShieldAlert size={16} className="text-warn" aria-hidden="true" />
        )}
        <div className="text-sm font-medium text-ink">
          Attempt {verdict.toLowerCase()}
        </div>
        {score !== null && total !== null && (
          <span className="text-[10px] font-mono text-dim">
            ({score}/{total})
          </span>
        )}
        <span className="text-[10px] font-mono text-faint ml-auto">
          {fmtDuration(attemptDuration(attempt))} ·{" "}
          {attempt.violationCount} violation
          {attempt.violationCount === 1 ? "" : "s"}
        </span>
      </div>
      <button
        onClick={onToggleLog}
        className="w-full px-4 py-2 text-xs text-dim hover:text-ink hover:bg-elev/20 flex items-center gap-1.5 transition"
      >
        {showLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showLog ? "Hide" : "Show"} full violation log
      </button>
      {showLog && (
        <ul className="max-h-72 overflow-y-auto divide-y divide-line/60 border-t border-line">
          {attempt.violations.length === 0 ? (
            <li className="px-4 py-4 text-center text-xs text-faint">
              Clean run — no violations.
            </li>
          ) : (
            [...attempt.violations].reverse().map((v) => (
              <li key={v.id} className="px-4 py-2 text-xs flex items-start gap-3">
                <span className="font-mono text-[10px] text-faint tabular-nums shrink-0">
                  {fmtTime(v.timestamp)}
                </span>
                <span className="text-ink">{VIOLATION_LABEL[v.type]}</span>
                {typeof v.durationMs === "number" && v.durationMs > 0 && (
                  <span className="text-faint font-mono text-[10px]">
                    {fmtDuration(v.durationMs)}
                  </span>
                )}
                {v.context && (
                  <span className="text-dim text-[10px] truncate font-mono">
                    {v.context}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
      <div className="border-t border-line px-4 py-2 flex items-center justify-end bg-elev/20">
        <button
          onClick={onReset}
          className="text-[10px] text-dim hover:text-ink inline-flex items-center gap-1 transition"
        >
          <RotateCcw size={10} aria-hidden="true" />
          Take another attempt
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Disabled notice
// ─────────────────────────────────────────────────────────────────

function DisabledNotice() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-faint">
      <EyeOff size={12} aria-hidden="true" />
      Proctoring is disabled on this deployment
      <span aria-hidden="true">·</span>
      <span className="font-mono">NEXT_PUBLIC_PROCTORING=1</span> to enable.
    </div>
  );
}
