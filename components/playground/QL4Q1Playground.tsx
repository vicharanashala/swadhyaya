"use client";
import { useState, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { fmt, m2det } from "@/lib/math";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question L4-q1: "A = [[1,2],[3,4]], x = [1,1]. What is Ax?"
// Widget: a 2x2 matrix A and a 2-vector x, both editable via small
// number inputs. The product y = Ax is computed live and plotted:
// x as a blue arrow from origin, y as a red arrow from origin, A
// applied to the unit grid (warped parallelogram) so the student can
// see how A "moves" x to y.
//
// Beyond the VectorCanvas, we add:
//   * A matrix-heatmap strip showing |A| with sign-coloring
//   * A bars graph of the A·x calculation (component-wise)
//   * A prose "step-by-step" explainer that walks through forming A,
//     forming x, computing Ax via dot products, and reading the answer.

function TeX({ math, color }: { math: string; color?: string }) {
  try {
    const html = katex.renderToString(math, { displayMode: true });
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

export function QL4Q1Playground() {
  // Defaults match the actual question
  const [[a, b, c, d], setA] = useState<[number, number, number, number]>([1, 2, 3, 4]);
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(1);
  const [showSteps, setShowSteps] = useState(false);

  const y1 = a * x1 + b * x2;
  const y2 = c * x1 + d * x2;
  const det = m2det([[a, b], [c, d]] as const);
  const isSingular = Math.abs(det) < 1e-6;

  // Grid image: where do the basis vectors e1 and e2 land?
  // A * e1 = (a, c),  A * e2 = (b, d)
  const W = 360;

  // Steps — prose, not table.
  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — its two columns tell you where î and ĵ go",
        detail:
          "Column 1 = where the basis vector î lands after the " +
          "transformation; column 2 = where ĵ lands. So A " +
          "completely describes how the plane gets reshaped — every " +
          "other vector's image follows from these two arrows.",
        value: `col1=(${fmt(a, 2)}, ${fmt(c, 2)}), col2=(${fmt(b, 2)}, ${fmt(d, 2)})`,
        tone: "faint" as const,
      },
      {
        title: "Check det(A) — does A invert?",
        detail:
          "det(A) ≠ 0 means A has an inverse (you can undo the " +
          "transformation); det(A) = 0 means A collapses a " +
          "dimension and the transformation loses information.",
        value: `det(A) = ${fmt(det, 3)}`,
        tone: isSingular ? ("warn" as const) : ("accent" as const),
      },
      {
        title: "Read x — the input vector",
        detail:
          "x is the unknown we feed INTO the transformation. The " +
          "output y = Ax tells us where x lands after A reshapes " +
          "the space.",
        value: `x = (${fmt(x1, 2)}, ${fmt(x2, 2)})`,
        tone: "faint" as const,
      },
      {
        title: "Compute y = A·x — dot each row of A with x",
        detail:
          "Row 1: a·x₁ + b·x₂ gives the first component of y. " +
          "Row 2: c·x₁ + d·x₂ gives the second. This is the " +
          "definition of matrix-vector multiplication — each row " +
          "dotted with x.",
        value: `y = (${fmt(y1, 2)}, ${fmt(y2, 2)})`,
        tone: "accent" as const,
      },
      {
        title: "Geometrically — y is A applied to x",
        detail:
          "The blue arrow x gets warped by A into the orange arrow " +
          "y. Watch the unit grid deform too — the parallelogram " +
          "spanned by A·î and A·ĵ is the unit cell's new shape.",
        value: `||y|| = ${fmt(Math.hypot(y1, y2), 3)}`,
        tone: "faint" as const,
      },
    ],
    [a, b, c, d, det, x1, x2, y1, y2, isSingular],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        A · x — the matrix multiplies the vector
      </div>

      {/* KaTeX equation */}
      <motion.div
        layout
        className="bg-card border border-line rounded-lg px-3 py-2 mb-3"
      >
        <TeX
          math={`\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix} \\begin{pmatrix} ${x1} \\\\ ${x2} \\end{pmatrix} = \\begin{pmatrix} ${fmt(y1, 2)} \\\\ ${fmt(y2, 2)} \\end{pmatrix}`}
        />
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={W}
          height={W}
          worldSize={4}
          gridLines={[
            // A * e1
            {
              from: { x: 0, y: 0 },
              to: { x: a, y: c },
              color: "var(--matrix)",
              width: 2,
              dashed: true,
            },
            // A * e2
            {
              from: { x: 0, y: 0 },
              to: { x: b, y: d },
              color: "var(--matrix)",
              width: 2,
              dashed: true,
            },
            // A * x (warped parallelogram side)
            {
              from: { x: b * x2, y: d * x2 },
              to: { x: y1, y: y2 },
              color: "var(--accent)",
              width: 1.5,
              dashed: true,
            },
            {
              from: { x: a * x1, y: c * x1 },
              to: { x: y1, y: y2 },
              color: "var(--accent)",
              width: 1.5,
              dashed: true,
            },
          ]}
          arrows={[
            // x (input, blue)
            {
              from: { x: 0, y: 0 },
              to: { x: x1, y: x2 },
              color: "var(--matrix)",
              label: `x = (${x1}, ${x2})`,
              labelOffset: { x: -0.3, y: 0.4 },
              width: 2.5,
            },
            // y = Ax (output, red)
            {
              from: { x: 0, y: 0 },
              to: { x: y1, y: y2 },
              color: "var(--vector)",
              label: `y = (${y1.toFixed(2)}, ${y2.toFixed(2)})`,
              labelOffset: { x: -0.3, y: 0.4 },
              width: 3,
            },
          ]}
        />

        <div className="flex-1 space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              A
            </div>
            <div className="grid grid-cols-2 gap-1 max-w-[120px] font-mono">
              <Cell value={a} onChange={(v) => setA([v, b, c, d])} />
              <Cell value={b} onChange={(v) => setA([a, v, c, d])} />
              <Cell value={c} onChange={(v) => setA([a, b, v, d])} />
              <Cell value={d} onChange={(v) => setA([a, b, c, v])} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              x
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-faint">(</span>
              <input
                type="number"
                value={x1}
                step={0.5}
                onChange={(e) => setX1(Number(e.target.value))}
                className="w-14 bg-card border border-line rounded px-1.5 py-0.5 text-matrix text-center"
              />
              <span className="text-faint">,</span>
              <input
                type="number"
                value={x2}
                step={0.5}
                onChange={(e) => setX2(Number(e.target.value))}
                className="w-14 bg-card border border-line rounded px-1.5 py-0.5 text-matrix text-center"
              />
              <span className="text-faint">)</span>
            </div>
          </div>
          <div className="bg-card border border-line rounded p-2">
            <div className="text-faint text-[10px] uppercase tracking-wider">
              y = A · x
            </div>
            <div className="font-mono text-vector">
              ({y1.toFixed(1)}, {y2.toFixed(1)})
            </div>
            <div className="text-[10px] text-faint mt-1">
              row 1: {a}·{x1} + {b}·{x2} = {y1.toFixed(1)}
              <br />
              row 2: {c}·{x1} + {d}·{x2} = {y2.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Graphs: matrix heatmap + dot-product bars */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Color = sign (warm = positive, cool = negative). Watch how
            dragging entries changes the parallelogram the basis vectors
            span.
          </p>
          <MatrixStripHeatmap
            matrix={[[a, b], [c, d]]}
            maxAbs={Math.max(4, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Dot-product terms — how y is built
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each bar is one term in the row sums that produce y. Negative
            terms pull the sum down, positive push it up.
          </p>
          <BarsGraph
            values={[a * x1, b * x2, y1, c * x1, d * x2, y2]}
            labels={["a·x₁", "b·x₂", "y₁", "c·x₁", "d·x₂", "y₂"]}
            maxAbs={Math.max(6, Math.abs(y1), Math.abs(y2))}
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

function Cell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      step={0.5}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-14 bg-card border border-line rounded px-1.5 py-1 text-matrix text-center"
    />
  );
}
