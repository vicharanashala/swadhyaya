"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept V8: Dimension — the count of basis vectors
// "Every basis of a space has the same size. That size IS the dimension."

export function DimensionPlayground() {
  const [dim, setDim] = useState(2);
  const [basisX, setBasisX] = useState(2);
  const [basisY, setBasisY] = useState(2);

  // Generate basis vectors for the current dim
  const basis = useMemo(() => {
    if (dim === 1) {
      return [{ x: basisX, y: 0 }];
    } else {
      return [{ x: basisX, y: 0 }, { x: 0, y: basisY }];
    }
  }, [dim, basisX, basisY]);

  // Sample points
  const points = useMemo(() => {
    if (dim === 1) {
      const out: Array<{ x: number; y: number; a: number }> = [];
      for (let i = -4; i <= 4; i++) out.push({ x: i * basis[0].x, y: 0, a: 0.3 });
      return out;
    }
    const out: Array<{ x: number; y: number; a: number }> = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        out.push({
          x: i * basis[0].x + j * basis[1].x,
          y: i * basis[0].y + j * basis[1].y,
          a: 0.2,
        });
      }
    }
    return out;
  }, [dim, basis]);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          A {dim}D space has {dim} basis vectors. Always.
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={6}
          arrows={basis.map((b, i) => ({
            from: { x: 0, y: 0 },
            to: b,
            color: i === 0 ? "var(--vector)" : "var(--matrix)",
            label: `b${i + 1}`,
            width: 3,
            labelOffset: { x: 0, y: -0.3 - i * 0.3 },
          }))}
        >
          {points.map((p, i) => (
            <circle
              key={i}
              cx={520 / 2 + p.x * (520 / 12)}
              cy={520 / 2 - p.y * (520 / 12)}
              r={2}
              fill="var(--transform)"
              opacity={p.a}
            />
          ))}
        </VectorCanvas>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Dimension</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setDim(1)}
              className={`text-xs px-2 py-1.5 rounded ${dim === 1 ? "bg-accent text-canvas" : "border border-line text-dim"}`}
            >
              1D (a line)
            </button>
            <button
              onClick={() => setDim(2)}
              className={`text-xs px-2 py-1.5 rounded ${dim === 2 ? "bg-accent text-canvas" : "border border-line text-dim"}`}
            >
              2D (a plane)
            </button>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Basis length(s)</div>
          {dim >= 1 && (
            <Slider label="b₁" value={basisX} min={0.5} max={4} step={0.1} onChange={setBasisX} />
          )}
          {dim >= 2 && (
            <Slider label="b₂" value={basisY} min={0.5} max={4} step={0.1} onChange={setBasisY} />
          )}
        </div>

        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim leading-relaxed">
          Notice: in {dim}D, the points form a <span className="text-accent">{dim === 1 ? "line" : "grid"}</span>.
          {dim === 2 && " The two basis vectors can be any length, any direction (as long as independent) — but there are always exactly 2 of them."}
          {dim === 1 && " A single arrow. Any line through the origin is a 1D space."}
        </div>
      </div>
    </div>
  );
}
