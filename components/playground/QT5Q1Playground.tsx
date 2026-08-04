"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { m2eigen, fmt } from "@/lib/math";

// Question T5-q1: "If T: R⁵ → R⁵ and the null space has dimension 2, what
// is the rank?"
// Story: rank + nullity = dim(input). The student drags a slider for
// nullity. The rank badge updates, and a horizontal bar shows the
// sum. The student can also play with the matrix of a 5×5
// transformation (rank-3 + nullity-2).

const TOTAL_DIM = 5;

export function QT5Q1Playground() {
  const [nullity, setNullity] = useState(2);
  const rank = TOTAL_DIM - nullity;

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
    </div>
  );
}