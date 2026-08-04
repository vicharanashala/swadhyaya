"use client";
import { useState, useMemo } from "react";
import { m2det, fmt } from "@/lib/math";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Shuffle, Scaling, Plus, Equal } from "lucide-react";

// Question L5-q1: "Which row operation keeps the answer the same?"
// Story: Three operations preserve the solution (swap, scale by non-zero,
// add multiple); one doesn't (multiply by 0). The student picks
// operations and watches the determinant + solution bullet.

export function QL5Q1Playground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(3);
  const [b1] = useState(7);
  const [b2] = useState(7);

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