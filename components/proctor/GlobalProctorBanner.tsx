"use client";

// GlobalProctorBanner — first-visit-popup that surfaces the proctoring
// opt-in globally, exactly once per browser. Models Vibe's behaviour
// where the proctored-quiz system is announced clearly to the learner
// the first time they land on the platform.
//
// Two-state UX:
//   • First visit  → a centered modal popup asking the student to
//                    acknowledge proctoring is available, and to
//                    decide a default (always opt-in / always skip /
//                    ask me each time).
//   • Every visit  → a thin bottom-left pill reminding the learner
//                    that proctoring is enabled on this deployment
//                    and showing the current per-session default.
//
// The default-preference is stored as `swadhyaya-proctoring-default`
// in localStorage with one of:
//   • "always"      — open the Test tab directly into a proctored
//                      attempt with no popup
//   • "never"       — never open a proctored attempt; the Test tab
//                      proceeds without any monitoring
//   • "ask"         — show the per-test ProctorConsentModal every time
//                      (the default for first-time visitors)
//
// If the env var isn't on, the banner becomes invisible.

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ShieldAlert,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  endSiteSession,
  getOrCreateSiteSession,
} from "@/lib/proctoring";

type DefaultPref = "ask" | "always" | "never";

const STORE = {
  seen: "swadhyaya-proctoring-seen",
  default: "swadhyaya-proctoring-default",
};

function readPref(): DefaultPref {
  if (typeof window === "undefined") return "ask";
  try {
    const v = window.localStorage.getItem(STORE.default);
    return v === "always" || v === "never" ? v : "ask";
  } catch {
    return "ask";
  }
}

function writePref(p: DefaultPref) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE.default, p);
  } catch {
    // ignore
  }
}

function readSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORE.seen) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE.seen, "1");
  } catch {
    // ignore
  }
}

export function GlobalProctorBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false); // first-visit modal
  const [pillOpen, setPillOpen] = useState(false); // settings popover
  const [pref, setPref] = useState<DefaultPref>("ask");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(process.env.NEXT_PUBLIC_PROCTORING === "1");
    const prefValue = readPref();
    const seen = readSeen();
    setPref(prefValue);
    // Show the modal ONLY on the first visit and only when the user
    // hasn't yet committed to a default. After that, they get the
    // small pill on every page; never the full modal again.
    if (!seen && prefValue === "ask") setOpen(true);
  }, []);

  if (!mounted) return null;
  if (!enabled) return null;

  const accept = (next: DefaultPref) => {
    setPref(next);
    writePref(next);
    markSeen();
    // Manage the sticky site session so the data flows into the admin
    // dashboard immediately.
    if (next === "always") {
      getOrCreateSiteSession();
    } else if (next === "never") {
      endSiteSession("completed");
    }
    // Broadcast so any other open components (TopNav badge, SiteProctorController)
    // pick up the change without a reload.
    window.dispatchEvent(
      new CustomEvent("swadhyaya:proctor-pref-update", {
        detail: { pref: next },
      }),
    );
    setOpen(false);
  };

  if (open) {
    return <FirstVisitModal pref={pref} onAccept={accept} />;
  }

  return (
    <Pill
      pref={pref}
      onChange={(p) => {
        setPref(p);
        writePref(p);
        setPillOpen(false);
      }}
      expanded={pillOpen}
      setExpanded={setPillOpen}
    />
  );
}

function FirstVisitModal({
  pref,
  onAccept,
}: {
  pref: DefaultPref;
  onAccept: (p: DefaultPref) => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-proctor-title"
      aria-describedby="global-proctor-body"
      onClick={(e) => {
        // Backdrop click — show a confirm-discard hint by clicking the
        // dismiss button below rather than silent-close.
        if (e.target === e.currentTarget) {
          // nudge: nothing breaks; pill state handles itself
        }
      }}
      className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 animate-[a11y-fade_180ms_ease]"
    >
      <div className="w-full max-w-md bg-card border border-line rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55)] overflow-hidden animate-[a11y-slide_200ms_ease]">
        <div className="px-6 pt-5 pb-3 border-b border-line flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center">
            <ShieldCheck size={20} className="text-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="global-proctor-title"
              className="font-serif text-lg text-ink leading-tight"
            >
              Proctoring is available on this site
            </h2>
            <p
              id="global-proctor-body"
              className="text-xs text-faint mt-0.5"
            >
              One-time setup. You can change the default at any time
              from the badge in the bottom-left.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3 text-sm text-dim leading-relaxed">
          <p>
            When you open the <strong className="text-ink">Test</strong>{" "}
            tab of any concept, you can choose to take it{" "}
            <strong className="text-ink">with proctoring on</strong>. Proctoring
            tracks window focus, copy/paste, idle time, and (best effort)
            devtools — nothing more.
          </p>

          <div className="grid gap-2">
            <PrefRow
              active={pref === "ask"}
              onClick={() => onAccept("ask")}
              icon={<Eye size={14} aria-hidden="true" />}
              label="Ask me each time"
              hint="Show the consent modal every time I open the Test tab."
            />
            <PrefRow
              active={pref === "always"}
              onClick={() => onAccept("always")}
              icon={<ShieldCheck size={14} aria-hidden="true" />}
              label="Always proctor (default on)"
              hint="Skip the per-test consent — every Test tab opens proctored."
              accent
            />
            <PrefRow
              active={pref === "never"}
              onClick={() => onAccept("never")}
              icon={<ShieldAlert size={14} aria-hidden="true" />}
              label="Skip proctoring"
              hint="Never proctor my attempts — the consent modal won't appear."
            />
          </div>

          <p className="text-[11px] text-faint border-t border-line pt-3">
            Tip: you can change this default any time from the small badge
            in the bottom-left corner of every page.
          </p>
        </div>

        <div className="px-6 py-3 border-t border-line bg-elev/30 flex items-center justify-end">
          <button
            type="button"
            onClick={() => onAccept(pref || "ask")}
            className="text-xs text-dim hover:text-ink underline-offset-2 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  active,
  onClick,
  icon,
  label,
  hint,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 w-full text-left rounded-lg p-2.5 border transition",
        active
          ? accent
            ? "border-accent/60 bg-accent/15"
            : "border-line bg-elev/60"
          : "border-line/50 bg-canvas/30 hover:bg-elev/40",
      )}
    >
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          active
            ? accent
              ? "bg-accent text-canvas"
              : "bg-ink text-canvas"
            : "bg-canvas text-faint border border-line",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-ink">{label}</div>
        <div className="text-[11px] text-faint leading-snug mt-0.5">
          {hint}
        </div>
      </div>
    </button>
  );
}

function Pill({
  pref,
  onChange,
  expanded,
  setExpanded,
}: {
  pref: DefaultPref;
  onChange: (p: DefaultPref) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  const handleChange = (p: DefaultPref) => {
    onChange(p);
    // Manage the sticky site session so we don't leave it dangling
    // when the user flips the default off mid-session.
    if (p === "always") {
      getOrCreateSiteSession();
    } else if (p === "never") {
      endSiteSession("completed");
    } else if (p === "ask") {
      // "Ask" leaves the site session in whatever state it had —
      // usually "completed" if it was running. Drop it.
      endSiteSession("completed");
    }
    window.dispatchEvent(
      new CustomEvent("swadhyaya:proctor-pref-update", {
        detail: { pref: p },
      }),
    );
    setExpanded(false);
  };

  const label =
    pref === "always"
      ? "Proctoring ON by default"
      : pref === "never"
        ? "Proctoring OFF by default"
        : "Proctoring — ask each time";
  const Icon =
    pref === "always" ? ShieldCheck : pref === "never" ? ShieldAlert : Eye;

  return (
    <div className="fixed bottom-4 left-4 z-30">
      {expanded && (
        <div className="mb-2 w-72 max-w-[calc(100vw-2rem)] bg-card border border-line rounded-xl shadow-[0_10px_28px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-3 py-2 border-b border-line bg-elev/30 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-faint inline-flex items-center gap-1.5">
              <Settings2 size={11} aria-hidden="true" />
              Proctor preference
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close proctor preference"
              className="w-6 h-6 rounded flex items-center justify-center text-dim hover:text-ink hover:bg-elev transition"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
          <div className="p-2 grid gap-1">
            {(
              [
                {
                  p: "always",
                  label: "Always ON",
                  hint: "Proctor every attempt",
                  Icon: ShieldCheck,
                },
                {
                  p: "ask",
                  label: "Ask each time",
                  hint: "Show consent on Test tab",
                  Icon: Eye,
                },
                {
                  p: "never",
                  label: "Always OFF",
                  hint: "Never proctor",
                  Icon: ShieldAlert,
                },
              ] as const
            ).map(({ p, label, hint, Icon }) => (
              <button
                key={p}
                type="button"
                onClick={() => handleChange(p)}
                aria-pressed={pref === p}
                className={cn(
                  "flex items-center gap-2.5 w-full text-left rounded p-2 transition",
                  pref === p
                    ? "bg-accent/15 text-ink ring-1 ring-accent/30"
                    : "text-dim hover:text-ink hover:bg-elev/60",
                )}
              >
                <Icon
                  size={13}
                  className={pref === p ? "text-accent" : "text-faint"}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-[10px] text-faint">{hint}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-line bg-elev/20">
            <a
              href="/admin/proctor"
              className="text-[10px] text-accent hover:underline"
            >
              View admin dashboard →
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label="Open proctor preference"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full border backdrop-blur",
          "text-[11px] font-medium shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition",
          pref === "always"
            ? "bg-accent/15 border-accent/40 text-accent hover:bg-accent/25"
            : pref === "never"
              ? "bg-elev/70 border-line text-dim hover:text-ink"
              : "bg-card/90 border-line text-ink hover:bg-card",
        )}
        title="Proctoring preference (open settings)"
      >
        {pref === "never" ? (
          <EyeOff size={11} aria-hidden="true" />
        ) : (
          <Icon size={11} aria-hidden="true" />
        )}
        <span>{label}</span>
      </button>
    </div>
  );
}
