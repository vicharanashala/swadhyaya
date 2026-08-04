"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { m2, m2eigen, m2mulVec, fmt } from "@/lib/math";

export function EigenPlayground() {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(0.5);
  const [c, setC] = useState(0.5);
  const [d, setD] = useState(1.5);
  const M = useMemo(() => m2(a, b, c, d), [a, b, c, d]);
  const e = useMemo(() => m2eigen(M), [M]);

  // pick a test vector and show its trajectory
  const [test, setTest] = useState({ x: 1, y: 0.3 });
  const trajectory = useMemo(() => {
    const out: Array<{ x: number; y: number }> = [];
    let v: number[] = [test.x, test.y];
    out.push({ x: v[0], y: v[1] });
    for (let i = 0; i < 30; i++) {
      v = m2mulVec(M, [v[0], v[1]]) as number[];
      // normalize if growing
      const len = Math.hypot(v[0], v[1]);
      if (len > 1000) break;
      out.push({ x: v[0], y: v[1] });
    }
    return out;
  }, [M, test]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Find the vectors that just get stretched — never rotated
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={8}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: a, y: c }, color: "var(--vector)", label: "col 1", width: 3, labelOffset: { x: 0, y: -0.4 } },
            { from: { x: 0, y: 0 }, to: { x: b, y: d }, color: "var(--matrix)", label: "col 2", width: 3, labelOffset: { x: 0, y: 0.4 } },
            ...(e ? [
              {
                from: { x: 0, y: 0 },
                to: { x: e.vectors[0][0] * Math.min(4, Math.abs(e.values[0])), y: e.vectors[0][1] * Math.min(4, Math.abs(e.values[0])) },
                color: "var(--eigen)",
                label: `eigenvector (λ=${fmt(e.values[0], 2)})`,
                width: 4,
                labelOffset: { x: 0, y: -0.5 },
              },
              {
                from: { x: 0, y: 0 },
                to: { x: e.vectors[1][0] * Math.min(4, Math.abs(e.values[1])), y: e.vectors[1][1] * Math.min(4, Math.abs(e.values[1])) },
                color: "var(--singular)",
                label: `λ=${fmt(e.values[1], 2)}`,
                width: 4,
                labelOffset: { x: 0, y: 0.5 },
              },
            ] : []),
          ]}
        >
          {trajectory.length > 1 && (
            <polyline
              points={trajectory.map((p) => `${520 / 2 + p.x * (520 / 16)},${520 / 2 - p.y * (520 / 16)}`).join(" ")}
              fill="none"
              stroke="var(--transform)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              opacity={0.6}
            />
          )}
          <circle
            cx={520 / 2 + test.x * (520 / 16)}
            cy={520 / 2 - test.y * (520 / 16)}
            r={5}
            fill="var(--accent)"
          />
        </VectorCanvas>
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Matrix</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>Test vector (drag sliders, watch its trajectory)</div>
          <Slider label="x" value={test.x} min={-3} max={3} step={0.05} onChange={(x) => setTest({ x, y: test.y })} />
          <Slider label="y" value={test.y} min={-3} max={3} step={0.05} onChange={(y) => setTest({ x: test.x, y })} />
        </div>
        {e ? (
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Eigenvalues</div>
            <div className="space-y-1.5 font-mono text-sm">
              <div style={{ color: "var(--eigen)" }}>λ₁ = {fmt(e.values[0], 4)}</div>
              <div style={{ color: "var(--singular)" }}>λ₂ = {fmt(e.values[1], 4)}</div>
            </div>
            <div className="mt-2 text-[10px] text-faint">
              {Math.abs(e.values[0] - e.values[1]) < 0.01
                ? "Repeated eigenvalue — matrix is a scalar multiple of I."
                : "Two distinct eigenvalues — two preferred directions."}
            </div>
          </div>
        ) : (
          <div className="bg-warn/10 border border-warn/40 rounded-xl p-3 text-xs text-warn">
            No real eigenvalues. The matrix is a rotation (or rotation+scaling).
          </div>
        )}
      </div>
    </div>
  );
}
