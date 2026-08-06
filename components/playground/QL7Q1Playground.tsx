"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { motion } from "framer-motion";
import { Check, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  PivotStaircase,
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question L7-q1: "RREF is unique for every matrix."
// Story: The student picks a matrix. The playground shows TWO different
// paths to RREF — one starting from the matrix directly, one starting
// after swapping rows first. Both paths arrive at the same RREF. The
// student sees that the staircase is canonical.
//
// Beyond the two-path equality check, we add:
//   * A pivot-staircase visualisation that highlights how all paths
//     converge on the same staircase shape
//   * A bars graph of the row magnitudes (after each path)
//   * A prose step-by-step explainer

type Path = "direct" | "swap-first" | "scale-first";

export function QL7Q1Playground() {
  const [m, setM] = useState([
    [2, 4, 6],
    [0, 3, 9],
    [0, 0, 5],
  ]);
  const [showSteps, setShowSteps] = useState(false);

  const rrefDirect = useMemo(
    () => matRref(m.map((r) => [...r])),
    [m],
  );

  const rrefSwap = useMemo(() => {
    const swapped = [m[1]!, m[0]!, m[2]!].map((r) => [...r]);
    return matRref(swapped);
  }, [m]);

  const rrefScale = useMemo(() => {
    const scaled = m.map((r) => r.map((v) => v * 3));
    return matRref(scaled);
  }, [m]);

  const [path, setPath] = useState<Path>("direct");

  const eq =
    JSON.stringify(rrefDirect.rref) === JSON.stringify(rrefSwap.rref) &&
    JSON.stringify(rrefDirect.rref) === JSON.stringify(rrefScale.rref);

  const matrixEqual = (a: number[][], b: number[][]) =>
    a.every((row, i) =>
      row.every((v, j) => Math.abs(v - (b[i]?.[j] ?? 0)) < 1e-6),
    );

  const currentRref =
    path === "direct"
      ? rrefDirect
      : path === "swap-first"
        ? rrefSwap
        : rrefScale;

  // Step explainer — why all paths converge.
  const explainerSteps = useMemo(
    () => [
      {
        title: "Choose your path — three ways to the same RREF",
        detail:
          "Path A applies RREF directly. Path B swaps rows 1↔2 first. " +
          "Path C scales the whole matrix by 3. Different moves — " +
          "same destination, because RREF is canonical.",
        value:
          path === "direct"
            ? "A: direct"
            : path === "swap-first"
              ? "B: swap first"
              : "C: scale ×3 first",
        tone: "faint" as const,
      },
      {
        title: "Read the RREF along this path",
        detail:
          "Every entry above each pivot is zero. Every pivot itself " +
          "is exactly 1. The remaining structure — staircase shape, " +
          "rank, pivot positions — is the matrix's fingerprint.",
        value: `rank ${currentRref.pivots.length}, pivots ${currentRref.pivots.map((p) => p + 1).join(",")}`,
        tone: "accent" as const,
      },
      {
        title: "Compare all three RREFs",
        detail:
          "They must be EQUAL — same numbers in every cell. If they " +
          "aren't, the reduction algorithm is broken (which would " +
          "mean RREF is NOT unique, contradicting a theorem).",
        value: eq ? "all three match" : "MISMATCH (shouldn't happen)",
        tone: eq ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Why is RREF unique?",
        detail:
          "Because each pivot column has a 1 in exactly one row and " +
          "0 in every other row. Once the pivot positions are fixed " +
          "by the row space's structure, everything else is forced.",
        value: "RREF = canonical",
        tone: "accent" as const,
      },
    ],
    [path, currentRref, eq],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Edit the matrix — see that RREF is unique regardless of path.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Two different paths to the same matrix should give the same RREF.
      </p>

      <div className="bg-card border border-line rounded p-3 mb-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          Original
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
                    setM((rows) =>
                      rows.map((r, ri) =>
                        ri === i
                          ? r.map((c, rj) => (rj === j ? parseFloat(e.target.value) || 0 : c))
                          : r,
                      ),
                    )
                  }
                  className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label={`m[${i + 1}][${j + 1}]`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          onClick={() => setPath("direct")}
          className={`text-[10px] px-2 py-1 rounded border ${
            path === "direct"
              ? "bg-accent/20 text-accent border-accent/40"
              : "border-line text-dim"
          }`}
        >
          path A: direct
        </button>
        <button
          onClick={() => setPath("swap-first")}
          className={`text-[10px] px-2 py-1 rounded border ${
            path === "swap-first"
              ? "bg-accent/20 text-accent border-accent/40"
              : "border-line text-dim"
          }`}
        >
          path B: swap first
        </button>
        <button
          onClick={() => setPath("scale-first")}
          className={`text-[10px] px-2 py-1 rounded border ${
            path === "scale-first"
              ? "bg-accent/20 text-accent border-accent/40"
              : "border-line text-dim"
          }`}
        >
          path C: scale ×3 first
        </button>
      </div>

      <div className="bg-card border border-line rounded p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          {path === "direct" && "Path A: RREF of original"}
          {path === "swap-first" && "Path B: RREF after swapping R1↔R2"}
          {path === "scale-first" && "Path C: RREF after scaling ×3"}
        </div>
        <div className="space-y-1 font-mono text-xs">
          {currentRref.rref.map((row, i) => (
            <div key={i}>
              [{row.map((v, j) => (
                <span key={j} className="inline-block w-12 text-center">
                  {fmt(v, 2)}
                </span>
              ))}
              ]
            </div>
          ))}
        </div>
      </div>

      <motion.div
        animate={{
          backgroundColor: eq ? "rgba(92,184,122,0.1)" : "rgba(0,0,0,0)",
        }}
        className="mt-3 rounded p-3 border text-center"
        style={{ borderColor: eq ? "var(--correct)" : "var(--line)" }}
      >
        <div className="text-sm font-medium text-correct flex items-center justify-center gap-1">
          <Check size={12} aria-hidden="true" />
          All three paths give the same RREF
        </div>
        <div className="text-[10px] text-dim mt-1">
          {matrixEqual(rrefDirect.rref, rrefSwap.rref) &&
          matrixEqual(rrefDirect.rref, rrefScale.rref)
            ? "RREF is canonical — the same for everyone."
            : "Keep editing until all three match."}
        </div>
      </motion.div>

      {/* Graphs: pivot staircase + row magnitude bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            RREF staircase — see the canonical shape
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Every path lands on THIS same staircase. Pivots are highlighted
            in orange. Notice: even path B (row-swapped) produces the
            identical staircase.
          </p>
          <PivotStaircase
            rows={currentRref.rref}
            pivots={currentRref.pivots}
            width={undefined}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Row magnitudes — feel how RREF normalises rows
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            RREF rescales rows so each pivot is exactly 1. The row
            magnitudes here are NOT all 1 because of off-diagonal
            contributions, but the structure is.
          </p>
          <BarsGraph
            values={currentRref.rref.map((r) => Math.hypot(...r))}
            labels={currentRref.rref.map((_, i) => `R${i + 1}`)}
            maxAbs={Math.max(2, ...currentRref.rref.map((r) => Math.hypot(...r)))}
            width={undefined}
            height={120}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-3 bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Original matrix heatmap
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
