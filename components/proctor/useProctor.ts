"use client";

// useProctor — the client-side monitoring hook for an active proctored
// attempt. Six event sources are wired up; each produces a violation
// entry in localStorage. A 10 s heartbeat marks the attempt alive so
// the admin dashboard can distinguish live sessions from ghosts.
//
// Important design choices:
//   • We never BLOCK the student — focus/tab loss only logs a violation,
//     not a kick. This matches swadhyaya's friendly tone (vs vibe's
//     stricter proctor).
//   • Heartbeats only fire while the attempt is active; on pause/complete
//     the listeners are removed so a closed tab does not produce noise.
//   • contextmenu, copy, paste, cut — these are the soft signals. We
//     don't suppress them (browsers don't reliably let you); we just
//     record the attempt so the admin knows.
//   • Long-idle is detected via input + pointer activity tracked in
//     `useProctor`'s body. An absence of EITHER for 5 min logs
//     `long_idle` once per session.

import { useEffect, useRef } from "react";
import {
  type Attempt,
  type ViolationType,
  heartbeat,
  HEARTBEAT_MS,
  isProctoringEnabled,
  logViolation,
} from "@/lib/proctoring";

const LONG_IDLE_MS = 5 * 60_000;

interface UseProctorOpts {
  attempt: Attempt | null;
  onViolation?: (type: ViolationType, durationMs?: number) => void;
}

interface ProctorHandle {
  /** Force a violation (used by `ProctorPanel` for testing/manual reset). */
  reportTest: () => void;
}

export function useProctor(
  opts: UseProctorOpts,
): ProctorHandle {
  const { attempt, onViolation } = opts;
  const reportTestRef = useRef<() => void>(() => {});
  const lastBlurAt = useRef<number | null>(null);
  const longIdleLogged = useRef<boolean>(false);
  const lastActivity = useRef<number>(Date.now());

  // Touch activity time on any input / pointer event so we can detect
  // long idle. Mounted only when the attempt is active.
  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    const onActivity = () => {
      lastActivity.current = Date.now();
    };
    window.addEventListener("keydown", onActivity, true);
    window.addEventListener("pointerdown", onActivity, true);
    window.addEventListener("pointermove", onActivity, true);
    window.addEventListener("wheel", onActivity, true);
    return () => {
      window.removeEventListener("keydown", onActivity, true);
      window.removeEventListener("pointerdown", onActivity, true);
      window.removeEventListener("pointermove", onActivity, true);
      window.removeEventListener("wheel", onActivity, true);
    };
  }, [attempt?.id, attempt?.status]);

  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    if (!isProctoringEnabled()) return;
    const aid = attempt.id;

    const onBlur = () => {
      lastBlurAt.current = Date.now();
      const v = logViolation(aid, { type: "focus_loss" });
      if (v) onViolation?.("focus_loss");
    };
    const onFocus = () => {
      if (lastBlurAt.current) {
        const dur = Date.now() - lastBlurAt.current;
        lastBlurAt.current = null;
        const v = logViolation(aid, {
          type: "focus_loss",
          durationMs: dur,
          context: "regained focus",
        });
        if (v) onViolation?.("focus_loss", dur);
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        const v = logViolation(aid, { type: "tab_switch" });
        if (v) onViolation?.("tab_switch");
        lastBlurAt.current = Date.now();
      } else if (lastBlurAt.current) {
        const dur = Date.now() - lastBlurAt.current;
        lastBlurAt.current = null;
        const v = logViolation(aid, {
          type: "tab_switch",
          durationMs: dur,
          context: "back to test tab",
        });
        if (v) onViolation?.("tab_switch", dur);
      }
    };
    const onContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const ctx = target ? `${tag}${target.id ? "#" + target.id : ""}` : "unknown";
      const v = logViolation(aid, { type: "right_click", context: ctx });
      if (v) onViolation?.("right_click");
      // We don't preventDefault — suppression isn't reliable cross-browser
      // and a hard block feels punitive. Just record.
    };
    const onCopy = () => {
      const v = logViolation(aid, { type: "copy" });
      if (v) onViolation?.("copy");
    };
    const onPaste = () => {
      const v = logViolation(aid, { type: "paste" });
      if (v) onViolation?.("paste");
    };
    const onCut = () => {
      const v = logViolation(aid, { type: "cut" });
      if (v) onViolation?.("cut");
    };

    let devtoolsWarned = false;
    const probeDevtools = () => {
      // Classic timing probe: console.log round-trip time is much higher
      // when devtools is open. Threshold 250 ms is conservative.
      if (devtoolsWarned) return;
      const t0 = performance.now();
      // eslint-disable-next-line no-console
      console.log("p");
      // eslint-disable-next-line no-console
      console.clear();
      const dt = performance.now() - t0;
      if (dt > 250) {
        devtoolsWarned = true;
        const v = logViolation(aid, {
          type: "devtools_open",
          context: `console probe ${dt.toFixed(0)}ms`,
        });
        if (v) onViolation?.("devtools_open");
      }
    };

    const hb = window.setInterval(() => {
      heartbeat(aid);
      if (!longIdleLogged.current && Date.now() - lastActivity.current >= LONG_IDLE_MS) {
        longIdleLogged.current = true;
        const v = logViolation(aid, { type: "long_idle" });
        if (v) onViolation?.("long_idle");
      }
      probeDevtools();
    }, HEARTBEAT_MS);

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut", onCut);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut", onCut);
      window.clearInterval(hb);
    };
  }, [attempt?.id, attempt?.status, onViolation]);

  // Expose a manual trigger so the ProctorPanel can mount a "test event"
  // button — useful for QA / demo runs.
  reportTestRef.current = () => {
    if (!attempt) return;
    logViolation(attempt.id, {
      type: "focus_loss",
      context: "manual test",
    });
    onViolation?.("focus_loss");
  };

  return {
    reportTest: () => reportTestRef.current(),
  };
}
