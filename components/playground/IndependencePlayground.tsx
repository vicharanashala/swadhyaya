"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

export function IndependencePlayground() {
  // Three arrows — student sees if one is a combo of the others
  const [v1, setV1] = useState({ x: 2, y: 1 });
  const [v2, setV2] = useState({ x: -1, y: 2 });
  const [v3, setV3] = useState({ x: 4, y: 2 }); // 2 * v1 — DEPENDENT

  // Check if v3 is in span of v1, v2
  const det = v1.x * v2.y - v1.y * v2.x;
  let inSpan = false;
  if (Math.abs(det) > 0.01) {
    // solve [v1 v2] c = v3
    const c1 = (v2.y * v3.x - v2.x * v3.y) / det;
    const c2 = (v1.x * v3.y - v1.y * v3.x) / det;
    const reconstructed = {
      x: c1 * v1.x + c2 * v2.x,
      y: c1 * v1.y + c2 * v2.y,
    };
    inSpan = Math.abs(reconstructed.x - v3.x) < 0.05 && Math.abs(reconstructed.y - v3.y) < 0.05;
  } else {
    inSpan = true; // v1, v2 parallel — v3 might be a combo (or trivial)
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Can the third arrow be made from the first two?
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={8}
          arrows={[
            { from: { x: 0, y: 0 }, to: v1, color: "var(--vector)", label: "v₁", width: 3, labelOffset: { x: 0, y: -0.4 } },
            { from: { x: 0, y: 0 }, to: v2, color: "var(--matrix)", label: "v₂", width: 3, labelOffset: { x: 0, y: 0.4 } },
            { from: { x: 0, y: 0 }, to: v3, color: "var(--eigen)", label: "v₃", width: 3, labelOffset: { x: 0, y: 0.6 } },
          ]}
        />
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--vector)" }}>v₁</div>
          <Slider label="x" value={v1.x} min={-5} max={5} step={0.1} onChange={(x) => setV1({ x, y: v1.y })} />
          <Slider label="y" value={v1.y} min={-5} max={5} step={0.1} onChange={(y) => setV1({ x: v1.x, y })} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>v₂</div>
          <Slider label="x" value={v2.x} min={-5} max={5} step={0.1} onChange={(x) => setV2({ x, y: v2.y })} />
          <Slider label="y" value={v2.y} min={-5} max={5} step={0.1} onChange={(y) => setV2({ x: v2.x, y })} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--eigen)" }}>v₃ (the test)</div>
          <Slider label="x" value={v3.x} min={-5} max={5} step={0.1} onChange={(x) => setV3({ x, y: v3.y })} />
          <Slider label="y" value={v3.y} min={-5} max={5} step={0.1} onChange={(y) => setV3({ x: v3.x, y })} />
        </div>
        <div className={`border rounded-xl p-3 text-xs leading-relaxed ${inSpan ? "bg-warn/10 border-warn/40 text-warn" : "bg-accent/10 border-accent/40 text-accent"}`}>
          {inSpan
            ? "v₃ IS a combo of v₁ and v₂ — the three are dependent. One is redundant."
            : "v₃ is NOT a combo of v₁ and v₂ — the three are independent. Each is essential."}
        </div>
      </div>
    </div>
  );
}
