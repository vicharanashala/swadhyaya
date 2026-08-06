"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Deterministic PRNG so SSR/CSR agree (avoids hydration mismatch warnings).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate noisy linear data with a deterministic noise pattern.
function generateData(
  slope: number,
  intercept: number,
  noise: number,
  seed: number,
  N: number = 20,
): Array<[number, number]> {
  const rng = mulberry32(seed);
  const points: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const x = -3 + (i / (N - 1)) * 6;
    const y = slope * x + intercept + (rng() - 0.5) * noise;
    points.push([x, y]);
  }
  return points;
}

// Least squares: y = m*x + c
// m = (N*Σxy - Σx*Σy) / (N*Σx² - (Σx)²)
// c = (Σy - m*Σx) / N
function leastSquares(points: Array<[number, number]>): {
  m: number;
  c: number;
  residuals: number[];
  sse: number;
} {
  const N = points.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const [x, y] of points) {
    sx += x; sy += y; sxy += x * y; sxx += x * x;
  }
  const m = (N * sxy - sx * sy) / (N * sxx - sx * sx);
  const c = (sy - m * sx) / N;
  const residuals = points.map(([x, y]) => y - (m * x + c));
  const sse = residuals.reduce((s, r) => s + r * r, 0);
  return { m, c, residuals, sse };
}

export function LeastSquaresPlayground() {
  const [trueM, setTrueM] = useState(1.2);
  const [trueC, setTrueC] = useState(0.3);
  const [noise, setNoise] = useState(0.8);
  const [seed, setSeed] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  const data = useMemo(
    () => generateData(trueM, trueC, noise, seed),
    [trueM, trueC, noise, seed],
  );
  const fit = useMemo(() => leastSquares(data), [data]);

  // Build A and b for the Ax=b system: A[i] = [x_i, 1], b[i] = y_i.
  // The least-squares solution is x* = (AᵀA)⁻¹Aᵀb.
  const Acols = useMemo(() => {
    const col1 = data.map(([x]) => x);
    const col2 = data.map(() => 1);
    return [col1, col2];
  }, [data]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Look at the data",
        detail:
          `${data.length} points scattered around an (unknown) line. ` +
          "The TRUE line is the dashed grey one; the FIT line is what " +
          "least squares finds. They won&apos;t agree exactly because " +
          "of noise.",
        value: `${data.length} noisy points`,
        tone: "faint" as const,
      },
      {
        title: "Form the linear system",
        detail:
          "Each point gives one equation: y_i = m·x_i + c. Stack them " +
          "into A · [m, c]ᵀ = b where A[i] = [x_i, 1] and b[i] = y_i.",
        value: "A · [m, c]ᵀ = b",
        tone: "faint" as const,
      },
      {
        title: "Apply the normal equations",
        detail:
          "When Ax = b has no solution (over-determined), the closest " +
          "thing is the projection of b onto the column space of A. " +
          "Solve AᵀA · x* = Aᵀb instead.",
        value: "x* = (AᵀA)⁻¹ · Aᵀb",
        tone: "accent" as const,
      },
      {
        title: "Get the coefficients",
        detail:
          "Two scalar equations in two unknowns (m and c). The " +
          "solution minimises the SUM OF SQUARED RESIDUALS — the " +
          "orange vertical distances in the picture.",
        value: `m = ${fit.m.toFixed(3)}, c = ${fit.c.toFixed(3)}`,
        tone: "accent" as const,
      },
      {
        title: "Read the residual energy",
        detail:
          "SSE = sum of (y_i − m·x_i − c)². Bigger noise ⟹ bigger " +
          "SSE. The fit line can&apos;t make it zero because the " +
          "data is inconsistent with a single line.",
        value: `SSE = ${fit.sse.toFixed(2)}`,
        tone: "faint" as const,
      },
      {
        title: "Why least squares — minimisation principle",
        detail:
          "Among all lines, least squares is the one that makes the " +
          "L2 distance from the data smallest. Geometrically: project " +
          "b onto the column space of A, then solve Ax = projection.",
        value: "min ||Ax − b||²",
        tone: "faint" as const,
      },
    ],
    [data, fit],
  );

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        Find the best line through noisy points — the closest point in a space you can&apos;t reach
      </h3>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={6}
            gridLines={[
              { from: { x: -6, y: fit.m * -6 + fit.c }, to: { x: 6, y: fit.m * 6 + fit.c }, color: "var(--transform)", width: 2.5 },
              { from: { x: -6, y: trueM * -6 + trueC }, to: { x: 6, y: trueM * 6 + trueC }, color: "var(--ink-faint)", width: 1.5, dashed: true },
            ]}
          >
            {data.map(([x, y], i) => {
              const yFit = fit.m * x + fit.c;
              return (
                <g key={i}>
                  <circle
                    cx={520 / 2 + x * (520 / 12)}
                    cy={520 / 2 - y * (520 / 12)}
                    r={3.5}
                    fill="var(--vector)"
                    opacity={0.8}
                  />
                  <line
                    x1={520 / 2 + x * (520 / 12)}
                    y1={520 / 2 - y * (520 / 12)}
                    x2={520 / 2 + x * (520 / 12)}
                    y2={520 / 2 - yFit * (520 / 12)}
                    stroke="var(--warn)"
                    strokeWidth={1}
                    opacity={0.4}
                  />
                </g>
              );
            })}
          </VectorCanvas>
        </div>

        <div className="space-y-3">
          <div className="bg-elev/30 border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Truth (dashed grey line)</div>
            <Slider label="m" value={trueM} min={-2} max={2} step={0.1} onChange={setTrueM} />
            <Slider label="c" value={trueC} min={-2} max={2} step={0.1} onChange={setTrueC} />
            <Slider label="noise" value={noise} min={0} max={3} step={0.1} onChange={setNoise} />
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="mt-2 text-xs text-dim hover:text-ink"
            >
              Regenerate data
            </button>
          </div>
          <div className="bg-elev/30 border border-transform/30 rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1" style={{ color: "var(--transform)" }}>Best fit (green line)</div>
            <div className="font-mono text-sm">
              m = {fit.m.toFixed(3)}<br />
              c = {fit.c.toFixed(3)}
            </div>
          </div>
          <div className="bg-elev/30 border border-warn/30 rounded p-3 text-xs text-dim">
            Orange = the error (residual) for each point. Least squares makes the
            <span className="text-ink"> sum of squared orange lengths</span> as small as possible.
          </div>
        </div>
      </div>

      {/* Graph: residuals bars */}
      <div className="mt-3 grid sm:grid-cols-1 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Residuals — what least squares minimises
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each bar is one residual rᵢ = yᵢ − (m·xᵢ + c). Positive " +
            "means the data sits ABOVE the fit line; negative means " +
            "BELOW. SSE = Σ rᵢ².
          </p>
          <BarsGraph
            values={fit.residuals}
            labels={fit.residuals.map((_, i) => `r${i + 1}`)}
            maxAbs={Math.max(
              3,
              ...fit.residuals.map((r) => Math.abs(r) || 0),
            )}
            width={undefined}
            height={140}
            className="w-full"
          />
          <div className="mt-2 text-[10px] text-dim">
            Sum of squared residuals ={" "}
            <span className="font-mono text-ink">{fit.sse.toFixed(3)}</span>{" "}
            (the value least squares is minimising)
          </div>
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
