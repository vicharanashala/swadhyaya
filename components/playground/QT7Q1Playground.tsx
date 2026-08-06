"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmt } from "@/lib/math";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question T7-q1: "If A = [[1, 1], [0, 1]] and B = [[2, 0], [0, 2]], what
// is BA?"
// Story: BA = row-of-B · col-of-A. The student steps through each cell
// of BA: row i, col j lights up, the corresponding row of B and column
// of A are highlighted, and the dot product animates in.
//
// Enhanced: BA + AB shown as heatmaps so the student can see that
// BA ≠ AB; a bars graph of the dot-product terms; a prose step
// explainer walking through each cell of the product.

export function QT7Q1Playground() {
  const A = useMemo(
    () => [
      [1, 1],
      [0, 1],
    ],
    [],
  );
  const B = useMemo(
    () => [
      [2, 0],
      [0, 2],
    ],
    [],
  );
  const BA = useMemo(
    () => [
      [B[0]![0]! * A[0]![0]! + B[0]![1]! * A[1]![0]!, B[0]![0]! * A[0]![1]! + B[0]![1]! * A[1]![1]!],
      [B[1]![0]! * A[0]![0]! + B[1]![1]! * A[1]![0]!, B[1]![0]! * A[0]![1]! + B[1]![1]! * A[1]![1]!],
    ],
    [A, B],
  );
  // AB for comparison — proves BA ≠ AB in general.
  const AB = useMemo(
    () => [
      [A[0]![0]! * B[0]![0]! + A[0]![1]! * B[1]![0]!, A[0]![0]! * B[0]![1]! + A[0]![1]! * B[1]![1]!],
      [A[1]![0]! * B[0]![0]! + A[1]![1]! * B[1]![0]!, A[1]![0]! * B[0]![1]! + A[1]![1]! * B[1]![1]!],
    ],
    [A, B],
  );

  const [step, setStep] = useState<{ i: number; j: number } | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const cellSequence: Array<{ i: number; j: number }> = [
    { i: 0, j: 0 },
    { i: 0, j: 1 },
    { i: 1, j: 0 },
    { i: 1, j: 1 },
  ];

  const advance = () => {
    if (!step) {
      setStep(cellSequence[0]!);
      return;
    }
    const idx = cellSequence.findIndex(
      (c) => c.i === step.i && c.j === step.j,
    );
    if (idx < cellSequence.length - 1) {
      setStep(cellSequence[idx + 1]!);
    } else {
      setStep(null);
    }
  };

  // For the bars graph of "all four cell dot products" at once.
  const allDotProducts = useMemo(() => {
    return BA.flatMap((row, i) =>
      row.map((v, j) => ({
        i,
        j,
        v,
        terms: `r${i + 1}·c${j + 1}`,
      })),
    );
  }, [BA]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A and B",
        detail:
          "A is a shear (the upper triangle is 1); B scales every " +
          "component by 2. Their order matters: BA means apply A " +
          "FIRST, then B (right-to-left composition).",
        value: "A = shear, B = scale ×2",
        tone: "faint" as const,
      },
      {
        title: "Pick cell (i, j) of BA",
        detail:
          "(BA)ᵢⱼ is the dot product of row i of B with column j of A. " +
          "It's the only way the matrix product is defined — and " +
          "it's why BA's (row count, col count) = (B.rows, A.cols).",
        value: step
          ? `cell (${step.i + 1}, ${step.j + 1})`
          : "all four cells next",
        tone: "accent" as const,
      },
      {
        title: "Compute the dot product",
        detail:
          "Row of B dotted with col of A = sum of (row entry) × " +
          "(col entry). The student steps through this one cell at " +
          "a time.",
        value: step
          ? `${B[step.i]![0]}·${A[0]![step.j]!} + ${B[step.i]![1]}·${A[1]![step.j]!} = ${BA[step.i]![step.j]}`
          : "(see step)",
        tone: "accent" as const,
      },
      {
        title: "Compare with AB",
        detail:
          "In general BA ≠ AB. For these specific matrices, BA " +
          "preserves A's shear then scales; AB scales first then " +
          "shears. Different paths through the transformations.",
        value: `BA ≠ AB (different orderings)`,
        tone: "warn" as const,
      },
      {
        title: "All four dot products",
        detail:
          "BA is fully specified by four dot products — one per " +
          "(i, j) pair. The bars graph shows all of them at once " +
          "so you can compare magnitudes.",
        value: `${BA.flat().join(", ")}`,
        tone: "faint" as const,
      },
    ],
    [A, B, BA, AB, step],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Step through BA — watch the dot product animate in.
      </div>
      <p className="text-[10px] text-dim mb-3">
        (BA)ᵢⱼ = row i of B dotted with column j of A.
      </p>

      <div className="flex items-center gap-3 justify-center mb-4 flex-wrap">
        <Matrix name="B" matrix={B} highlight={step ? { row: step.i } : undefined} />
        <span className="text-2xl text-faint">×</span>
        <Matrix name="A" matrix={A} highlight={step ? { col: step.j } : undefined} />
        <span className="text-2xl text-faint">=</span>
        <Matrix name="BA" matrix={BA} highlight={step ? { row: step.i, col: step.j } : undefined} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step ? `${step.i}-${step.j}` : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-card border border-line rounded p-3 text-center"
        >
          {step ? (
            <div className="text-xs">
              <div className="text-faint mb-1">
                (BA)[{step.i + 1},{step.j + 1}] = row {step.i + 1} of B · col{" "}
                {step.j + 1} of A
              </div>
              <div className="font-mono text-accent">
                {B[step.i]![0]}·{A[0]![step.j]!} + {B[step.i]![1]}·{A[1]![step.j]!} ={" "}
                <span className="text-2xl">
                  {BA[step.i]![step.j]}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-faint">Press step to begin</div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 mt-3">
        <button
          onClick={advance}
          className="flex-1 text-xs px-3 py-1.5 rounded bg-accent text-canvas font-medium hover:bg-accent/90 transition"
        >
          {step ? "next cell" : "step"}
        </button>
        <button
          onClick={() => setStep(null)}
          className="text-xs px-3 py-1.5 rounded border border-line hover:bg-elev transition"
        >
          reset
        </button>
      </div>

      {/* Graphs: BA vs AB heatmaps + dot-product bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            BA vs AB — note the difference
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Left: BA. Right: AB. They&apos;re different matrices because
            matrix multiplication is NOT commutative — order of
            composition matters.
          </p>
          <div className="grid grid-cols-2 gap-2 items-start">
            <div>
              <div className="text-[10px] text-faint font-mono mb-1">BA</div>
              <MatrixStripHeatmap
                matrix={BA}
                maxAbs={Math.max(3, ...BA.flat().map((v) => Math.abs(v)))}
                className="w-full"
              />
            </div>
            <div>
              <div className="text-[10px] text-faint font-mono mb-1">AB</div>
              <MatrixStripHeatmap
                matrix={AB}
                maxAbs={Math.max(3, ...AB.flat().map((v) => Math.abs(v)))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            All four dot products of BA
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each bar is one (BA)ᵢⱼ value — the dot product of row i of B
            with column j of A. See all four together to compare.
          </p>
          <BarsGraph
            values={allDotProducts.map((d) => d.v)}
            labels={allDotProducts.map((d) => d.terms)}
            maxAbs={Math.max(3, ...allDotProducts.map((d) => Math.abs(d.v)))}
            width={undefined}
            height={140}
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

function Matrix({
  name,
  matrix,
  highlight,
}: {
  name: string;
  matrix: number[][];
  highlight?: { row?: number; col?: number };
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        {name}
      </div>
      <div className="font-mono text-sm border border-line rounded p-2 bg-canvas">
        {matrix.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((v, j) => {
              const isHighlight =
                highlight?.row === i || highlight?.col === j;
              const isBoth =
                highlight?.row === i && highlight?.col === j;
              return (
                <motion.span
                  key={j}
                  animate={{
                    backgroundColor: isBoth
                      ? "rgba(232,134,74,0.25)"
                      : isHighlight
                        ? "rgba(232,134,74,0.1)"
                        : "rgba(0,0,0,0)",
                  }}
                  className="w-10 text-center rounded px-1"
                >
                  {fmt(v, 0)}
                </motion.span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
