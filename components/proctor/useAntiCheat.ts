"use client";

// useAntiCheat — ported from tenali's useAntiCheat.js.
//
// Hard-blocks the cheater-shortcuts a proctored browser still leaves
// available out of the box. Without this, a student can right-click to
// see options, hit F12 for devtools, Ctrl+U to view source, Ctrl+S to
// save the page (which downloads the React tree as HTML and lets them
// read answers in their IDE), Ctrl+P to print, Ctrl+T for a fresh tab.
//
// `preventDefault` is necessary because blocking the keystroke matters
// more than logging it — most of these have no UI surface to show an
// alert from, so the violation would otherwise be invisible. Reporting
// is a separate concern, run as a side effect.
//
// Notably wider than what swadhyaya's old useProctor listened for:
//   right-click           copy/paste     devtools (F12 / Ctrl+Shift+I / Cmd+Opt+I)
//   view-source (Ctrl+U)  save (Ctrl+S)  print (Ctrl+P)
//   new tab (Ctrl+T)      text selection  image drag
//
// `selectstart` and `dragstart` are caught on the document. They are
// legitimate inside form inputs (selection inside an answer field, drag
// to rearrange), so the handler ignores any element where selection is
// expected to work — <input>, <textarea>, [contenteditable].

import { useCallback, useEffect, useRef } from "react";

export type AntiCheatViolationType =
  | "right_click"
  | "copy_paste"
  | "devtools"
  | "view_source"
  | "save"
  | "print"
  | "new_tab"
  | "select"
  | "drag";

export interface AntiCheatOpts {
  enabled: boolean;
  onAnomaly?: (a: { type: AntiCheatViolationType; severity: number; action?: string }) => void;
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useAntiCheat(opts: AntiCheatOpts): void {
  const { enabled, onAnomaly } = opts;
  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => {
    onAnomalyRef.current = onAnomaly;
  });

  const report = useCallback((type: AntiCheatViolationType, action?: string) => {
    // Severity is uniform for the block; the per-type timing matters more.
    onAnomalyRef.current?.({ type, severity: 1, action });
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const onContextMenu = (e: MouseEvent) => {
      // Allow right-click inside editable controls — students legitimately
      // need it for spellcheck suggestions, paste, etc.
      if (isEditable(e.target)) return;
      e.preventDefault();
      report("right_click");
    };

    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // F12 / Ctrl+Shift+I / Cmd+Opt+I / Ctrl+Shift+J / Cmd+Opt+J
      if (
        e.key === "F12" ||
        (ctrl && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.metaKey && e.altKey && (e.key === "i" || e.key === "j" || e.key === "u"))
      ) {
        e.preventDefault();
        report("devtools", `devtools:${e.key}`);
        return;
      }

      // Ctrl+S — save page (downloads a readable copy of the lesson)
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        report("save", "Ctrl+S");
        return;
      }

      // Ctrl+U / Cmd+Opt+U — view source
      if ((ctrl && !e.shiftKey && e.key.toLowerCase() === "u")) {
        e.preventDefault();
        report("view_source", "Ctrl+U");
        return;
      }

      // Ctrl+P — print
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        report("print", "Ctrl+P");
        return;
      }

      // Ctrl+T — new tab
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        report("new_tab", "Ctrl+T");
        return;
      }

      // Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+A — clipboard + select-all
      if (ctrl && !e.shiftKey) {
        const k = e.key.toLowerCase();
        if (k === "c" || k === "x" || k === "v") {
          // Allow inside editable controls — pasting an answer is the
          // expected workflow on the question prompt.
          if (isEditable(e.target)) return;
          e.preventDefault();
          report("copy_paste", k.toUpperCase());
        }
      }
    };

    const onSelectStart = (e: Event) => {
      if (isEditable(e.target)) return;
      // Most browsers don't let us preventDefault on text-selection of
      // arbitrary nodes without breaking the rest of the UI. Setting
      // selection to empty is the cleanest we can do.
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) sel.removeAllRanges();
      report("select");
    };

    const onDragStart = (e: DragEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      report("drag");
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKey);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dragstart", onDragStart);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, [enabled, report]);
}
