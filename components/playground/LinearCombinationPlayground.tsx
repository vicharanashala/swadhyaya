"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { fmt } from "@/lib/math";
import { Shuffle } from "lucide-react";

// Concept V2: Adding and Scaling — Linear Combinations.
// Three things to drag:
//   1. The head of vector a (or b) directly on the canvas.
//   2. The tip of the result, which auto-balances the scalars.
//   3. The scalars c₁ and c₂ via sliders or number inputs.
//
// The parallelogram construction animates live: as you scale c₁, you see
// a stretch out; as you scale c₂, you see b stretch and the head-to-tail
// walk.

export function LinearCombinationPlayground() {
  const [a, setA] = useState({ x: 2, y: 1 });
  const [b, setB] = useState({ x: -1, y: 2 });
  const [ca, setCa] = useState(1.5);
  const [cb, setCb] = useState(0.7);

  const sum = useMemo(
    () => ({
      x: ca * a.x + cb * b.x,
      y: ca * a.y + cb * b.y,
    }),
    [ca, cb, a, b],
  );

  // If the user drags the "result" point, we solve for ca and cb
  // (using the inverse of [a | b] in 2×2 form) so that c₁·a + c₂·b = target.
  const onResultDrag = (target: { x: number; y: number }) => {
    const det = a.x * b.y - a.y * b.x;
    if (Math.abs(det) < 0.2) return; // not invertible: ignore drag
    const newCa = (target.x * b.y - target.y * b.x) / det;
    const newCb = (-a.x * target.y + a.y * target.x) / det;
    if (Math.abs(newCa) <= 4 && Math.abs(newCb) <= 4) {
      setCa(newCa);
      setCb(newCb);
    }
  };

  // Parallelogram vertices for the area visualization.
  const parallelogram = useMemo(
    () => [
      { x: 0, y: 0 },
      { x: ca * a.x, y: ca * a.y },
      { x: sum.x, y: sum.y },
      { x: cb * b.x, y: cb * b.y },
    ],
    [ca, cb, a, b, sum],
  );

  const reset = () => {
    setA({ x: 2, y: 1 });
    setB({ x: -1, y: 2 });
    setCa(1.5);
    setCb(0.7);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-1">
          Drag a, b, or the result — see the linear combination update live.
        </h3>
        <p className="text-xs text-dim mb-3">
          A linear combination is a sum of scaled vectors. The dashed
          parallelogram shows the two scaled steps.
        </p>

        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={5}
            polygons={[
              {
                points: parallelogram,
                fill: "var(--accent)",
                stroke: "var(--accent)",
                fillOpacity: 0.08,
                strokeWidth: 1,
                strokeDasharray: "2 3",
              },
            ]}
            arrows={[
              {
                from: { x: 0, y: 0 },
                to: a,
                color: "var(--vector)",
                label: "a",
                width: 3,
                labelOffset: { x: 0, y: -0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: b,
                color: "var(--matrix)",
                label: "b",
                width: 3,
                labelOffset: { x: 0, y: 0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: { x: ca * a.x, y: ca * a.y },
                color: "var(--vector)",
                label: `${ca.toFixed(1)}·a`,
                width: 2,
                dashed: true,
                labelOffset: { x: 0, y: -0.4 },
              },
              {
                from: { x: ca * a.x, y: ca * a.y },
                to: sum,
                color: "var(--matrix)",
                label: `${cb.toFixed(1)}·b`,
                width: 2,
                dashed: true,
                labelOffset: { x: 0.3, y: 0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: sum,
                color: "var(--accent)",
                label: `${ca.toFixed(1)}a+${cb.toFixed(1)}b`,
                width: 3,
                labelOffset: { x: 0.2, y: -0.4 },
              },
            ]}
            draggablePoints={[
              { id: "a", pos: a, color: "var(--vector)", label: "a", radius: 7 },
              { id: "b", pos: b, color: "var(--matrix)", label: "b", radius: 7 },
              {
                id: "result",
                pos: sum,
                color: "var(--accent)",
                label: "result",
                radius: 8,
              },
            ]}
            onPointDrag={(id, p) => {
              if (id === "a")
                setA({
                  x: Math.round(p.x * 10) / 10,
                  y: Math.round(p.y * 10) / 10,
                });
              else if (id === "b")
                setB({
                  x: Math.round(p.x * 10) / 10,
                  y: Math.round(p.y * 10) / 10,
                });
              else if (id === "result") onResultDrag(p);
            }}
            clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
            ariaLabel="Linear combination playground"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div
              className="text-[10px] text-faint uppercase tracking-wider"
              style={{ color: "var(--vector)" }}
            >
              Vector a
            </div>
            <button
              onClick={reset}
              className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
            >
              <Shuffle size={10} aria-hidden="true" /> randomize
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 mb-1">
            <input
              type="number"
              step={0.1}
              value={a.x}
              onChange={(e) =>
                setA({ x: parseFloat(e.target.value) || 0, y: a.y })
              }
              className="px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
              aria-label="a x"
            />
            <input
              type="number"
              step={0.1}
              value={a.y}
              onChange={(e) =>
                setA({ x: a.x, y: parseFloat(e.target.value) || 0 })
              }
              className="px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
              aria-label="a y"
            />
          </div>
          <div className="font-mono text-xs text-ink">
            ({fmt(a.x, 2)}, {fmt(a.y, 2)})
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-4">
          <div
            className="text-[10px] text-faint uppercase tracking-wider mb-2"
            style={{ color: "var(--matrix)" }}
          >
            Vector b
          </div>
          <div className="grid grid-cols-2 gap-1 mb-1">
            <input
              type="number"
              step={0.1}
              value={b.x}
              onChange={(e) =>
                setB({ x: parseFloat(e.target.value) || 0, y: b.y })
              }
              className="px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
              aria-label="b x"
            />
            <input
              type="number"
              step={0.1}
              value={b.y}
              onChange={(e) =>
                setB({ x: b.x, y: parseFloat(e.target.value) || 0 })
              }
              className="px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink"
              aria-label="b y"
            />
          </div>
          <div className="font-mono text-xs text-ink">
            ({fmt(b.x, 2)}, {fmt(b.y, 2)})
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Scalars
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-faint font-mono w-8">
                c₁ =
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.05}
                value={ca}
                onChange={(e) => setCa(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="c₁ slider"
              />
              <input
                type="number"
                step={0.1}
                value={ca}
                onChange={(e) => setCa(parseFloat(e.target.value) || 0)}
                className="w-14 px-2 py-0.5 text-xs font-mono rounded border border-line bg-canvas text-ink"
                aria-label="c₁ numeric"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-faint font-mono w-8">
                c₂ =
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.05}
                value={cb}
                onChange={(e) => setCb(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="c₂ slider"
              />
              <input
                type="number"
                step={0.1}
                value={cb}
                onChange={(e) => setCb(parseFloat(e.target.value) || 0)}
                className="w-14 px-2 py-0.5 text-xs font-mono rounded border border-line bg-canvas text-ink"
                aria-label="c₂ numeric"
              />
            </div>
          </div>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded p-3 text-xs">
          <div className="text-accent font-medium mb-1">
            {ca.toFixed(2)}·a + {cb.toFixed(2)}·b =
          </div>
          <div className="font-mono text-lg text-center text-accent">
            ({fmt(sum.x, 2)}, {fmt(sum.y, 2)})
          </div>
          <div className="text-[10px] text-dim mt-1">
            = ({fmt(ca * a.x, 2)} + {fmt(cb * b.x, 2)},{" "}
            {fmt(ca * a.y, 2)} + {fmt(cb * b.y, 2)})
          </div>
        </div>
      </div>
    </div>
  );
}