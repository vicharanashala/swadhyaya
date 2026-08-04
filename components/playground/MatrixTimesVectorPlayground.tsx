"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { m2mulVec, fmt } from "@/lib/math";
import { Sparkles, RotateCcw } from "lucide-react";

// Concept L4: The Matrix Form — Ax = b
// "The moment matrices enter. Coefficients, unknowns, answers — three blocks."
//
// Three ways to play:
//   1. Drag the tip of vector x anywhere on the canvas.
//   2. Type exact values into the matrix / x inputs.
//   3. Use the sliders for quick exploration.
//
// Ax is computed live and drawn on the canvas. As you change x, the output
// arrow follows. This is the picture of "Ax = b": pick an input, see the
// output.

type NumInputProps = {
  value: number;
  onChange: (v: number) => void;
  step?: number;
};

function NumInput({ value, onChange, step = 0.1 }: NumInputProps) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) onChange(v);
      }}
      className="w-16 px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink focus:outline-none focus:border-accent"
    />
  );
}

export function MatrixTimesVectorPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(3);
  const [d, setD] = useState(1);
  const [x, setX] = useState(2);
  const [y, setY] = useState(1);

  const M = useMemo<[[number, number], [number, number]]>(
    () => [[a, b], [c, d]],
    [a, b, c, d],
  );
  const v = useMemo<[number, number]>(() => [x, y], [x, y]);
  const out = useMemo(() => m2mulVec(M, v), [M, v]);

  const reset = () => {
    setA(2);
    setB(1);
    setC(3);
    setD(1);
    setX(2);
    setY(1);
  };

  const presets: Array<{
    name: string;
    M: [[number, number], [number, number]];
    v: [number, number];
  }> = [
    { name: "Identity", M: [[1, 0], [0, 1]], v: [2, 1] },
    { name: "Swap", M: [[0, 1], [1, 0]], v: [2, 1] },
    { name: "Scale 2x", M: [[2, 0], [0, 2]], v: [1, 1] },
    { name: "Shear", M: [[1, 1], [0, 1]], v: [2, 0] },
    { name: "Rotate 90°", M: [[0, -1], [1, 0]], v: [2, 0] },
    { name: "Project x", M: [[1, 0], [0, 0]], v: [1, 1] },
  ];

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-1">
        <Sparkles size={12} className="inline mr-1 text-warn" aria-hidden="true" />
        Ax = b — drag x anywhere on the canvas, or edit the matrix
      </h3>
      <p className="text-xs text-dim mb-3">
        The matrix A turns vector x into vector b. Change A or x — see b
        follow.
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={6}
            arrows={[
              {
                to: { x, y },
                color: "var(--ink)",
                label: "x",
                width: 2.5,
                labelOffset: { x: 0.3, y: 0.3 },
              },
              {
                to: { x: out[0] ?? 0, y: out[1] ?? 0 },
                color: "var(--accent)",
                label: `Ax = (${fmt(out[0] ?? 0, 2)}, ${fmt(out[1] ?? 0, 2)})`,
                width: 3,
                labelOffset: { x: 0.3, y: -0.3 },
              },
            ]}
            draggablePoints={[
              { id: "x", pos: { x, y }, color: "var(--ink)", label: "x", radius: 8 },
            ]}
            onPointDrag={(id, p) => {
              if (id === "x") {
                setX(Math.round(p.x * 10) / 10);
                setY(Math.round(p.y * 10) / 10);
              }
            }}
            clamp={{ min: { x: -5.5, y: -5.5 }, max: { x: 5.5, y: 5.5 } }}
            ariaLabel="A times x visualization"
          />
        </div>

        <div className="space-y-3">
          <div className="bg-elev/30 border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Matrix A
            </div>
            <div className="grid grid-cols-2 gap-2 items-center mb-2">
              <NumInput value={a} onChange={setA} />
              <NumInput value={b} onChange={setB} />
              <NumInput value={c} onChange={setC} />
              <NumInput value={d} onChange={setD} />
            </div>
            <div className="font-mono text-sm text-ink text-center">
              [{fmt(a, 2)} {fmt(b, 2)}]<br />
              [{fmt(c, 2)} {fmt(d, 2)}]
            </div>
          </div>

          <div className="bg-elev/30 border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Vector x
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <NumInput value={x} onChange={setX} />
              <NumInput value={y} onChange={setY} />
            </div>
            <div className="font-mono text-sm text-ink text-center">
              ({fmt(x, 2)}, {fmt(y, 2)})
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Ax (the answer)
            </div>
            <div className="font-mono text-xl text-accent">
              ({fmt(out[0] ?? 0, 3)}, {fmt(out[1] ?? 0, 3)})
            </div>
            <div className="text-[10px] text-dim mt-1">
              row 1 · dot: {fmt(a, 2)}·{fmt(x, 2)} + {fmt(b, 2)}·{fmt(y, 2)} ={" "}
              {fmt(out[0] ?? 0, 2)}
              <br />
              row 2 · dot: {fmt(c, 2)}·{fmt(x, 2)} + {fmt(d, 2)}·{fmt(y, 2)} ={" "}
              {fmt(out[1] ?? 0, 2)}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setA(p.M[0][0]);
                  setB(p.M[0][1]);
                  setC(p.M[1][0]);
                  setD(p.M[1][1]);
                  setX(p.v[0]);
                  setY(p.v[1]);
                }}
                className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={reset}
              className="ml-auto text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
            >
              <RotateCcw size={10} aria-hidden="true" /> reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}