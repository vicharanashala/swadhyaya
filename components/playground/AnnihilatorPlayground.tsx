"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept F6: Annihilator
// "W° = {functionals f : f(w) = 0 for ALL w in W}. The functionals that vanish on a subspace."

export function AnnihilatorPlayground() {
  // User picks a subspace W (a line through origin: 2 vectors spanning it)
  const [w1x, setW1x] = useState(2);
  const [w1y, setW1y] = useState(1);

  // W° in 2D: a 1D line perpendicular to W
  // If W is along (w1x, w1y), then W° is along (-w1y, w1x)
  const w1Len = Math.hypot(w1x, w1y);
  const w0Vec = w1Len > 0.01
    ? { x: -w1y / w1Len * 4, y: w1x / w1Len * 4 }
    : { x: 0, y: 0 };

  // Test: a user-picked functional f = (a, b). Is it in W°? f(w) = a*w1x + b*w1y = 0?
  const [fa, setFa] = useState(1);
  const [fb, setFb] = useState(1);
  const fOnW = fa * w1x + fb * w1y;
  const isInW0 = Math.abs(fOnW) < 0.05;

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          W° — the functionals that vanish on W
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: w1x, y: w1y }, color: "var(--vector)", label: "W", width: 3, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: { x: w1x * 1.5, y: w1y * 1.5 }, color: "var(--vector)", width: 1.5, dashed: true },
            { from: { x: 0, y: 0 }, to: { x: w0Vec.x, y: w0Vec.y }, color: "var(--eigen)", label: "W°", width: 3, labelOffset: { x: 0, y: 0.3 } },
            { from: { x: 0, y: 0 }, to: { x: -w0Vec.x, y: -w0Vec.y }, color: "var(--eigen)", width: 3, dashed: true },
            { from: { x: 0, y: 0 }, to: { x: fa, y: fb }, color: isInW0 ? "var(--accent)" : "var(--warn)", label: isInW0 ? "f ∈ W°" : "f ∉ W°", width: 2.5, labelOffset: { x: 0.3, y: 0.2 } },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--vector)" }}>Subspace W (a line)</div>
          <Slider label="W₁x" value={w1x} min={-3} max={3} step={0.1} onChange={setW1x} />
          <Slider label="W₁y" value={w1y} min={-3} max={3} step={0.1} onChange={setW1y} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Test functional f = (a, b)</div>
          <Slider label="a" value={fa} min={-3} max={3} step={0.1} onChange={setFa} />
          <Slider label="b" value={fb} min={-3} max={3} step={0.1} onChange={setFb} />
        </div>
        <div className={`rounded p-3 text-xs leading-relaxed ${
          isInW0
            ? "bg-accent/10 border border-accent/30 text-accent"
            : "bg-warn/10 border border-warn/30 text-warn"
        }`}>
          {isInW0
            ? `f(w₁) = ${fa}·${w1x} + ${fb}·${w1y} = ${fOnW.toFixed(2)} ≈ 0. So f is in W° (it vanishes on W).`
            : `f(w₁) = ${fa}·${w1x} + ${fb}·${w1y} = ${fOnW.toFixed(2)} ≠ 0. f is NOT in W°. f is perpendicular to the W° line.`}
        </div>
        <div className="text-[10px] text-faint">
          W° is always perpendicular to W. dim(W) + dim(W°) = dim(V).
        </div>
      </div>
    </div>
  );
}
