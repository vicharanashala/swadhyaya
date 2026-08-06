"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { m2eigen } from "@/lib/math";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Deterministic seeded PRNG so the SSR/CSR HTML matches and React 19 doesn't
// warn about hydration mismatches.
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

function generateDataset(
  kind: "blob" | "line" | "circle",
  seed: number,
): Array<[number, number]> {
  const rng = mulberry32(seed);
  const points: Array<[number, number]> = [];
  const N = 80;
  for (let i = 0; i < N; i++) {
    if (kind === "blob") {
      const t = (i / N) * Math.PI * 2;
      const r = 1 + 0.5 * Math.cos(t * 3);
      points.push([
        r * Math.cos(t) * 2 + (rng() - 0.5) * 0.6,
        r * Math.sin(t) * 1.2 + (rng() - 0.5) * 0.6,
      ]);
    } else if (kind === "line") {
      const t = (rng() - 0.5) * 5;
      points.push([t * 1.5, t * 1 + (rng() - 0.5) * 0.3]);
    } else {
      const t = (i / N) * Math.PI * 2 + rng() * 0.05;
      points.push([Math.cos(t) * 3, Math.sin(t) * 3]);
    }
  }
  return points;
}

export function PCAPlayground() {
  const [kind, setKind] = useState<"blob" | "line" | "circle">("blob");
  const [seed, setSeed] = useState(1);
  const [showSteps, setShowSteps] = useState(false);
  const points = useMemo(() => generateDataset(kind, seed), [kind, seed]);

  // Compute mean and covariance, then eigen-decompose with lib/math.
  const pca = useMemo(() => {
    const n = points.length;
    const mean: [number, number] = [0, 0];
    for (const p of points) {
      mean[0] += p[0];
      mean[1] += p[1];
    }
    mean[0] /= n;
    mean[1] /= n;
    let c00 = 0,
      c01 = 0,
      c11 = 0;
    for (const p of points) {
      const dx = p[0] - mean[0];
      const dy = p[1] - mean[1];
      c00 += dx * dx;
      c01 += dx * dy;
      c11 += dy * dy;
    }
    c00 /= n;
    c01 /= n;
    c11 /= n;
    const cov: [[number, number], [number, number]] = [
      [c00, c01],
      [c01, c11],
    ];
    const e = m2eigen(cov);
    if (!e) {
      return {
        mean,
        cov,
        pc1: { dir: [1, 0] as [number, number], variance: 0 },
        pc2: { dir: [0, 1] as [number, number], variance: 0 },
      };
    }
    return {
      mean,
      cov,
      pc1: { dir: e.vectors[0], variance: e.values[0] },
      pc2: { dir: e.vectors[1], variance: e.values[1] },
    };
  }, [points]);

  const totalVar = pca.pc1.variance + pca.pc2.variance;
  const varianceRatio =
    totalVar > 0 ? (pca.pc1.variance / totalVar) * 100 : 0;

  const explainerSteps = useMemo(
    () => [
      {
        title: "Look at the data cloud",
        detail:
          "Each dataset (blob, line, circle) has a different shape. " +
          "PCA finds the axes that ALIGN with that shape — so the " +
          "first axis captures the most variance.",
        value: `${points.length} points`,
        tone: "faint" as const,
      },
      {
        title: "Compute mean — centre the cloud",
        detail:
          "Subtract the mean from every point. The data is now " +
          "centred at the origin; PCA directions pass through the " +
          "centroid.",
        value: `mean = (${pca.mean[0].toFixed(2)}, ${pca.mean[1].toFixed(2)})`,
        tone: "faint" as const,
      },
      {
        title: "Build the covariance matrix",
        detail:
          "Cov[i][j] = average of (x_i − x̄_i)(x_j − x̄_j). For 2D " +
          "data this is a 2×2 symmetric matrix whose diagonal is " +
          "the variance along each axis and off-diagonal is the " +
          "covariance.",
        value: `cov = [[${pca.cov[0][0].toFixed(3)}, ${pca.cov[0][1].toFixed(3)}], [${pca.cov[1][0].toFixed(3)}, ${pca.cov[1][1].toFixed(3)}]]`,
        tone: "accent" as const,
      },
      {
        title: "Eigen-decompose the covariance",
        detail:
          "The eigenvectors point along the natural axes of the data. " +
          "The eigenvalues are the variances along those axes.",
        value: `PC1 = (${pca.pc1.dir[0].toFixed(2)}, ${pca.pc1.dir[1].toFixed(2)}), PC2 = (${pca.pc2.dir[0].toFixed(2)}, ${pca.pc2.dir[1].toFixed(2)})`,
        tone: "accent" as const,
      },
      {
        title: "Read the variance ratio",
        detail:
          "How much of the total variance is captured by PC1? Higher " +
          "% means PC1 is the dominant direction — most of the data " +
          "spread is along that one axis.",
        value: `PC1 explains ${varianceRatio.toFixed(1)}%`,
        tone: "accent" as const,
      },
      {
        title: "Why this matters — dimensionality reduction",
        detail:
          "If PC1 explains 95% of the variance, you can drop PC2 and " +
          "keep 95% of the data&apos;s structure in just one " +
          "dimension. That&apos;s the core trick of PCA-based " +
          "compression.",
        value: "compress to 1D, lose 5%",
        tone: "faint" as const,
      },
    ],
    [points, pca, varianceRatio],
  );

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        The best camera angle for your data — the direction of maximum spread
      </h3>
      <p className="text-xs text-dim mb-3">
        PCA finds the line through the data cloud that captures the most
        variance. Watch the purple (PC1) and gold (PC2) axes snap to the
        natural directions.
      </p>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={6}
            arrows={[
              {
                from: { x: pca.mean[0], y: pca.mean[1] },
                to: {
                  x: pca.mean[0] + pca.pc1.dir[0] * 3,
                  y: pca.mean[1] + pca.pc1.dir[1] * 3,
                },
                color: "var(--eigen)",
                label: "PC1",
                width: 3,
                labelOffset: { x: 0, y: -0.3 },
              },
              {
                from: { x: pca.mean[0], y: pca.mean[1] },
                to: {
                  x: pca.mean[0] + pca.pc2.dir[0] * 3,
                  y: pca.mean[1] + pca.pc2.dir[1] * 3,
                },
                color: "var(--singular)",
                label: "PC2",
                width: 3,
                labelOffset: { x: 0, y: 0.3 },
              },
            ]}
            ariaLabel="PCA scatter with principal axes"
          >
            {points.map((p, i) => (
              <circle
                key={i}
                cx={520 / 2 + p[0] * (520 / 12)}
                cy={520 / 2 - p[1] * (520 / 12)}
                r={3}
                fill="var(--transform)"
                opacity={0.7}
                aria-hidden="true"
              />
            ))}
            <circle
              cx={520 / 2 + pca.mean[0] * (520 / 12)}
              cy={520 / 2 - pca.mean[1] * (520 / 12)}
              r={4}
              fill="var(--accent)"
              aria-hidden="true"
            />
          </VectorCanvas>
        </div>

        <div className="space-y-3">
          <div className="bg-elev/30 border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Dataset
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              {(["blob", "line", "circle"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setKind(k);
                    setSeed((s) => s + 1);
                  }}
                  className={`px-2 py-1.5 rounded text-left ${
                    kind === k
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "bg-elev border border-line text-dim hover:text-ink"
                  }`}
                >
                  {k === "blob"
                    ? "Diagonal blob"
                    : k === "line"
                      ? "Noisy line"
                      : "Circle"}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-elev/30 border border-eigen/30 rounded p-3">
            <div
              className="text-[10px] text-faint uppercase tracking-wider mb-1"
              style={{ color: "var(--eigen)" }}
            >
              PC1 variance
            </div>
            <div className="font-mono text-lg">{pca.pc1.variance.toFixed(3)}</div>
            <div className="text-[10px] text-faint mt-1">
              Direction of maximum spread
            </div>
          </div>
          <div className="bg-elev/30 border border-singular/40 rounded p-3">
            <div
              className="text-[10px] text-faint uppercase tracking-wider mb-1"
              style={{ color: "var(--singular)" }}
            >
              PC2 variance
            </div>
            <div className="font-mono text-lg">{pca.pc2.variance.toFixed(3)}</div>
            <div className="text-[10px] text-faint mt-1">
              Perpendicular to PC1
            </div>
          </div>
          <div className="bg-elev/30 border border-line rounded p-3 text-xs text-dim">
            <span className="text-ink">Variance ratio:</span>{" "}
            {varianceRatio.toFixed(1)}
            % explained by PC1
          </div>
        </div>
      </div>

      {/* Graphs: covariance matrix heatmap + variance bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Covariance matrix — symmetric, positive semi-definite
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The diagonal entries are the per-axis variances. The " +
            "off-diagonals are the covariances — large values mean " +
            "the data is correlated.
          </p>
          <MatrixStripHeatmap
            matrix={pca.cov ?? [[0, 0], [0, 0]]}
            maxAbs={Math.max(2, ...(pca.cov ?? [[0, 0], [0, 0]]).flat().map((v: number) => Math.abs(v) || 0))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Variances along PC1 and PC2
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            PC1 always has the larger variance — that&apos;s the whole " +
            "point. PC2 is perpendicular to PC1.
          </p>
          <BarsGraph
            values={[pca.pc1.variance, pca.pc2.variance]}
            labels={["PC1", "PC2"]}
            maxAbs={Math.max(
              pca.pc1.variance + 0.5,
              pca.pc2.variance + 0.5,
              1,
            )}
            highlights={[0]}
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