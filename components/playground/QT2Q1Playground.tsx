"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

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
  const [showSteps, setShowSteps] = useState(false);

  // A diagonal matrix so the picture is clean.
  const T = useMemo(() => M(2, 0.5, -0.3, 1.5), []);

  // Path 1: T(c·v) — scale first
  const scaled = useMemo(
    () => ({ x: c * v.x, y: c * v.y }),
    [c, v],
  );
  const path1 = useMemo(
    () => ({
      x: T[0]![0]! * scaled.x + T[0]![1]! * scaled.y,
      y: T[1]![0]! * scaled.x + T[1]![1]! * scaled.y,
    }),
    [T, scaled],
  );

  // Path 2: c·T(v) — apply first
  const Tv = useMemo(
    () => ({
      x: T[0]![0]! * v.x + T[0]![1]! * v.y,
      y: T[1]![0]! * v.x + T[1]![1]! * v.y,
    }),
    [T, v],
  );
  const path2 = useMemo(() => ({ x: c * Tv.x, y: c * Tv.y }), [c, Tv]);

  const match =
    Math.abs(path1.x - path2.x) < 1e-9 && Math.abs(path1.y - path2.y) < 1e-9;

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read T — its matrix tells you what it does to each basis vector",
        detail:
          "Column 1 = where î lands after T. Column 2 = where ĵ lands. " +
          "Apply T to any vector v by dotting each row with v.",
        value: `T = [[${T[0]![0]}, ${T[0]![1]}], [${T[1]![0]}, ${T[1]![1]}]]`,
        tone: "faint" as const,
      },
      {
        title: "Read v and the scalar c",
        detail:
          "v is the input vector (you can drag it). c is the scalar " +
          "(you can slide it). The two paths we'll compare both start " +
          "with these.",
        value: `v = (${v.x}, ${v.y}), c = ${c.toFixed(1)}`,
        tone: "faint" as const,
      },
      {
        title: "Path 1 — scale v first, then apply T",
        detail:
          "Compute c·v = (c·v₁, c·v₂), then multiply by T. Result: " +
          "T(c·v).",
        value: `T(c·v) = (${path1.x.toFixed(2)}, ${path1.y.toFixed(2)})`,
        tone: "accent" as const,
      },
      {
        title: "Path 2 — apply T first, then scale",
        detail:
          "Compute T(v), then multiply by c. Result: c·T(v).",
        value: `c·T(v) = (${path2.x.toFixed(2)}, ${path2.y.toFixed(2)})`,
        tone: "accent" as const,
      },
      {
        title: "Linearity check — both paths agree?",
        detail:
          "If T(cv) = cT(v), T is linear. The two arrows in the " +
          "canvas land on the same point. If they don't, T has a " +
          "constant term or a non-linear piece — and this is the test " +
          "for linearity.",
        value: match ? "T is linear ✓" : "T is NOT linear",
        tone: match ? ("accent" as const) : ("warn" as const),
      },
    ],
    [T, v, c, path1, path2, match],
  );

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

      {/* Graphs: matrix T heatmap + comparison bars of both paths */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix T — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            T&apos;s columns are where î and ĵ go. Each row is the dot
            product that produces the corresponding output component.
          </p>
          <MatrixStripHeatmap
            matrix={T.map((r) => [...r])}
            maxAbs={Math.max(2, Math.abs(T[0]![0]!), Math.abs(T[1]![1]!))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Path 1 vs Path 2 — same answer?
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The first two bars are T(cv); the next two are cT(v). When T
            is linear, all four match exactly.
          </p>
          <BarsGraph
            values={[path1.x, path1.y, path2.x, path2.y]}
            labels={["x₁", "y₁", "x₂", "y₂"]}
            maxAbs={Math.max(6, Math.abs(path1.x), Math.abs(path2.x), Math.abs(path1.y), Math.abs(path2.y))}
            width={undefined}
            height={140}
            className="w-full"
          />
        </div>
      </div>

      {/* Step-by-step explainer */}
      <div className="mt-3 bg-card border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-elev/30 transition"
          aria-expanded={showSteps}
        >
          <div className="flex items-center gap-2">
            <Info size={12} className="text-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">
              What&apos;s happening — step by step
            </span>
          </div>
          <span className="text-faint">
            {showSteps ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </span>
        </button>
        {showSteps && (
          <div className="border-t border-line p-3">
            <StepExplainer steps={explainerSteps} compact />
          </div>
        )}
      </div>
    </div>
  );
}
