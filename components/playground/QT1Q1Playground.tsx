"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { m2mulVec, fmt } from "@/lib/math";
import { Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question T1-q1: "Which of these is a transformation?"
// Concept: a transformation is a function between vector spaces. A point
// in the input lands somewhere in the output. The student uses this
// playground to compose a 2×2 linear transformation and watch the picture
// on the input side get warped into the picture on the output side.

type V = { x: number; y: number };

const PRESETS: Array<{
  id: string;
  name: string;
  M: [[number, number], [number, number]];
  hint: string;
}> = [
  { id: "ident", name: "Identity", M: [[1, 0], [0, 1]], hint: "T(v) = v — picture unchanged" },
  { id: "swap", name: "Swap axes", M: [[0, 1], [1, 0]], hint: "T(x, y) = (y, x) — reflect across y = x" },
  { id: "rot", name: "Rotate 90°", M: [[0, -1], [1, 0]], hint: "counterclockwise quarter turn" },
  { id: "scale", name: "Scale 2×", M: [[2, 0], [0, 2]], hint: "uniform scaling — picture grows by 2" },
  { id: "shear", name: "Shear", M: [[1, 1], [0, 1]], hint: "T(x, y) = (x + y, y)" },
  { id: "proj", name: "Project y", M: [[1, 0], [0, 0]], hint: "drop the y-component" },
];

export function QT1Q1Playground() {
  const [presetId, setPresetId] = useState("swap");
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  // Live "input picture": three colored dots and an arrow from origin
  const [points, setPoints] = useState<V[]>([
    { x: 1.5, y: 1.5 },
    { x: -1, y: 1 },
    { x: -1.2, y: -1.5 },
  ]);

  const M = useMemo<[[number, number], [number, number]]>(
    () => [[a, b], [c, d]],
    [a, b, c, d],
  );

  const applyPreset = (id: string) => {
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p) {
      setA(p.M[0][0]);
      setB(p.M[0][1]);
      setC(p.M[1][0]);
      setD(p.M[1][1]);
    }
  };

  // Apply T to each input point
  const mapped = useMemo(
    () => points.map((p) => m2mulVec(M, [p.x, p.y])),
    [points, M],
  );

  const det = a * d - b * c;
  const arrows = mapped.slice(0, 1).map((m, i) => ({
    from: { x: 0, y: 0 } as V,
    to: { x: m[0] ?? 0, y: m[1] ?? 0 },
    color: "var(--accent)",
    label: `T(p₁) = (${fmt(m[0] ?? 0, 2)}, ${fmt(m[1] ?? 0, 2)})`,
    width: 2.5,
    labelOffset: { x: 0.3, y: 0.3 } as V,
  }));

  const explainerSteps = useMemo(
    () => [
      {
        title: "A transformation takes a point and lands it somewhere",
        detail:
          "You give T a point (x, y). T gives you back a different point " +
          "(x', y'). That's all a transformation does. The matrix is the " +
          "recipe T uses to decide where each point lands.",
        value: `T: R² → R²`,
        tone: "faint" as const,
      },
      {
        title: "Read the matrix — its columns are where î and ĵ go",
        detail:
          "Column 1 = where (1, 0) lands = T(î). Column 2 = where (0, 1) lands = T(ĵ). " +
          "Every other input is a linear combination, so its image is determined.",
        value: `M = [[${fmt(a, 2)}, ${fmt(b, 2)}], [${fmt(c, 2)}, ${fmt(d, 2)}]]`,
        tone: "faint" as const,
      },
      {
        title: "Apply T to each input point",
        detail:
          "For each input point p, compute T(p) = M · p. The colored dots on " +
          "the right show where each input point lands after the transformation.",
        value: `points → T(points)`,
        tone: "accent" as const,
      },
      {
        title: "Watch the picture warp",
        detail:
          "The colored dots form a triangle on the LEFT. The same dots, after " +
          "passing through T, form a different shape on the RIGHT. Try each " +
          "preset to see how rotation, scaling, shear, and projection reshape the picture.",
        value: `det(M) = ${fmt(det, 3)} ${Math.abs(det) < 1e-6 ? "(collapses area)" : ""}`,
        tone: Math.abs(det) < 1e-6 ? ("warn" as const) : ("accent" as const),
      },
    ],
    [a, b, c, d, det],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-warn" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">
            Two views of the same transformation
          </span>
        </div>
        <div className="text-[10px] text-faint font-mono">
          {PRESETS.find((p) => p.id === presetId)?.hint}
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={`text-[10px] px-2.5 py-1 rounded border transition ${
              presetId === p.id
                ? "bg-accent/15 border-accent/40 text-accent font-medium"
                : "border-line bg-canvas text-dim hover:text-ink hover:bg-elev/60"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Two canvases side by side */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-canvas border border-line rounded-lg p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1 px-1">
            Input space · drag the dots
          </div>
          <VectorCanvas
            width={420}
            height={380}
            worldSize={4}
            arrows={arrows}
            polygons={[
              {
                points: [...points],
                fill: "var(--matrix)",
                fillOpacity: 0.1,
                stroke: "var(--matrix)",
                strokeWidth: 1.5,
              },
            ]}
            dots={points.map((p, i) => ({
              pos: p,
              color: i === 0 ? "var(--vector)" : i === 1 ? "var(--matrix)" : "var(--transform)",
              radius: 5,
            }))}
            draggablePoints={points.map((p, i) => ({
              id: `p${i}`,
              pos: p,
              color: i === 0 ? "var(--vector)" : i === 1 ? "var(--matrix)" : "var(--transform)",
              label: `p${i + 1}`,
              radius: 8,
            }))}
            onPointDrag={(id, p) => {
              const idx = parseInt(id.slice(1), 10);
              if (Number.isFinite(idx)) {
                setPoints((prev) =>
                  prev.map((q, j) =>
                    j === idx
                      ? {
                          x: Math.max(-3.5, Math.min(3.5, Math.round(p.x * 2) / 2)),
                          y: Math.max(-3.5, Math.min(3.5, Math.round(p.y * 2) / 2)),
                        }
                      : q,
                  ),
                );
              }
            }}
            ariaLabel="Input space"
          />
        </div>

        <div className="bg-canvas border border-line rounded-lg p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1 px-1">
            Output space · T(image)
          </div>
          <VectorCanvas
            width={420}
            height={380}
            worldSize={4}
            polygons={[
              {
                points: mapped.map((m) => ({ x: m[0] ?? 0, y: m[1] ?? 0 })),
                fill: "var(--accent)",
                fillOpacity: 0.15,
                stroke: "var(--accent)",
                strokeWidth: 1.5,
              },
            ]}
            dots={mapped.map((m, i) => ({
              pos: { x: m[0] ?? 0, y: m[1] ?? 0 },
              color: i === 0 ? "var(--vector)" : i === 1 ? "var(--matrix)" : "var(--transform)",
              radius: 5,
            }))}
            ariaLabel="Output space after transformation"
          />
        </div>
      </div>

      {/* Matrix */}
      <section className="bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
          The matrix of T · edit the entries directly
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-w-[160px]">
          {[
            { v: a, set: setA, label: "a" },
            { v: b, set: setB, label: "b" },
            { v: c, set: setC, label: "c" },
            { v: d, set: setD, label: "d" },
          ].map(({ v, set, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-faint font-mono w-3">
                {label}
              </span>
              <input
                type="number"
                step={0.1}
                value={v}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (Number.isFinite(val)) set(val);
                }}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-line bg-canvas text-ink focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Graphs */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix — what T looks like algebraically
          </div>
          <MatrixStripHeatmap
            matrix={M}
            maxAbs={Math.max(2, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            |T(p₁)| before/after — how the first point moves
          </div>
          <BarsGraph
            values={[
              Math.hypot(points[0]?.x ?? 0, points[0]?.y ?? 0),
              Math.hypot(mapped[0]?.[0] ?? 0, mapped[0]?.[1] ?? 0),
            ]}
            labels={["||p₁||", "||T(p₁)||"]}
            maxAbs={Math.max(4, Math.hypot(mapped[0]?.[0] ?? 0, mapped[0]?.[1] ?? 0))}
            width={undefined}
            height={120}
            className="w-full"
            highlights={[1]}
          />
        </div>
      </div>

      {/* Step explainer */}
      <section className="bg-card border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-elev/30 transition"
          aria-expanded={showSteps}
        >
          <div className="flex items-center gap-2">
            <Info size={12} className="text-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">
              What&apos;s happening — step by step
            </span>
          </div>
          <span className="text-faint">
            {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
        {showSteps && (
          <div className="border-t border-line p-3">
            <StepExplainer steps={explainerSteps} compact />
          </div>
        )}
      </section>
    </div>
  );
}
