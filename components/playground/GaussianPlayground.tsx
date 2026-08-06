"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  PivotStaircase,
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept L6: Row-Echelon Form (Gaussian Elimination)
// "Make the staircase. Eliminate below, leave above alone — back-substitute later."
//
// Beyond the live editable matrix + RREF, we add:
//   * A pivot-staircase SVG to make the staircase shape visible
//   * A bars graph of column magnitudes (non-pivot columns collapse)
//   * A matrix heatmap for the live coefficient view
//   * A prose step-by-step explainer

const PRESETS = [
  { name: "Staircase 3x3", M: [[2, 4, -2, 8], [1, 2, 1, 5], [3, 6, -1, 13]] },
  { name: "Pivot in corner", M: [[1, 2, 3, 9], [0, 1, 1, 4], [0, 0, 1, 2]] },
  { name: "Already echelon", M: [[1, 2, 3, 4], [0, 5, 6, 7], [0, 0, 8, 9]] },
];

export function GaussianPlayground() {
  const [M, setM] = useState(PRESETS[0].M);
  const [showSteps, setShowSteps] = useState(false);

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

  const explainerSteps = useMemo(
    () => [
      {
        title: "Form the augmented matrix [A | b]",
        detail:
          "Stack coefficients in a 3×3 block A and append the right-hand side " +
          "as a fourth column b. This converts three equations into one " +
          "object we can manipulate with row operations.",
        value: `[${M.map((r) => `[${r.slice(0, 3).map((v) => fmt(v, 1)).join(", ")}]`).join(" ")} | [${M.map((r) => fmt(r[3]!, 1)).join(", ")}]]`,
        tone: "faint" as const,
      },
      {
        title: "Apply three solution-preserving moves",
        detail:
          "Swap two rows (order doesn't matter), scale a row by any " +
          "non-zero number, or add a multiple of one row to another. " +
          "None of these change which (x, y, z) is the answer.",
        value: "swap / scale / add-mult",
        tone: "faint" as const,
      },
      {
        title: "Sweep top-left → bottom-right, eliminating below each pivot",
        detail:
          "At each step: find the next non-zero in the pivot column, " +
          "swap it to the top, use it to clear every entry below. The " +
          "result is a staircase — zeros below the diagonal, pivots on " +
          "the diagonal.",
        value: `rank = ${rank}`,
        tone: rank === 3 ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Back-substitute from the bottom row up",
        detail:
          "The bottom row now has at most one non-zero entry — solve " +
          "directly. Substitute that answer into the row above, solve " +
          "again, and so on up the staircase.",
        value: "x₃ → x₂ → x₁",
        tone: "accent" as const,
      },
    ],
    [M, rank],
  );

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-1">
        Make the staircase
      </h3>
      <p className="text-xs text-dim mb-4">
        A matrix is in <span className="text-accent">row-echelon form</span> when
        each leading non-zero entry is strictly to the right of the one above it.
        That&apos;s the staircase. Below each pivot is zero.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Your matrix
          </div>
          <MatrixEditable M={M} setM={setM} highlightPivots={pivots} />
          <div className="mt-2 text-[10px] text-faint flex gap-3 flex-wrap">
            <span>presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setM(p.M.map((r) => [...r]));
                }}
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
              Rows {echelonCheck.map((i) => i + 1).join(", ")} still have a leading
              entry that isn&apos;t strictly to the right. Keep eliminating.
            </div>
          )}
        </div>
      </div>

      {/* Graphs: pivot staircase + column magnitude bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-elev/30 border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Staircase shape — see the canonical pattern
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The pivot positions trace out a staircase. Below each pivot
            everything is zero; above, entries can be anything (in echelon
            form) or forced to zero too (in RREF).
          </p>
          <PivotStaircase
            rows={rref}
            pivots={pivots}
            width={undefined}
            className="w-full"
          />
        </div>
        <div className="bg-elev/30 border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Column magnitudes — feel when columns collapse
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each column is a vector. In RREF, non-pivot columns are linear
            combinations of the pivot columns — that&apos;s why their
            "independent" contribution can be zero in RREF.
          </p>
          <BarsGraph
            values={Array.from({ length: 3 }, (_, j) =>
              Math.hypot(...rref.map((row) => Math.abs(row[j] ?? 0))),
            )}
            labels={["col 1", "col 2", "col 3"]}
            highlights={pivots}
            maxAbs={Math.max(
              2,
              ...Array.from({ length: 3 }, (_, j) =>
                Math.hypot(...rref.map((row) => Math.abs(row[j] ?? 0))),
              ),
            )}
            width={undefined}
            height={120}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-3 bg-elev/30 border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Original matrix (heatmap)
        </div>
        <MatrixStripHeatmap
          matrix={M}
          maxAbs={Math.max(6, ...M.flat().map((v) => Math.abs(v) || 0))}
          className="w-full"
        />
      </div>

      {/* Step-by-step explainer */}
      <div className="mt-3 bg-card border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-elev/30 transition"
          aria-expanded={showSteps}
        >
          <div className="flex items-center gap-2">
            <Info size={12} className="text-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">
              What&apos;s happening — step by step
            </span>
          </div>
          <span className="text-faint">
            {showSteps ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </span>
        </button>
        {showSteps && (
          <div className="border-t border-line p-3">
            <StepExplainer steps={explainerSteps} compact />
          </div>
        )}
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
    next[i]![j] = v;
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
