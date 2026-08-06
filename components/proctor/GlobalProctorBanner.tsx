"use client";

// GlobalProctorBanner — first-visit pop-up + bottom-left preference pill.
// Lifted the consent UX from a one-click inline card to Vibe's
// `EthicsConsentModal` flow — scroll-to-accept, webcam + audio
// disclosure, clear opt-in/out semantics.
//
// Two-state UX:
//   • First visit  → EthicsConsentModal asks for an explicit
//                    consent with full disclosure. Accept writes a
//                    consent flag AND the chosen preference to
//                    localStorage; Decline just records "no consent"
//                    so we don't ask twice.
//   • Every visit  → small floating pill in the bottom-left with
//                    quick toggles (always / ask / never). Click →
//                    popover with the same three states.
//   • When a live session is active (ethics consented + pref =
//     "always"), the SiteProctorController renders the actual
//     webcam preview via ProctorFloatingPanel. The pill stays
//     visible but more subdued.

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
  isProctoringEnabled,
} from "@/lib/proctoring";
import {
  acceptSiteProctoring,
  declineSiteProctoring,
} from "./SiteProctorController";
import { EthicsConsentModal } from "./EthicsConsentModal";

type DefaultPref = "ask" | "always" | "never";

const STORE = {
  seen: "swadhyaya-proctoring-seen",
  default: "swadhyaya-proctoring-default",
  consent: "swadhyaya-proctoring-consent",
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
    /* ignore */
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
    /* ignore */
  }
}

export function GlobalProctorBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false); // first-visit modal
  const [pillOpen, setPillOpen] = useState(false); // settings popover
  const [pref, setPref] = useState<DefaultPref>("ask");
  const [consented, setConsented] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isProctoringEnabled());
    const prefValue = readPref();
    const consentValue = (() => {
      try {
        return window.localStorage.getItem(STORE.consent) === "1";
      } catch {
        return false;
      }
    })();
    const seen = readSeen();
    setPref(prefValue);
    setConsented(consentValue);
    // First-visit modal shows only if we haven't asked yet, OR if the
    // student visited but never picked a default.
    if ((!seen || (seen && !consentValue && prefValue === "ask"))) {
      setOpen(true);
    }
  }, []);

  if (!mounted) return null;
  if (!enabled) return null;

  // Ethics-consent path — student accepts → enable site proctoring,
  // drop session attempt in place, broadcast the change.
  const onAccept = () => {
    setOpen(false);
    markSeen();
    acceptSiteProctoring();
    setConsented(true);
    // Default is the existing pref (probably "always" once they accept).
    if (readPref() === "always") {
      getOrCreateSiteSession();
    }
  };
  const onDecline = () => {
    setOpen(false);
    markSeen();
    declineSiteProctoring();
    writePref("never");
    setPref("never");
    setConsented(false);
  };

  // Skip entirely: just close the modal without recording.
  const onSkip = () => {
    setOpen(false);
    markSeen();
  };

  if (open) {
    return (
      <EthicsConsentModal
        isOpen
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );
  }

  return (
    <Pill
      pref={pref}
      consented={consented}
      onChange={(p) => {
        setPref(p);
        writePref(p);
        if (p === "always") {
          getOrCreateSiteSession();
        } else if (p === "never") {
          endSiteSession("completed");
        } else if (p === "ask") {
          endSiteSession("completed");
        }
        window.dispatchEvent(
          new CustomEvent("swadhyaya:proctor-pref-update", {
            detail: { pref: p },
          }),
        );
        setPillOpen(false);
      }}
      onAskAgain={() => {
        setPillOpen(false);
        setOpen(true);
      }}
      expanded={pillOpen}
      setExpanded={setPillOpen}
    />
  );
}

function Pill({
  pref,
  consented,
  onChange,
  onAskAgain,
  expanded,
  setExpanded,
}: {
  pref: DefaultPref;
  consented: boolean;
  onChange: (p: DefaultPref) => void;
  onAskAgain: () => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  // If the user has consented + "always", show a quiet badge — the
  // ProctorFloatingPanel does the heavy lifting visually now.
  const liveActive = pref === "always" && consented;
  const label = liveActive
    ? "Proctoring active"
    : pref === "always"
      ? "Proctoring ready"
      : pref === "never"
        ? "Proctoring off"
        : "Proctoring paused";
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
                  hint: "Proctor every moment",
                  Icon: ShieldCheck,
                },
                {
                  p: "ask",
                  label: "Ask each time",
                  hint: "Show consent modal",
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
                onClick={() => onChange(p)}
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
          <div className="px-3 py-2 border-t border-line bg-elev/20 flex items-center justify-between">
            <button
              type="button"
              onClick={onAskAgain}
              className="text-[10px] text-faint hover:text-ink"
            >
              Re-read consent
            </button>
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
          liveActive
            ? "bg-correct/10 border-correct/40 text-correct hover:bg-correct/15"
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
        {liveActive && (
          <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-correct animate-pulse" />
        )}
      </button>
    </div>
  );
}
