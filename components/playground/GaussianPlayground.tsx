"use client";
import { useState, useMemo } from "react";
import { matRref, matRank, fmt } from "@/lib/math";
import { RotateCcw, ChevronRight } from "lucide-react";

// Concept L6: Row-Echelon Form (Gaussian Elimination)
// "Make the staircase. Eliminate below, leave above alone — back-substitute later."

const PRESETS = [
  { name: "Staircase 3x3", M: [[2, 4, -2, 8], [1, 2, 1, 5], [3, 6, -1, 13]] },
  { name: "Pivot in corner", M: [[1, 2, 3, 9], [0, 1, 1, 4], [0, 0, 1, 2]] },
  { name: "Already echelon", M: [[1, 2, 3, 4], [0, 5, 6, 7], [0, 0, 8, 9]] },
];

export function GaussianPlayground() {
  const [M, setM] = useState(PRESETS[0].M);
  const [step, setStep] = useState(0);

  // Compute the echelon form via our matRref
  const { rref, pivots, rank } = useMemo(() => matRref(M), [M]);

  // Detect if a row is "echelon-shaped" (leading entry strictly right of above)
  const echelonCheck = useMemo(() => {
    let lastPivotCol = -1;
    const issues: number[] = [];
    for (let i = 0; i < rref.length; i++) {
      // skip zero rows
      if (rref[i].every((v) => Math.abs(v) < 1e-9)) continue;
      // find first nonzero
      let c = 0;
      while (c < rref[i].length && Math.abs(rref[i][c]) < 1e-9) c++;
      if (c <= lastPivotCol && i > 0) {
        issues.push(i);
      }
      lastPivotCol = c;
    }
    return issues;
  }, [rref]);

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-1">
        Make the staircase
      </h3>
      <p className="text-xs text-dim mb-4">
        A matrix is in <span className="text-accent">row-echelon form</span> when
        each leading non-zero entry is strictly to the right of the one above it.
        That's the staircase. Below each pivot is zero.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Your matrix
          </div>
          <MatrixEditable M={M} setM={setM} highlightPivots={pivots} />
          <div className="mt-2 text-[10px] text-faint flex gap-3">
            <span>presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => { setM(p.M.map(r => [...r])); setStep(0); }}
                className="text-accent hover:underline"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Echelon form (RREF for now)</span>
            <span className="text-accent font-mono">rank = {rank}</span>
          </div>
          <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
            {rref.map((row, i) => {
              const isZero = row.slice(0, -1).every((v) => Math.abs(v) < 1e-9);
              return (
                <div key={i} className={`flex gap-2 ${isZero ? "opacity-30" : ""}`}>
                  <span className="text-faint text-xs w-4">{i + 1}.</span>
                  {row.slice(0, -1).map((x, j) => {
                    const isPivot = pivots.includes(j);
                    return (
                      <span
                        key={j}
                        className={`w-12 text-right ${isPivot ? "text-accent font-medium" : x === 0 ? "text-faint" : "text-ink"}`}
                      >
                        {fmt(x, 2)}
                      </span>
                    );
                  })}
                  <span className="text-faint">|</span>
                  <span className="text-warn w-12 text-right">{fmt(row[row.length - 1], 2)}</span>
                </div>
              );
            })}
          </div>
          {echelonCheck.length > 0 && (
            <div className="mt-2 text-xs text-warn">
              Rows {echelonCheck.map(i => i + 1).join(", ")} still have a leading
              entry that isn't strictly to the right. Keep eliminating.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-elev/30 border border-line rounded-md p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
          What the staircase means
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-dim leading-relaxed">
          <div>
            <span className="text-accent font-mono">Pivot 1</span>: the first row
            isolates one variable. Use it to eliminate the same column below.
          </div>
          <div>
            <span className="text-accent font-mono">Pivot 2</span>: the second row
            isolates another. Eliminate below it too.
          </div>
          <div>
            <span className="text-accent font-mono">Zero rows at the bottom</span>:
            no more information to extract. You have all the answers.
          </div>
        </div>
      </div>
    </div>
  );
}

function MatrixEditable({
  M,
  setM,
  highlightPivots,
}: {
  M: number[][];
  setM: (m: number[][]) => void;
  highlightPivots: number[];
}) {
  const update = (i: number, j: number, v: number) => {
    const next = M.map((r) => [...r]);
    next[i][j] = v;
    setM(next);
  };
  return (
    <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
      {M.map((row, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="text-faint text-xs w-4">{i + 1}.</span>
          {row.map((v, j) => {
            const isLast = j === row.length - 1;
            return (
              <span key={j} className="flex items-center">
                {isLast && j === row.length - 1 && <span className="text-faint mx-1">|</span>}
                <input
                  type="number"
                  step={0.1}
                  value={v}
                  onChange={(e) => update(i, j, parseFloat(e.target.value) || 0)}
                  className={`w-12 bg-transparent text-right text-sm px-1 py-0.5 border-b border-line/40 focus:border-accent outline-none ${
                    isLast ? "text-warn" : highlightPivots.includes(j) ? "text-accent" : "text-ink"
                  }`}
                />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
