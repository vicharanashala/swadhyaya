"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";

// Question S1-q1: "Every m×n matrix A can be decomposed as..."
// Widget: a small 2x2 matrix A, with Vᵀ (rotation by angle θ) and U
// (rotation by angle φ) and Σ (diag of σ₁, σ₂). As the student drags
// the sliders, the unit circle rotates by Vᵀ, scales by Σ, then
// rotates by U — and the resulting ellipse matches the image of the
// unit circle under A. Shows the "rotate-scale-rotate" intuition.

export function QS1Q1Playground() {
  // Angles in radians, singular values
  const [theta, setTheta] = useState(Math.PI / 6); // Vᵀ rotation
  const [phi, setPhi] = useState(Math.PI / 4); // U rotation
  const [s1, setS1] = useState(2);
  const [s2, setS2] = useState(0.8);

  // Apply the unit circle through Vᵀ → Σ → U. Plot 32 sample points.
  const N = 32;
  const points = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    // unit circle
    let x = Math.cos(t);
    let y = Math.sin(t);
    // Vᵀ: rotate by -theta (because we plot A = U Σ Vᵀ, so Vᵀ acts first)
    let xr = x * Math.cos(theta) + y * Math.sin(theta);
    let yr = -x * Math.sin(theta) + y * Math.cos(theta);
    // Σ: scale axes
    xr *= s1;
    yr *= s2;
    // U: rotate by phi
    const xf = xr * Math.cos(phi) - yr * Math.sin(phi);
    const yf = xr * Math.sin(phi) + yr * Math.cos(phi);
    points.push({ x: xf, y: yf });
  }

  const W = 360;
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    segs.push(
      <line
        key={`s-${i}`}
        x1={(W / 2) + points[i].x * (W / 8)}
        y1={(W / 2) - points[i].y * (W / 8)}
        x2={(W / 2) + points[i + 1].x * (W / 8)}
        y2={(W / 2) - points[i + 1].y * (W / 8)}
        stroke="var(--singular)"
        strokeWidth={2}
        fill="none"
      />,
    );
  }

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        A = U Σ Vᵀ — rotate, scale, rotate
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative">
          <VectorCanvas
            width={W}
            height={W}
            worldSize={4}
          >
            <g pointerEvents="none">{segs}</g>
          </VectorCanvas>
          <div className="absolute top-2 right-2 text-[10px] text-faint bg-canvas/80 px-1.5 py-0.5 rounded font-mono">
            A · (unit circle)
          </div>
        </div>

        <div className="flex-1 space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Vᵀ — first rotation
            </div>
            <SliderRow
              label="θ"
              value={theta}
              min={-Math.PI}
              max={Math.PI}
              step={0.01}
              onChange={setTheta}
              fmt={(v) => `${(v * 180 / Math.PI).toFixed(0)}°`}
            />
          </div>
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Σ — axis stretches
            </div>
            <SliderRow label="σ₁" value={s1} min={0} max={3} step={0.05} onChange={setS1} fmt={(v) => v.toFixed(2)} />
            <SliderRow label="σ₂" value={s2} min={0} max={3} step={0.05} onChange={setS2} fmt={(v) => v.toFixed(2)} />
          </div>
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              U — last rotation
            </div>
            <SliderRow
              label="φ"
              value={phi}
              min={-Math.PI}
              max={Math.PI}
              step={0.01}
              onChange={setPhi}
              fmt={(v) => `${(v * 180 / Math.PI).toFixed(0)}°`}
            />
          </div>
          <div className="text-[10px] text-faint">
            Drag to see: the unit circle is rotated, then stretched along
            new axes, then rotated again. The result is an ellipse — and
            it's the image of the unit circle under A.
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-faint font-mono w-6">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
      <span className="font-mono text-ink w-12 text-right">{fmt(value)}</span>
    </div>
  );
}