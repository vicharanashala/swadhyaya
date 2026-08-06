"use client";

// ProctoringInlineStatus — a slim, content-aware indicator that sits
// at the top of any page's content (used in the Story tab of the
// concept page, plus any page that wants to flag that proctoring is
// active on the current view). Reads the live session from
// localStorage so the label always reflects truth.
//
// Renders nothing when:
//   • Proctoring isn't enabled at the deployment level (env var off)
//   • The user hasn't accepted the ethics consent yet
//   • There's no live session (yet)
//
// Otherwise shows a slim pill: "Proctored · 0 violations · 5m 12s"
// along with a pulsing dot. The user always sees, IN the content
// flow, that the page they're reading is being watched.

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  attemptDuration,
  isProctoringEnabled,
  listAttempts,
  type Attempt,
} from "@/lib/proctoring";
import { cn } from "@/lib/cn";

const CONSENT_KEY = "swadhyaya-proctoring-consent";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

interface ProctoringInlineStatusProps {
  /**
   * Compact mode — just shows the dot + label, no expand option.
   * Default false (shows full inline status with violation count).
   */
  compact?: boolean;
  /** Optional override label. */
  label?: string;
  className?: string;
}

export function ProctoringInlineStatus({
  compact = false,
  label,
  className,
}: ProctoringInlineStatusProps) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Attempt | null>(null);
  const [consented, setConsented] = useState(false);
  const [, forceTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!isProctoringEnabled()) return;
    const refresh = () => {
      try {
        setConsented(
          window.localStorage.getItem(CONSENT_KEY) === "1",
        );
      } catch {
        /* ignore */
      }
      const sessions = listAttempts().filter(
        (a) => a.conceptId === "_session" && a.status === "active",
      );
      setSession(sessions[0] ?? null);
    };
    refresh();
    const t = window.setInterval(refresh, 2000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "swadhyaya-proctoring") refresh();
    };
    const onUpdate = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("swadhyaya:proctor-pref-update", onUpdate);
    window.addEventListener("swadhyaya:proctor-consent", onUpdate);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("swadhyaya:proctor-pref-update", onUpdate);
      window.removeEventListener("swadhyaya:proctor-consent", onUpdate);
    };
  }, []);

  // 1-Hz tick so the duration counter updates inside this component.
  useEffect(() => {
    if (!mounted || !consented || !session) return;
    const t = window.setInterval(() => forceTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [mounted, consented, session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;
  if (!isProctoringEnabled()) return null;
  if (!consented) return null;
  if (!session) return null;

  const healthy = session.violationCount === 0;
  const stale = Date.now() - session.lastHeartbeatAt > 30_000;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider",
          healthy ? "text-correct" : "text-warn",
          stale && "text-faint",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <span className="relative inline-flex h-2 w-2">
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              healthy ? "bg-correct" : "bg-warn",
              !stale && "animate-ping",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              healthy ? "bg-correct" : "bg-warn",
            )}
          />
        </span>
        Proctored
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 backdrop-blur",
        healthy
          ? "bg-correct/10 border-correct/40 text-correct"
          : "bg-warn/10 border-warn/40 text-warn",
        stale && "opacity-60",
        className,
      )}
    >
      <span className="relative inline-flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            healthy ? "bg-correct" : "bg-warn",
            !stale && "animate-ping opacity-60",
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            healthy ? "bg-correct" : "bg-warn",
          )}
        />
      </span>
      <ShieldCheck size={14} aria-hidden="true" />
      <span className="text-xs font-medium">
        {label ?? "Proctored session — you're being watched"}
      </span>
      <span className="text-[10px] uppercase tracking-wider opacity-80">
        site-wide
      </span>
      <span className="text-xs font-mono tabular-nums ml-auto">
        {fmt(attemptDuration(session))} · {session.violationCount}{" "}
        {session.violationCount === 1 ? "violation" : "violations"}
      </span>
    </div>
  );
}
