"use client";

// Accessibility settings — a floating gear button at the bottom-left of
// the viewport that opens a modal with four toggles:
//
//   • Dyslexia-friendly font  (Lexend via --font-lexend)
//   • Text size               (default · large · xl)
//   • Letter spacing          (normal · wide for low-vision readers)
//   • High contrast           (filter: contrast/saturate boost)
//
// Each setting is persisted to localStorage under `swadhyaya-a11y` and
// applied to <html> via data-* attributes. The CSS lives in globals.css
// — keep them in sync.
//
// Pattern lifted from vicharanashala/tenali (client/src/index.css +
// App.jsx A11y modal), adapted for swadhyaya's warm-dark theme and the
// existing design tokens.

import { useCallback, useEffect, useState } from "react";
import { Accessibility, X, Type, LetterText, Contrast, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

type A11yPrefs = {
  dyslexia: boolean;
  size: "default" | "large" | "xl";
  spacing: boolean;
  contrast: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  dyslexia: false,
  size: "default",
  spacing: false,
  contrast: false,
};

const STORAGE_KEY = "swadhyaya-a11y";

function applyPrefs(p: A11yPrefs) {
  const html = document.documentElement;
  if (p.dyslexia) html.setAttribute("data-a11y-dyslexia", "true");
  else html.removeAttribute("data-a11y-dyslexia");
  if (p.size !== "default") html.setAttribute("data-a11y-size", p.size);
  else html.removeAttribute("data-a11y-size");
  if (p.spacing) html.setAttribute("data-a11y-spacing", "true");
  else html.removeAttribute("data-a11y-spacing");
  if (p.contrast) html.setAttribute("data-a11y-contrast", "high");
  else html.removeAttribute("data-a11y-contrast");
}

function loadPrefs(): A11yPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      size: parsed.size ?? "default",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: A11yPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // localStorage may be disabled in private mode — ignore.
  }
}

export function A11ySettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);

  // Hydrate from localStorage on mount and apply once. We deliberately
  // do NOT pre-apply on the server pass — the data-attributes only flip
  // after hydration to avoid a flash of unstyled text on first paint.
  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    applyPrefs(p);
  }, []);

  const update = useCallback((patch: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      savePrefs(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    applyPrefs(DEFAULT_PREFS);
    savePrefs(DEFAULT_PREFS);
  }, []);

  // Close on Escape for parity with Tenali's modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sizeLabels: Array<{ value: A11yPrefs["size"]; label: string }> = [
    { value: "default", label: "Default" },
    { value: "large", label: "Large" },
    { value: "xl", label: "XL" },
  ];

  return (
    <>
      {/* Floating gear — bottom-right, doesn't collide with the side rail or
          mobile nav. 40×40 circle is the same convention Tenali uses for
          its accessibility gear. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open accessibility settings"
        title="Accessibility"
        className={cn(
          "fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full",
          "border border-line bg-card/90 backdrop-blur",
          "shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
          "flex items-center justify-center",
          "text-accent hover:bg-elev hover:text-accent",
          "transition",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          open && "hidden",
        )}
      >
        <Accessibility size={18} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-panel-title"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-[a11y-fade_180ms_ease]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-line rounded-2xl w-full max-w-sm shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-[a11y-slide_200ms_ease]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <h2
                  id="a11y-panel-title"
                  className="font-serif text-lg text-ink leading-tight"
                >
                  Accessibility
                </h2>
                <p className="text-[11px] text-faint mt-0.5">
                  Settings persist across sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close accessibility settings"
                className="w-8 h-8 rounded flex items-center justify-center text-dim hover:text-ink hover:bg-elev transition"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
              <Section
                icon={<Type size={14} aria-hidden="true" />}
                title="Dyslexia-friendly font"
              >
                <Toggle
                  label="Use Lexend instead of DM Sans"
                  on={prefs.dyslexia}
                  onChange={(v) => update({ dyslexia: v })}
                />
              </Section>

              <Section
                icon={<Type size={14} aria-hidden="true" />}
                title="Text size"
              >
                <div className="flex gap-1.5">
                  {sizeLabels.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update({ size: value })}
                      aria-pressed={prefs.size === value}
                      className={cn(
                        "flex-1 py-2 rounded-md text-xs border transition",
                        prefs.size === value
                          ? "bg-accent text-canvas border-accent font-medium"
                          : "bg-elev/40 border-line text-dim hover:text-ink hover:bg-elev",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section
                icon={<LetterText size={14} aria-hidden="true" />}
                title="Letter spacing"
              >
                <Toggle
                  label="Wider spacing for low-vision reading"
                  on={prefs.spacing}
                  onChange={(v) => update({ spacing: v })}
                />
              </Section>

              <Section
                icon={<Contrast size={14} aria-hidden="true" />}
                title="High contrast"
              >
                <Toggle
                  label="Boost contrast and saturation"
                  on={prefs.contrast}
                  onChange={(v) => update({ contrast: v })}
                />
              </Section>
            </div>

            <div className="px-5 py-3 border-t border-line bg-elev/30 flex items-center justify-between">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-dim hover:text-ink inline-flex items-center gap-1.5 transition"
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs px-3 py-1.5 rounded border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes a11y-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes a11y-slide {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
        <span className="text-accent/70">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer text-xs text-ink">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "relative inline-flex w-9 h-5 rounded-full transition shrink-0",
          on ? "bg-accent" : "bg-elev",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-canvas transition shadow",
            on && "translate-x-4",
          )}
        />
      </button>
    </label>
  );
}
