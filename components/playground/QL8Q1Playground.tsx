"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";
import { Check, Plus, RotateCcw } from "lucide-react";

// Question L8-q1: "Ax = 0 (homogeneous) always has which solution?"
// Story: Ax = 0 always has x = 0. The student edits a 3×3 matrix and
// drags a probe. When the probe is in the null space (T sends it to 0),
// it lights up. Multiple probe points reveal the null-space shape:
// {0} (origin only), a line, a plane.

export function QL8Q1Playground() {
  const [m, setM] = useState<number[][]>([
    [2, 4, 6],
    [0, 3, 9],
    [0, 0, 5],
  ]);
  const [probes, setProbes] = useState<Array<{ x: number; y: number; z: number }>>([
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ]);

  const solution = useMemo(() => {
    const aug = m.map((row, i) => [...row, 0]);
    const { rref, pivots } = matRref(aug);
    const n = m[0]!.length;
    const free: number[] = [];
    for (let j = 0; j < n; j++) {
      if (!pivots.includes(j)) free.push(j);
    }
    return { rref, pivots, free };
  }, [m]);

  const nullDim = solution.free.length;
  const shapeLabel =
    nullDim === 0 ? "{0} — only the origin" : nullDim === 1 ? "a line" : "a plane";

  // For each probe, compute M·probe.
  const evalProbe = (p: { x: number; y: number; z: number }) => {
    if (m.length !== 3) return [0, 0];
    return [
      m[0]![0]! * p.x + m[0]![1]! * p.y + m[0]![2]! * p.z,
      m[1]![0]! * p.x + m[1]![1]! * p.y + m[1]![2]! * p.z,
      m[2]![0]! * p.x + m[2]![1]! * p.y + m[2]![2]! * p.z,
    ];
  };

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Homogeneous Ax = 0 — drop probes to find the null space.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Ax = 0 always has x = 0 (the origin). If rank &lt; n, more vectors
        also satisfy it — the null space is a line or plane.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Matrix A
          </div>
          <div className="space-y-1">
            {m.map((row, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[10px] text-faint w-4">R{i + 1}</span>
                {row.map((v, j) => (
                  <input
                    key={j}
                    type="number"
                    step={0.5}
                    value={v}
                    onChange={(e) =>
                      setM((rows) =>
                        rows.map((r, ri) =>
                          ri === i
                            ? r.map((c, rj) => (rj === j ? parseFloat(e.target.value) || 0 : c))
                            : r,
                        ),
                      )
                    }
                    className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                    aria-label={`A[${i + 1}][${j + 1}]`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Null-space shape
          </div>
          <motion.div
            key={nullDim}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded p-2 bg-card border border-line text-center"
          >
            <div className="text-[10px] text-faint uppercase tracking-wider">
              dim(null space)
            </div>
            <div className="text-3xl font-mono text-accent">{nullDim}</div>
            <div className="text-[10px] text-dim mt-1">{shapeLabel}</div>
          </motion.div>
        </div>
      </div>

      <div className="mt-3 bg-card border border-line rounded p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
          Probes — green if Ax = 0
        </div>
        <div className="space-y-1">
          {probes.map((p, i) => {
            const out = evalProbe(p);
            const inNull = out.every((v) => Math.abs(v) < 1e-6);
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs p-1.5 rounded ${
                  inNull
                    ? "bg-correct/10 border border-correct/40"
                    : "bg-warn/10 border border-warn/40"
                }`}
              >
                {inNull ? (
                  <Check
                    size={12}
                    className="text-correct shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-warn shrink-0" />
                )}
                <span className="font-mono text-ink flex-1">
                  ({p.x}, {p.y}, {p.z})
                </span>
                <span className="text-[10px] font-mono text-dim">
                  A·p = ({fmt(out[0] ?? 0, 1)}, {fmt(out[1] ?? 0, 1)},{" "}
                  {fmt(out[2] ?? 0, 1)})
                </span>
                <button
                  onClick={() =>
                    setProbes((arr) => arr.filter((_, j) => j !== i))
                  }
                  className="text-[10px] text-faint hover:text-warn"
                  aria-label={`remove probe ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
          <button
            onClick={() =>
              setProbes((arr) => [
                ...arr,
                {
                  x: Math.round((Math.random() - 0.5) * 4),
                  y: Math.round((Math.random() - 0.5) * 4),
                  z: Math.round((Math.random() - 0.5) * 4),
                },
              ])
            }
            className="mt-2 text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
          >
            <Plus size={10} aria-hidden="true" /> drop probe
          </button>
          <button
            onClick={() => setProbes([{ x: 0, y: 0, z: 0 }])}
            className="mt-2 ml-2 text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
          >
            <RotateCcw size={10} aria-hidden="true" /> reset
          </button>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-dim">
        The trivial solution x = 0 always satisfies Ax = 0. The other
        probes (if green) are non-trivial null-space vectors.
      </div>
    </div>
  );
}