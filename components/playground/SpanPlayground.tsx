"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

export function SpanPlayground() {
  const [v1, setV1] = useState({ x: 2, y: 1 });
  const [v2, setV2] = useState({ x: -1, y: 2 });
  // parallel check
  const cross = v1.x * v2.y - v1.y * v2.x;
  const isParallel = Math.abs(cross) < 0.01;
  // sample span dots
  const dots = useMemo(() => {
    const out: Array<{ x: number; y: number; alpha: number }> = [];
    for (let i = -8; i <= 8; i++) {
      for (let j = -8; j <= 8; j++) {
        if (Math.abs(i) > 5 || Math.abs(j) > 5) continue;
        out.push({
          x: i * v1.x + j * v2.x,
          y: i * v1.y + j * v2.y,
          alpha: 0.5,
        });
      }
    }
    return out;
  }, [v1, v2]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          The span of two arrows — all the dots you can reach
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={8}
          arrows={[
            { from: { x: 0, y: 0 }, to: v1, color: "var(--vector)", label: "v₁", width: 3, labelOffset: { x: 0, y: -0.4 } },
            { from: { x: 0, y: 0 }, to: v2, color: "var(--matrix)", label: "v₂", width: 3, labelOffset: { x: 0, y: 0.4 } },
          ]}
        >
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={520 / 2 + d.x * (520 / 16)}
              cy={520 / 2 - d.y * (520 / 16)}
              r={2}
              fill={isParallel ? "var(--warn)" : "var(--transform)"}
              opacity={0.6}
            />
          ))}
        </VectorCanvas>
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
        <div className={`border rounded-xl p-3 text-xs leading-relaxed ${isParallel ? "bg-warn/10 border-warn/40 text-warn" : "bg-elev/40 border-line text-dim"}`}>
          {isParallel
            ? "The two arrows are parallel — span is just a line."
            : "Two non-parallel arrows — span covers the entire plane."}
        </div>
      </div>
    </div>
  );
}
