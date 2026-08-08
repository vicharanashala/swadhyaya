"use client";

// useFullscreenLockdown — ports vibe's utils/fullscreen.ts into a hook
// that keeps the browser in native fullscreen for the duration of the
// proctored attempt.
//
// Why native fullscreen: the in-app overlay is "fake" fullscreen — it
// covers the viewport with a fixed div, but it doesn't hide Chrome's
// omnibox or prevent the user from Alt-Tabbing to another window. The
// only thing the browser exposes for the second case is the Fullscreen
// API, and the only thing that hides the omnibox.
//
// The Fullscreen API only honours a request that runs inside a user
// gesture's "transient activation" window. So:
//   • On attempt start, the consent click calls enter() synchronously
//     before any await — that consumes the gesture.
//   • On revocation (user hits Esc), we wait one tick and re-enter.
//     There is no other browser-exposed way to keep them in fullscreen,
//     and the attempt must still be one continuous session.
//
// `document.fullscreenElement` going null is what fires; we don't try
// to detect Alt-Tab specifically — it's already the same logical state
// (window not fullscreen) from the proctor's point of view.

import { useCallback, useEffect, useRef } from "react";

export interface FullscreenState {
  active: boolean;
  enter: () => void;
  exit: () => void;
}

export function useFullscreenLockdown(opts: {
  enabled: boolean;
  /** Optional callback when the user exits fullscreen (Esc, browser UI).
   *  Useful for emitting a violation or pausing the session. */
  onExit?: () => void;
}): FullscreenState {
  const { enabled, onExit } = opts;
  const enteringRef = useRef(false);
  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  });

  const enter = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) return;
    enteringRef.current = true;
    // Swallow rejections: some browsers refuse if a transient-activation
    // window expired, or in iframes without `allow="fullscreen"`. The
    // app remains usable; the user just isn't locked.
    void document.documentElement.requestFullscreen?.().catch(() => {});
    // requestFullscreen is async; the fullscreenchange event lands later.
  }, []);

  const exit = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) return;
    void document.exitFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onChange = () => {
      if (!enabled) return;
      const active = !!document.fullscreenElement;
      if (!active && !enteringRef.current) {
        onExitRef.current?.();
      }
      enteringRef.current = false;
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    // No way to auto-enter — the API requires a user gesture. The caller
    // invokes `enter()` from the click handler.
    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [enabled]);

  return { active: false, enter, exit };
}
