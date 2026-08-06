"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { m2mulVec, m2det, fmt } from "@/lib/math";
import { Sparkles, RotateCcw, Info, ChevronDown, ChevronUp } from "lucide-react";
import { TeX, BasisTransform, ValueBar } from "@/components/viz/VisualPrimitives";
import {
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept L4: The Matrix Form — Ax = b
// "The moment matrices enter. Coefficients, unknowns, answers — three blocks."
//
// Three ways to play:
//   1. Drag the tip of vector x anywhere on the canvas.
//   2. Type exact values into the matrix / x inputs.
//   3. Use the preset cards for quick exploration.
//
// Ax is computed live and drawn on the canvas. As you change x, the
// output arrow follows. The matrix heatmap and the bars graph show
// the same picture in two more languages — magnitude + dot-product.

type NumInputProps = {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  ariaLabel: string;
};

function NumInput({ value, onChange, step = 0.1, ariaLabel }: NumInputProps) {
  return (
    <input
      type="number"
      step={step}
      aria-label={ariaLabel}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) onChange(v);
      }}
      className="w-full px-2 py-1.5 text-xs font-mono rounded border border-line bg-canvas text-ink focus:outline-none focus:border-accent transition"
    />
  );
}

const PRESETS: Array<{
  name: string;
  M: [[number, number], [number, number]];
  v: [number, number];
  detail: string;
}> = [
  {
    name: "Identity",
    M: [[1, 0], [0, 1]],
    v: [2, 1],
    detail: "ax = y → b is just x unchanged.",
  },
  {
    name: "Swap",
    M: [[0, 1], [1, 0]],
    v: [2, 1],
    detail: "swap rows — output flips the components.",
  },
  {
    name: "Scale 2×",
    M: [[2, 0], [0, 2]],
    v: [1, 1],
    detail: "uniform scaling — b is twice as long as x.",
  },
  {
    name: "Shear",
    M: [[1, 1], [0, 1]],
    v: [2, 0],
    detail: "x slides along ĵ without changing its own length.",
  },
  {
    name: "Rotate 90°",
    M: [[0, -1], [1, 0]],
    v: [2, 0],
    detail: "counterclockwise quarter turn.",
  },
  {
    name: "Project x",
    M: [[1, 0], [0, 0]],
    v: [1, 1],
    detail: "y-component vanishes — b lies on the x-axis.",
  },
];

export function MatrixTimesVectorPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(3);
  const [d, setD] = useState(1);
  const [x, setX] = useState(2);
  const [y, setY] = useState(1);
  const [showSteps, setShowSteps] = useState(false);

  const M = useMemo<[[number, number], [number, number]]>(
    () => [[a, b], [c, d]],
    [a, b, c, d],
  );
  const v = useMemo<[number, number]>(() => [x, y], [x, y]);
  const out = useMemo(() => m2mulVec(M, v), [M, v]);
  const det = useMemo(() => m2det(M), [M]);
  const isSingular = Math.abs(det) < 1e-6;

  const reset = () => {
    setA(2);
    setB(1);
    setC(3);
    setD(1);
    setX(2);
    setY(1);
  };

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — its two columns tell you where î and ĵ go",
        detail:
          "Drag the two colored arrows. Each arrow IS a column of the matrix. " +
          "Column 1 = where î lands; column 2 = where ĵ lands. The full " +
          "transformation is determined by these two destinations alone.",
        value: `col1=(${fmt(M[0][0], 2)}, ${fmt(M[1][0], 2)}) · col2=(${fmt(M[0][1], 2)}, ${fmt(M[1][1], 2)})`,
        tone: "faint" as const,
      },
      {
        title: "Check det(A) — does A collapse any dimension?",
        detail:
          "det ≠ 0 means A is invertible (you can undo the warp). " +
          "det = 0 means a dimension is squashed and information is lost.",
        value: `det(A) = ${fmt(det, 3)}`,
        tone: isSingular ? ("warn" as const) : ("accent" as const),
      },
      {
        title: "Read x — the input vector",
        detail:
          "x is the unknown we feed INTO the transformation. " +
          "The output b = Ax tells us where x lands after A reshapes space.",
        value: `x = (${fmt(x, 2)}, ${fmt(y, 2)})`,
        tone: "faint" as const,
      },
      {
        title: "Compute b = A·x — dot each row of A with x",
        detail:
          "Row 1: a·x + b·y gives the first component of b. " +
          "Row 2: c·x + d·y gives the second. " +
          "Each row dotted with x — that's the whole definition.",
        value: `b = (${fmt(out[0] ?? 0, 2)}, ${fmt(out[1] ?? 0, 2)})`,
        tone: "accent" as const,
      },
      {
        title: "Geometrically — b is A applied to x",
        detail:
          "The white arrow x gets warped by A into the orange arrow b. " +
          "Watch the basis-vector transform: every other vector follows from " +
          "where î and ĵ go. The parallelogram they span is the unit cell's new shape.",
        value: `||b|| = ${fmt(Math.hypot(out[0] ?? 0, out[1] ?? 0), 3)}`,
        tone: "faint" as const,
      },
    ],
    [M, det, isSingular, x, y, out],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-warn" aria-hidden="true" />
          <h3 className="text-sm font-medium text-ink">
            A x = b — drag x, edit A, watch b follow
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isSingular && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-warn/30 bg-warn/10 text-warn font-mono">
              singular · det = 0
            </span>
          )}
          <button
            onClick={reset}
            className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1 transition"
          >
            <RotateCcw size={10} aria-hidden="true" /> reset
          </button>
        </div>
      </header>

      {/* Live equation */}
      <div className="bg-card border border-line rounded-lg px-4 py-3 text-center">
        <TeX
          math={`\\begin{pmatrix} ${fmt(a, 2)} & ${fmt(b, 2)} \\\\ ${fmt(c, 2)} & ${fmt(d, 2)} \\end{pmatrix} \\begin{pmatrix} ${fmt(x, 2)} \\\\ ${fmt(y, 2)} \\end{pmatrix} = \\begin{pmatrix} ${fmt(out[0] ?? 0, 3)} \\\\ ${fmt(out[1] ?? 0, 3)} \\end{pmatrix}`}
        />
      </div>

      {/* Main grid: canvas + sidebar */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          {/* Canvas */}
          <div className="bg-canvas border border-line rounded-lg p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1 px-1">
              x  →  Ax in the plane
            </div>
            <VectorCanvas
              width={520}
              height={400}
              worldSize={6}
              arrows={[
                {
                  to: { x, y },
                  color: "var(--ink)",
                  label: `x (${fmt(x, 2)}, ${fmt(y, 2)})`,
                  width: 2.5,
                  labelOffset: { x: 0.3, y: 0.3 },
                },
                {
                  to: { x: out[0] ?? 0, y: out[1] ?? 0 },
                  color: "var(--accent)",
                  label: `Ax = (${fmt(out[0] ?? 0, 2)}, ${fmt(out[1] ?? 0, 2)})`,
                  width: 3,
                  labelOffset: { x: 0.3, y: -0.3 },
                },
              ]}
              gridLines={[
                {
                  from: { x: 0, y: 0 },
                  to: { x: M[0][0], y: M[1][0] },
                  color: "var(--vector)",
                  width: 1,
                  dashed: true,
                },
                {
                  from: { x: 0, y: 0 },
                  to: { x: M[0][1], y: M[1][1] },
                  color: "var(--matrix)",
                  width: 1,
                  dashed: true,
                },
                {
                  from: { x: M[0][0], y: M[1][0] },
                  to: { x: M[0][0] + M[0][1], y: M[1][0] + M[1][1] },
                  color: "var(--line)",
                  width: 1,
                  dashed: true,
                },
                {
                  from: { x: M[0][1], y: M[1][1] },
                  to: { x: M[0][0] + M[0][1], y: M[1][0] + M[1][1] },
                  color: "var(--line)",
                  width: 1,
                  dashed: true,
                },
              ]}
              draggablePoints={[
                { id: "x", pos: { x, y }, color: "var(--ink)", label: "x", radius: 8 },
              ]}
              onPointDrag={(id, p) => {
                if (id === "x") {
                  setX(Math.round(p.x * 10) / 10);
                  setY(Math.round(p.y * 10) / 10);
                }
              }}
              clamp={{ min: { x: -5.5, y: -5.5 }, max: { x: 5.5, y: 5.5 } }}
              ariaLabel="A times x visualization"
            />
          </div>

          {/* Basis-vector transform */}
          <div className="bg-canvas border border-line rounded-lg p-3 flex items-center gap-3">
            <div className="shrink-0">
              <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
                Basis-vector transform
              </div>
              <BasisTransform matrix={M} width={300} height={240} />
            </div>
            <div className="flex-1 text-xs text-dim leading-relaxed space-y-2">
              <p>
                Watch where{" "}
                <span className="text-[#e8864a] font-mono">î</span> and{" "}
                <span className="text-[#6db3ff] font-mono">ĵ</span> go as the
                matrix changes. The fading dots trace the journey from the
                original basis to the transformed one.
              </p>
              <p>
                The transformed basis is the matrix&apos;s{" "}
                <strong className="text-ink">fingerprint</strong>: every other
                vector follows.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-3">
          {/* Matrix inputs */}
          <section className="bg-elev/40 border border-line rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-faint uppercase tracking-wider">
                Matrix A
              </div>
              <div className="text-[10px] font-mono text-faint">
                det ={" "}
                <span className={isSingular ? "text-warn" : "text-accent"}>
                  {fmt(det, 3)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-w-[160px]">
              <NumInput value={a} onChange={setA} ariaLabel="a" />
              <NumInput value={b} onChange={setB} ariaLabel="b" />
              <NumInput value={c} onChange={setC} ariaLabel="c" />
              <NumInput value={d} onChange={setD} ariaLabel="d" />
            </div>
          </section>

          {/* Vector x */}
          <section className="bg-elev/40 border border-line rounded-xl p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Vector x
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-w-[160px] mb-2">
              <NumInput value={x} onChange={setX} ariaLabel="x" />
              <NumInput value={y} onChange={setY} ariaLabel="y" />
            </div>
            <div className="font-mono text-xs text-ink text-center">
              x = <span className="text-[var(--ink)]">({fmt(x, 2)}, {fmt(y, 2)})</span>
            </div>
          </section>

          {/* Ax result */}
          <section className="bg-accent/10 border border-accent/30 rounded-xl p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              b = A x <span className="text-accent">·</span> the answer
            </div>
            <div className="font-mono text-lg text-accent mb-2">
              ({fmt(out[0] ?? 0, 3)}, {fmt(out[1] ?? 0, 3)})
            </div>
            <div className="space-y-1">
              <ValueBar value={out[0] ?? 0} min={-6} max={6} label="row 1" />
              <ValueBar value={out[1] ?? 0} min={-6} max={6} label="row 2" />
            </div>
            <div className="mt-2 text-[10px] text-dim font-mono space-y-0.5">
              <div>
                a·x + b·y ={" "}
                <span className="text-accent">{fmt(out[0] ?? 0, 3)}</span>
              </div>
              <div>
                c·x + d·y ={" "}
                <span className="text-accent">{fmt(out[1] ?? 0, 3)}</span>
              </div>
            </div>
          </section>

          {/* Presets */}
          <section className="bg-elev/40 border border-line rounded-xl p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Try a preset
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setA(p.M[0][0]);
                    setB(p.M[0][1]);
                    setC(p.M[1][0]);
                    setD(p.M[1][1]);
                    setX(p.v[0]);
                    setY(p.v[1]);
                  }}
                  className="text-[10px] px-2 py-1 border border-line rounded bg-canvas hover:bg-elev/60 text-dim hover:text-ink transition"
                  title={p.detail}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Graphs: heatmap + bars */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Color = sign (warm positive, cool negative). Watch how dragging
            entries changes the parallelogram the basis vectors span.
          </p>
          <MatrixStripHeatmap
            matrix={M}
            maxAbs={Math.max(4, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Dot-product terms — how b is built
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each bar is one term in the row sums that produce b.
            Negative terms pull the sum down, positive push it up.
          </p>
          <BarsGraph
            values={[a * x, b * y, out[0] ?? 0, c * x, d * y, out[1] ?? 0]}
            labels={["a·x", "b·y", "b₁", "c·x", "d·y", "b₂"]}
            maxAbs={Math.max(6, Math.abs(out[0] ?? 0), Math.abs(out[1] ?? 0))}
            width={undefined}
            height={140}
            className="w-full"
          />
        </div>
      </div>

      {/* Step-by-step explainer */}
      <section className="bg-card border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-elev/30 transition"
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
      </section>
    </div>
  );
}
