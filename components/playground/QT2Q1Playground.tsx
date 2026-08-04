"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";

// Question T2-q1: "If T is linear, what is T(2v)?"
// Story: Linear maps commute with scalar multiplication. The student
// sees two paths to the answer:
//   1. Scale v by 2 first, then apply T.
//   2. Apply T to v first, then scale the result by 2.
// Both paths land on the same vector. The playground highlights both
// paths in different colors so the student sees they're equal.

const M = (a: number, b: number, c: number, d: number) =>
  [[a, b], [c, d]] as const;

export function QT2Q1Playground() {
  const [v, setV] = useState({ x: 1, y: 2 });
  const [c, setC] = useState(2);

  // A diagonal matrix so the picture is clean.
  const T = useMemo(() => M(2, 0.5, -0.3, 1.5), []);

  // Path 1: T(c·v) — scale first
  const scaled = useMemo(
    () => ({ x: c * v.x, y: c * v.y }),
    [c, v],
  );
  const path1 = useMemo(
    () => ({
      x: T[0][0] * scaled.x + T[0][1] * scaled.y,
      y: T[1][0] * scaled.x + T[1][1] * scaled.y,
    }),
    [T, scaled],
  );

  // Path 2: c·T(v) — apply first
  const Tv = useMemo(
    () => ({
      x: T[0][0] * v.x + T[0][1] * v.y,
      y: T[1][0] * v.x + T[1][1] * v.y,
    }),
    [T, v],
  );
  const path2 = useMemo(() => ({ x: c * Tv.x, y: c * Tv.y }), [c, Tv]);

  const match =
    Math.abs(path1.x - path2.x) < 1e-9 && Math.abs(path1.y - path2.y) < 1e-9;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Two paths to the same answer — linearity in action.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Path 1 (blue): scale v by c, then apply T. Path 2 (green):
        apply T, then scale. Linear maps make them land on the same point.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={6}
          arrows={[
            // Original v
            {
              from: { x: 0, y: 0 },
              to: v,
              color: "var(--ink)",
              label: "v",
              width: 2,
              labelOffset: { x: 0.3, y: 0.3 },
            },
            // Scaled v (path 1 step 1)
            {
              from: { x: 0, y: 0 },
              to: scaled,
              color: "var(--matrix)",
              label: `c·v`,
              width: 1.5,
              dashed: true,
              labelOffset: { x: 0, y: -0.3 },
            },
            // Path 1 result: T(c·v)
            {
              from: { x: 0, y: 0 },
              to: path1,
              color: "var(--matrix)",
              label: `T(${c.toFixed(1)}·v)`,
              width: 3,
              labelOffset: { x: 0.3, y: -0.3 },
            },
            // Path 2 step 1: T(v)
            {
              from: { x: 0, y: 0 },
              to: Tv,
              color: "var(--transform)",
              label: "T(v)",
              width: 1.5,
              dashed: true,
              labelOffset: { x: 0, y: 0.3 },
            },
            // Path 2 result: c·T(v)
            {
              from: { x: 0, y: 0 },
              to: path2,
              color: "var(--transform)",
              label: `${c.toFixed(1)}·T(v)`,
              width: 3,
              labelOffset: { x: 0.3, y: 0.4 },
            },
          ]}
          draggablePoints={[
            { id: "v", pos: v, color: "var(--ink)", label: "v", radius: 8 },
          ]}
          onPointDrag={(id, p) => {
            if (id === "v")
              setV({
                x: Math.round(p.x * 2) / 2,
                y: Math.round(p.y * 2) / 2,
              });
          }}
          clamp={{ min: { x: -3.5, y: -3.5 }, max: { x: 3.5, y: 3.5 } }}
          ariaLabel="Linearity playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              v = ({v.x}, {v.y}), c = {c.toFixed(1)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-faint font-mono w-8">c =</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={c}
                onChange={(e) => setC(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="scalar c"
              />
              <span className="font-mono text-ink w-10 text-right">
                {c.toFixed(1)}
              </span>
            </div>
          </div>

          <motion.div
            animate={{
              backgroundColor: match
                ? "rgba(92,184,122,0.1)"
                : "rgba(0,0,0,0)",
              borderColor: match
                ? "rgba(92,184,122,0.4)"
                : "rgba(255,245,230,0.18)",
            }}
            className="rounded p-3 border text-center"
          >
            <div
              className="text-sm font-medium"
              style={{ color: match ? "var(--correct)" : "var(--ink)" }}
            >
              {match
                ? "✓ T(cv) = cT(v) — linearity confirmed"
                : "T(cv) ≠ cT(v) — this T is NOT linear"}
            </div>
            <div className="text-[10px] text-dim font-mono mt-1">
              T({c.toFixed(1)}·v) = ({path1.x.toFixed(2)},{" "}
              {path1.y.toFixed(2)})<br />
              {c.toFixed(1)}·T(v) = ({path2.x.toFixed(2)},{" "}
              {path2.y.toFixed(2)})
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}