"use client";
import { useState, useMemo } from "react";
import { m2det, m2eigen, fmt } from "@/lib/math";
import { Slider } from "./Slider";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept T5: Rank-Nullity Theorem
// "dim(null) + dim(range) = dim(input). Always. The most important equation in linear algebra."

export function RankNullityPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(2);
  const [inputDim] = useState(2);

  const M = useMemo(() => [[a, b], [c, d]], [a, b, c, d]);
  const det = m2det(M as any);
  const eigen = useMemo(() => m2eigen(M as any), [M]);

  // rank
  const rank = useMemo(() => {
    if (Math.abs(det) > 1e-9) return 2;
    if (Math.abs(a) > 1e-9 || Math.abs(b) > 1e-9 || Math.abs(c) > 1e-9 || Math.abs(d) > 1e-9) return 1;
    return 0;
  }, [det, a, b, c, d]);
  const nullity = inputDim - rank;

  const [showSteps, setShowSteps] = useState(false);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read the input dimension",
        detail:
          "A goes from R² to R². dim(input) = 2 — that's the total " +
          "budget of dimensions the transformation can either " +
          "preserve or crush.",
        value: `dim(input) = ${inputDim}`,
        tone: "faint" as const,
      },
      {
        title: "Compute rank — what's reachable",
        detail:
          "rank = number of linearly independent columns. Non-zero " +
          "det ⟹ columns independent ⟹ rank = 2. Zero det ⟹ columns " +
          "dependent ⟹ rank drops to 1 (or 0 if A is zero).",
        value: `rank = ${rank}`,
        tone: rank === 2 ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Compute nullity — what gets crushed",
        detail:
          "nullity = dimension of the kernel (everything sent to 0). " +
          "Found by solving Av = 0. If det ≠ 0, only v = 0 satisfies " +
          "it (nullity = 0). If det = 0, a whole line does (nullity = 1).",
        value: `nullity = ${nullity}`,
        tone: nullity === 0 ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Apply the rank-nullity theorem",
        detail:
          "rank + nullity = dim(input). Always. The dimension of " +
          "what survives plus the dimension of what gets crushed " +
          "equals the dimension of the space you started with.",
        value: `${rank} + ${nullity} = ${inputDim} ✓`,
        tone: "accent" as const,
      },
      {
        title: "Why this matters — conservation of dimensions",
        detail:
          "A linear transformation can ONLY destroy dimensions; it " +
          "cannot create them. Rank-nullity is the conservation law. " +
          "For higher-dim (Rⁿ → Rᵐ), it generalises to rank ≤ " +
          "min(input, output).",
        value: "no rank inflation possible",
        tone: "faint" as const,
      },
    ],
    [inputDim, rank, nullity],
  );

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          The most important equation
        </h3>
        <div className="bg-canvas border border-line rounded p-4 font-serif text-2xl text-center my-4">
          <span className="text-eigen">dim(null)</span>
          <span className="text-dim mx-2">+</span>
          <span className="text-accent">dim(range)</span>
          <span className="text-dim mx-2">=</span>
          <span className="text-ink">dim(input)</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-eigen/10 border border-eigen/40 rounded p-3">
            <div className="text-[10px] text-eigen uppercase tracking-wider">Null space</div>
            <div className="text-3xl font-mono text-eigen mt-1">{nullity}D</div>
            <div className="text-[10px] text-dim mt-1">what gets squashed</div>
          </div>
          <div className="bg-accent/10 border border-accent/40 rounded p-3">
            <div className="text-[10px] text-accent uppercase tracking-wider">Range</div>
            <div className="text-3xl font-mono text-accent mt-1">{rank}D</div>
            <div className="text-[10px] text-dim mt-1">what survives</div>
          </div>
          <div className="bg-elev/40 border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider">Input</div>
            <div className="text-3xl font-mono text-ink mt-1">{inputDim}D</div>
            <div className="text-[10px] text-dim mt-1">domain size</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim space-y-1">
          <div>det = {fmt(det, 3)}</div>
          {eigen && (
            <div>eigenvalues ≈ {fmt(eigen.values[0], 2)}, {fmt(eigen.values[1], 2)}</div>
          )}
          <div className="text-accent pt-1">
            Try making the two columns parallel (b/a = d/c). Watch the rank drop to 1, nullity become 1.
          </div>
        </div>
      </div>

      {/* Graphs: matrix heatmap + rank/nullity bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Try making the columns parallel — the heatmap rows will " +
            "become proportional, rank drops, nullity rises.
          </p>
          <MatrixStripHeatmap
            matrix={M}
            maxAbs={Math.max(4, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            The dimension split
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            rank + nullity = {inputDim}. The orange bar is what survives; " +
            "the highlighted bar is what gets crushed.
          </p>
          <BarsGraph
            values={[rank, nullity]}
            labels={["rank", "nullity"]}
            maxAbs={inputDim + 1}
            highlights={[1]}
            width={undefined}
            height={120}
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
