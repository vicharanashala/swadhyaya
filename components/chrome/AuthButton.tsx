"use client";
import { useState, useRef, useEffect, useId } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";

// AuthButton: shows the current auth state honestly.
// While auth is disabled (no samagama.in credentials yet), the button is
// a muted indicator — not an actionable "Sign in" that does nothing.
//
// The tooltip uses a <details>/<summary> pattern so it works on touch
// devices (hover-only tooltips don't trigger on mobile). The `onHover`
// enhancement is purely visual — focus and click also open it.
export function AuthButton() {
  const { status } = useAuth();
  const id = useId();
  const popoverId = `auth-popover-${id}`;
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the hover-only popover on outside click.
  useEffect(() => {
    if (!hovered) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setHovered(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [hovered]);

  // status === "disabled"
  void status; // reserved for when real auth is wired
  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        disabled
        aria-describedby={popoverId}
        aria-label="Sign-in is paused"
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-line/50 text-faint cursor-not-allowed hover:bg-elev/40 transition"
      >
        <Lock size={12} aria-hidden="true" />
        <span className="hidden sm:inline">Sign in paused</span>
      </button>
      {hovered && (
        <div
          id={popoverId}
          role="tooltip"
          className="absolute right-0 top-full mt-2 w-64 z-50 bg-elev border border-line rounded-md p-3 shadow-card text-xs text-dim leading-relaxed"
        >
          <div className="font-medium text-ink mb-1">Sign-in is paused</div>
          Your progress saves locally — no account needed to use Swadhyaya.
          When samagama.in credentials land, the OAuth flow will be wired here.
        </div>
      )}
    </div>
  );
}