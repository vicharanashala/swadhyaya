"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept T1: What is a Transformation?
// "Take every point, move it somewhere. A function between spaces."

export function TransformationPlayground() {
  const [mode, setMode] = useState<"point" | "function">("point");
  const [target, setTarget] = useState({ x: 2, y: 3 });
  const [fn, setFn] = useState("rotate");

  // For "function" mode, apply a global transformation
  const gridPoints = Array.from({ length: 9 }, (_, i) => {
    const x = (i % 3 - 1) * 2;
    const y = (Math.floor(i / 3) - 1) * 2;
    let tx = x, ty = y;
    if (fn === "rotate") { tx = -y; ty = x; }
    else if (fn === "scale") { tx = x * 1.5; ty = y * 1.5; }
    else if (fn === "shear") { tx = x + y * 0.5; ty = y; }
    else if (fn === "flip") { tx = -x; ty = y; }
    return { from: { x, y }, to: { x: tx, y: ty } };
  });

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-ink">
            A transformation: every point goes somewhere
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setMode("point")}
              className={`text-xs px-2 py-1 rounded ${mode === "point" ? "bg-accent text-canvas" : "border border-line text-dim"}`}
            >
              Single point
            </button>
            <button
              onClick={() => setMode("function")}
              className={`text-xs px-2 py-1 rounded ${mode === "function" ? "bg-accent text-canvas" : "border border-line text-dim"}`}
            >
              Function on grid
            </button>
          </div>
        </div>

        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={mode === "point" ? [
            { from: { x: 0, y: 0 }, to: { x: 1.5, y: 1 }, color: "var(--ink-faint)", label: "v", width: 2, dashed: true },
            { from: { x: 0, y: 0 }, to: target, color: "var(--accent)", label: "T(v)", width: 3 },
          ] : []}
        >
          {mode === "function" && gridPoints.map((p, i) => (
            <g key={i}>
              <line
                x1={520 / 2 + p.from.x * (520 / 10)}
                y1={520 / 2 - p.from.y * (520 / 10)}
                x2={520 / 2 + p.to.x * (520 / 10)}
                y2={520 / 2 - p.to.y * (520 / 10)}
                stroke="var(--transform)"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.4}
              />
              <circle cx={520 / 2 + p.from.x * (520 / 10)} cy={520 / 2 - p.from.y * (520 / 10)} r={2} fill="var(--ink-faint)" opacity={0.5} />
              <circle cx={520 / 2 + p.to.x * (520 / 10)} cy={520 / 2 - p.to.y * (520 / 10)} r={3} fill="var(--accent)" />
            </g>
          ))}
        </VectorCanvas>
      </div>

      <div className="space-y-3">
        {mode === "point" ? (
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Where the point lands</div>
            <Slider label="x" value={target.x} min={-4} max={4} step={0.1} onChange={(x) => setTarget({ x, y: target.y })} />
            <Slider label="y" value={target.y} min={-4} max={4} step={0.1} onChange={(y) => setTarget({ x: target.x, y })} />
            <div className="mt-3 text-xs text-dim leading-relaxed">
              You are the transformation. Drag to choose where the input point lands.
              This is a &ldquo;point&rdquo; map — not a function (yet).
            </div>
          </div>
        ) : (
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Pick a function</div>
            <div className="grid grid-cols-2 gap-1">
              {["rotate", "scale", "shear", "flip"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFn(f)}
                  className={`text-xs px-2 py-1.5 rounded ${fn === f ? "bg-accent text-canvas" : "border border-line text-dim"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-dim leading-relaxed">
              The same rule applied to every point. Notice: the grid stays a grid (rotated / scaled / sheared, but still a grid). That&apos;s what &ldquo;well-behaved&rdquo; means.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
