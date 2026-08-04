"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept F3: Linear Functionals — A function to a number
// "f: V → R. Linear. The dot product is the classic example."

export function FunctionalPlayground() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);
  const [vX, setVX] = useState(2);
  const [vY, setVY] = useState(1);

  const fv = w1 * vX + w2 * vY;
  const wLen = Math.hypot(w1, w2);
  // Level set f(v) = c: line w1·x + w2·y = c
  // Perpendicular to w
  // Passes through (c·w1/wLen², c·w2/wLen²)
  const showLevelSet = (c: number) => {
    if (wLen < 0.01) return null;
    // Two points on the line w1·x + w2·y = c, perpendicular to w
    // Direction perpendicular to w: (-w2, w1)
    // Center: c/w_len² · w
    const cx = (c * w1) / (w1 * w1 + w2 * w2);
    const cy = (c * w2) / (w1 * w1 + w2 * w2);
    return [
      { x: cx - w2 * 4, y: cy + w1 * 4 },
      { x: cx + w2 * 4, y: cy - w1 * 4 },
    ];
  };
  const levelSet0 = showLevelSet(0);
  const levelSetFV = showLevelSet(fv);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          A linear functional f(v) = w·v
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: w1, y: w2 }, color: "var(--eigen)", label: "w", width: 3, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: { x: vX, y: vY }, color: "var(--matrix)", label: "v", width: 3, labelOffset: { x: 0, y: 0.3 } },
          ]}
        >
          {levelSet0 && (
            <line
              x1={520/2 + levelSet0[0].x * (520/10)}
              y1={520/2 - levelSet0[0].y * (520/10)}
              x2={520/2 + levelSet0[1].x * (520/10)}
              y2={520/2 - levelSet0[1].y * (520/10)}
              stroke="var(--faint, var(--ink-faint))"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.4}
            />
          )}
          {levelSetFV && (
            <line
              x1={520/2 + levelSetFV[0].x * (520/10)}
              y1={520/2 - levelSetFV[0].y * (520/10)}
              x2={520/2 + levelSetFV[1].x * (520/10)}
              y2={520/2 - levelSetFV[1].y * (520/10)}
              stroke="var(--accent)"
              strokeWidth={2}
            />
          )}
        </VectorCanvas>
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--eigen)" }}>The functional w</div>
          <Slider label="w₁" value={w1} min={-3} max={3} step={0.1} onChange={setW1} />
          <Slider label="w₂" value={w2} min={-3} max={3} step={0.1} onChange={setW2} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>The input v</div>
          <Slider label="x" value={vX} min={-4} max={4} step={0.1} onChange={setVX} />
          <Slider label="y" value={vY} min={-4} max={4} step={0.1} onChange={setVY} />
        </div>
        <div className="bg-elev/40 border border-line rounded p-3 text-xs space-y-1">
          <div className="text-faint">f(v) = w · v =</div>
          <div className="text-accent text-2xl font-mono text-center">
            {fv.toFixed(3)}
          </div>
          <div className="text-faint text-[10px]">
            Dashed grey = level set f(v)=0. Orange = level set f(v)=fv.
            Both lines are perpendicular to w.
          </div>
        </div>
      </div>
    </div>
  );
}
