"use client";
import { useState, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { matRref, fmt } from "@/lib/math";
import { motion } from "framer-motion";
import { Sparkles, Shuffle, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  PlaneStripesGraph,
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import {
  StepExplainer,
  buildSystemSolveSteps,
} from "./_shared/StepExplainer";

// Question L3-q1: "Three equations in three unknowns usually have…"
// Library: KaTeX (math formula display) + framer-motion (smooth transitions)
// The student manipulates all three equations simultaneously —
//   * sliders OR number inputs for each coefficient
//   * live solution point update
//   * the equations are written symbolically via KaTeX
//   * an animated "determinant meter" tells them when the system is
//     singular (determinant ≈ 0), so they can FEEL when there are
//     zero or infinite solutions.
//   * a 2D plane-stripes graph shows the orientations of the three
//     planes (so the student can SEE why the planes meet or don't)
//   * a "What's happening" panel walks through the solve step-by-step
//     in prose, not a table.

// Inline KaTeX formula, rendered to HTML. Returns null for invalid input.
function TeX({ math, color }: { math: string; color?: string }) {
  try {
    const html = katex.renderToString(math, {
      displayMode: true,
    });
    return (
      <span
        style={{ color }}
        dangerouslySetInnerHTML={{ __html: html }}
        className="text-base"
      />
    );
  } catch {
    return <span className="text-warn font-mono text-xs">{math}</span>;
  }
}

interface EqState {
  a: number;
  b: number;
  c: number;
  d: number;
}

const PRESETS: Array<{
  name: string;
  eqs: [EqState, EqState, EqState];
  right: [number, number, number];
}> = [
  {
    name: "Unique",
    eqs: [
      { a: 1, b: 0, c: 0, d: 2 },
      { a: 0, b: 1, c: 0, d: 1 },
      { a: 0, b: 0, c: 1, d: 3 },
    ],
    right: [2, 1, 3],
  },
  {
    name: "Coincident planes",
    eqs: [
      { a: 1, b: 0, c: 0, d: 1 },
      { a: 2, b: 0, c: 0, d: 2 },
      { a: 3, b: 0, c: 0, d: 1 },
    ],
    right: [1, 2, 0],
  },
  {
    name: "Parallel planes",
    eqs: [
      { a: 1, b: 0, c: 0, d: 2 },
      { a: 1, b: 0, c: 0, d: 5 },
      { a: 0, b: 0, c: 1, d: 1 },
    ],
    right: [1, 0, 0],
  },
  {
    name: "Near-singular",
    eqs: [
      { a: 1, b: 2, c: 3, d: 2 },
      { a: 4, b: 5, c: 6, d: 3 },
      { a: 7, b: 8, c: 9, d: 1 },
    ],
    right: [1, 2, 3],
  },
];

export function QL3Q1Playground() {
  const [eqs, setEqs] = useState<[EqState, EqState, EqState]>([
    { a: 1, b: 0, c: 0, d: 2 },
    { a: 0, b: 1, c: 0, d: 1 },
    { a: 0, b: 0, c: 1, d: 3 },
  ]);
  const [rhs, setRhs] = useState<[number, number, number]>([2, 1, 3]);

  const [showSteps, setShowSteps] = useState(false);

  const updateEq = (
    i: 0 | 1 | 2,
    key: keyof EqState,
    value: number,
  ) => {
    setEqs((arr) => {
      const next: [EqState, EqState, EqState] = [
        { ...arr[0] },
        { ...arr[1] },
        { ...arr[2] },
      ];
      next[i][key] = value;
      return next;
    });
  };

  const updateRhs = (i: 0 | 1 | 2, v: number) =>
    setRhs((r) => [i === 0 ? v : r[0], i === 1 ? v : r[1], i === 2 ? v : r[2]]);

  // Build the 3×3 augmented matrix and solve via RREF.
  const solution = useMemo(() => {
    const A = eqs.map((e) => [e.a, e.b, e.c]);
    const b = [rhs[0], rhs[1], rhs[2]];
    const aug = A.map((row, i) => [...row, b[i]]);
    const { rref, pivots } = matRref(aug);

    // Inconsistent?
    for (const row of rref) {
      const leftZero = row.slice(0, 3).every((v) => Math.abs(v) < 1e-9);
      const rightNonzero = Math.abs(row[3] ?? 0) > 1e-9;
      if (leftZero && rightNonzero) return { type: "none" as const, rref, pivots };
    }
    // Unique solution?
    if (pivots.length === 3) {
      const sol = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        const col = pivots[i];
        if (col !== undefined) sol[col] = rref[i]?.[3] ?? 0;
      }
      return { type: "unique" as const, sol, rref, pivots };
    }
    return {
      type: "infinite" as const,
      rank: pivots.length,
      rref,
      pivots,
    };
  }, [eqs, rhs]);

  // Determinant (3×3 via Sarrus' rule, computed from the coefficient matrix).
  const det = useMemo(() => {
    const m = eqs.map((e) => [e.a, e.b, e.c]);
    return (
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!)
    );
  }, [eqs]);

  // Log-scale magnitude of |det| for the meter.
  const detMag = Math.log10(Math.max(1e-6, Math.abs(det)));
  const meterPct = Math.min(100, (detMag / 2) * 100); // 0 at 1e-6, 100 at 1e2
  const isNearSingular = Math.abs(det) < 0.1;

  const status =
    solution.type === "unique"
      ? { color: "var(--accent)", text: "1 unique solution", bg: "bg-accent/10 border-accent/40" }
      : solution.type === "none"
        ? { color: "var(--wrong)", text: "0 solutions — planes contradict", bg: "bg-wrong/10 border-wrong/40" }
        : { color: "var(--warn)", text: "∞ solutions — under-determined", bg: "bg-warn/10 border-warn/40" };

  // Build the row data shape expected by the shared graph + step
  // components.
  const rows: [number, number, number, number][] = eqs.map((e, i) => [
    e.a,
    e.b,
    e.c,
    rhs[i] ?? 0,
  ]);
  const graphSolution =
    solution.type === "unique"
      ? ({ type: "unique" as const, sol: solution.sol })
      : solution.type === "infinite"
        ? ({ type: "infinite" as const, rank: solution.rank })
        : ({ type: "none" as const });
  const explainerSteps = useMemo(
    () =>
      buildSystemSolveSteps({
        rows,
        rref: solution.rref,
        pivots: solution.pivots,
        rank: solution.pivots.length,
        solution: graphSolution,
        det,
      }),
    [rows, solution, graphSolution, det],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        Three equations, three unknowns — drag coefficients, watch the solution
      </div>

      {/* KaTeX equation display */}
      <div className="space-y-2 mb-4 font-serif">
        {eqs.map((e, i) => (
          <motion.div
            key={i}
            layout
            className="flex items-center gap-3 bg-card border border-line rounded-lg px-3 py-2"
          >
            <span className="text-[10px] text-faint font-mono w-4">
              L{i + 1}:
            </span>
            <div className="flex-1">
              <TeX
                math={`${e.a}x + ${e.b}y + ${e.c}z = ${rhs[i]}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Equation coefficient editors — three columns per equation */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([0, 1, 2] as const).map((i) => (
          <div
            key={i}
            className="bg-card border border-line rounded-lg p-2"
          >
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1.5 text-center">
              L{i + 1} coefficients
            </div>
            <div className="grid grid-cols-2 gap-1">
              <CoeffRow label="a" value={eqs[i].a} onChange={(v) => updateEq(i, "a", v)} />
              <CoeffRow label="b" value={eqs[i].b} onChange={(v) => updateEq(i, "b", v)} />
              <CoeffRow label="c" value={eqs[i].c} onChange={(v) => updateEq(i, "c", v)} />
              <CoeffRow label="d" value={rhs[i]} onChange={(v) => updateRhs(i, v)} />
            </div>
          </div>
        ))}
      </div>

      {/* Status banner — animated */}
      <motion.div
        key={solution.type}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className={`mb-3 border rounded-xl p-3 text-center ${status.bg}`}
      >
        <div className="text-sm font-medium" style={{ color: status.color }}>
          {solution.type === "unique" && (
            <>
              <Sparkles size={12} className="inline mr-1" aria-hidden="true" />
              Solves at{" "}
              <span className="font-mono">
                ({fmt(solution.sol[0], 2)}, {fmt(solution.sol[1], 2)},{" "}
                {fmt(solution.sol[2], 2)})
              </span>
            </>
          )}
          {solution.type === "none" && "The planes contradict — no common point."}
          {solution.type === "infinite" && (
            <>
              The planes share a line / plane — rank = {solution.rank}, so{" "}
              {3 - solution.rank} dimension{3 - solution.rank === 1 ? "" : "s"}{" "}
              of freedom.
            </>
          )}
        </div>
      </motion.div>

      {/* Determinant meter */}
      <div>
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Determinant |A|</span>
          <span className="font-mono text-ink">{fmt(det, 3)}</span>
        </div>
        <div
          className="relative h-2 rounded-full bg-elev overflow-hidden"
          role="progressbar"
          aria-label="Determinant magnitude"
          aria-valuenow={Math.round(meterPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className={`absolute top-0 h-full ${
              isNearSingular ? "bg-warn" : "bg-accent"
            }`}
            animate={{ width: `${meterPct}%` }}
            transition={{ duration: 0.25 }}
          />
          {/* Singularity line at |det|=0 */}
          <div
            className="absolute top-[-2px] h-6 w-px bg-faint"
            aria-hidden="true"
          />
        </div>
        <div className="mt-1 text-[10px] text-dim leading-relaxed">
          When |det| → 0, the system loses information — 0 or ∞ solutions
          instead of 1.
        </div>
      </div>

      {/* Visualisations: 2D stripe graph + matrix heatmap side by side */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Plane orientations (2D)
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each tilted stripe is one plane — see how its angle tracks the
            normal vector. Watch the three stripes converge when the system
            meets at a point.
          </p>
          <PlaneStripesGraph
            rows={rows}
            solution={graphSolution}
            width={undefined}
            height={200}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Augmented matrix [A | b]
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Color = magnitude, sign = direction. Watch the columns light up
            as you edit — the columns without pivots (free variables) carry
            infinite solutions.
          </p>
          <MatrixStripHeatmap
            matrix={rows}
            highlightCols={solution.pivots}
            maxAbs={Math.max(
              3,
              ...rows.flat().map((v) => Math.abs(v) || 0),
            )}
            className="w-full"
          />
        </div>
      </div>

      {/* Row magnitude bars */}
      <div className="mt-3 bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Row magnitudes — feel when a row collapses
        </div>
        <BarsGraph
          values={rows.map((r) => Math.hypot(r[0], r[1], r[2], r[3]))}
          labels={rows.map((_, i) => `R${i + 1}`)}
          width={undefined}
          height={100}
          className="w-full"
        />
      </div>

      {/* What's-happening toggle + deep step explainer */}
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

      {/* Presets */}
      <div className="mt-3 flex flex-wrap gap-1">
        <div className="text-[10px] text-faint uppercase tracking-wider mr-2 self-center">
          presets
        </div>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setEqs(p.eqs);
              setRhs(p.right);
            }}
            className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
          >
            <Shuffle size={10} aria-hidden="true" /> {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function CoeffRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-faint font-mono w-3">{label}</span>
      <input
        type="number"
        step={0.5}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="flex-1 min-w-0 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
        aria-label={`${label} value`}
      />
    </div>
  );
}
