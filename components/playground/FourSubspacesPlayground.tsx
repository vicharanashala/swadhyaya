"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { matRref, fmt } from "@/lib/math";
import { Slider } from "./Slider";
import {
  TeX,
  MatrixHeatmap,
  ValueBar,
} from "@/components/viz/VisualPrimitives";

// Concept F1: The Four Fundamental Subspaces
// "For an m×n matrix A: C(A)⊥N(Aᵀ), R(A)⊥N(A). Two pairs of orthogonal subspaces."

export function FourSubspacesPlayground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(6);
  const [e, setE] = useState(1);
  const [f, setF] = useState(1);

  const A = [[a, b, e], [c, d, f]];

  const subspaces = useMemo(() => {
    const col1 = { x: a, y: c };
    const col2 = { x: b, y: d };
    const col3 = { x: e, y: f };
    const row1 = { x: a, y: b, z: e };
    const row2 = { x: c, y: d, z: f };
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

  const nullBasis = useMemo(() => {
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

  const colPlane = useMemo(() => {
    if (subspaces.rankA >= 2) {
      return [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
        { x: 0, y: 5 },
      ];
    }
    return null;
  }, [subspaces]);

  const leftNullVec = useMemo(() => {
    if (subspaces.rankA === 2) return null;
    const c1 = subspaces.col1;
    const c2 = subspaces.col2;
    const v = (Math.abs(c1.x) + Math.abs(c1.y)) > 0.01 ? c1 : c2;
    return { x: -v.y, y: v.x };
  }, [subspaces]);

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
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A — color = magnitude</div>
            <MatrixHeatmap matrix={A} max={6} />
            <div className="font-mono text-sm grid grid-cols-3 gap-1 mt-3">
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

          <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs space-y-2">
            <div className="text-[10px] text-faint uppercase tracking-wider">
              Fundamental theorem
            </div>
            <div className="leading-relaxed">
              <TeX math={`\\dim(C(A)) + \\dim(N(A)) = n = 3`} />
            </div>
            <div className="leading-relaxed">
              <TeX math={`\\dim(C(A^T)) + \\dim(N(A^T)) = m = 2`} />
            </div>
            <div className="space-y-1.5 mt-2">
              <ValueBar value={subspaces.rankA} min={0} max={2} color="var(--matrix)" label="dim C(A)" />
              <ValueBar value={subspaces.rankA} min={0} max={2} color="var(--eigen)" label="dim R(A)" />
              <ValueBar value={3 - subspaces.rankA} min={0} max={3} color="var(--warn)" label="dim N(A)" />
              <ValueBar value={2 - subspaces.rankA} min={0} max={2} color="var(--warn)" label="dim N(Aᵀ)" />
            </div>
            {subspaces.rankA < 2 && (
              <div className="text-accent mt-2 pt-2 border-t border-line/40 leading-relaxed">
                C(A) and N(Aᵀ) are perpendicular ({subspaces.rankA === 1 ? "a line ⊥ a line" : "a point ⊥ a plane"}).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
