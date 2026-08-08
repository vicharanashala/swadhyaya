"use client";

// usePipWindow — ported from tenali's usePipWindow.js.
//
// Picture-in-Picture proctor window: shows the proctoring camera in a
// persistent floating window that survives Alt-Tab and tab switches.
// Browser-only (Chrome/Edge via Document Picture-in-Picture API).
//
// Why: even with fullscreen enforcement, a student can still Alt-Tab
// to read notes — the proctor feed then disappears. With PiP, the
// feed stays on screen regardless of which window has focus, so the
// reviewer can see whether the student is looking at the lesson or at
// another screen.
//
// Falls back gracefully — if PiP is unsupported or denied, proctoring
// simply runs without the floating window; no error surface.

import { useCallback, useEffect, useRef, useState } from "react";

export interface PipState {
  active: boolean;
  supported: boolean;
  open: () => Promise<void>;
  close: () => void;
  toggle: () => void;
}

export function usePipWindow(opts: {
  stream: MediaStream | null;
  enabled: boolean;
}): PipState {
  const { stream, enabled } = opts;
  const [active, setActive] = useState(false);
  const [supported] = useState(
    () => typeof window !== "undefined" && "documentPictureInPicture" in window,
  );
  const pipWindowRef = useRef<Window | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  const close = useCallback(() => {
    pipWindowRef.current?.close();
    pipWindowRef.current = null;
    pipVideoRef.current = null;
    setActive(false);
  }, []);

  const open = useCallback(async () => {
    if (!supported || !stream || active) return;
    try {
      const pipWindow = await (
        window as unknown as {
          documentPictureInPicture: { requestWindow: (o: { width: number; height: number }) => Promise<Window> };
        }
      ).documentPictureInPicture.requestWindow({ width: 280, height: 210 });

      // Clone the active stylesheets so the PiP body matches the app
      // theme — most useful when the proctor panel renders its own
      // chrome inside the PiP.
      const css = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules ?? [])
              .map((r) => r.cssText)
              .join("\n");
          } catch {
            // Cross-origin stylesheet — skip.
            return "";
          }
        })
        .filter(Boolean)
        .join("\n");
      const style = pipWindow.document.createElement("style");
      style.textContent = css;
      pipWindow.document.head.appendChild(style);

      const video = pipWindow.document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText =
        "width:100%;height:100%;object-fit:cover;transform:scaleX(-1);background:#111";

      if (stream.getVideoTracks().length > 0) {
        video.srcObject = stream;
      }

      pipWindow.document.body.style.cssText =
        "margin:0;padding:0;overflow:hidden;background:#111";
      pipWindow.document.body.appendChild(video);

      pipWindow.addEventListener("pagehide", () => {
        pipWindowRef.current = null;
        pipVideoRef.current = null;
        setActive(false);
      });

      pipWindowRef.current = pipWindow;
      pipVideoRef.current = video;
      setActive(true);
    } catch {
      // PiP denied or unsupported. Stay silent — the proctor surface
      // is best-effort.
    }
  }, [supported, stream, active]);

  const toggle = useCallback(() => {
    if (active) close();
    else void open();
  }, [active, close, open]);

  // Keep the PiP feed synced if the underlying stream changes (e.g.
  // the user revokes and re-grants during the session).
  useEffect(() => {
    const v = pipVideoRef.current;
    if (!v || !stream) return;
    if (v.srcObject !== stream) v.srcObject = stream;
  }, [stream, active]);

  // Tear down on disable.
  useEffect(() => {
    if (!enabled && active) close();
  }, [enabled, active, close]);

  return { active, supported, open, close, toggle };
}
