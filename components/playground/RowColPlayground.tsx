"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept F2: Row Space and Column Space
// "Row space of A = column space of Aᵀ. Same dimension (the rank), different home."

export function RowColPlayground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(6);
  const [e, setE] = useState(0);
  const [f, setF] = useState(0);

  // A is 2x3
  // Col(A) ⊂ R^2: span of (a,c), (b,d), (e,f)
  // Row(A) ⊂ R^3: span of (a,b,e), (c,d,f)

  const colSpace = useMemo(() => {
    // 2D space — show the span
    const points: Array<{ x: number; y: number; a: number }> = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        points.push({
          x: i * a + j * b + (e ? i * e : 0),
          y: i * c + j * d + (f ? i * f : 0),
          a: 0.3,
        });
      }
    }
    return points;
  }, [a, b, c, d, e, f]);

  // Row space: span of (a,b,e) and (c,d,f) in 3D — but we can only show 2D
  // Project onto the plane: take first 2 components
  const rowSpace2D = useMemo(() => {
    const points: Array<{ x: number; y: number; a: number }> = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        points.push({
          x: i * a + j * c,
          y: i * b + j * d,
          a: 0.3,
        });
      }
    }
    return points;
  }, [a, b, c, d]);

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        Row space of A = Column space of Aᵀ
      </h3>
      <p className="text-xs text-dim mb-3">
        Both have the same dimension (= rank of A). They live in different spaces,
        but they are the "same thing" under transposition.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">C(A) ⊂ R² (column space)</div>
          <VectorCanvas
            width={320}
            height={320}
            worldSize={6}
            arrows={[
              { from: { x: 0, y: 0 }, to: { x: a, y: c }, color: "var(--matrix)", label: "col 1", width: 2.5 },
              { from: { x: 0, y: 0 }, to: { x: b, y: d }, color: "var(--matrix)", label: "col 2", width: 2.5 },
            ]}
          >
            {colSpace.map((p, i) => (
              <circle key={i} cx={320/2 + p.x * (320/12)} cy={320/2 - p.y * (320/12)} r={2} fill="var(--matrix)" opacity={p.a} />
            ))}
          </VectorCanvas>
        </div>
        <div className="bg-canvas border border-line rounded p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">R(A) = C(Aᵀ) (row space, projected)</div>
          <VectorCanvas
            width={320}
            height={320}
            worldSize={6}
            arrows={[
              { from: { x: 0, y: 0 }, to: { x: a, y: b }, color: "var(--eigen)", label: "row 1", width: 2.5 },
              { from: { x: 0, y: 0 }, to: { x: c, y: d }, color: "var(--eigen)", label: "row 2", width: 2.5 },
            ]}
          >
            {rowSpace2D.map((p, i) => (
              <circle key={i} cx={320/2 + p.x * (320/12)} cy={320/2 - p.y * (320/12)} r={2} fill="var(--eigen)" opacity={p.a} />
            ))}
          </VectorCanvas>
        </div>
      </div>

      <div className="mt-3 bg-elev/40 border border-line rounded p-3 text-xs text-dim space-y-1">
        <div>Edit A:</div>
        <div className="grid grid-cols-6 gap-1 mt-1">
          <input type="number" step={0.1} value={a} onChange={(e) => setA(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={b} onChange={(e) => setB(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={c} onChange={(e) => setC(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={d} onChange={(e) => setD(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={e} onChange={(e) => setE(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={f} onChange={(e) => setF(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
        </div>
        <div className="text-accent mt-2">
          Both spaces have rank = (visible blue/eigen area). The blue points and eigen points are
          always equal in extent — the "shape" is the same, just the home is different.
        </div>
      </div>
    </div>
  );
}
