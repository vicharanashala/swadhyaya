"use client";

// ProctorLiveBadge — mounts in the TopNav next to the streak counter.
// Shows the current site-wide proctoring session status when one is
// active: live timer + violation count. Hidden entirely when proctoring
// is disabled at the deployment level, or when no session is active.

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  attemptDuration,
  isProctoringEnabled,
  listAttempts,
  type Attempt,
} from "@/lib/proctoring";
import { cn } from "@/lib/cn";

function fmtShort(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function ProctorLiveBadge() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Attempt | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!isProctoringEnabled()) return;

    const refresh = () => {
      const s = listAttempts().find(
        (a) => a.conceptId === "_session" && a.status === "active",
      );
      setSession(s ?? null);
    };

    refresh();
    // Tick every second for the live timer; re-read every 2 s for
    // the violation count + heartbeat freshness.
    const tTimer = window.setInterval(() => force((v) => v + 1), 1000);
    const tRefresh = window.setInterval(refresh, 2000);
    const onUpdate = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "swadhyaya-proctoring") refresh();
    };
    window.addEventListener("swadhyaya:proctor-pref-update", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(tTimer);
      window.clearInterval(tRefresh);
      window.removeEventListener("swadhyaya:proctor-pref-update", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!mounted || !isProctoringEnabled() || !session) return null;

  const healthy = session.violationCount === 0;
  const stale = Date.now() - session.lastHeartbeatAt > 30_000;

  return (
    <a
      href="/admin/proctor"
      className={cn(
        "hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded border transition",
        stale
          ? "border-faint text-faint"
          : healthy
            ? "border-correct/40 bg-correct/10 text-correct hover:bg-correct/15"
            : "border-warn/40 bg-warn/10 text-warn hover:bg-warn/15",
      )}
      title={
        stale
          ? "Session has stopped sending heartbeats (tab may be in the background)"
          : "Live proctoring session — click to open admin dashboard"
      }
    >
      {healthy ? (
        <ShieldCheck size={11} aria-hidden="true" />
      ) : (
        <ShieldAlert size={11} aria-hidden="true" />
      )}
      <span className="tabular-nums">{fmtShort(attemptDuration(session))}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">
        {session.violationCount}{" "}
        {session.violationCount === 1 ? "violation" : "violations"}
      </span>
    </a>
  );
}
