"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmt } from "@/lib/math";

// Question T7-q1: "If A = [[1, 1], [0, 1]] and B = [[2, 0], [0, 2]], what
// is BA?"
// Story: BA = row-of-B · col-of-A. The student steps through each cell
// of BA: row i, col j lights up, the corresponding row of B and column
// of A are highlighted, and the dot product animates in.

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

  const [step, setStep] = useState<{ i: number; j: number } | null>(null);

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