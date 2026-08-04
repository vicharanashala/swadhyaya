"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { matRref, fmt } from "@/lib/math";
import { Slider } from "./Slider";

// Concept F1: The Four Fundamental Subspaces
// "For an m×n matrix A: C(A)⊥N(Aᵀ), R(A)⊥N(A). Two pairs of orthogonal subspaces."

export function FourSubspacesPlayground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(6);
  const [e, setE] = useState(1);
  const [f, setF] = useState(1);

  // A is 2x3 (m=2, n=3)
  // Col space ⊂ R^2, Row space = Col(A^T) ⊂ R^3
  // Null space ⊂ R^3 (3D), Left null space ⊂ R^2 (2D)

  // Compute basis for each
  const subspaces = useMemo(() => {
    // A^T = [[a, c, e], [b, d, f]]  (3x2)
    // R(A) = column space of A^T
    // N(A) = null space of A (3x3 -> 3D)
    // C(A) = column space of A (2D) — 2 columns
    // N(A^T) = null space of A^T (2x2 -> 2D)

    const col1 = { x: a, y: c };
    const col2 = { x: b, y: d };
    const col3 = { x: e, y: f };
    // Row space basis = col space of A^T
    const row1 = { x: a, y: b, z: e };
    const row2 = { x: c, y: d, z: f };
    // C(A) rank
    const det = a * d - b * c;
    const det2 = a * f - b * e;
    const det3 = c * f - d * e;
    const rankA = [det, det2, det3].filter(d => Math.abs(d) > 1e-9).length;
    return {
      col1, col2, col3,
      row1, row2,
      rankA,
    };
  }, [a, b, c, d, e, f]);

  // Determine N(A) basis by row reducing A
  const nullBasis = useMemo(() => {
    const A = [[a, b, e], [c, d, f]];
    const { rref, pivots } = matRref(A);
    const n = 3;
    const free: number[] = [];
    for (let j = 0; j < n; j++) if (!pivots.includes(j)) free.push(j);
    const basis: number[][] = [];
    for (const f of free) {
      const v = new Array(n).fill(0);
      v[f] = 1;
      for (let i = 0; i < pivots.length; i++) {
        v[pivots[i]] = -rref[i][f];
      }
      basis.push(v);
    }
    return basis;
  }, [a, b, c, d, e, f]);

  // Visual scaling — make things visible in 2D
  const SCALE = 1;

  // Build the "C(A) plane" — 2D plane, render as parallelogram
  const colPlane = useMemo(() => {
    if (subspaces.rankA >= 2) {
      // Full plane — show the unit square in col space
      return [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
        { x: 0, y: 5 },
      ];
    }
    // Line: col1 (or col2 if col1 is zero)
    const v = (Math.abs(subspaces.col1.x) + Math.abs(subspaces.col1.y)) > 0.01 ? subspaces.col1 : subspaces.col2;
    return null;
  }, [subspaces]);

  // N(A^T) — left null space of A in 2D
  const leftNullVec = useMemo(() => {
    // A^T is 3x2, so N(A^T) is 2D... unless rank is 2, then N(A^T) is trivial
    // rank(A) = rank(A^T)
    if (subspaces.rankA === 2) return null;
    // For rank 1: the row space is 1D, so N(A^T) is 1D
    // Find the vector perpendicular to the columns in 2D
    const c1 = subspaces.col1;
    const c2 = subspaces.col2;
    // Perpendicular to both
    // In 2D, perpendicular is rotation by 90°
    // Take perpendicular of (c1 if non-zero else c2)
    const v = (Math.abs(c1.x) + Math.abs(c1.y)) > 0.01 ? c1 : c2;
    return { x: -v.y, y: v.x };
  }, [subspaces]);

  // Project N(A) to 2D for visualization (project onto the first 2 components)
  const nullVec2D = nullBasis[0] ? { x: nullBasis[0][0], y: nullBasis[0][1] } : null;

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        The four fundamental subspaces of A (2×3)
      </h3>
      <p className="text-xs text-dim mb-4">
        Drag the 6 entries of A. Watch the four subspaces: C(A) in blue, N(Aᵀ) in orange,
        R(A) in purple, N(A) in green. The two pairs are perpendicular.
      </p>

      <div className="grid md:grid-cols-[1fr_280px] gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">C(A) ⊂ R² (blue) &nbsp;|&nbsp; N(Aᵀ) ⊂ R² (orange) &nbsp;|&nbsp; N(A) projected (green)</div>
          <VectorCanvas
            width={460}
            height={460}
            worldSize={5}
            arrows={[
              { from: { x: 0, y: 0 }, to: subspaces.col1, color: "var(--matrix)", label: "col 1", width: 3, labelOffset: { x: 0, y: -0.3 } },
              { from: { x: 0, y: 0 }, to: subspaces.col2, color: "var(--matrix)", label: "col 2", width: 3, labelOffset: { x: 0, y: 0.3 } },
              ...(leftNullVec
                ? [
                    { from: { x: 0, y: 0 }, to: { x: leftNullVec.x * 3, y: leftNullVec.y * 3 }, color: "var(--warn)", label: "N(Aᵀ)", width: 3, dashed: true },
                    { from: { x: 0, y: 0 }, to: { x: -leftNullVec.x * 3, y: -leftNullVec.y * 3 }, color: "var(--warn)", width: 3, dashed: true },
                  ]
                : []),
              ...(nullVec2D
                ? [
                    { from: { x: 0, y: 0 }, to: { x: nullVec2D.x * 3, y: nullVec2D.y * 3 }, color: "var(--eigen)", label: "N(A)", width: 2, dashed: true },
                  ]
                : []),
            ]}
            polygons={colPlane ? [{
              points: colPlane,
              fill: "var(--matrix)",
              stroke: "var(--matrix)",
              fillOpacity: 0.1,
            }] : []}
          />
        </div>

        <div className="space-y-3">
          <div className="bg-card border border-line rounded-xl p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A (2×3)</div>
            <div className="font-mono text-sm grid grid-cols-3 gap-1">
              {[0, 1].map(i => (
                <div key={i} className="contents">
                  <input type="number" step={0.1} value={[a, c][i]} onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    if (i === 0) setA(v); else setC(v);
                  }} className="w-full bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
                </div>
              ))}
              {[0, 1].map(i => (
                <div key={i} className="contents">
                  <input type="number" step={0.1} value={[b, d][i]} onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    if (i === 0) setB(v); else setD(v);
                  }} className="w-full bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
                </div>
              ))}
              {[0, 1].map(i => (
                <div key={i} className="contents">
                  <input type="number" step={0.1} value={[e, f][i]} onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    if (i === 0) setE(v); else setF(v);
                  }} className="w-full bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim space-y-1">
            <div>rank(A) = <span className="text-accent font-mono">{subspaces.rankA}</span></div>
            <div>dim C(A) = <span className="text-matrix font-mono">{subspaces.rankA}</span></div>
            <div>dim R(A) = <span className="text-eigen font-mono">{subspaces.rankA}</span></div>
            <div>dim N(A) = <span className="text-warn font-mono">{3 - subspaces.rankA}</span></div>
            <div>dim N(Aᵀ) = <span className="text-warn font-mono">{2 - subspaces.rankA}</span></div>
            {subspaces.rankA < 2 && (
              <div className="text-accent mt-2 pt-2 border-t border-line/40">
                C(A) and N(Aᵀ) are perpendicular ({subspaces.rankA === 1 ? "a line ⊥ a line" : "a point ⊥ a plane"}).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
