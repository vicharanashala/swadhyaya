"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

export function AddScalePlayground() {
  const [a, setA] = useState({ x: 2, y: 1 });
  const [b, setB] = useState({ x: 1, y: 3 });
  const [s1, setS1] = useState(1);
  const [s2, setS2] = useState(1);
  const sum = { x: s1 * a.x + s2 * b.x, y: s1 * a.y + s2 * b.y };
  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          A linear combination: <span className="font-mono text-warn">c₁·a + c₂·b</span>
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={8}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: s1 * a.x, y: s1 * a.y }, color: "var(--vector)", label: "c₁·a", labelOffset: { x: 0, y: -0.4 }, width: 2.5 },
            { from: { x: s1 * a.x, y: s1 * a.y }, to: { x: sum.x, y: sum.y }, color: "var(--matrix)", label: "c₂·b", labelOffset: { x: 0, y: 0.4 }, width: 2.5 },
            { from: { x: 0, y: 0 }, to: sum, color: "var(--transform)", label: "c₁a+c₂b", labelOffset: { x: 0, y: 0.6 }, width: 3 },
          ]}
        />
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--vector)" }}>Vector a</div>
          <Slider label="x" value={a.x} min={-5} max={5} step={0.1} onChange={(x) => setA({ x, y: a.y })} />
          <Slider label="y" value={a.y} min={-5} max={5} step={0.1} onChange={(y) => setA({ x: a.x, y })} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>Vector b</div>
          <Slider label="x" value={b.x} min={-5} max={5} step={0.1} onChange={(x) => setB({ x, y: b.y })} />
          <Slider label="y" value={b.y} min={-5} max={5} step={0.1} onChange={(y) => setB({ x: b.x, y })} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--warn)" }}>Scalars</div>
          <Slider label="c₁" value={s1} min={-3} max={3} step={0.05} onChange={setS1} />
          <Slider label="c₂" value={s2} min={-3} max={3} step={0.05} onChange={setS2} />
        </div>
      </div>
    </div>
  );
}
