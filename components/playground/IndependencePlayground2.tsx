"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept V6: Linear Independence
// "No arrow in the set can be made from the others. Each is doing new work."

export function IndependencePlayground2() {
  const [v1, setV1] = useState({ x: 2, y: 1 });
  const [v2, setV2] = useState({ x: -1, y: 2 });
  const [v3, setV3] = useState({ x: 3, y: 3 });

  const det = v1.x * v2.y - v1.y * v2.x;

  // Test: is v3 in span of v1, v2?
  const inSpan = useMemo(() => {
    if (Math.abs(det) < 0.01) return null; // v1 || v2 — degenerate
    const c1 = (v2.y * v3.x - v2.x * v3.y) / det;
    const c2 = (v1.x * v3.y - v1.y * v3.x) / det;
    const reconstructed = { x: c1 * v1.x + c2 * v2.x, y: c1 * v1.y + c2 * v2.y };
    return {
      c1, c2,
      isMatch: Math.abs(reconstructed.x - v3.x) < 0.05 && Math.abs(reconstructed.y - v3.y) < 0.05,
    };
  }, [v1, v2, v3, det]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Can the third arrow be made from the first two?
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={[
            { from: { x: 0, y: 0 }, to: v1, color: "var(--vector)", label: "v₁", width: 3, labelOffset: { x: 0, y: -0.4 } },
            { from: { x: 0, y: 0 }, to: v2, color: "var(--matrix)", label: "v₂", width: 3, labelOffset: { x: 0, y: 0.4 } },
            { from: { x: 0, y: 0 }, to: v3, color: "var(--eigen)", label: "v₃", width: 3, labelOffset: { x: 0.3, y: 0.3 } },
          ]}
        />
      </div>
      <div className="space-y-3">
        {[
          { label: "v₁", v: v1, set: setV1, color: "var(--vector)" },
          { label: "v₂", v: v2, set: setV2, color: "var(--matrix)" },
          { label: "v₃", v: v3, set: setV3, color: "var(--eigen)" },
        ].map(({ label, v, set, color }) => (
          <div key={label} className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color }}>
              {label} = ({v.x.toFixed(2)}, {v.y.toFixed(2)})
            </div>
            <Slider label="x" value={v.x} min={-4} max={4} step={0.05} onChange={(x) => set({ x, y: v.y })} />
            <Slider label="y" value={v.y} min={-4} max={4} step={0.05} onChange={(y) => set({ x: v.x, y })} />
          </div>
        ))}

        <div className={`rounded-xl p-3 text-xs leading-relaxed ${
          inSpan === null ? "bg-warn/10 text-warn border border-warn/30" :
          inSpan.isMatch ? "bg-warn/10 text-warn border border-warn/30" :
          "bg-accent/10 text-accent border border-accent/30"
        }`}>
          {inSpan === null
            ? "v₁ and v₂ are parallel — they can't span anything 2D. Independent analysis breaks down."
            : inSpan.isMatch
            ? `v₃ = ${inSpan.c1.toFixed(2)}·v₁ + ${inSpan.c2.toFixed(2)}·v₂. v₃ is a combo of v₁ and v₂ — the set is DEPENDENT.`
            : "v₃ cannot be made from v₁ and v₂ — the set is INDEPENDENT. Each arrow is essential."}
        </div>
      </div>
    </div>
  );
}
