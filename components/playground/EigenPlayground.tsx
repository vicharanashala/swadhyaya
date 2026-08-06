"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { m2, m2eigen, m2mulVec, fmt, m2trace, m2det } from "@/lib/math";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

export function EigenPlayground() {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(0.5);
  const [c, setC] = useState(0.5);
  const [d, setD] = useState(1.5);
  const [showSteps, setShowSteps] = useState(false);

  const M = useMemo(() => m2(a, b, c, d), [a, b, c, d]);
  const e = useMemo(() => m2eigen(M), [M]);
  const tr = m2trace(M);
  const detM = m2det(M);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — the matrix whose eigenvalues we want",
        detail:
          "Drag the four sliders to explore different 2×2 matrices. " +
          "Most matrices have two real eigenvalues; some have none " +
          "(rotation-like).",
        value: `A = [[${a}, ${b}], [${c}, ${d}]]`,
        tone: "faint" as const,
      },
      {
        title: "Compute trace and determinant",
        detail:
          "trace = a + d (sum of diagonal). det = a·d − b·c. The " +
          "characteristic polynomial is λ² − tr·λ + det = 0, " +
          "so trace and det encode the eigenvalues.",
        value: `tr = ${fmt(tr, 3)}, det = ${fmt(detM, 3)}`,
        tone: "faint" as const,
      },
      {
        title: "Solve the characteristic equation",
        detail:
          "λ² − tr·λ + det = 0. Discriminant = tr² − 4·det. If " +
          "positive, two real eigenvalues; if zero, one repeated; " +
          "if negative, complex conjugates (no real eigenvectors).",
        value: e
          ? `λ₁ = ${fmt(e.values[0], 3)}, λ₂ = ${fmt(e.values[1], 3)}`
          : "complex eigenvalues — no real eigenvectors",
        tone: e ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Find eigenvectors — special directions",
        detail:
          "Solve (A − λᵢI)v = 0. The eigenvectors point along the " +
          "arrows that A ONLY STRETCHES, never rotates. For each " +
          "eigenvalue, the eigenspace is a line through the origin.",
        value: e
          ? `v₁ ≈ (${fmt(e.vectors[0][0], 2)}, ${fmt(e.vectors[0][1], 2)})`
          : "—",
        tone: "accent" as const,
      },
      {
        title: "Why this matters — repeated vs distinct",
        detail:
          "Distinct eigenvalues ⟹ two independent eigenvectors ⟹ " +
          "A is diagonalizable. Repeated eigenvalue ⟹ A might " +
          "still diagonalize (if eigenvectors are independent) " +
          "or not (if it&apos;s a Jordan block).",
        value: e && Math.abs(e.values[0] - e.values[1]) < 0.01
          ? "repeated eigenvalue"
          : "distinct eigenvalues",
        tone: "faint" as const,
      },
    ],
    [a, b, c, d, tr, detM, e],
  );

  // pick a test vector and show its trajectory
  const [test, setTest] = useState({ x: 1, y: 0.3 });
  const trajectory = useMemo(() => {
    const out: Array<{ x: number; y: number }> = [];
    let v: number[] = [test.x, test.y];
    out.push({ x: v[0], y: v[1] });
    for (let i = 0; i < 30; i++) {
      v = m2mulVec(M, [v[0], v[1]]) as number[];
      // normalize if growing
      const len = Math.hypot(v[0], v[1]);
      if (len > 1000) break;
      out.push({ x: v[0], y: v[1] });
    }
    return out;
  }, [M, test]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Find the vectors that just get stretched — never rotated
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={8}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: a, y: c }, color: "var(--vector)", label: "col 1", width: 3, labelOffset: { x: 0, y: -0.4 } },
            { from: { x: 0, y: 0 }, to: { x: b, y: d }, color: "var(--matrix)", label: "col 2", width: 3, labelOffset: { x: 0, y: 0.4 } },
            ...(e ? [
              {
                from: { x: 0, y: 0 },
                to: { x: e.vectors[0][0] * Math.min(4, Math.abs(e.values[0])), y: e.vectors[0][1] * Math.min(4, Math.abs(e.values[0])) },
                color: "var(--eigen)",
                label: `eigenvector (λ=${fmt(e.values[0], 2)})`,
                width: 4,
                labelOffset: { x: 0, y: -0.5 },
              },
              {
                from: { x: 0, y: 0 },
                to: { x: e.vectors[1][0] * Math.min(4, Math.abs(e.values[1])), y: e.vectors[1][1] * Math.min(4, Math.abs(e.values[1])) },
                color: "var(--singular)",
                label: `λ=${fmt(e.values[1], 2)}`,
                width: 4,
                labelOffset: { x: 0, y: 0.5 },
              },
            ] : []),
          ]}
        >
          {trajectory.length > 1 && (
            <polyline
              points={trajectory.map((p) => `${520 / 2 + p.x * (520 / 16)},${520 / 2 - p.y * (520 / 16)}`).join(" ")}
              fill="none"
              stroke="var(--transform)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              opacity={0.6}
            />
          )}
          <circle
            cx={520 / 2 + test.x * (520 / 16)}
            cy={520 / 2 - test.y * (520 / 16)}
            r={5}
            fill="var(--accent)"
          />
        </VectorCanvas>
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Matrix</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>Test vector (drag sliders, watch its trajectory)</div>
          <Slider label="x" value={test.x} min={-3} max={3} step={0.05} onChange={(x) => setTest({ x, y: test.y })} />
          <Slider label="y" value={test.y} min={-3} max={3} step={0.05} onChange={(y) => setTest({ x: test.x, y })} />
        </div>
        {e ? (
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Eigenvalues</div>
            <div className="space-y-1.5 font-mono text-sm">
              <div style={{ color: "var(--eigen)" }}>λ₁ = {fmt(e.values[0], 4)}</div>
              <div style={{ color: "var(--singular)" }}>λ₂ = {fmt(e.values[1], 4)}</div>
            </div>
            <div className="mt-2 text-[10px] text-faint">
              {Math.abs(e.values[0] - e.values[1]) < 0.01
                ? "Repeated eigenvalue — matrix is a scalar multiple of I."
                : "Two distinct eigenvalues — two preferred directions."}
            </div>
          </div>
        ) : (
          <div className="bg-warn/10 border border-warn/40 rounded-xl p-3 text-xs text-warn">
            No real eigenvalues. The matrix is a rotation (or rotation+scaling).
          </div>
        )}
      </div>

      {/* Graphs: matrix heatmap + eigenvalue bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Symmetric matrices (a = d, b = c) have real eigenvalues " +
            "always. Asymmetric ones can have complex.
          </p>
          <MatrixStripHeatmap
            matrix={[Array.from(M[0]), Array.from(M[1])]}
            maxAbs={Math.max(4, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Eigenvalues + matrix invariants
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            λ₁ and λ₂ are the eigenvalues. Their sum equals trace, " +
            "their product equals det.
          </p>
          <BarsGraph
            values={e ? [e.values[0], e.values[1], tr, detM] : [0, 0, tr, detM]}
            labels={e ? ["λ₁", "λ₂", "tr", "det"] : ["tr", "det"]}
            maxAbs={Math.max(6, Math.abs(tr) + 1, Math.abs(detM) + 1)}
            highlights={[0, 1]}
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
