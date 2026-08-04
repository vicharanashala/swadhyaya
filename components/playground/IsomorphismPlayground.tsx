"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept T6: Isomorphisms — same shape, different name
// "Two vector spaces with the same dimension are isomorphic. You can label one with the other's coordinates."

export function IsomorphismPlayground() {
  const [angle, setAngle] = useState(0);
  const [scale, setScale] = useState(1);

  // Original space: standard R^2 (gray)
  // Mapped space: rotate + scale
  const rad = (angle * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const M = [
    [c * scale, -s],
    [s * scale, c],
  ];

  // Sample points
  const samplePoints = [
    { x: 2, y: 0, label: "v₁" },
    { x: 0, y: 2, label: "v₂" },
    { x: 2, y: 2, label: "v₃" },
    { x: -1, y: 1.5, label: "v₄" },
  ];
  const mapped = samplePoints.map(p => ({
    x: M[0][0] * p.x + M[0][1] * p.y,
    y: M[1][0] * p.x + M[1][1] * p.y,
    label: p.label,
  }));

  // Check: is the same MAPPING? If yes, the two spaces are isomorphic.
  const isInvertible = Math.abs(M[0][0] * M[1][1] - M[0][1] * M[1][0]) > 0.01;

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Same shape — different name
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-canvas border border-line rounded p-1">
            <div className="text-[10px] text-faint uppercase tracking-wider px-2 py-1">Space V (standard basis)</div>
            <VectorCanvas
              width={250}
              height={250}
              worldSize={3}
              arrows={samplePoints.map((p, i) => ({
                from: { x: 0, y: 0 },
                to: { x: p.x, y: p.y },
                color: ["var(--vector)", "var(--matrix)", "var(--transform)", "var(--eigen)"][i],
                label: p.label,
                width: 2.5,
                labelOffset: { x: 0, y: -0.3 - i * 0.2 },
              }))}
            />
          </div>
          <div className="bg-canvas border border-line rounded p-1">
            <div className="text-[10px] text-faint uppercase tracking-wider px-2 py-1">Space W (different basis)</div>
            <VectorCanvas
              width={250}
              height={250}
              worldSize={3}
              arrows={mapped.map((p, i) => ({
                from: { x: 0, y: 0 },
                to: { x: p.x, y: p.y },
                color: ["var(--vector)", "var(--matrix)", "var(--transform)", "var(--eigen)"][i],
                label: p.label,
                width: 2.5,
                labelOffset: { x: 0, y: -0.3 - i * 0.2 },
              }))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Change of basis (invertible)
          </div>
          <Slider label="rotate" value={angle} min={-180} max={180} step={1} onChange={setAngle} />
          <Slider label="scale" value={scale} min={0.5} max={2} step={0.05} onChange={setScale} />
        </div>
        <div className={`rounded-xl p-3 text-xs leading-relaxed ${
          isInvertible
            ? "bg-accent/10 border border-accent/30 text-accent"
            : "bg-warn/10 border border-warn/30 text-warn"
        }`}>
          {isInvertible
            ? "Both spaces are 2D. The mapping is invertible. So V and W are ISOMORPHIC — the same shape, different label."
            : "Mapping is not invertible — the two spaces are NOT isomorphic."}
        </div>
        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim leading-relaxed">
          Polynomials of degree ≤ 1 form a 2D space (basis: 1, x). R² is also 2D. They're isomorphic: a + bx ↔ (a, b).
        </div>
      </div>
    </div>
  );
}
