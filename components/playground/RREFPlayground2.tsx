"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { Sparkles, RotateCcw, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  PivotStaircase,
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept L7: RREF — Row-Reduced Echelon Form
// "Take the staircase FURTHER. Every pivot = 1, everything above is zero too. UNIQUE."
//
// Beyond the live RREF, we add:
//   * A pivot-staircase SVG to make the canonical shape visible
//   * A bars graph of column magnitudes
//   * A prose step-by-step explainer

const PRESETS = [
  { name: "Unique answer", M: [[2, 3, 16], [5, 8, 37]] },
  { name: "Infinite answers", M: [[1, 2, 1], [2, 4, 2]] },
  { name: "No answer", M: [[1, 1, 3], [2, 2, 5]] },
  { name: "Hill cipher", M: [[2, 3, 7], [3, 5, 11]] },
];

export function RREFPlayground2() {
  const [M, setM] = useState(PRESETS[0].M);
  const [showSteps, setShowSteps] = useState(false);

  const { rref, pivots } = useMemo(() => matRref(M), [M]);
  const [m, n] = [M.length, M[0]!.length - 1];

  // Determine solution type
  const solution = useMemo(() => {
    const augRank = pivots.filter((c) => c < n).length;
    const augFullRank = rref.every((row, i) => {
      const augVal = row[n];
      const restZero = row.slice(0, n).every((v) => Math.abs(v) < 1e-9);
      if (restZero && Math.abs(augVal) > 1e-9) return false;
      return true;
    });
    if (!augFullRank) return { type: "none" as const, text: "No solution — the equations contradict." };
    if (augRank < n)
      return {
        type: "infinite" as const,
        text: `Infinite solutions — ${n - augRank} free variable(s).`,
      };
    return { type: "unique" as const, text: "One unique solution." };
  }, [rref, pivots, n]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read the original augmented matrix [A | b]",
        detail:
          "Two equations, two unknowns. The 2×2 block on the left is " +
          "the coefficient matrix; the rightmost column is the " +
          "right-hand side (b).",
        value: `[${M.map((r) => `[${r.slice(0, n).map((v) => fmt(v, 1)).join(", ")}]`).join(" ")} | [${M.map((r) => fmt(r[n]!, 1)).join(", ")}]]`,
        tone: "faint" as const,
      },
      {
        title: "Reduce to row-echelon form (zero out below pivots)",
        detail:
          "Sweep down the diagonal — eliminate entries below each pivot " +
          "using row operations. Result: a triangular matrix with " +
          "pivots marching right.",
        value: `rank ${pivots.length}`,
        tone: "faint" as const,
      },
      {
        title: "Continue to RREF — zero out ABOVE each pivot too",
        detail:
          "Sweep UP the diagonal this time — eliminate entries above " +
          "each pivot, and scale each pivot row so the pivot itself " +
          "is exactly 1. Result: the unique RREF.",
        value: pivots.length > 0 ? `pivots normalised to 1` : "no pivots",
        tone: "accent" as const,
      },
      {
        title: "Why RREF is canonical — it's UNIQUE",
        detail:
          "Every pivot column has a 1 in exactly one row and 0 in " +
          "every other row. That structure forces every other cell to " +
          "a specific value. Different paths, same destination.",
        value: solution.type === "unique"
          ? "(x, y) directly readable"
          : solution.type === "infinite"
            ? "free variables parametrize"
            : "row 0 = nonzero → contradiction",
        tone: solution.type === "unique"
          ? ("accent" as const)
          : ("warn" as const),
      },
      {
        title: "Classify the solution",
        detail:
          "If RREF has a row [0 0 | nonzero], the system " +
          "contradicts. If rank < n, infinitely many. Otherwise " +
          "exactly one.",
        value: solution.text,
        tone: solution.type === "unique" ? ("accent" as const) : ("warn" as const),
      },
    ],
    [M, pivots, n, solution],
  );

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-ink">
          The unique final form
        </h3>
        <button
          onClick={() => setM(PRESETS[0].M.map((r) => [...r]))}
          className="text-xs text-dim hover:text-ink flex items-center gap-1"
        >
          <RotateCcw size={11} /> reset
        </button>
      </div>
      <p className="text-xs text-dim mb-4">
        Take echelon form one step further. Every pivot is <span className="text-accent">1</span>,
        and everything <span className="text-ink">above</span> each pivot is zero too.
        The result is RREF — and it&apos;s <span className="text-accent font-medium">unique</span> for
        every system.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Original [A | b]</div>
          <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
            {M.map((row, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-faint text-xs w-4">{i + 1}.</span>
                {row.map((v, j) => (
                  <span key={j} className={`w-12 text-right ${j === n ? "text-warn" : "text-ink"}`}>
                    {fmt(v)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            RREF (unique)
          </div>
          <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
            {rref.map((row, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-faint text-xs w-4">{i + 1}.</span>
                {row.slice(0, n).map((x, j) => {
                  const isPivot = pivots.includes(j);
                  return (
                    <span
                      key={j}
                      className={`w-12 text-right ${
                        isPivot ? "text-accent font-medium" :
                        Math.abs(x) < 1e-9 ? "text-faint" : "text-ink"
                      }`}
                    >
                      {fmt(x, 3)}
                    </span>
                  );
                })}
                <span className="text-faint">|</span>
                <span className={`w-12 text-right ${pivots.length < m && row.slice(0,n).every(v=>Math.abs(v)<1e-9) ? "text-warn" : "text-accent"}`}>
                  {fmt(row[n]!, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setM(p.M.map((r) => [...r]))}
            className="text-xs px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Graphs: pivot staircase + column magnitudes */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-elev/30 border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Staircase — see how RREF normalises everything
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Orange dots are pivots, normalised to exactly 1. Above each
            pivot everything is forced to zero. The shape is the same
            regardless of which path you took.
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
            Column magnitudes
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Column magnitudes here reflect the NORMALISED pivots — 1 in " +
            "every pivot column, since RREF scales them to 1.
          </p>
          <BarsGraph
            values={Array.from({ length: n }, (_, j) =>
              Math.hypot(...rref.map((row) => Math.abs(row[j] ?? 0))),
            )}
            labels={Array.from({ length: n }, (_, j) => `col ${j + 1}`)}
            highlights={pivots}
            maxAbs={2}
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

      <div className={`mt-4 rounded-md p-3 text-sm flex items-start gap-2 ${
        solution.type === "none" ? "bg-warn/10 text-warn border border-warn/30" :
        solution.type === "infinite" ? "bg-warn/10 text-warn border border-warn/30" :
        "bg-accent/10 text-accent border border-accent/30"
      }`}>
        <Sparkles size={14} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-medium mb-0.5">
            {solution.type === "unique" && "Unique solution."}
            {solution.type === "infinite" && "Infinite solutions."}
            {solution.type === "none" && "No solution."}
          </div>
          <div className="text-xs opacity-80">{solution.text}</div>
        </div>
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
