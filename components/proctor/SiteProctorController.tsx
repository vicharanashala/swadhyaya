"use client";

// SiteProctorController — runs the proctoring listener hook for the
// whole site, not just inside a Test tab. Mounted once in layout.tsx.
//
// Lifecycle:
//   1. On mount, checks the global preference (localStorage key
//      `swadhyaya-proctoring-default`). If "always", mounts the
//      listeners on the site-wide Attempt (created via
//      getOrCreateSiteSession) so the session stays sticky across
//      reloads.
//   2. If "ask", no listeners are mounted — the per-test
//      ProctorPanel takes over.
//   3. If "never", no listeners.
//   4. Subscribes to localStorage events so preference changes from
//      the GlobalProctorBanner pill take effect without a reload.
//
// Site-wide proctoring applies to the whole visit, from when the
// user enters the website until they opt out. The admin sees one
// continuous record per session.

import { useEffect } from "react";
import {
  endSiteSession,
  getOrCreateSiteSession,
  isProctoringEnabled,
} from "@/lib/proctoring";
import { useProctor } from "./useProctor";

const PREF_KEY = "swadhyaya-proctoring-default";

function readPref(): "ask" | "always" | "never" {
  if (typeof window === "undefined") return "ask";
  try {
    const v = window.localStorage.getItem(PREF_KEY);
    return v === "always" || v === "never" ? v : "ask";
  } catch {
    return "ask";
  }
}

export function SiteProctorController() {
  // Read preference, then either mount listeners (always), unmount
  // (never), or stay deaf (ask).
  // We use a small custom effect to keep the logic explicit.

  useEffect(() => {
    if (!isProctoringEnabled()) return;

    const refresh = () => {
      const pref = readPref();
      // Always / never change → leave / re-enter the proctored session.
      // The hook tear-down + re-mount happens naturally because the
      // hook below depends on the active Attempt instance.
      if (pref === "never") {
        endSiteSession("completed");
      } else if (pref === "always") {
        getOrCreateSiteSession();
      }
      // For "ask", don't manage a session here — ProctorPanel does it.
      // We dispatch a custom event so anything interested can react.
      window.dispatchEvent(
        new CustomEvent("swadhyaya:proctor-pref-changed", {
          detail: { pref },
        }),
      );
    };

    refresh();

    // Listen for cross-component preference updates.
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREF_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    // Also listen for in-tab updates (same-window writes don't dispatch
    // the storage event — add a custom event too).
    const onCustom = () => refresh();
    window.addEventListener("swadhyaya:proctor-pref-update", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("swadhyaya:proctor-pref-update", onCustom);
    };
  }, []);

  // Site-wide listener mount when preference is "always".
  // The hook is keyed off the session attempt's id so it
  // remounts if the session is restarted.
  const [attempt, setAttempt] = useStateSessionAttempt();
  useProctor({
    attempt: attempt && attempt.status === "active" ? attempt : null,
    onViolation: () => {
      // Re-read so the TopNav live indicator can re-render with the
      // updated count.
      setAttempt(getOrCreateSiteSession());
    },
  });

  return null;
}

// Local helper hook to subscribe to the active session attempt.
import { useCallback, useState } from "react";
import { type Attempt, listAttempts } from "@/lib/proctoring";

function useStateSessionAttempt() {
  const [a, setA] = useState<Attempt | null>(null);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    const pref = readPref();
    if (pref !== "always") {
      setA(null);
      return;
    }
    const s = getOrCreateSiteSession();
    setA(s);
  }, []);

  useEffect(() => {
    if (!isProctoringEnabled()) return;
    refresh();
    // Re-read whenever the preference changes or a violation pushes
    // new state into localStorage.
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREF_KEY) refresh();
    };
    const onCustom = () => refresh();
    const onTick = () => {
      // Re-read on a 1-Hz tick so the TopNav live counter and the
      // bottom-left pill can show fresh numbers without per-event work.
      const sessions = listAttempts().filter(
        (x) => x.conceptId === "_session",
      );
      const active = sessions.find((x) => x.status === "active");
      setA(active ?? null);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("swadhyaya:proctor-pref-update", onCustom);
    const t = window.setInterval(onTick, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("swadhyaya:proctor-pref-update", onCustom);
      window.clearInterval(t);
    };
  }, [refresh]);

  return [a, setA] as const;
}
