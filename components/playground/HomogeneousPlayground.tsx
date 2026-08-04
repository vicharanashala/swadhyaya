"use client";
import { useState, useMemo } from "react";
import { matRref, matNullSpace, fmt } from "@/lib/math";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { RotateCcw } from "lucide-react";

// Concept L8: Homogeneous vs Non-Homogeneous
// "Ax = 0 always has at least x = 0. The question: is there MORE?"
// "Ax = b might have 0, 1, or infinite answers."

export function HomogeneousPlayground() {
  const [A, setA] = useState([[2, 1], [4, 2]]); // rank 1, null space = a line
  const [b, setB] = useState([3, 6]); // if A is 2x2 with rank 1, this is consistent → infinite
  const [mode, setMode] = useState<"homo" | "hetero">("homo");

  // Compute the null space and the specific solution (or inconsistency)
  const nullBasis = useMemo(() => matNullSpace(A), [A]);

  // Try to solve A x = b via RREF
  const solution = useMemo(() => {
    const aug = A.map((row, i) => [...row, b[i]]);
    const { rref, pivots } = matRref(aug);
    const n = A[0].length;
    // Check for inconsistency: any row that's all zero on the left but has nonzero on the right
    for (const row of rref) {
      const leftZero = row.slice(0, n).every((v) => Math.abs(v) < 1e-9);
      const rightNonzero = Math.abs(row[n]) > 1e-9;
      if (leftZero && rightNonzero) return { type: "none" as const };
    }
    // Find a particular solution
    const particular = new Array(n).fill(0);
    for (let i = 0; i < pivots.length; i++) {
      particular[pivots[i]] = rref[i][n];
    }
    return { type: "ok" as const, particular, nullBasis };
  }, [A, b]);

  // Render null space as a line / origin
  const nullArrows = (nullBasis[0] && Math.abs(nullBasis[0][0]) + Math.abs(nullBasis[0][1]) > 1e-9) ? [
    { from: { x: 0, y: 0 }, to: { x: nullBasis[0][0] * 5, y: nullBasis[0][1] * 5 }, color: "var(--eigen)", label: "null space", width: 2.5, dashed: true },
    { from: { x: 0, y: 0 }, to: { x: -nullBasis[0][0] * 5, y: -nullBasis[0][1] * 5 }, color: "var(--eigen)", width: 2.5, dashed: true },
  ] : [];

  const preset = (matrix: number[][], vector: number[]) => {
    setA(matrix);
    setB(vector);
  };

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-ink">Ax = 0 vs Ax = b</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode("homo")}
            className={`text-xs px-2 py-1 rounded ${mode === "homo" ? "bg-accent text-canvas" : "border border-line text-dim hover:text-ink"}`}
          >
            Ax = 0
          </button>
          <button
            onClick={() => setMode("hetero")}
            className={`text-xs px-2 py-1 rounded ${mode === "hetero" ? "bg-accent text-canvas" : "border border-line text-dim hover:text-ink"}`}
          >
            Ax = b
          </button>
        </div>
      </div>
      <p className="text-xs text-dim mb-3">
        {mode === "homo" ? (
          <>The homogeneous system <span className="text-ink font-mono">Ax = 0</span> always has at least the trivial answer <span className="text-ink font-mono">x = 0</span>. The question is: is there a non-trivial null space? Drag the matrix.</>
        ) : (
          <>The non-homogeneous system <span className="text-ink font-mono">Ax = b</span> might have 0, 1, or infinite answers depending on whether <span className="text-ink font-mono">b</span> is in the column space.</>
        )}
      </p>

      <div className="grid md:grid-cols-[1fr_280px] gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={420}
            height={420}
            worldSize={6}
            arrows={[
              ...nullArrows,
              ...(mode === "hetero" && solution.type === "ok" ? [
                { from: { x: 0, y: 0 }, to: { x: solution.particular[0], y: solution.particular[1] }, color: "var(--accent)", label: "particular", width: 3, labelOffset: { x: 0.3, y: 0.3 } },
                ...(nullBasis[0] && Math.abs(nullBasis[0][0]) + Math.abs(nullBasis[0][1]) > 1e-9 ? [
                  { from: { x: solution.particular[0], y: solution.particular[1] }, to: { x: solution.particular[0] + nullBasis[0][0] * 3, y: solution.particular[1] + nullBasis[0][1] * 3 }, color: "var(--eigen)", label: "+null", width: 2, dashed: true, labelOffset: { x: 0.3, y: -0.3 } },
                  { from: { x: solution.particular[0], y: solution.particular[1] }, to: { x: solution.particular[0] - nullBasis[0][0] * 3, y: solution.particular[1] - nullBasis[0][1] * 3 }, color: "var(--eigen)", width: 2, dashed: true },
                ] : []),
              ] : []),
            ]}
          />
        </div>

        <div className="space-y-2">
          <div className="bg-elev/30 border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">A</div>
            <div className="font-mono text-sm">
              [{fmt(A[0][0])}  {fmt(A[0][1])}]<br />
              [{fmt(A[1][0])}  {fmt(A[1][1])}]
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {[0, 1].map((i) => [0, 1].map((j) => (
                <input
                  key={`${i}-${j}`}
                  type="number"
                  step={0.1}
                  value={A[i][j]}
                  onChange={(e) => {
                    const next = A.map(r => [...r]);
                    next[i][j] = parseFloat(e.target.value) || 0;
                    setA(next);
                  }}
                  className="w-full bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono"
                />
              )))}
            </div>
          </div>

          {mode === "hetero" && (
            <div className="bg-elev/30 border border-line rounded p-2">
              <div className="text-[10px] text-faint uppercase tracking-wider mb-1">b</div>
              <div className="grid grid-cols-2 gap-1">
                {b.map((v, i) => (
                  <input
                    key={i}
                    type="number"
                    step={0.1}
                    value={v}
                    onChange={(e) => {
                      const next = [...b];
                      next[i] = parseFloat(e.target.value) || 0;
                      setB(next);
                    }}
                    className="w-full bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-warn font-mono"
                  />
                ))}
              </div>
            </div>
          )}

          <div className={`rounded p-2 text-xs ${
            (mode === "homo" && nullBasis.length === 0) ? "bg-accent/10 text-accent border border-accent/30" :
            (mode === "homo" && nullBasis.length > 0) ? "bg-eigen/10 text-eigen border border-eigen/30" :
            solution.type === "none" ? "bg-warn/10 text-warn border border-warn/30" :
            nullBasis.length > 0 ? "bg-warn/10 text-warn border border-warn/30" :
            "bg-accent/10 text-accent border border-accent/30"
          }`}>
            {mode === "homo" ? (
              nullBasis.length === 0
                ? "Only the trivial solution x = 0. A is full rank."
                : "A non-trivial null space — infinite solutions (a line of them)."
            ) : (
              solution.type === "none" ? "Inconsistent — no solution exists." :
              nullBasis.length > 0 ? "One particular + a null space = infinite solutions." :
              "One unique solution. The null space is trivial."
            )}
          </div>

          <div className="text-[10px] text-faint">presets:</div>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => preset([[2, 1], [4, 2]], [3, 6])} className="text-[10px] px-1 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink">
              rank-1
            </button>
            <button onClick={() => preset([[1, 0], [0, 1]], [2, 3])} className="text-[10px] px-1 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink">
              full rank
            </button>
            <button onClick={() => preset([[1, 2], [2, 4]], [3, 4])} className="text-[10px] px-1 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink">
              inconsistent
            </button>
            <button onClick={() => preset([[1, 1], [1, -1]], [0, 0])} className="text-[10px] px-1 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink">
              null only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
