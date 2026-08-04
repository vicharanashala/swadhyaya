"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept F5: Dual Basis
// "Every basis of V has a partner basis of V*. f_i(v_j) = 1 if i=j, else 0."

export function DualBasisPlayground() {
  // User picks the original basis v1, v2
  const [v1x, setV1x] = useState(2);
  const [v1y, setV1y] = useState(0);
  const [v2x, setV2x] = useState(1);
  const [v2y, setV2y] = useState(2);

  // The dual basis f1, f2 satisfies:
  // f1(v1) = 1, f1(v2) = 0
  // f2(v1) = 0, f2(v2) = 1
  // In matrix form: f1 = (a, b), f2 = (c, d)
  //   a*v1x + b*v1y = 1
  //   a*v2x + b*v2y = 0
  //   c*v1x + d*v1y = 0
  //   c*v2x + d*v2y = 1

  const det = v1x * v2y - v1y * v2x;
  let f1: [number, number] = [0, 0];
  let f2: [number, number] = [0, 0];
  if (Math.abs(det) > 0.01) {
    f1 = [v2y / det, -v2x / det];
    f2 = [-v1y / det, v1x / det];
  }

  // Test vector in the original basis
  const [tX, setTX] = useState(1);
  const [tY, setTY] = useState(1);
  // The dual basis applied to t
  const f1t = f1[0] * tX + f1[1] * tY;
  const f2t = f2[0] * tX + f2[1] * tY;

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Every basis has a partner: the dual basis
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={4}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: v1x, y: v1y }, color: "var(--vector)", label: "v₁", width: 3, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: { x: v2x, y: v2y }, color: "var(--matrix)", label: "v₂", width: 3, labelOffset: { x: 0, y: 0.3 } },
            { from: { x: 0, y: 0 }, to: { x: tX, y: tY }, color: "var(--accent)", label: "t", width: 2.5, dashed: true, labelOffset: { x: 0.2, y: 0.2 } },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Original basis (V)</div>
          <Slider label="v₁x" value={v1x} min={-3} max={3} step={0.1} onChange={setV1x} />
          <Slider label="v₁y" value={v1y} min={-3} max={3} step={0.1} onChange={setV1y} />
          <Slider label="v₂x" value={v2x} min={-3} max={3} step={0.1} onChange={setV2x} />
          <Slider label="v₂y" value={v2y} min={-3} max={3} step={0.1} onChange={setV2y} />
        </div>
        <div className="bg-elev/40 border border-line rounded p-3 text-xs space-y-1">
          <div className="text-faint">Dual basis (V*):</div>
          <div className="text-eigen font-mono">f₁ = ({f1[0].toFixed(2)}, {f1[1].toFixed(2)})</div>
          <div className="text-transform font-mono">f₂ = ({f2[0].toFixed(2)}, {f2[1].toFixed(2)})</div>
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Test t</div>
          <Slider label="x" value={tX} min={-3} max={3} step={0.1} onChange={setTX} />
          <Slider label="y" value={tY} min={-3} max={3} step={0.1} onChange={setTY} />
        </div>
        <div className="bg-elev/40 border border-line rounded p-3 text-xs space-y-1">
          <div className="text-faint">t expressed in the dual basis:</div>
          <div className="text-eigen">f₁(t) = {f1t.toFixed(3)}</div>
          <div className="text-transform">f₂(t) = {f2t.toFixed(3)}</div>
          <div className="text-accent text-[10px] mt-1 pt-1 border-t border-line/40">
            So t = {f1t.toFixed(2)}·v₁ + {f2t.toFixed(2)}·v₂ in the original basis.
          </div>
        </div>
      </div>
    </div>
  );
}
