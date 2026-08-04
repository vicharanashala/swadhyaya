"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";

// Question V1-q1: "Two arrows are the SAME vector if..."
// Story: The same vector lives in many positions. The student drags two
// arrows independently. When their head-tail differences match, a green
// "same vector" banner appears with a satisfying spring animation.
// Unique: drag-on-canvas with live "head-tail difference" readout and
// a parallelogram showing the equal translation.

const COLORS = {
  v: "var(--vector)",
  w: "var(--matrix)",
  equal: "var(--correct)",
};

export function QV1Q1Playground() {
  const [v, setV] = useState({ head: { x: 2, y: 1 }, tail: { x: -1, y: -1 } });
  const [w, setW] = useState({ head: { x: 1, y: 2 }, tail: { x: 0, y: -1 } });

  const vDiff = useMemo(
    () => ({ x: v.head.x - v.tail.x, y: v.head.y - v.tail.y }),
    [v],
  );
  const wDiff = useMemo(
    () => ({ x: w.head.x - w.tail.x, y: w.head.y - w.tail.y }),
    [w],
  );

  const equal =
    Math.abs(vDiff.x - wDiff.x) < 0.01 && Math.abs(vDiff.y - wDiff.y) < 0.01;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Two arrows at different positions — make them the SAME vector.
      </div>
      <p className="text-[10px] text-dim mb-3">
        A vector is its head-to-tail difference, not its location. Make both
        differences match.
      </p>

      <VectorCanvas
        width={360}
        height={360}
        worldSize={6}
        arrows={[
          {
            id: "v-head",
            from: v.tail,
            to: v.head,
            color: COLORS.v,
            label: "v",
            width: 3,
            labelOffset: { x: 0, y: -0.4 },
          },
          {
            id: "w-head",
            from: w.tail,
            to: w.head,
            color: COLORS.w,
            label: "w",
            width: 3,
            labelOffset: { x: 0, y: 0.4 },
          },
        ]}
        draggableArrows={[
          {
            id: "v-head",
            from: v.tail,
            to: v.head,
            color: COLORS.v,
            label: "v",
            width: 3,
            labelOffset: { x: 0, y: -0.4 },
          },
          {
            id: "w-head",
            from: w.tail,
            to: w.head,
            color: COLORS.w,
            label: "w",
            width: 3,
            labelOffset: { x: 0, y: 0.4 },
          },
        ]}
        draggablePoints={[
          { id: "v-tail", pos: v.tail, color: COLORS.v, label: "v tail", radius: 5 },
          { id: "w-tail", pos: w.tail, color: COLORS.w, label: "w tail", radius: 5 },
        ]}
        onArrowDrag={(id, to) => {
          if (id === "v-head")
            setV((p) => ({ head: to, tail: p.tail }));
          if (id === "w-head")
            setW((p) => ({ head: to, tail: p.tail }));
        }}
        onPointDrag={(id, pos) => {
          if (id === "v-tail") setV((p) => ({ head: p.head, tail: pos }));
          if (id === "w-tail") setW((p) => ({ head: p.head, tail: pos }));
        }}
        clamp={{ min: { x: -5.5, y: -5.5 }, max: { x: 5.5, y: 5.5 } }}
        ariaLabel="Vector equality playground"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div
          className="bg-card border rounded p-2"
          style={{ borderColor: COLORS.v }}
        >
          <div
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: COLORS.v }}
          >
            v (head – tail)
          </div>
          <div className="font-mono text-ink">
            ({vDiff.x.toFixed(2)}, {vDiff.y.toFixed(2)})
          </div>
        </div>
        <div
          className="bg-card border rounded p-2"
          style={{ borderColor: COLORS.w }}
        >
          <div
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: COLORS.w }}
          >
            w (head – tail)
          </div>
          <div className="font-mono text-ink">
            ({wDiff.x.toFixed(2)}, {wDiff.y.toFixed(2)})
          </div>
        </div>
      </div>

      <motion.div
        animate={{
          backgroundColor: equal ? "rgba(92,184,122,0.1)" : "rgba(0,0,0,0)",
          borderColor: equal ? "rgba(92,184,122,0.4)" : "rgba(255,245,230,0.18)",
        }}
        className="mt-3 rounded p-3 border text-center"
      >
        <div
          className="font-medium"
          style={{ color: equal ? "var(--correct)" : "var(--ink)" }}
        >
          {equal ? "✓ Same vector (different positions)" : "Different vectors"}
        </div>
      </motion.div>
    </div>
  );
}