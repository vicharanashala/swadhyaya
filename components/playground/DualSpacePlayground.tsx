"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept F4: The Dual Space V* — all functionals form their own space
// "Add two functionals, get another. Scale a functional, get another. V* is a vector space."

export function DualSpacePlayground() {
  // Two functionals f1, f2. User can add them, scale them.
  const [f1a, setF1a] = useState(1);
  const [f1b, setF1b] = useState(0);
  const [f2a, setF2a] = useState(0);
  const [f2b, setF2b] = useState(1);
  const [c1, setC1] = useState(1);
  const [c2, setC2] = useState(0);

  // The combined functional: (c1·f1 + c2·f2)(v) = (c1·f1a + c2·f2a)·x + (c1·f1b + c2·f2b)·y
  const totalA = c1 * f1a + c2 * f2a;
  const totalB = c1 * f1b + c2 * f2b;

  // Test vector
  const [vX, setVX] = useState(2);
  const [vY, setVY] = useState(1);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          The dual space V* — all functionals form their own vector space
        </h3>
        <p className="text-xs text-dim mb-3">
          Each functional is a vector in V*. Add them: (f₁+f₂)(v) = f₁(v) + f₂(v).
          Scale them: (cf)(v) = c·f(v). The level sets (dashed) show the
          geometric meaning.
        </p>

        <VectorCanvas
          width={520}
          height={520}
          worldSize={4}
          arrows={[
            { from: { x: 0, y: 0 }, to: { x: vX, y: vY }, color: "var(--matrix)", label: "v", width: 3 },
          ]}
        >
          {/* f1 level set (f1(v)=0) — perpendicular to (f1a, f1b) */}
          <line
            x1={520/2 - f1b * 50}
            y1={520/2 - f1a * 50}
            x2={520/2 + f1b * 50}
            y2={520/2 + f1a * 50}
            stroke="var(--eigen)"
            strokeWidth={1.5}
            opacity={0.5}
          />
          {/* f2 level set */}
          <line
            x1={520/2 - f2b * 50}
            y1={520/2 - f2a * 50}
            x2={520/2 + f2b * 50}
            y2={520/2 + f2a * 50}
            stroke="var(--transform)"
            strokeWidth={1.5}
            opacity={0.5}
          />
          {/* total level set (f1+f2)(v) = 0 */}
          <line
            x1={520/2 - totalB * 50}
            y1={520/2 - totalA * 50}
            x2={520/2 + totalB * 50}
            y2={520/2 + totalA * 50}
            stroke="var(--accent)"
            strokeWidth={2.5}
          />
        </VectorCanvas>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--eigen)" }}>f₁ = ({f1a}, {f1b})</div>
          <Slider label="a" value={f1a} min={-2} max={2} step={0.1} onChange={setF1a} />
          <Slider label="b" value={f1b} min={-2} max={2} step={0.1} onChange={setF1b} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--transform)" }}>f₂ = ({f2a}, {f2b})</div>
          <Slider label="a" value={f2a} min={-2} max={2} step={0.1} onChange={setF2a} />
          <Slider label="b" value={f2b} min={-2} max={2} step={0.1} onChange={setF2b} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Linear combination</div>
          <Slider label="c₁" value={c1} min={-2} max={2} step={0.1} onChange={setC1} />
          <Slider label="c₂" value={c2} min={-2} max={2} step={0.1} onChange={setC2} />
        </div>
        <div className="bg-elev/40 border border-line rounded p-3 text-xs space-y-1">
          <div className="text-faint">c₁·f₁ + c₂·f₂ =</div>
          <div className="text-accent text-xl font-mono text-center">
            ({totalA.toFixed(1)}, {totalB.toFixed(1)})
          </div>
          <div className="text-faint text-[10px]">
            The orange level set is perpendicular to the combined functional.
            f(v) = ({totalA.toFixed(1)})·{vX} + ({totalB.toFixed(1)})·{vY} = {(totalA*vX + totalB*vY).toFixed(2)}
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>Test v</div>
          <Slider label="x" value={vX} min={-3} max={3} step={0.1} onChange={setVX} />
          <Slider label="y" value={vY} min={-3} max={3} step={0.1} onChange={setVY} />
        </div>
      </div>
    </div>
  );
}
