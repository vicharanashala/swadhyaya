"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";

// Question L2-q1: "Two lines y = 2x + 1 and y = -x + 4. Where do they meet?"
// Widget: two lines plotted with sliders for m1, c1, m2, c2. The meeting
// point is computed live and marked. When the lines are parallel
// (m1 == m2), the meeting point disappears and a 'no meeting' indicator
// shows. The student reads off the (x, y) intersection directly.

export function QL2Q1Playground() {
  // Defaults match the actual question: y = 2x + 1 and y = -x + 4
  const [m1, setM1] = useState(2);
  const [c1, setC1] = useState(1);
  const [m2, setM2] = useState(-1);
  const [c2, setC2] = useState(4);

  const line1 = useMemo(() => [
    { x: -10, y: m1 * -10 + c1 },
    { x: 10, y: m1 * 10 + c1 },
  ], [m1, c1]);
  const line2 = useMemo(() => [
    { x: -10, y: m2 * -10 + c2 },
    { x: 10, y: m2 * 10 + c2 },
  ], [m2, c2]);

  const intersect = useMemo(() => {
    const det = m1 - m2;
    if (Math.abs(det) < 1e-6) return null;
    const x = (c2 - c1) / det;
    const y = m1 * x + c1;
    return { x, y };
  }, [m1, c1, m2, c2]);

  const W = 360;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        Where do these two lines meet?
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={W}
          height={W}
          worldSize={8}
          gridLines={[
            { from: line1[0], to: line1[1], color: "var(--vector)", width: 2.5 },
            { from: line2[0], to: line2[1], color: "var(--matrix)", width: 2.5 },
          ]}
        >
          {intersect && (() => {
            const p = (() => {
              const scale = W / 16;
              return {
                x: W / 2 + intersect.x * scale,
                y: W / 2 - intersect.y * scale,
              };
            })();
            return (
              <g pointerEvents="none">
                <circle cx={p.x} cy={p.y} r={5} fill="var(--accent)" />
                <text
                  x={p.x + 9}
                  y={p.y - 9}
                  fill="var(--accent)"
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                >
                  ({intersect.x.toFixed(2)}, {intersect.y.toFixed(2)})
                </text>
              </g>
            );
          })()}
        </VectorCanvas>

        <div className="flex-1 space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Line 1
            </div>
            <div className="font-mono text-vector mb-2">
              y = {m1.toFixed(2)}x + {c1.toFixed(2)}
            </div>
            <SliderRow label="m₁" value={m1} min={-3} max={3} step={0.05} onChange={setM1} />
            <SliderRow label="c₁" value={c1} min={-5} max={5} step={0.1} onChange={setC1} />
          </div>
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Line 2
            </div>
            <div className="font-mono text-matrix mb-2">
              y = {m2.toFixed(2)}x + {c2.toFixed(2)}
            </div>
            <SliderRow label="m₂" value={m2} min={-3} max={3} step={0.05} onChange={setM2} />
            <SliderRow label="c₂" value={c2} min={-5} max={5} step={0.1} onChange={setC2} />
          </div>
          <div className="bg-card border border-line rounded p-2">
            {intersect ? (
              <div>
                <div className="text-faint text-[10px] uppercase tracking-wider">
                  Meet point
                </div>
                <div className="font-mono text-accent">
                  ({intersect.x.toFixed(3)}, {intersect.y.toFixed(3)})
                </div>
              </div>
            ) : (
              <div className="text-warn">
                Parallel — same slope, no meeting.
              </div>
            )}
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
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
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
      <span className="font-mono text-ink w-10 text-right">
        {value.toFixed(2)}
      </span>
    </div>
  );
}