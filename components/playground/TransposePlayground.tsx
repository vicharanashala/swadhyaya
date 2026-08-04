"use client";
import { useState } from "react";
import { Slider } from "./Slider";

// Concept F7: Transpose of a Transformation
// "T: V → W. T*: W* → V*. (T*f)(v) = f(Tv). On matrices: T has matrix A, T* has matrix Aᵀ."

export function TransposePlayground() {
  // T: R² → R² with matrix A
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(0);
  const [d, setD] = useState(3);
  // T*: R² → R² with matrix Aᵀ = [[a, c], [b, d]]

  const [vx, setVx] = useState(2);
  const [vy, setVy] = useState(1);
  const tvx = a * vx + b * vy;
  const tvy = c * vx + d * vy;

  // A functional f: R² → R, represented by (f1, f2). f(v) = f1·v1 + f2·v2.
  const [f1, setF1] = useState(1);
  const [f2, setF2] = useState(0);
  const fOnTv = f1 * tvx + f2 * tvy;
  // T*f has the components (Tᵀ f): [a·f1 + c·f2, b·f1 + d·f2]
  const tsf1 = a * f1 + c * f2;
  const tsf2 = b * f1 + d * f2;
  // T*f applied to v
  const tsfOnV = tsf1 * vx + tsf2 * vy;

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        T* acts on functionals, not on vectors
      </h3>
      <p className="text-xs text-dim mb-3">
        If T has matrix A, then T* has matrix Aᵀ. For any functional f and vector v:<br />
        <span className="text-ink font-mono">(T* f)(v) = f(T v)</span>
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>

        <div className="bg-card border border-line rounded-xl p-4 space-y-3">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Aᵀ</div>
            <div className="font-mono text-sm">
              [{a}  {c}]<br />
              [{b}  {d}]
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">v (vector)</div>
          <Slider label="x" value={vx} min={-3} max={3} step={0.1} onChange={setVx} />
          <Slider label="y" value={vy} min={-3} max={3} step={0.1} onChange={setVy} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">f (functional)</div>
          <Slider label="f₁" value={f1} min={-3} max={3} step={0.1} onChange={setF1} />
          <Slider label="f₂" value={f2} min={-3} max={3} step={0.1} onChange={setF2} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div className="bg-elev/40 border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider">Tv (vector)</div>
          <div className="font-mono text-accent">({tvx.toFixed(2)}, {tvy.toFixed(2)})</div>
        </div>
        <div className="bg-elev/40 border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider">f(Tv)</div>
          <div className="font-mono text-accent">{fOnTv.toFixed(3)}</div>
        </div>
        <div className="bg-elev/40 border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider">T*f (functional)</div>
          <div className="font-mono text-accent">({tsf1.toFixed(2)}, {tsf2.toFixed(2)})</div>
        </div>
      </div>

      <div className="mt-3 bg-accent/10 border border-accent/30 rounded p-3 text-xs">
        <div className="text-accent font-medium">Same number, two ways</div>
        <div className="text-dim mt-1">
          f(Tv) = {fOnTv.toFixed(3)} &nbsp;=&nbsp; (T*f)(v) = {tsfOnV.toFixed(3)}
        </div>
      </div>
    </div>
  );
}
