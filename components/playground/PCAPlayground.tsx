"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { m2eigen } from "@/lib/math";

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
        pc1: { dir: [1, 0] as [number, number], variance: 0 },
        pc2: { dir: [0, 1] as [number, number], variance: 0 },
      };
    }
    return {
      mean,
      pc1: { dir: e.vectors[0], variance: e.values[0] },
      pc2: { dir: e.vectors[1], variance: e.values[1] },
    };
  }, [points]);

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
            {(
              (pca.pc1.variance / (pca.pc1.variance + pca.pc2.variance)) *
              100
            ).toFixed(1)}
            % explained by PC1
          </div>
        </div>
      </div>
    </div>
  );
}