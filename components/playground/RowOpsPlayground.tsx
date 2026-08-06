"use client";
import { useState, useMemo } from "react";
import { m2det, fmt } from "@/lib/math";
import {
  RotateCcw,
  Shuffle,
  Scaling,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BarsGraph,
  MatrixStripHeatmap,
  LinesGraph,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept L5: Row Operations — Multiply, Swap, Add
// "Three moves that don't change the answer. Master the toolkit before you use it."
//
// Beyond the live editable matrix + op buttons, we add:
//   * A lines-graph so the student can SEE the two lines on a 2D plot
//   * A matrix heatmap of the current state
//   * A bars graph of det + entries
//   * A prose step-by-step explainer

export function RowOpsPlayground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(1);
  const [swap, setSwap] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const M = useMemo<[[number, number], [number, number]]>(() => {
    const base: [[number, number], [number, number]] = [[a, b], [c, d]];
    return swap ? [[c, d], [a, b]] : base;
  }, [a, b, c, d, swap]);

  const det = m2det(M);

  // Apply a transformation
  const scaleRow = (row: number, k: number) => {
    if (k === 0) return;
    if (row === 0) {
      if (swap) { setC(c * k); setD(d * k); } else { setA(a * k); setB(b * k); }
    } else {
      if (swap) { setA(a * k); setB(b * k); } else { setC(c * k); setD(d * k); }
    }
  };
  const addRow = (from: number, to: number, k: number) => {
    if (from === to) return;
    if (from === 0) {
      if (swap) {
        if (to === 1) { setA(a + c * k); setB(b + d * k); }
      } else {
        if (to === 1) { setC(c + a * k); setD(d + b * k); }
      }
    } else {
      if (swap) {
        if (to === 0) { setC(c + a * k); setD(d + b * k); }
      } else {
        if (to === 0) { setA(a + c * k); setB(b + d * k); }
      }
    }
  };
  const reset = () => { setA(1); setB(1); setC(1); setD(1); setSwap(false); };

  const b1 = 5, b2 = 3;
  const m11 = M[0]?.[0] ?? 0;
  const m12 = M[0]?.[1] ?? 0;
  const m21 = M[1]?.[0] ?? 0;
  const m22 = M[1]?.[1] ?? 0;
  const x = (m22 * b1 - m12 * b2) / det;
  const y = (-m21 * b1 + m11 * b2) / det;
  const isDegenerate = Math.abs(det) < 0.1;

  // Convert each row to slope-intercept form so we can plot.
  // Each row is a·x + b·y = c (where c is b1 or b2 depending on the row).
  const linesForGraph = useMemo(() => {
    return M.map((row, i) => {
      const ar = row[0] ?? 0;
      const br = row[1] ?? 0;
      const rhs = i === 0 ? b1 : b2;
      if (Math.abs(br) > 1e-9) {
        return { m: -ar / br, c: rhs / br };
      }
      // Vertical-ish line — represent with huge slope.
      return { m: 1e6, c: -ar * 1e6 / (rhs || 1) };
    });
  }, [M, b1, b2]);

  // Intersection of the two lines (the (x, y) answer).
  const intersection = useMemo(() => {
    if (isDegenerate) return null;
    const [l1, l2] = linesForGraph;
    if (!l1 || !l2) return null;
    if (Math.abs(l1.m - l2.m) < 1e-6) return null;
    const x = (l2.c - l1.c) / (l1.m - l2.m);
    const y = l1.m * x + l1.c;
    return { x, y };
  }, [linesForGraph, isDegenerate]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read the augmented matrix [A | b]",
        detail:
          "Two equations, two unknowns. The 2×2 block is A — its rows " +
          "are the two lines we're solving. The right column is b — " +
          "the constant on the right side of each equation.",
        value: `[${M.map((r, i) => `[${r.map((v) => fmt(v, 1)).join(", ")} | ${fmt(i === 0 ? b1 : b2, 1)}]`).join(" ")}]`,
        tone: "faint" as const,
      },
      {
        title: "Compute det(A) — sign and magnitude",
        detail:
          "det = a·d − b·c. Sign tells you orientation (which line is " +
          "above the other at x = 0); magnitude tells you how far apart " +
          "they'd be scaled. When det → 0, lines become parallel or " +
          "coincident.",
        value: `det = ${fmt(det, 3)}`,
        tone: isDegenerate ? ("warn" as const) : ("accent" as const),
      },
      {
        title: "Apply the three solution-preserving moves",
        detail:
          "Swap rows, scale a row by non-zero, add a multiple of one row " +
          "to another. The determinant tells you how each move changes " +
          "the AREA: swap flips sign, scale-by-k multiplies by k, " +
          "add-multiple leaves it unchanged.",
        value: isDegenerate ? "0 — system collapsed" : "≠ 0 — invertible",
        tone: isDegenerate ? ("warn" as const) : ("accent" as const),
      },
      {
        title: "Read off (x, y) from Cramer's rule",
        detail:
          "x = (m₂₂·b₁ − m₁₂·b₂) / det, y = (−m₂₁·b₁ + m₁₁·b₂) / det. " +
          "These numbers must stay PUT across any solution-preserving " +
          "move. If they don't, you've made a mistake.",
        value: `(x, y) = (${fmt(x, 3)}, ${fmt(y, 3)})`,
        tone: isFinite(x) ? ("accent" as const) : ("warn" as const),
      },
    ],
    [M, det, x, y, b1, b2, isDegenerate],
  );

  // Heatmap view of the augmented matrix.
  const augMatrix = useMemo(
    () => [M[0] ? [...M[0], b1] : [0, 0, b1], M[1] ? [...M[1], b2] : [0, 0, b2]],
    [M, b1, b2],
  );

  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Three moves that don&apos;t change the answer
        </h3>
        <p className="text-xs text-dim mb-4">
          Solve: x + y = 5, x + y = 3. Wait — they have the same slope! The lines
          are parallel. Use row operations to make the structure visible.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Matrix A */}
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Your matrix [A | b]</div>
            <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
              {M.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-faint text-xs w-6">R{i + 1}</span>
                  <span className="text-ink">[</span>
                  <span className="text-vector w-8 text-right">{fmt(row[0])}</span>
                  <span className="text-matrix w-8 text-right">{fmt(row[1])}</span>
                  <span className="text-faint">|</span>
                  <span className="text-accent w-8 text-right">{fmt(i === 0 ? b1 : b2)}</span>
                  <span className="text-ink">]</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-faint">
              det = {fmt(det, 3)} {isDegenerate && "(≈ 0 — the system is degenerate)"}
            </div>
          </div>

          {/* Operations */}
          <div className="space-y-2">
            <div className="bg-elev/30 border border-line rounded-md p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
                <Shuffle size={11} /> 1. Swap rows
              </div>
              <button
                onClick={() => setSwap(!swap)}
                className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60"
              >
                R1 ↔ R2 {!swap ? "(swap)" : "(unswap)"}
              </button>
            </div>

            <div className="bg-elev/30 border border-line rounded-md p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
                <Scaling size={11} /> 2. Scale a row
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => scaleRow(0, 2)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 × 2</button>
                <button onClick={() => scaleRow(0, 0.5)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 ÷ 2</button>
                <button onClick={() => scaleRow(1, 2)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 × 2</button>
                <button onClick={() => scaleRow(1, 0.5)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 ÷ 2</button>
              </div>
            </div>

            <div className="bg-elev/30 border border-line rounded-md p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
                <Plus size={11} /> 3. Add a multiple
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => addRow(0, 1, -1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 − R1</button>
                <button onClick={() => addRow(0, 1, 1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 + R1</button>
                <button onClick={() => addRow(1, 0, -1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 − R2</button>
                <button onClick={() => addRow(1, 0, 1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 + R2</button>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full text-xs text-dim hover:text-ink flex items-center justify-center gap-1 py-1.5 border border-line rounded-md"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-elev/30 rounded-md p-2 text-center">
            <div className="text-[10px] text-faint uppercase tracking-wider">x</div>
            <div className="font-mono text-sm text-ink">{isFinite(x) ? fmt(x, 3) : "—"}</div>
          </div>
          <div className="bg-elev/30 rounded-md p-2 text-center">
            <div className="text-[10px] text-faint uppercase tracking-wider">y</div>
            <div className="font-mono text-sm text-ink">{isFinite(y) ? fmt(y, 3) : "—"}</div>
          </div>
          <div className="bg-elev/30 rounded-md p-2 text-center">
            <div className="text-[10px] text-faint uppercase tracking-wider">status</div>
            <div className="text-[10px] mt-1" style={{ color: isDegenerate ? "var(--warn)" : "var(--accent)" }}>
              {isDegenerate ? "no / ∞" : "unique"}
            </div>
          </div>
        </div>
      </div>

      {/* Graphs: lines visualisation + bars of the determinant */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            The two equations as lines
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each row of the augmented matrix is one line. Watch them
            converge when det ≠ 0; become parallel when det → 0.
          </p>
          <LinesGraph
            rows={linesForGraph}
            intersection={intersection}
            width={undefined}
            height={240}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            det + matrix entry magnitudes
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The rightmost bar is det — when it shrinks toward zero, the
            parallel lines in the picture above merge into one.
          </p>
          <BarsGraph
            values={[M[0]?.[0] ?? 0, M[0]?.[1] ?? 0, M[1]?.[0] ?? 0, M[1]?.[1] ?? 0, det]}
            labels={["a", "b", "c", "d", "det"]}
            maxAbs={Math.max(6, Math.abs(det) + 1)}
            highlights={[4]}
            width={undefined}
            height={160}
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Current matrix (heatmap)
        </div>
        <MatrixStripHeatmap
          matrix={augMatrix}
          maxAbs={Math.max(6, ...augMatrix.flat().map((v) => Math.abs(v) || 0))}
          highlightCols={[2]}
          className="w-full"
        />
      </div>

      {/* Step-by-step explainer */}
      <div className="bg-card border border-line rounded-xl overflow-hidden">
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
