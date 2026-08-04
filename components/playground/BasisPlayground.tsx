"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept V7: Basis — the minimum set that spans
// "Independent AND spanning. The smallest set that covers the space."

export function BasisPlayground() {
  // User picks how many "candidate" vectors
  const [count, setCount] = useState(3);
  const [seed, setSeed] = useState(0);
  // Pre-baked scenarios
  const scenarios = [
    { name: "Standard R² basis", vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }], dim: 2 },
    { name: "Skewed basis", vectors: [{ x: 2, y: 1 }, { x: -1, y: 2 }], dim: 2 },
    { name: "R³ basis (orthogonal)", vectors: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }], dim: 3 },
    { name: "Over-determined R² (3 vectors, 1 redundant)", vectors: [{ x: 2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }], dim: 2 },
    { name: "Under-determined R² (1 vector)", vectors: [{ x: 1, y: 1 }], dim: 2 },
  ];
  const [scenario, setScenario] = useState(0);
  const sc = scenarios[scenario];

  // Sample dot grid
  const dots = useMemo(() => {
    if (sc.dim === 2) {
      const out: Array<{ x: number; y: number }> = [];
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          // sum of sc.vectors
          let x = 0, y = 0;
          for (let k = 0; k < sc.vectors.length; k++) {
            x += (k === 0 ? i : k === 1 ? j : 0) * (sc.vectors[k].x || 0);
            y += (k === 0 ? i : k === 1 ? j : 0) * (sc.vectors[k].y || 0);
          }
          out.push({ x, y });
        }
      }
      return out;
    }
    return [];
  }, [sc]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Which vectors form a basis?
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={6}
          arrows={sc.vectors.map((v, i) => ({
            from: { x: 0, y: 0 },
            to: { x: v.x, y: v.y },
            color: ["var(--vector)", "var(--matrix)", "var(--transform)"][i],
            label: `b${i + 1}`,
            width: 3,
            labelOffset: { x: 0, y: -0.3 - i * 0.3 },
          }))}
        >
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={520 / 2 + d.x * (520 / 12)}
              cy={520 / 2 - d.y * (520 / 12)}
              r={2}
              fill="var(--transform)"
              opacity={0.3}
            />
          ))}
        </VectorCanvas>
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Scenario</div>
          <div className="space-y-1">
            {scenarios.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setScenario(i)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition ${
                  scenario === i ? "bg-accent/20 text-accent border border-accent/40" : "border border-line text-dim hover:text-ink"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-4 text-xs text-dim leading-relaxed">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Analysis</div>
          <div>Number of vectors: <span className="text-ink font-mono">{sc.vectors.length}</span></div>
          <div>Dimension of space: <span className="text-ink font-mono">{sc.dim}D</span></div>
          <div className="mt-2 text-accent">
            {sc.vectors.length === sc.dim
              ? "Equal count and dimension → this is a BASIS."
              : sc.vectors.length < sc.dim
              ? "Too few vectors → cannot span the whole space. NOT a basis."
              : "Too many vectors → at least one is redundant. NOT a basis."}
          </div>
        </div>
      </div>
    </div>
  );
}
