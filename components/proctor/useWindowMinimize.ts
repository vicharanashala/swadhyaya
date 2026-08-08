"use client";

// useWindowMinimize — distinguishes the window being minimised from a
// normal tab switch. A tab switch fires `visibilitychange` (hidden), a
// window minimise fires `blur` without `visibilitychange` flipping, and
// both together is the user Alt-Tabbing to another application and then
// minimising.
//
// This was missing from the old useProctor hook, which reported every
// blur as "focus_loss" with no way to tell what kind of disruption it
// was. Now it emits a dedicated `window_minimized` violation that the
// admin dashboard can distinguish from a tab switch in the log.
//
// Detection is brittle on purpose. The window minimize event isn't
// directly observable in the browser spec — we infer it from the
// pattern of events. Empirically:
//
//   tab switch     : visibility:hidden then visibility:visible
//   window minimize: blur, no visibility change for > 1s, then focus
//   Alt-Tab to app : blur, visibility stays visible, then focus

import { useEffect, useRef } from "react";

export interface WindowMinimizeOpts {
  enabled: boolean;
  /** Threshold: only report minimise when the window has been absent
   *  for at least this many ms. Filters out momentary blur from
   *  address-bar focus changes. Defaults to 1000. */
  thresholdMs?: number;
  onAnomaly?: (a: { type: "window_minimized"; severity: number; durationMs: number }) => void;
}

export function useWindowMinimize(opts: WindowMinimizeOpts): void {
  const { enabled, thresholdMs = 1000, onAnomaly } = opts;
  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let blurAt: number | null = null;
    let visibilityHiddenDuringBlur = false;
    let fired = false;

    const onBlur = () => {
      blurAt = Date.now();
      visibilityHiddenDuringBlur = document.visibilityState === "hidden";
      fired = false;
    };

    const onVisChange = () => {
      if (blurAt !== null && document.visibilityState === "hidden") {
        visibilityHiddenDuringBlur = true;
      }
    };

    const onFocus = () => {
      if (blurAt === null || fired) {
        blurAt = null;
        return;
      }
      const duration = Date.now() - blurAt;
      const minimized =
        duration >= thresholdMs && !visibilityHiddenDuringBlur;
      if (minimized) {
        fired = true;
        onAnomalyRef.current?.({
          type: "window_minimized",
          severity: 2,
          durationMs: duration,
        });
      }
      blurAt = null;
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [enabled, thresholdMs]);
}
