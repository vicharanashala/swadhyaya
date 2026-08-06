"use client";
import { useState, useMemo } from "react";
import { m2det, fmt } from "@/lib/math";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Shuffle, Scaling, Plus, Equal, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question L5-q1: "Which row operation keeps the answer the same?"
// Story: Three operations preserve the solution (swap, scale by non-zero,
// add multiple); one doesn't (multiply by 0). The student picks
// operations and watches the determinant + solution bullet.
//
// Beyond the existing interactive op buttons, we add:
//   * A matrix-heatmap strip so the student SEES the values change
//   * A bars graph of the determinant before/after the op
//   * A prose step-by-step explainer

export function QL5Q1Playground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(3);
  const [b1] = useState(7);
  const [b2] = useState(7);
  const [showSteps, setShowSteps] = useState(false);

  const det = m2det([[a, b], [c, d]] as const);

  // Computed x, y (assuming det ≠ 0)
  const ok = Math.abs(det) > 1e-6;
  const x = ok ? (d * b1 - b * b2) / det : 0;
  const y = ok ? (-c * b1 + a * b2) / det : 0;

  // Mutators
  const swap = () => {
    const t = a;
    setA(c);
    setC(t);
    const tb = b;
    setB(d);
    setD(tb);
  };
  const scaleR1 = (k: number) => {
    setA(a * k);
    setB(b * k);
  };
  const scaleR2 = (k: number) => {
    setC(c * k);
    setD(d * k);
  };
  const addMultiple = (from: 1 | 2, k: number) => {
    if (from === 1) {
      setC(c + a * k);
      setD(d + b * k);
    } else {
      setA(a + c * k);
      setB(b + d * k);
    }
  };
  const zeroR1 = () => {
    setA(0);
    setB(0);
  };
  const reset = () => {
    setA(2);
    setB(1);
    setC(1);
    setD(3);
  };

  // Prose step explainer — what's actually happening to det/solution
  // under each operation the student has applied. We describe the
  // current matrix state in narrative form.
  const explainerSteps = useMemo(
    () => [
      {
        title: "Read the current augmented matrix [A | b]",
        detail:
          "Two equations, two unknowns. The 2×2 block on the left is " +
          "the coefficient matrix; the rightmost column is the " +
          "right-hand side (b). Row operations only touch the rows — " +
          "they never change which (x, y) is the answer.",
        value: `[${fmt(a, 0)}, ${fmt(b, 0)}, ${fmt(b1, 0)}; ${fmt(c, 0)}, ${fmt(d, 0)}, ${fmt(b2, 0)}]`,
        tone: "faint" as const,
      },
      {
        title: "Compute det(A) — if non-zero, the solution is unique",
        detail:
          "det(A) = a·d − b·c. It measures the SIGNED AREA of the " +
          "parallelogram the basis vectors span. Non-zero means the " +
          "transformation preserves area and the system has one " +
          "answer; zero means a dimension collapsed and we have 0 or " +
          "∞ answers instead.",
        value: `det = ${fmt(det, 3)}`,
        tone: ok ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Cramer-style solution x, y (when det ≠ 0)",
        detail:
          "x = (d·b₁ − b·b₂) / det and y = (−c·b₁ + a·b₂) / det. " +
          "Watch these numbers stay PUT across swap / scale / " +
          "add-multiple — that's the proof those operations are " +
          "solution-preserving.",
        value: `(x, y) = (${fmt(x, 3)}, ${fmt(y, 3)})`,
        tone: "accent" as const,
      },
      {
        title: "Rule of thumb — when do operations break the answer?",
        detail:
          "Multiplying a row by 0 makes it say 0 = b₁, which is " +
          "either trivially true (and infinite solutions appear) or " +
          "contradictory (no solutions). All three other moves — " +
          "swap, scale by non-zero, add a multiple — are reversible, " +
          "so the answer is unchanged.",
        value: ok ? "preserved" : "BROKEN — det = 0",
        tone: ok ? ("accent" as const) : ("warn" as const),
      },
    ],
    [a, b, c, d, b1, b2, det, x, y, ok],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Apply row operations — does the solution change?
      </div>
      <p className="text-[10px] text-dim mb-3">
        Three moves preserve the answer: swap rows, scale (by non-zero),
        add a multiple. One doesn&apos;t.
      </p>

      <div className="bg-card border border-line rounded p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          Augmented matrix [A | b]
        </div>
        <div className="font-mono text-sm space-y-1">
          <div className="flex gap-1 items-center">
            <span className="text-faint text-[10px] w-4">R1</span>
            <span className="text-ink">[</span>
            <span className="text-vector w-6 text-center">{fmt(a, 0)}</span>
            <span className="text-matrix w-6 text-center">{fmt(b, 0)}</span>
            <span className="text-faint">|</span>
            <span className="text-accent w-6 text-center">{b1}</span>
            <span className="text-ink">]</span>
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-faint text-[10px] w-4">R2</span>
            <span className="text-ink">[</span>
            <span className="text-vector w-6 text-center">{fmt(c, 0)}</span>
            <span className="text-matrix w-6 text-center">{fmt(d, 0)}</span>
            <span className="text-faint">|</span>
            <span className="text-accent w-6 text-center">{b2}</span>
            <span className="text-ink">]</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
          <OpBtn
            label="swap R1↔R2"
            Icon={Shuffle}
            valid
            onClick={swap}
          />
          <OpBtn
            label="R1 × 2"
            Icon={Scaling}
            valid
            onClick={() => scaleR1(2)}
          />
          <OpBtn
            label="R2 + 1·R1"
            Icon={Plus}
            valid
            onClick={() => addMultiple(1, 1)}
          />
          <OpBtn
            label="R2 − 1·R1"
            Icon={Equal}
            valid
            onClick={() => addMultiple(2, -1)}
          />
          <OpBtn
            label="R1 × ½"
            Icon={Scaling}
            valid
            onClick={() => scaleR1(0.5)}
          />
          <OpBtn
            label="R1 × 0"
            Icon={Scaling}
            valid={false}
            onClick={zeroR1}
          />
        </div>

        <button
          onClick={reset}
          className="mt-2 w-full text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
        >
          reset
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${fmt(a, 2)}-${fmt(b, 2)}-${fmt(c, 2)}-${fmt(d, 2)}-${ok}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mt-3 rounded p-3 border ${
            !ok
              ? "bg-warn/10 border-warn/40"
              : "bg-correct/10 border-correct/40"
          }`}
        >
          <div
            className="text-sm font-medium"
            style={{ color: ok ? "var(--correct)" : "var(--warn)" }}
          >
            {ok
              ? "✓ Solution unchanged (det ≠ 0)"
              : "det = 0 — system collapsed"}
          </div>
          {ok && (
            <div className="text-[10px] text-dim font-mono mt-1">
              x = {fmt(x, 3)}, y = {fmt(y, 3)} (det = {fmt(det, 3)})
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Graphs: matrix heatmap + bars of the 2x2 entries */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Watch the heatmap shift as you apply operations. Swap = swap
            rows, scale = multiply a row, add-mult = overlay one row on
            another.
          </p>
          <MatrixStripHeatmap
            matrix={[[a, b], [c, d]]}
            maxAbs={Math.max(4, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Determinant magnitude — feel when it collapses
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            det = a·d − b·c. After a swap, det flips sign. After a
            scale-by-k on a row, det multiplies by k. After add-multiple,
            det is unchanged.
          </p>
          <BarsGraph
            values={[a, b, c, d, det]}
            labels={["a", "b", "c", "d", "det"]}
            maxAbs={Math.max(6, Math.abs(det) + 1)}
            highlights={[4]}
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

function OpBtn({
  label,
  Icon,
  valid,
  onClick,
}: {
  label: string;
  Icon: typeof Shuffle;
  valid: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded border text-left ${
        valid
          ? "border-correct/30 text-correct hover:bg-correct/10"
          : "border-warn/30 text-warn hover:bg-warn/10"
      }`}
    >
      <Icon size={11} aria-hidden="true" />
      <span>{label}</span>
      {valid ? (
        <Check size={10} className="ml-auto" aria-hidden="true" />
      ) : (
        <X size={10} className="ml-auto" aria-hidden="true" />
      )}
    </button>
  );
}
