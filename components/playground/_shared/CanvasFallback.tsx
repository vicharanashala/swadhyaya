"use client";
import { useState, useEffect } from "react";
import { Box, Layers } from "lucide-react";
import { cn } from "@/lib/cn";

// Detects WebGL availability and the renderer string. Returns null while
// the check is in flight, then either:
//   - "ok" with the renderer string when WebGL works
//   - "fail" with the error reason if the context cannot be created
//
// Browsers without a GPU (or with WebGL disabled) get "fail" — the
// caller can then render a 2D fallback instead of an infinite spinner.
type WebGLState =
  | { status: "checking" }
  | { status: "ok"; renderer: string }
  | { status: "fail"; reason: string };

export function useWebGL(): WebGLState {
  const [state, setState] = useState<WebGLState>({ status: "checking" });
  useEffect(() => {
    if (typeof window === "undefined") {
      setState({ status: "fail", reason: "no window" });
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
      if (!gl) {
        setState({ status: "fail", reason: "WebGL not supported" });
        return;
      }
      // Lose-context listeners tell us if the GPU reset the context
      // (common on machines with weak drivers). Even if creation
      // worked, a lost context counts as "fail" so the 2D fallback
      // takes over.
      const onLost = (e: Event) => {
        e.preventDefault();
        setState({
          status: "fail",
          reason: "GPU lost the WebGL context",
        });
      };
      canvas.addEventListener("webglcontextlost", onLost, { once: true });
      // Pull a renderer string from WEBGL_debug_renderer_info so we can
      // surface it in the loading hint ("Intel Iris Plus" is more
      // informative than just "Loading…").
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "")
        : String(gl.getParameter(gl.RENDERER) ?? "");
      setState({ status: "ok", renderer: renderer || "WebGL renderer" });
      return () => {
        canvas.removeEventListener("webglcontextlost", onLost);
      };
    } catch (err) {
      setState({
        status: "fail",
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }, []);
  return state;
}

// Loader skeleton used by the 3D playgrounds while the WebGL context
// is being established. Three layers of fake planes pulse in sequence
// so the student sees something happening, not just a spinner.
//
// Important: this is rendered server-side (the Playground.tsx dynamic
// imports with ssr:false for 3D, but the loading() callback fires
// before that, so it CAN run on the server). We therefore avoid any
// browser-only APIs in here.
export function CanvasLoadingSkeleton({
  height = 460,
  message = "Loading 3D…",
}: {
  height?: number;
  message?: string;
}) {
  return (
    <div
      className="bg-canvas border border-line rounded-lg flex items-center justify-center relative overflow-hidden"
      style={{ height }}
      aria-busy="true"
      aria-live="polite"
    >
      {/* Animated pulse layers — three translucent squares representing
          the three planes the 3D scene will draw. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-48 h-48">
          <div
            className="absolute inset-0 border-2 border-[#e8864a]/30 rounded-lg"
            style={{
              animation: "pulse 2.4s ease-in-out infinite",
              transform: "rotateX(60deg) rotateZ(-45deg)",
            }}
          />
          <div
            className="absolute inset-0 border-2 border-[#6db3ff]/30 rounded-lg"
            style={{
              animation: "pulse 2.4s ease-in-out infinite 0.3s",
              transform: "rotateX(60deg) rotateZ(45deg)",
            }}
          />
          <div
            className="absolute inset-0 border-2 border-[#4dd9a8]/30 rounded-lg"
            style={{
              animation: "pulse 2.4s ease-in-out infinite 0.6s",
              transform: "rotateX(60deg)",
            }}
          />
        </div>
      </div>
      <div className="relative z-10 text-center">
        <Box size={18} className="mx-auto mb-2 text-faint animate-pulse" />
        <div className="text-xs text-dim">{message}</div>
        <div className="text-[10px] text-faint mt-1 font-mono">
          initialising WebGL…
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
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

// 2D fallback when WebGL is unavailable. Renders each plane as a
// colored stripe on a labelled coordinate, with the system status
// banner underneath. The student still gets the intuition — just
// without the spinning 3D scene.
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
      <div className="flex flex-col items-center justify-center h-full gap-3">
        {planeBars.map((p, i) => (
          <div key={i} className="w-full max-w-md flex items-center gap-3">
            <span
              className="text-[10px] font-mono w-6 text-right"
              style={{ color: p.color }}
            >
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
                {p.isDegenerate
                  ? "degenerate"
                  : `dist=${p.dist?.toFixed(2)}`}
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
