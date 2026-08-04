"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept T2: Why LINEAR Matters
// "Linear transformations preserve add and scale. The grid stays a grid. Parallel stays parallel."

export function LinearMattersPlayground() {
  const [nonlinear, setNonlinear] = useState(false);
  const [stretch, setStretch] = useState(1.5);

  // Build the grid points and apply either a linear (scaling) or nonlinear (sine-curve) warp
  const gridPoints = Array.from({ length: 81 }, (_, i) => {
    const x = (i % 9 - 4) * 0.8;
    const y = (Math.floor(i / 9) - 4) * 0.8;
    let tx = x * stretch;
    let ty = nonlinear ? y * (1 + 0.4 * Math.sin(x * 1.5)) : y;
    return { from: { x, y }, to: { x: tx, y: ty } };
  });

  // Pick a pair of parallel lines: y=0 and y=2 (horizontal)
  const parallelFrom = { y: -3, x: -3 };
  const parallelTo = { y: -3, x: 3 };
  const parallelFrom2 = { y: 2, x: -3 };
  const parallelTo2 = { y: 2, x: 3 };
  // after warp (nonlinear only y)
  const parallelFromT = { y: nonlinear ? -3 * (1 + 0.4 * Math.sin(-3 * 1.5)) : -3, x: -3 };
  const parallelToT = { y: nonlinear ? -3 * (1 + 0.4 * Math.sin(3 * 1.5)) : -3, x: 3 };
  const parallelFrom2T = { y: nonlinear ? 2 * (1 + 0.4 * Math.sin(-3 * 1.5)) : 2, x: -3 };
  const parallelTo2T = { y: nonlinear ? 2 * (1 + 0.4 * Math.sin(3 * 1.5)) : 2, x: 3 };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Why "linear" matters: parallel stays parallel
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={4.5}
          arrows={[]}
        >
          {gridPoints.map((p, i) => (
            <line
              key={i}
              x1={520 / 2 + p.from.x * (520 / 9)}
              y1={520 / 2 - p.from.y * (520 / 9)}
              x2={520 / 2 + p.to.x * (520 / 9)}
              y2={520 / 2 - p.to.y * (520 / 9)}
              stroke="var(--ink-faint)"
              strokeWidth={0.5}
              opacity={nonlinear ? 0.25 : 0.5}
            />
          ))}
          {gridPoints.map((p, i) => (
            <circle
              key={`p-${i}`}
              cx={520 / 2 + p.to.x * (520 / 9)}
              cy={520 / 2 - p.to.y * (520 / 9)}
              r={1.5}
              fill={nonlinear ? "var(--warn)" : "var(--transform)"}
            />
          ))}
          {/* The two parallel lines */}
          <line
            x1={520 / 2 + parallelFrom.x * (520 / 9)}
            y1={520 / 2 - parallelFrom.y * (520 / 9)}
            x2={520 / 2 + parallelTo.x * (520 / 9)}
            y2={520 / 2 - parallelTo.y * (520 / 9)}
            stroke="var(--vector)"
            strokeWidth={1.5}
          />
          <line
            x1={520 / 2 + parallelFromT.x * (520 / 9)}
            y1={520 / 2 - parallelFromT.y * (520 / 9)}
            x2={520 / 2 + parallelToT.x * (520 / 9)}
            y2={520 / 2 - parallelToT.y * (520 / 9)}
            stroke="var(--vector)"
            strokeWidth={2.5}
          />
          <line
            x1={520 / 2 + parallelFrom2.x * (520 / 9)}
            y1={520 / 2 - parallelFrom2.y * (520 / 9)}
            x2={520 / 2 + parallelTo2.x * (520 / 9)}
            y2={520 / 2 - parallelTo2.y * (520 / 9)}
            stroke="var(--matrix)"
            strokeWidth={1.5}
          />
          <line
            x1={520 / 2 + parallelFrom2T.x * (520 / 9)}
            y1={520 / 2 - parallelFrom2T.y * (520 / 9)}
            x2={520 / 2 + parallelTo2T.x * (520 / 9)}
            y2={520 / 2 - parallelTo2T.y * (520 / 9)}
            stroke="var(--matrix)"
            strokeWidth={2.5}
          />
        </VectorCanvas>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Mode</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setNonlinear(false)}
              className={`text-xs px-2 py-1.5 rounded ${!nonlinear ? "bg-accent text-canvas" : "border border-line text-dim"}`}
            >
              Linear
            </button>
            <button
              onClick={() => setNonlinear(true)}
              className={`text-xs px-2 py-1.5 rounded ${nonlinear ? "bg-warn text-canvas" : "border border-line text-dim"}`}
            >
              Nonlinear
            </button>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <Slider label="x-stretch" value={stretch} min={0.5} max={2.5} step={0.05} onChange={setStretch} />
          <div className="mt-3 text-xs text-dim leading-relaxed">
            {nonlinear
              ? "The grid warped unevenly — y gets squished at some x's, stretched at others. The two parallel lines are no longer parallel: the orange one got tilted by the sine. THIS is what 'not linear' looks like."
              : "The grid warped evenly. The two parallel lines (orange and blue) stay parallel. This is linear."}
          </div>
        </div>
      </div>
    </div>
  );
}
