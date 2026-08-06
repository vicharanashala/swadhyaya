"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Layers } from "lucide-react";
import { cn } from "@/lib/cn";

// Detects WebGL availability with a hard timeout.
//
// IMPORTANT: synchronous WebGL calls (`getContext`, `getExtension`,
// `getParameter`) can hang indefinitely on some GPUs / drivers. Without a
// timeout, the UI gets stuck on the "Loading 3D…" skeleton forever.
//
// Returns [state, retry] so callers can let the user manually re-probe
// if the probe times out the first time.

type WebGLState =
  | { status: "checking" }
  | { status: "ok"; renderer: string }
  | { status: "fail"; reason: string };

const WEBGL_PROBE_TIMEOUT_MS = 2000;

function probeWebGL(): { ok: true; renderer: string } | { ok: false; reason: string } {
  if (typeof window === "undefined") return { ok: false, reason: "no window" };
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return { ok: false, reason: "WebGL not supported" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "")
      : String(gl.getParameter(gl.RENDERER) ?? "");
    return { ok: true, renderer: renderer || "WebGL renderer" };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

export function useWebGL(
  timeoutMs: number = WEBGL_PROBE_TIMEOUT_MS,
): [WebGLState, () => void] {
  const [state, setState] = useState<WebGLState>({ status: "checking" });
  const attemptRef = useRef(0);

  const check = useCallback(() => {
    const attempt = ++attemptRef.current;
    setState({ status: "checking" });

    let settled = false;
    const settle = (next: WebGLState) => {
      if (settled) return;
      settled = true;
      // Only apply if this attempt is still the active one.
      if (attemptRef.current === attempt) setState(next);
    };

    // Hard timeout — the single most important addition. Without this,
    // a hung GPU probe locks the UI on "Loading 3D…" forever.
    const timer = setTimeout(() => {
      settle({ status: "fail", reason: `WebGL probe timed out after ${timeoutMs} ms` });
    }, timeoutMs);

    // Defer the probe one microtask so React has committed the
    // "checking" state first — this guarantees the skeleton flashes
    // briefly even when the probe is instant, which avoids a layout
    // thrash and feels like a deliberate "starting" moment.
    queueMicrotask(() => {
      const result = probeWebGL();
      clearTimeout(timer);
      if (result.ok) settle({ status: "ok", renderer: result.renderer });
      else settle({ status: "fail", reason: result.reason });
    });
  }, [timeoutMs]);

  useEffect(() => {
    check();
    return () => {
      // Invalidate any in-flight attempt.
      attemptRef.current++;
    };
  }, [check]);

  return [state, check];
}

// CanvasLoadingSkeleton — 3-pulse animated placeholder.
// Three translucent, animated tilted squares representing the three planes,
// pulsing in sequence. Box icon, "Loading 3D…" message, "initialising WebGL…"
// monospace subtext. Rendered server-side (dynamic import ssr:false can fire
// the loading() callback on the server).
export function CanvasLoadingSkeleton({
  height = 460,
  message = "Loading 3D…",
  subtext = "initialising WebGL…",
}: {
  height?: number;
  message?: string;
  subtext?: string;
}) {
  return (
    <div
      className="bg-canvas border border-line rounded-lg flex items-center justify-center relative overflow-hidden"
      style={{ height }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-48 h-48">
          <div
            className="absolute inset-0 border-2 border-[#e8864a]/30 rounded-lg"
            style={{
              animation: "pg-pulse 2.4s ease-in-out infinite",
              transform: "rotateX(60deg) rotateZ(-45deg)",
            }}
          />
          <div
            className="absolute inset-0 border-2 border-[#6db3ff]/30 rounded-lg"
            style={{
              animation: "pg-pulse 2.4s ease-in-out infinite 0.3s",
              transform: "rotateX(60deg) rotateZ(45deg)",
            }}
          />
          <div
            className="absolute inset-0 border-2 border-[#4dd9a8]/30 rounded-lg"
            style={{
              animation: "pg-pulse 2.4s ease-in-out infinite 0.6s",
              transform: "rotateX(60deg)",
            }}
          />
        </div>
      </div>
      <div className="relative z-10 text-center">
        <Box size={18} className="mx-auto mb-2 text-faint animate-pulse" />
        <div className="text-xs text-dim">{message}</div>
        <div className="text-[10px] text-faint mt-1 font-mono">{subtext}</div>
      </div>
      <style jsx>{`
        @keyframes pg-pulse {
          0%,
          100% {
            opacity: 0.25;
            transform: rotateX(60deg) rotateZ(-45deg) scale(0.95);
          }
          50% {
            opacity: 0.7;
            transform: rotateX(60deg) rotateZ(-45deg) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

// CanvasLoadingWithRetry — wraps the loading state with a retry button that
// becomes visible after a grace period. If the WebGL probe hangs past
// `graceMs`, the user sees the skeleton PLUS a "Retry / Use 2D fallback"
// action so they can never be permanently stuck.
export function CanvasLoadingWithRetry({
  height = 460,
  onRetry,
  onForce2D,
  graceMs = 2500,
}: {
  height?: number;
  onRetry: () => void;
  onForce2D: () => void;
  graceMs?: number;
}) {
  const [showEscape, setShowEscape] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowEscape(true), graceMs);
    return () => clearTimeout(t);
  }, [graceMs]);

  return (
    <div className="relative" style={{ height }}>
      <CanvasLoadingSkeleton height={height} />
      {showEscape && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/85 backdrop-blur-sm">
          <div className="text-center max-w-xs">
            <div className="text-xs text-dim mb-3 leading-relaxed">
              Taking longer than expected. Your GPU may be blocked or busy.
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="text-xs px-3 py-1.5 rounded border border-line bg-elev hover:bg-elev/70 text-ink transition"
              >
                Retry 3D
              </button>
              <button
                type="button"
                onClick={onForce2D}
                className="text-xs px-3 py-1.5 rounded border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent transition"
              >
                Use 2D fallback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Canvas2DFallback — renders plane stripes + distance bars when WebGL is
// unavailable. Inputs: rows[ [a,b,c,d] ] × 3, solutionLabel, height.
export function Canvas2DFallback({
  rows,
  solutionLabel,
  height = 460,
}: {
  rows: [number, number, number, number][];
  solutionLabel: string;
  height?: number;
}) {
  const colors = ["#e8864a", "#6db3ff", "#4dd9a8"];
  const labels = ["P1", "P2", "P3"];
  const planeBars = rows.map((r, i) => {
    const [a, b, c, d] = r;
    const nLen = Math.hypot(a, b, c);
    const isDegenerate = nLen < 1e-6;
    const dist = isDegenerate ? null : Math.abs(d) / nLen;
    const tilt = isDegenerate
      ? 0
      : Math.atan2(Math.hypot(b, c), Math.abs(a)) * (180 / Math.PI);
    return { ...r, color: colors[i]!, label: labels[i]!, dist, tilt, isDegenerate };
  });
  return (
    <div
      className="bg-canvas border border-line rounded-lg p-4 relative overflow-hidden"
      style={{ height }}
      role="img"
      aria-label="2D fallback showing plane stripes"
    >
      <div className="absolute top-3 left-3 text-[10px] text-faint uppercase tracking-wider flex items-center gap-1.5 font-mono">
        <Layers size={11} aria-hidden="true" />
        2D fallback (WebGL unavailable)
      </div>
      <div className="flex flex-col items-center justify-center h-full gap-3 pt-4">
        {planeBars.map((p, i) => (
          <div key={i} className="w-full max-w-md flex items-center gap-3">
            <span className="text-[10px] font-mono w-6 text-right" style={{ color: p.color }}>
              {p.label}
            </span>
            <div className="flex-1 relative h-8 bg-elev/40 rounded overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-1/2 h-full origin-center border-2 border-dashed rounded",
                  p.isDegenerate && "opacity-40",
                )}
                style={{
                  width: `${Math.min(100, 60 + p.tilt)}%`,
                  transform: `translateX(-50%) rotate(${p.tilt - 30}deg)`,
                  borderColor: p.color,
                  background: `${p.color}22`,
                }}
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono"
                style={{ color: p.color }}
              >
                {p.isDegenerate ? "degenerate" : `dist=${p.dist?.toFixed(2)}`}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-[10px] font-mono text-center text-dim bg-elev/60 rounded px-2 py-1">
        {solutionLabel}
      </div>
    </div>
  );
}
