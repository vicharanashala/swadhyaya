"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { matMul, matTranspose, matMulVec, m2eigen, fmt } from "@/lib/math";

// Concept S1: SVD — Every Matrix is Rotate-Scale-Rotate.
// Three ways to feel the decomposition:
//   1. Drag the matrix entries and watch the unit circle deform in real time.
//   2. Edit the entries numerically for precision.
//   3. Snap to a preset (identity, scale, shear, rotation) to feel each piece.
//
// The unit circle (32 sample points) is animated to show the rotation-scale-
// rotation decomposition live.

const PRESETS: Array<{
  name: string;
  M: [[number, number], [number, number]];
}> = [
  { name: "Identity", M: [[1, 0], [0, 1]] },
  { name: "Scale (2×, ½×)", M: [[2, 0], [0, 0.5]] },
  { name: "Shear x", M: [[1, 1], [0, 1]] },
  { name: "Rotation 45°", M: [[0.707, -0.707], [0.707, 0.707]] },
  { name: "Reflect x", M: [[1, 0], [0, -1]] },
  { name: "Diagonal (1.5, 0.8)", M: [[1.5, 0], [0, 0.8]] },
];

const CIRCLE_POINTS = 48;

function buildUnitCircle(): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= CIRCLE_POINTS; i++) {
    const t = (i / CIRCLE_POINTS) * Math.PI * 2;
    pts.push({ x: Math.cos(t), y: Math.sin(t) });
  }
  return pts;
}

function transformCircle(
  pts: Array<{ x: number; y: number }>,
  M: [[number, number], [number, number]],
): Array<{ x: number; y: number }> {
  return pts.map((p) => ({
    x: M[0][0] * p.x + M[0][1] * p.y,
    y: M[1][0] * p.x + M[1][1] * p.y,
  }));
}

export function SVDPlayground() {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(0.8);
  const [c, setC] = useState(-0.5);
  const [d, setD] = useState(1.2);
  const [showCircle, setShowCircle] = useState(true);
  const [showStages, setShowStages] = useState(false);

  const M = useMemo<[[number, number], [number, number]]>(
    () => [[a, b], [c, d]],
    [a, b, c, d],
  );
  const MtM = useMemo(
    () => matMul(matTranspose(M as number[][]), M as number[][]),
    [M],
  );
  const e = useMemo(
    () => m2eigen(MtM as [[number, number], [number, number]]),
    [MtM],
  );
  const singularValues = useMemo(
    () =>
      e
        ? [
            Math.sqrt(Math.max(e.values[0], 0)),
            Math.sqrt(Math.max(e.values[1], 0)),
          ]
        : [0, 0],
    [e],
  );
  const V = useMemo(
    () =>
      e
        ? (e.vectors as unknown as number[][])
        : [
            [1, 0],
            [0, 1],
          ],
    [e],
  );
  const U = useMemo(() => {
    if (!e) return [[1, 0], [0, 1]];
    const out: number[][] = [];
    for (let i = 0; i < 2; i++) {
      const vCol = [V[0]?.[i] ?? 0, V[1]?.[i] ?? 0];
      const u = matMulVec(M as number[][], vCol);
      const sigma = singularValues[i] ?? 1;
      if (sigma > 1e-9) {
        u[0] = (u[0] ?? 0) / sigma;
        u[1] = (u[1] ?? 0) / sigma;
      }
      out.push(u);
    }
    return out;
  }, [e, V, M, singularValues]);

  // Build the four visualizations of the unit circle.
  const unitCircle = useMemo(buildUnitCircle, []);
  const rotated = useMemo(
    () =>
      transformCircle(unitCircle, [
        [V[0]?.[0] ?? 1, V[0]?.[1] ?? 0],
        [V[1]?.[0] ?? 0, V[1]?.[1] ?? 1],
      ]),
    [unitCircle, V],
  );
  const scaled = useMemo(
    () =>
      rotated.map((p) => ({
        x: p.x * (singularValues[0] ?? 1),
        y: p.y * (singularValues[1] ?? 1),
      })),
    [rotated, singularValues],
  );
  const transformed = useMemo(() => transformCircle(unitCircle, M), [
    unitCircle,
    M,
  ]);

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-sm font-medium text-ink">
          Every matrix is{" "}
          <span className="text-eigen">Vᵀ</span> ·{" "}
          <span className="text-singular">Σ</span> ·{" "}
          <span className="text-transform">U</span> — rotate, scale, rotate
        </h3>
        <div className="flex gap-2">
          <label className="text-[10px] text-dim flex items-center gap-1">
            <input
              type="checkbox"
              checked={showCircle}
              onChange={(e) => setShowCircle(e.target.checked)}
            />
            unit circle
          </label>
          <label className="text-[10px] text-dim flex items-center gap-1">
            <input
              type="checkbox"
              checked={showStages}
              onChange={(e) => setShowStages(e.target.checked)}
            />
            show stages
          </label>
        </div>
      </div>
      <p className="text-xs text-dim mb-4">
        Drag the matrix entries — the unit circle morphs through 4 stages
        (circle → Vᵀ-rotated → Σ-stretched → U-rotated) to become the ellipse
        the matrix draws.
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <VectorCanvas
          width={520}
          height={520}
          worldSize={6}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: { x: a, y: c },
              color: "var(--vector)",
              label: "col 1",
              width: 2.5,
              labelOffset: { x: 0, y: -0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: { x: b, y: d },
              color: "var(--matrix)",
              label: "col 2",
              width: 2.5,
              labelOffset: { x: 0, y: 0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: { x: V[0]![0]! * 2, y: V[1]![0]! * 2 },
              color: "var(--eigen)",
              label: "v₁",
              width: 2,
              dashed: true,
            },
            {
              from: { x: 0, y: 0 },
              to: { x: V[0]![1]! * 2, y: V[1]![1]! * 2 },
              color: "var(--eigen)",
              label: "v₂",
              width: 2,
              dashed: true,
            },
            {
              from: { x: 0, y: 0 },
              to: { x: U[0]![0]! * 2, y: U[1]![0]! * 2 },
              color: "var(--transform)",
              label: "u₁",
              width: 2,
              dashed: true,
            },
            {
              from: { x: 0, y: 0 },
              to: { x: U[0]![1]! * 2, y: U[1]![1]! * 2 },
              color: "var(--transform)",
              label: "u₂",
              width: 2,
              dashed: true,
            },
          ]}
          ariaLabel="SVD visualization with unit circle"
        >
          {/* Stages of the unit-circle transform (faint). */}
          {showStages && (
            <>
              <CirclePoly pts={rotated} stroke="var(--eigen)" opacity={0.3} />
              <CirclePoly pts={scaled} stroke="var(--singular)" opacity={0.45} />
            </>
          )}
          {showCircle && (
            <CirclePoly pts={transformed} stroke="var(--accent)" opacity={0.9} />
          )}
        </VectorCanvas>

        <div className="space-y-3">
          <div className="bg-elev/30 border border-line rounded-md p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              A =
            </div>
            <div className="font-mono text-sm text-ink">
              [{fmt(a, 2)} {fmt(b, 2)}]<br />
              [{fmt(c, 2)} {fmt(d, 2)}]
            </div>
          </div>

          <div className="bg-elev/30 border border-eigen/30 rounded-md p-3">
            <div
              className="text-[10px] text-faint uppercase tracking-wider mb-2"
              style={{ color: "var(--eigen)" }}
            >
              Vᵀ (rotation in input space)
            </div>
            <div className="font-mono text-sm">
              [{fmt(V[0]![0]!, 2)} {fmt(V[0]![1]!, 2)}]<br />
              [{fmt(V[1]![0]!, 2)} {fmt(V[1]![1]!, 2)}]
            </div>
          </div>

          <div className="bg-elev/30 border border-singular/40 rounded-md p-3">
            <div
              className="text-[10px] text-faint uppercase tracking-wider mb-2"
              style={{ color: "var(--singular)" }}
            >
              Σ (stretching)
            </div>
            <div className="font-mono text-sm">
              [{fmt(singularValues[0] ?? 0, 2)} 0]<br />
              [0 {fmt(singularValues[1] ?? 0, 2)}]
            </div>
            <div className="text-[10px] text-faint mt-1">
              singular values = how much each direction is stretched
            </div>
          </div>

          <div className="bg-elev/30 border border-transform/30 rounded-md p-3">
            <div
              className="text-[10px] text-faint uppercase tracking-wider mb-2"
              style={{ color: "var(--transform)" }}
            >
              U (rotation in output space)
            </div>
            <div className="font-mono text-sm">
              [{fmt(U[0]![0]!, 2)} {fmt(U[0]![1]!, 2)}]<br />
              [{fmt(U[1]![0]!, 2)} {fmt(U[1]![1]!, 2)}]
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-elev/30 border border-line rounded-md p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-faint uppercase tracking-wider">
            Matrix entries — type or drag
          </div>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setA(p.M[0][0]);
                  setB(p.M[0][1]);
                  setC(p.M[1][0]);
                  setD(p.M[1][1]);
                }}
                className="text-[10px] px-2 py-0.5 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <NumberSlider label="a" value={a} onChange={setA} />
          <NumberSlider label="b" value={b} onChange={setB} />
          <NumberSlider label="c" value={c} onChange={setC} />
          <NumberSlider label="d" value={d} onChange={setD} />
        </div>
      </div>
    </div>
  );
}

function CirclePoly({
  pts,
  stroke,
  opacity = 0.5,
}: {
  pts: Array<{ x: number; y: number }>;
  stroke: string;
  opacity?: number;
}) {
  const W = 520;
  const d = pts
    .map((p) => {
      const px = W / 2 + p.x * (W / 12);
      const py = W / 2 - p.y * (W / 12);
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    })
    .join(" ");
  return (
    <polyline
      points={d}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      opacity={opacity}
    />
  );
}

function NumberSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-faint font-mono w-4">{label}</span>
      <Slider
        label={label}
        value={value}
        min={-3}
        max={3}
        step={0.1}
        onChange={onChange}
      />
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="w-14 px-2 py-0.5 text-xs font-mono rounded border border-line bg-canvas text-ink"
        aria-label={`${label} numeric input`}
      />
    </div>
  );
}