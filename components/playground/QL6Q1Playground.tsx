"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { motion } from "framer-motion";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { PivotStaircase, BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question L6-q1: "In row-echelon form, where are the leading non-zero
// entries?"
// Story: Pivots staircase from top-left to bottom-right, each strictly to
// the right of the one above. The student edits a 3×3 matrix and
// watches the echelon form with pivots highlighted.
//
// Beyond the live pivot highlight, we add:
//   * A pivot-staircase SVG so the student can SEE the staircase shape
//   * A bars graph of column magnitudes — non-pivot columns naturally
//     shrink to zero
//   * A prose step-by-step explainer

export function QL6Q1Playground() {
  const [m, setM] = useState([
    [2, 4, 6],
    [0, 3, 9],
    [0, 0, 5],
  ]);
  const [showSteps, setShowSteps] = useState(false);

  const echelon = useMemo(() => {
    const { rref, pivots } = matRref(
      m.map((r) => [...r]),
    );
    return { rref, pivots };
  }, [m]);

  const update = (i: number, j: number, v: number) =>
    setM((rows) => rows.map((row, ri) => (ri === i ? row.map((c, rj) => (rj === j ? v : c)) : row)));

  // Step explainer — what's actually happening to the staircase.
  const explainerSteps = useMemo(() => {
    const rank = echelon.pivots.length;
    const isFull = rank === 3;
    const firstZeroPivotRow =
      echelon.pivots.length < 3 ? echelon.pivots.length : null;
    return [
      {
        title: "Read the original matrix",
        detail:
          "This is the coefficient matrix A — its three rows are three " +
          "vectors in 3D. We want to reduce it without changing the " +
          "span of those rows.",
        value: `[${m.map((r) => `[${r.map((v) => fmt(v, 1)).join(", ")}]`).join(" ")}]`,
        tone: "faint" as const,
      },
      {
        title: "Apply row operations — swap, scale, add-multiple",
        detail:
          "Three moves that preserve the row space. The algorithm " +
          "sweeps left-to-right, top-to-bottom: at each step find a " +
          "non-zero entry in the pivot column, swap it to the top, " +
          "scale to 1, and clear everything below.",
        value: `${rank} pivots in RREF`,
        tone: isFull ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Identify pivots — the staircase heads",
        detail:
          "Each pivot row has its leading non-zero entry one column to " +
          "the right of the previous row's pivot. The staircase shape " +
          "is canonical — same matrix, same staircase, no matter how " +
          "you got there.",
        value:
          echelon.pivots.length === 0
            ? "no pivots (matrix is zero)"
            : echelon.pivots
                .map((p, i) => `R${i + 1}→col ${p + 1}`)
                .join(", "),
        tone: "accent" as const,
      },
      {
        title: "Read the rank",
        detail:
          "The number of pivots equals the rank — the dimension of the " +
          "row space (and of the column space). For a 3×3 matrix, " +
          "rank = 3 means full rank (the rows span all of R³); rank " +
          "< 3 means at least one row is a combination of the others.",
        value: `rank = ${rank} of 3`,
        tone: isFull ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Singularity check",
        detail:
          "If rank < 3, the matrix is singular (det = 0). The " +
          "transformation it represents collapses at least one " +
          "dimension — some inputs become indistinguishable.",
        value: firstZeroPivotRow === null ? "non-singular" : "singular",
        tone:
          firstZeroPivotRow === null ? ("accent" as const) : ("warn" as const),
      },
    ];
  }, [echelon, m]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Edit the matrix — watch the echelon form with pivots lit up.
      </div>
      <p className="text-[10px] text-dim mb-3">
        In echelon form, pivots staircase — each one strictly to the right
        of the one above. Try making the matrix singular and see the
        staircase break.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Original matrix
          </div>
          <div className="space-y-1">
            {m.map((row, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[10px] text-faint w-4">R{i + 1}</span>
                {row.map((v, j) => (
                  <input
                    key={j}
                    type="number"
                    step={0.5}
                    value={v}
                    onChange={(e) =>
                      update(i, j, parseFloat(e.target.value) || 0)
                    }
                    className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                    aria-label={`m[${i + 1}][${j + 1}]`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Echelon form
          </div>
          <div className="space-y-1">
            {echelon.rref.map((row, i) => {
              const pivotCol = echelon.pivots[i];
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[10px] text-faint w-4">R{i + 1}</span>
                  {row.map((v, j) => {
                    const isPivot = pivotCol === j;
                    return (
                      <motion.span
                        key={j}
                        animate={{
                          backgroundColor: isPivot
                            ? "rgba(232,134,74,0.4)"
                            : "rgba(0,0,0,0)",
                        }}
                        className={`w-12 px-1 py-0.5 text-[10px] font-mono rounded text-center ${
                          isPivot ? "text-accent font-bold" : "text-ink"
                        }`}
                      >
                        {fmt(v, 1)}
                      </motion.span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 bg-elev/40 border border-line rounded p-2 text-[10px] text-dim flex items-center gap-2">
        <span>Pivots:</span>
        {echelon.pivots.map((p, i) => (
          <span key={i} className="font-mono text-accent">
            R{i + 1} → col {p + 1}
          </span>
        ))}
        <span className="ml-auto text-faint">
          rank = {echelon.pivots.length}
        </span>
      </div>

      {/* Graphs: pivot staircase + column-magnitude bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Staircase shape — see where the pivots land
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The orange dots are pivots. Each row's pivot is strictly to the
            right of the row above. If a row has no pivot, the staircase
            stops — rank drops.
          </p>
          <PivotStaircase
            rows={echelon.rref}
            pivots={echelon.pivots}
            width={undefined}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Column magnitudes — feel when columns collapse
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each column is a vector. The columns WITHOUT pivots are
            linear combinations of pivot columns — their "independent"
            contribution goes to zero in RREF.
          </p>
          <BarsGraph
            values={Array.from({ length: 3 }, (_, j) =>
              Math.hypot(...echelon.rref.map((row) => Math.abs(row[j] ?? 0))),
            )}
            labels={["col 1", "col 2", "col 3"]}
            highlights={echelon.pivots}
            width={undefined}
            height={120}
            className="w-full"
          />
        </div>
      </div>

      {/* Original matrix heatmap */}
      <div className="mt-3 bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Original matrix (heatmap view)
        </div>
        <MatrixStripHeatmap
          matrix={m}
          maxAbs={Math.max(6, ...m.flat().map((v) => Math.abs(v) || 0))}
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
