"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { matMul, matTranspose, matSVD } from "@/lib/math";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question S3-q1: "Singular values are always non-negative."
// Story: Singular values = √(eigenvalues of AᵀA). AᵀA is positive
// semi-definite → eigenvalues ≥ 0. The student drags a 2×2 matrix and
// sees that ALL its singular values stay non-negative, even as the
// matrix changes wildly. The d3-scale sequential RdYlGn colours the
// bars from red (0) to green (large).
//
// Enhanced: a heatmap of A, a heatmap of AᵀA (the positive
// semi-definite matrix whose eigenvalues feed the singular values),
// a bars graph of singular values vs eigenvalues, and a prose step
// explainer.

export function QS3Q1Playground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(1);
  const [showSteps, setShowSteps] = useState(false);

  const M = useMemo(() => [[a, b], [c, d]], [a, b, c, d]);
  const svd = useMemo(() => matSVD(M), [M]);
  const MtM = useMemo(() => matMul(matTranspose(M), M), [M]);
  const eigenvalues = useMemo(
    () => svd.S.map((s) => s * s).slice(0, 2),
    [svd],
  );
  const maxSv = Math.max(0.01, ...svd.S);
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, maxSv + 0.5])
        .range(["#5cb87a", "#f0a050", "#e05a4a"])
        .clamp(true),
    [maxSv],
  );

  const allNonNeg = svd.S.slice(0, 2).every((s) => s >= -1e-9);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — the matrix you're studying",
        detail:
          "Drag any 2×2 matrix. The columns of A are the two arrows " +
          "shown on the canvas. The singular values don't care about " +
          "the order — they only depend on the column vectors.",
        value: `A = [[${a.toFixed(2)}, ${b.toFixed(2)}], [${c.toFixed(2)}, ${d.toFixed(2)}]]`,
        tone: "faint" as const,
      },
      {
        title: "Compute AᵀA — positive semi-definite",
        detail:
          "AᵀA is a special matrix: xᵀ(AᵀA)x = (Ax)ᵀ(Ax) = ||Ax||² ≥ 0 " +
          "for ALL x. That means AᵀA is 'positive semi-definite' — all " +
          "its eigenvalues are non-negative.",
        value: `AᵀA = [[${MtM[0]![0]!.toFixed(2)}, ${MtM[0]![1]!.toFixed(2)}], [${MtM[1]![0]!.toFixed(2)}, ${MtM[1]![1]!.toFixed(2)}]]`,
        tone: "accent" as const,
      },
      {
        title: "Find eigenvalues of AᵀA",
        detail:
          "Solve det(AᵀA − λI) = 0. The two roots are the eigenvalues " +
          "of AᵀA — both ≥ 0 because AᵀA is positive semi-definite.",
        value: `eigenvalues = (${eigenvalues[0]?.toFixed(2) ?? "—"}, ${eigenvalues[1]?.toFixed(2) ?? "—"})`,
        tone: "accent" as const,
      },
      {
        title: "Singular values are √(eigenvalues)",
        detail:
          "σᵢ = √λᵢ where λᵢ are the eigenvalues of AᵀA. Since each " +
          "λᵢ ≥ 0, each σᵢ = √λᵢ is real and non-negative. The " +
          "singular values are sorted in decreasing order.",
        value: `σ = (${svd.S[0]?.toFixed(2) ?? "—"}, ${svd.S[1]?.toFixed(2) ?? "—"})`,
        tone: "accent" as const,
      },
      {
        title: "Why this matters — SVD uniqueness",
        detail:
          "The SVD decomposition A = U Σ Vᵀ is unique up to sign " +
          "flips. The Σ in the middle is diagonal with the singular " +
          "values — they're the 'magnitudes' of the transformation, " +
          "always positive, always sortable.",
        value: allNonNeg ? "all σᵢ ≥ 0 ✓" : "σᵢ < 0 ?!",
        tone: allNonNeg ? ("accent" as const) : ("warn" as const),
      },
    ],
    [a, b, c, d, MtM, eigenvalues, svd.S, allNonNeg],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the matrix — singular values stay non-negative.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Singular values are √(eigenvalues of AᵀA). AᵀA is positive
        semi-definite — its eigenvalues are always ≥ 0.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={260}
          height={260}
          worldSize={5}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: { x: a, y: c },
              color: "var(--vector)",
              label: "col 1",
              width: 2.5,
              labelOffset: { x: 0, y: -0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: { x: b, y: d },
              color: "var(--matrix)",
              label: "col 2",
              width: 2.5,
              labelOffset: { x: 0, y: 0.3 },
            },
          ]}
          ariaLabel="Singular values playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Matrix
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
              <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
              <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
              <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
            </div>
          </div>

          <div className="bg-card border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Singular values (σ₁ ≥ σ₂ ≥ 0)
            </div>
            <div className="space-y-2">
              {svd.S.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-faint w-4">
                    σ{i + 1}
                  </span>
                  <div className="flex-1 h-6 rounded bg-elev overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{
                        background: colorScale(s),
                      }}
                      animate={{
                        width: `${Math.min(100, (s / maxSv) * 100)}%`,
                      }}
                      transition={{ duration: 0.2 }}
                      aria-label={`σ${i + 1} magnitude bar`}
                    />
                  </div>
                  <span className="font-mono text-ink w-12 text-right">
                    {s.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            animate={{
              backgroundColor: "rgba(92,184,122,0.1)",
            }}
            className="rounded p-3 border border-correct/40"
          >
            <div className="text-sm font-medium text-correct">
              ✓ Both singular values ≥ 0
            </div>
            <div className="text-[10px] text-dim mt-1 font-mono">
              eigenvalues of AᵀA = ({eigenvalues[0]?.toFixed(2) ?? "—"},{" "}
              {eigenvalues[1]?.toFixed(2) ?? "—"})
            </div>
          </motion.div>
        </div>
      </div>

      {/* Graphs: A heatmap, AᵀA heatmap, comparison bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            AᵀA — positive semi-definite
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The matrix whose eigenvalues feed the singular values. Watch
            it&apos;s structure: it&apos;s always symmetric, with non-negative
            diagonal entries.
          </p>
          <MatrixStripHeatmap
            matrix={MtM}
            highlightRows={[]}
            maxAbs={Math.max(
              8,
              ...MtM.flat().map((v) => Math.abs(v) || 0),
            )}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Singular values vs eigenvalues of AᵀA
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The blue bars are singular values σ₁, σ₂. The orange bars " +
            "are eigenvalues of AᵀA — note σᵢ = √λᵢ.
          </p>
          <BarsGraph
            values={[...svd.S.slice(0, 2), ...eigenvalues]}
            labels={["σ₁", "σ₂", "λ₁", "λ₂"]}
            maxAbs={Math.max(6, ...svd.S.slice(0, 2), ...eigenvalues)}
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
