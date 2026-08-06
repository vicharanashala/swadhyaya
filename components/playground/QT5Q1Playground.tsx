"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { m2eigen, fmt } from "@/lib/math";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question T5-q1: "If T: R⁵ → R⁵ and the null space has dimension 2, what
// is the rank?"
// Story: rank + nullity = dim(input). The student drags a slider for
// nullity. The rank badge updates, and a horizontal bar shows the
// sum. The student can also play with the matrix of a 5×5
// transformation (rank-3 + nullity-2).
//
// Enhanced: a 5×5 matrix heatmap of a representative rank-3 example
// that updates as the slider moves; bars comparing rank vs nullity;
// a prose step explainer.

const TOTAL_DIM = 5;

// A helper that builds a 5×5 matrix with the desired rank. We use
// a block-diagonal form: top-left is a (rank × rank) identity-like
// block, bottom-right is a (nullity × nullity) zero block. This
// makes the rank visually obvious — exactly `rank` non-zero pivots
// in the staircase.
function buildExampleMatrix(rank: number): number[][] {
  const M = Array.from({ length: 5 }, () => new Array(5).fill(0));
  for (let i = 0; i < rank; i++) {
    M[i]![i] = 1;
  }
  return M;
}

export function QT5Q1Playground() {
  const [nullity, setNullity] = useState(2);
  const rank = TOTAL_DIM - nullity;
  const [showSteps, setShowSteps] = useState(false);

  // Example 5×5 matrix with the chosen rank.
  const example = useMemo(() => buildExampleMatrix(rank), [rank]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read dim(V) — the dimension of the input space",
        detail:
          "T goes from R⁵ to R⁵, so dim(input) = 5. That's the " +
          "total budget of dimensions to play with.",
        value: "dim(V) = 5",
        tone: "faint" as const,
      },
      {
        title: "Read nullity — how many dimensions get crushed to 0",
        detail:
          "The null space N(T) is everything T sends to 0. Its " +
          "dimension is the nullity — the count of directions that " +
          "DISAPPEAR under T.",
        value: `nullity = ${nullity}`,
        tone: "warn" as const,
      },
      {
        title: "Apply rank-nullity",
        detail:
          "rank(T) + nullity(T) = dim(V). Every dimension in the " +
          "input either survives (contributes to rank) or gets crushed " +
          "(contributes to nullity). Nothing in between.",
        value: `rank = ${TOTAL_DIM} − ${nullity} = ${rank}`,
        tone: "accent" as const,
      },
      {
        title: "Read rank — how many dimensions survive",
        detail:
          "The image (range) of T has dimension equal to rank. These " +
          "are the directions that REMAIN after T. The example " +
          "matrix below shows a 5×5 with exactly this rank.",
        value: `rank = ${rank}`,
        tone: "accent" as const,
      },
      {
        title: "See it — the example 5×5 matrix",
        detail:
          "Below is a 5×5 matrix with rank exactly " +
          `${rank}. The top-left ${rank}×${rank} block is an identity; ` +
          "the remaining rows are all zeros. So row-reduce: pivots in " +
          "the first " +
          `${rank} positions, zeros everywhere else.`,
        value: `pivots in first ${rank} cols`,
        tone: "faint" as const,
      },
    ],
    [nullity, rank],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the nullity — rank + nullity = dim(V).
      </div>
      <p className="text-[10px] text-dim mb-3">
        If T: R⁵ → R⁵ and the null space has dimension 2, the rank must be
        5 − 2 = 3.
      </p>

      <div className="bg-card border border-line rounded p-3 space-y-3">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Nullity</span>
            <span className="font-mono text-warn">{nullity}</span>
          </div>
          <input
            type="range"
            min={0}
            max={TOTAL_DIM}
            step={1}
            value={nullity}
            onChange={(e) => setNullity(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
            aria-label="nullity slider"
          />
        </div>

        <div className="text-[10px] text-faint uppercase tracking-wider">
          rank + nullity = 5
        </div>
        <div className="flex h-8 rounded-full overflow-hidden bg-elev">
          <motion.div
            className="bg-accent flex items-center justify-center text-[10px] font-mono text-canvas"
            animate={{ flex: rank }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            rank = {rank}
          </motion.div>
          <motion.div
            className="bg-warn flex items-center justify-center text-[10px] font-mono text-canvas"
            animate={{ flex: nullity }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            nullity = {nullity}
          </motion.div>
        </div>

        <motion.div
          key={rank}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded p-2 bg-accent/10 border border-accent/40 text-center"
        >
          <div className="text-[10px] text-faint uppercase tracking-wider">
            rank = {rank}, nullity = {nullity}
          </div>
          <div className="font-mono text-accent">
            {rank} + {nullity} = {TOTAL_DIM} ✓
          </div>
        </motion.div>

        <div className="text-[10px] text-dim leading-relaxed">
          The transformation has {nullity}-dimensional kernel (everything
          sent to 0) and {rank}-dimensional image (everything it can
          produce).
        </div>
      </div>

      {/* Graph: an example 5x5 matrix with the chosen rank */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Example 5×5 matrix with rank = {rank}
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Identity block in the top-left, zeros below. Pivot count =
            {rank} — exactly the rank. Try moving the slider and watch the
            pivots disappear one by one.
          </p>
          <div className="overflow-x-auto">
            <table className="font-mono text-[10px] border-collapse">
              <tbody>
                {example.map((row, i) => (
                  <tr key={i}>
                    <td className="text-faint pr-2 text-right">R{i + 1}</td>
                    {row.map((v, j) => {
                      const isPivot = i === j && i < rank;
                      return (
                        <td
                          key={j}
                          className={`px-2 py-1 text-center w-7 ${
                            isPivot
                              ? "text-accent font-bold bg-accent/15"
                              : v === 0
                                ? "text-faint"
                                : "text-ink"
                          }`}
                        >
                          {v === 0 ? "0" : v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Rank vs nullity — the budget split
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The total budget is {TOTAL_DIM} dimensions. Rank survives,
            nullity is crushed.
          </p>
          <BarsGraph
            values={[rank, nullity]}
            labels={["rank", "nullity"]}
            maxAbs={TOTAL_DIM + 1}
            highlights={[1]}
            width={undefined}
            height={120}
            className="w-full"
          />
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
