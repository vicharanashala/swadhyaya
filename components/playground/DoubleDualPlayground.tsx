"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept F8: The Double-Dual Theorem (V** = V)
// "For finite-dim V, V** is naturally isomorphic to V. Every vector in V equals
// a unique functional on V* that returns f(v) when tested."

export function DoubleDualPlayground() {
  // Pick a vector v in R^2
  const [vx, setVx] = useState(2);
  const [vy, setVy] = useState(1);

  // Now build the corresponding double-dual element φ_v : V* → R
  // φ_v(f) = f(v) = f1·v1 + f2·v2 for f = (f1, f2)
  // The user can test φ_v on any functional f
  const [f1, setF1] = useState(1);
  const [f2, setF2] = useState(2);
  const phiV = f1 * vx + f2 * vy;

  // For a basis {e1, e2} in V, the dual basis {f1, f2} in V* is just (1,0), (0,1)
  // And the double-dual basis is again (1,0), (0,1)
  // So if v = (vx, vy), then φ_v = (vx, vy) in the V** basis
  // The "isomorphism" is the natural one: v ↔ φ_v

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          V** = V — the double-dual
        </h3>
        <p className="text-xs text-dim mb-3">
          Every vector v in V corresponds to a unique functional on V*:
          φ_v(f) = f(v). In finite dimensions, this map V → V** is an isomorphism.
        </p>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={4}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: vx, y: vy }, color: "var(--vector)", label: "v", width: 3, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: { x: f1, y: f2 }, color: "var(--matrix)", label: "f", width: 3, labelOffset: { x: 0, y: 0.3 } },
          ]}
        />
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--vector)" }}>v in V</div>
          <Slider label="x" value={vx} min={-3} max={3} step={0.1} onChange={setVx} />
          <Slider label="y" value={vy} min={-3} max={3} step={0.1} onChange={setVy} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>f in V*</div>
          <Slider label="f₁" value={f1} min={-3} max={3} step={0.1} onChange={setF1} />
          <Slider label="f₂" value={f2} min={-3} max={3} step={0.1} onChange={setF2} />
        </div>
        <div className="bg-accent/10 border border-accent/30 rounded p-3 text-xs">
          <div className="text-accent font-medium mb-1">φ_v(f) = f(v) = f₁·v₁ + f₂·v₂</div>
          <div className="font-mono text-2xl text-accent text-center my-1">{phiV.toFixed(3)}</div>
          <div className="text-faint text-[10px]">
            The vector v uniquely determines the functional φ_v in V**. The map v ↔ φ_v
            is the canonical isomorphism V → V**.
          </div>
        </div>
        <div className="text-[10px] text-faint">
          <div>In V: &nbsp; v = ({vx}, {vy})</div>
          <div>In V**: &nbsp; φ_v = ({vx}, {vy})</div>
          <div className="text-accent mt-1">
            Same numbers. That's the isomorphism.
          </div>
        </div>
      </div>
    </div>
  );
}
