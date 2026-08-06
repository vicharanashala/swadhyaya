"use client";

// GlobalProctorBanner — first-visit pop-up + status pill.
//
// On a proctored deployment, proctoring is COMPULSORY — the
// student cannot opt out. The disclosure (EthicsConsentModal)
// has only one action: I Accept. The bottom-left pill therefore
// is a status indicator + "Re-read consent" link, not a
// preference toggle.

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getOrCreateSiteSession,
  isProctoringEnabled,
} from "@/lib/proctoring";
import {
  acceptSiteProctoring,
} from "./SiteProctorController";
import { EthicsConsentModal } from "./EthicsConsentModal";

const STORE = {
  seen: "swadhyaya-proctoring-seen",
  default: "swadhyaya-proctoring-default",
  consent: "swadhyaya-proctoring-consent",
};

// Compulsory deployments only store "always". Removing the "ask"
// / "never" branches from the consumer means the preference is
// effectively fixed at the deployment level.
type DefaultPref = "always";

function readPref(): DefaultPref {
  if (typeof window === "undefined") return "always";
  try {
    const v = window.localStorage.getItem(STORE.default);
    // Defensive: any prior "ask" / "never" prefs get coerced to
    // "always" since proctoring is compulsory on this deployment.
    return v === "always" ? "always" : "always";
  } catch {
    return "always";
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
  const [consented, setConsented] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isProctoringEnabled());
    const consentValue = (() => {
      try {
        return window.localStorage.getItem(STORE.consent) === "1";
      } catch {
        return false;
      }
    })();
    const seen = readSeen();
    setConsented(consentValue);
    // First-visit modal — always show if consent is not on file.
    if (!seen || !consentValue) {
      setOpen(true);
    }
  }, []);

  if (!mounted) return null;
  if (!enabled) return null;

  const onAccept = () => {
    setOpen(false);
    markSeen();
    acceptSiteProctoring();
    setConsented(true);
    // Always create the site session on acceptance — proctoring is
    // now in effect for the rest of the visit.
    getOrCreateSiteSession();
    // Persist the default so the SiteProctorController sees "always"
    // on subsequent renders.
    writePref("always");
  };

  if (open || !consented) {
    // Compulsory: keep showing the consent modal until accepted. No
    // Decline option, no skip — only the I Accept button can dismiss.
    return <EthicsConsentModal isOpen onAccept={onAccept} />;
  }

  return (
    <Pill
      consented={consented}
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
  consented,
  onAskAgain,
  expanded,
  setExpanded,
}: {
  consented: boolean;
  onAskAgain: () => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  const label = consented ? "Proctoring compulsory" : "Proctoring";
  const Icon = ShieldCheck;

  return (
    <div className="fixed bottom-4 left-4 z-30">
      {expanded && (
        <div className="mb-2 w-72 max-w-[calc(100vw-2rem)] bg-card border border-line rounded-xl shadow-[0_10px_28px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-3 py-2 border-b border-line bg-elev/30 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-faint inline-flex items-center gap-1.5">
              <Settings2 size={11} aria-hidden="true" />
              Proctoring (compulsory)
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close proctor status"
              className="w-6 h-6 rounded flex items-center justify-center text-dim hover:text-ink hover:bg-elev transition"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
          <div className="p-3 text-xs text-dim leading-relaxed">
            Proctoring is <strong className="text-ink">required</strong> on
            this site. Your webcam and browser activity stay in your
            local storage only — never uploaded.
          </div>
          <div className="px-3 py-2 border-t border-line bg-elev/20 flex items-center justify-between">
            <button
              type="button"
              onClick={onAskAgain}
              className="text-[10px] text-faint hover:text-ink"
            >
              Re-read full disclosure
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
        aria-label="Open proctor status"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-full border backdrop-blur",
          "text-[11px] font-medium shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition",
          consented
            ? "bg-correct/10 border-correct/40 text-correct hover:bg-correct/15"
            : "bg-card/90 border-line text-ink hover:bg-card",
        )}
        title="Proctoring is required on this site"
      >
        <Icon size={11} aria-hidden="true" />
        <span>{label}</span>
        {consented && (
          <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-correct animate-pulse" />
        )}
      </button>
    </div>
  );
}
