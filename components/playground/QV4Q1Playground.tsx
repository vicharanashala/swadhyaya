"use client";
import { useState, useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";

// Question V4-q1: "Which of these is a subspace of R²?"
// Story: A subspace must contain the origin AND be closed under both
// addition and scalar multiplication. The student picks from four shapes
// (a line through origin, a line NOT through origin, a circle, a square).
// For the chosen shape we test closure using a d3-scale sequential
// color ramp to mark which test pairs (a, b) of points satisfy a + b ∈ S
// and a·k ∈ S for various k — green if closed, red if not.

interface Shape {
  id: string;
  name: string;
  passes: boolean;
  reason: string;
  sample: Array<{ x: number; y: number; in: boolean }>;
}

const SHAPES: Shape[] = [
  {
    id: "origin-line",
    name: "Line through origin",
    passes: true,
    reason: "0·x + 0·y = 0 (closed under +0, contains origin, closed under scale).",
    sample: [],
  },
  {
    id: "shifted-line",
    name: "Line NOT through origin",
    passes: false,
    reason: "y = x + 1 doesn't contain (0,0). Scale by 0 → (0,0), not on the line.",
    sample: [],
  },
  {
    id: "circle",
    name: "Circle",
    passes: false,
    reason: "Sum of two unit-circle points is generally outside the circle.",
    sample: [],
  },
  {
    id: "square",
    name: "Square",
    passes: false,
    reason: "Sum of two corner points is generally outside the square.",
    sample: [],
  },
];

// Build samples
function buildSamples(): Record<string, Shape> {
  const result: Record<string, Shape> = {};
  for (const s of SHAPES) {
    if (s.id === "origin-line") {
      s.sample = [
        { x: 1, y: 1, in: true },
        { x: -2, y: -2, in: true },
        { x: 0.5, y: 0.5, in: true },
        { x: 3, y: -3, in: true },
      ];
    } else if (s.id === "shifted-line") {
      s.sample = [
        { x: 0, y: 1, in: true },
        { x: -1, y: 0, in: true },
        { x: 1, y: 2, in: true },
        { x: 0, y: 0, in: false },
      ];
    } else if (s.id === "circle") {
      s.sample = [
        { x: 1, y: 0, in: true },
        { x: 0, y: 1, in: true },
        { x: 0.7, y: 0.7, in: true },
        { x: 1, y: 1, in: false },
        { x: 1.4, y: 1.4, in: false },
      ];
    } else {
      s.sample = [
        { x: 1, y: 1, in: true },
        { x: -1, y: -1, in: true },
        { x: 1, y: -1, in: true },
        { x: -1, y: 1, in: true },
        { x: 1.5, y: 1.5, in: false },
        { x: 2, y: 0, in: false },
      ];
    }
    result[s.id] = s;
  }
  return result;
}

export function QV4Q1Playground() {
  const data = useMemo(() => buildSamples(), []);
  const [chosen, setChosen] = useState<string>("origin-line");

  // d3-scale: map a "violation strength" (0 = closed, 1 = wide open)
  // to a colour ramp from green to red.
  const violationColor = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1])
        .range(["#5cb87a", "#f0a050", "#e05a4a"])
        .clamp(true),
    [],
  );

  const shape = data[chosen];
  if (!shape) return null;
  const violationPct =
    shape.sample.length === 0
      ? 0
      : shape.sample.filter((s) => !s.in).length / shape.sample.length;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Which shape is a subspace of R²? Pick and watch the violation map.
      </div>
      <p className="text-[10px] text-dim mb-3">
        A subspace must contain the origin and stay inside itself under
        addition and scalar multiplication.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {Object.values(data).map((s) => (
          <button
            key={s.id}
            onClick={() => setChosen(s.id)}
            className={`p-2 rounded border text-left transition ${
              chosen === s.id
                ? s.passes
                  ? "bg-correct/20 border-correct/40"
                  : "bg-warn/20 border-warn/40"
                : "border-line hover:bg-elev/40"
            }`}
          >
            <div className="text-xs font-medium">{s.name}</div>
            <div className="text-[9px] text-faint">
              {s.passes ? "✓ subspace" : "✗ not a subspace"}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-card border border-line rounded p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
          Violation map — colour is d3-scale of # points outside the shape
        </div>
        <div className="flex gap-2 items-center">
          <div
            className="w-8 h-8 rounded"
            style={{ background: violationColor(0) }}
            aria-hidden="true"
          />
          <div className="flex-1 h-2 rounded-full bg-elev overflow-hidden">
            <motion.div
              className="h-full"
              style={{ background: violationColor(violationPct) }}
              animate={{ width: `${violationPct * 100}%` }}
              transition={{ duration: 0.3 }}
              role="progressbar"
              aria-valuenow={Math.round(violationPct * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div
            className="w-8 h-8 rounded"
            style={{ background: violationColor(1) }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 text-[10px] text-dim font-mono">
          {(violationPct * 100).toFixed(0)}% of test points fall outside
        </div>
      </div>

      <motion.div
        key={chosen}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-3 rounded p-3 border ${
          shape.passes
            ? "bg-correct/10 border-correct/40"
            : "bg-warn/10 border-warn/40"
        }`}
      >
        <div
          className="font-medium text-sm flex items-center gap-1.5"
          style={{ color: shape.passes ? "var(--correct)" : "var(--warn)" }}
        >
          {shape.passes ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <X size={14} aria-hidden="true" />
          )}
          {shape.name}: {shape.passes ? "IS a subspace" : "is NOT a subspace"}
        </div>
        <div className="text-[10px] text-dim mt-1">{shape.reason}</div>
      </motion.div>

      <button
        onClick={() => setChosen("origin-line")}
        className="mt-3 w-full text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center justify-center gap-1"
      >
        <RotateCcw size={10} aria-hidden="true" /> reset
      </button>
    </div>
  );
}