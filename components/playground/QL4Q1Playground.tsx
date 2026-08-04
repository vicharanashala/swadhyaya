"use client";
import { useState, useMemo } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";

// Question L4-q1: "A = [[1,2],[3,4]], x = [1,1]. What is Ax?"
// Widget: a 2x2 matrix A and a 2-vector x, both editable via small
// number inputs. The product y = Ax is computed live and plotted:
// x as a blue arrow from origin, y as a red arrow from origin, A
// applied to the unit grid (warped parallelogram) so the student can
// see how A "moves" x to y.

export function QL4Q1Playground() {
  // Defaults match the actual question
  const [[a, b, c, d], setA] = useState<[number, number, number, number]>([1, 2, 3, 4]);
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(1);

  const y1 = a * x1 + b * x2;
  const y2 = c * x1 + d * x2;

  // Grid image: where do the basis vectors e1 and e2 land?
  // A * e1 = (a, c),  A * e2 = (b, d)
  const W = 360;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        A · x — the matrix multiplies the vector
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={W}
          height={W}
          worldSize={4}
          gridLines={[
            // A * e1
            {
              from: { x: 0, y: 0 },
              to: { x: a, y: c },
              color: "var(--matrix)",
              width: 2,
              dashed: true,
            },
            // A * e2
            {
              from: { x: 0, y: 0 },
              to: { x: b, y: d },
              color: "var(--matrix)",
              width: 2,
              dashed: true,
            },
          ]}
          arrows={[
            // x (input, blue)
            {
              from: { x: 0, y: 0 },
              to: { x: x1, y: x2 },
              color: "var(--matrix)",
              label: `x = (${x1}, ${x2})`,
              labelOffset: { x: -0.3, y: 0.4 },
              width: 2.5,
            },
            // y = Ax (output, red)
            {
              from: { x: 0, y: 0 },
              to: { x: y1, y: y2 },
              color: "var(--vector)",
              label: `y = (${y1.toFixed(0)}, ${y2.toFixed(0)})`,
              labelOffset: { x: -0.3, y: 0.4 },
              width: 3,
            },
          ]}
        />

        <div className="flex-1 space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              A
            </div>
            <div className="grid grid-cols-2 gap-1 max-w-[120px] font-mono">
              <Cell value={a} onChange={(v) => setA([v, b, c, d])} />
              <Cell value={b} onChange={(v) => setA([a, v, c, d])} />
              <Cell value={c} onChange={(v) => setA([a, b, v, d])} />
              <Cell value={d} onChange={(v) => setA([a, b, c, v])} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              x
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-faint">(</span>
              <input
                type="number"
                value={x1}
                step={0.5}
                onChange={(e) => setX1(Number(e.target.value))}
                className="w-14 bg-card border border-line rounded px-1.5 py-0.5 text-matrix text-center"
              />
              <span className="text-faint">,</span>
              <input
                type="number"
                value={x2}
                step={0.5}
                onChange={(e) => setX2(Number(e.target.value))}
                className="w-14 bg-card border border-line rounded px-1.5 py-0.5 text-matrix text-center"
              />
              <span className="text-faint">)</span>
            </div>
          </div>
          <div className="bg-card border border-line rounded p-2">
            <div className="text-faint text-[10px] uppercase tracking-wider">
              y = A · x
            </div>
            <div className="font-mono text-vector">
              ({y1.toFixed(1)}, {y2.toFixed(1)})
            </div>
            <div className="text-[10px] text-faint mt-1">
              row 1: {a}·{x1} + {b}·{x2} = {y1.toFixed(1)}
              <br />
              row 2: {c}·{x1} + {d}·{x2} = {y2.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      step={0.5}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-14 bg-card border border-line rounded px-1.5 py-1 text-matrix text-center"
    />
  );
}