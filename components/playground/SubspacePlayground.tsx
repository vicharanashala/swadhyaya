"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept V4 + V5: Subspaces & Span
// "Subspaces are closed under add and scale. Span is what you can reach from given arrows."

export function SubspacePlayground() {
  const [v1, setV1] = useState({ x: 2, y: 1 });
  const [v2, setV2] = useState({ x: 1, y: -1 });

  // Sample span
  const dots = useMemo(() => {
    const out: Array<{ x: number; y: number; a: number }> = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        out.push({ x: i * v1.x + j * v2.x, y: i * v1.y + j * v2.y, a: 0.3 });
      }
    }
    return out;
  }, [v1, v2]);

  // Test a point: is it in the span?
  const [testX, setTestX] = useState(2.5);
  const [testY, setTestY] = useState(0.5);
  const inSpan = useMemo(() => {
    const det = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(det) < 0.05) return { inSpan: false, reason: "v₁ and v₂ are parallel — span is a line, not a plane" };
    const c1 = (v2.y * testX - v2.x * testY) / det;
    const c2 = (-v1.y * testX + v1.x * testY) / det;
    return { inSpan: true, c1, c2 };
  }, [v1, v2, testX, testY]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          The span of two arrows — everything you can reach
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={[
            { from: { x: 0, y: 0 }, to: v1, color: "var(--vector)", label: "v₁", width: 3, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: v2, color: "var(--matrix)", label: "v₂", width: 3, labelOffset: { x: 0, y: 0.3 } },
            { from: { x: 0, y: 0 }, to: { x: testX, y: testY }, color: inSpan.inSpan ? "var(--accent)" : "var(--warn)", label: inSpan.inSpan ? "∈ span" : "∉ span", width: 3, labelOffset: { x: 0.3, y: -0.3 } },
          ]}
        >
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={520/2 + d.x * (520/10)}
              cy={520/2 - d.y * (520/10)}
              r={2}
              fill="var(--transform)"
              opacity={d.a}
            />
          ))}
        </VectorCanvas>
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--vector)" }}>v₁</div>
          <Slider label="x" value={v1.x} min={-3} max={3} step={0.1} onChange={(x) => setV1({ x, y: v1.y })} />
          <Slider label="y" value={v1.y} min={-3} max={3} step={0.1} onChange={(y) => setV1({ x: v1.x, y })} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>v₂</div>
          <Slider label="x" value={v2.x} min={-3} max={3} step={0.1} onChange={(x) => setV2({ x, y: v2.y })} />
          <Slider label="y" value={v2.y} min={-3} max={3} step={0.1} onChange={(y) => setV2({ x: v2.x, y })} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Test point</div>
          <Slider label="x" value={testX} min={-4} max={4} step={0.1} onChange={setTestX} />
          <Slider label="y" value={testY} min={-4} max={4} step={0.1} onChange={setTestY} />
        </div>
        <div className={`rounded p-3 text-xs leading-relaxed ${
          !inSpan.inSpan
            ? "bg-warn/10 border border-warn/30 text-warn"
            : inSpan.c1 !== undefined && (inSpan.c1 < 0 || inSpan.c2 < 0)
            ? "bg-elev/40 border border-line text-dim"
            : "bg-accent/10 border border-accent/30 text-accent"
        }`}>
          {inSpan.inSpan ? (
            inSpan.c1 !== undefined ? (
              <>
                t = {inSpan.c1.toFixed(2)}·v₁ + {inSpan.c2.toFixed(2)}·v₂. The test point is in the span.
              </>
            ) : (
              <>{inSpan.reason}</>
            )
          ) : (
            <>{inSpan.reason}</>
          )}
        </div>
        <div className="text-[10px] text-dim leading-relaxed">
          The grey dots are the entire span (sampled on a grid). If your test point lands
          on a dot, it&apos;s in the span. If it&apos;s off the dots, it can&apos;t be reached.
        </div>
      </div>
    </div>
  );
}
