"use client";
import { useState, useMemo } from "react";
import { VectorCanvas, type Vec2 as V } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { m2, m2mul, m2mulVec, m2det, fmt } from "@/lib/math";
import type { Mat2 } from "@/lib/math";
import { Lightbulb, RotateCcw, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

interface Props {
  initial?: Mat2;
}

// "A matrix is two column-arrows" — the foundational playground.
// Drag the two arrows (the columns of the matrix) and watch the grid warp.
export function MatrixColumnsPlayground({ initial }: Props) {
  const [col1, setCol1] = useState<V>(() => {
    const m = initial ?? m2(2, 1, 0, 2);
    return { x: m[0][0], y: m[1][0] };
  });
  const [col2, setCol2] = useState<V>(() => {
    const m = initial ?? m2(2, 1, 0, 2);
    return { x: m[0][1], y: m[1][1] };
  });
  const [testVec, setTestVec] = useState<V>({ x: 1, y: 1 });
  const [showGrid, setShowGrid] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  const A: Mat2 = useMemo(() => [[col1.x, col2.x], [col1.y, col2.y]], [col1, col2]);
  const det = useMemo(() => m2det(A), [A]);
  const result = useMemo(() => m2mulVec(A, [testVec.x, testVec.y]), [A, testVec]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read the two column-arrows",
        detail:
          "Drag the two colored arrows. Each arrow IS a column of " +
          "the matrix. Column 1 = where î lands; column 2 = where ĵ " +
          "lands. The full linear transformation is determined by " +
          "these two destinations alone.",
        value: `col 1 = (${fmt(col1.x, 2)}, ${fmt(col1.y, 2)})`,
        tone: "faint" as const,
      },
      {
        title: "Read the matrix",
        detail:
          "A = [col1 | col2]. The matrix entries ARE the column " +
          "coordinates — no other representation needed. This is why " +
          "the matrix is so compact: two columns of numbers encode " +
          "the whole transformation.",
        value: `A = [[${fmt(A[0]![0], 2)}, ${fmt(A[0]![1], 2)}], [${fmt(A[1]![0], 2)}, ${fmt(A[1]![1], 2)}]]`,
        tone: "accent" as const,
      },
      {
        title: "Compute det(A) — the area of the parallelogram",
        detail:
          "det = col1.x · col2.y − col1.y · col2.x. It's the SIGNED " +
          "area of the parallelogram the two columns span. Positive " +
          "if the columns are counterclockwise; negative if clockwise; " +
          "zero if they're collinear.",
        value: `det = ${fmt(det, 3)}`,
        tone: Math.abs(det) < 0.1 ? ("warn" as const) : ("accent" as const),
      },
      {
        title: "Apply A to the test vector v",
        detail:
          "v = (v₁, v₂). Result: v₁·col1 + v₂·col2 — a linear " +
          "combination of the columns. The weight v₁ determines how " +
          "much of col1 to add; v₂ does the same for col2.",
        value: `Av = (${fmt(result[0], 2)}, ${fmt(result[1], 2)})`,
        tone: "accent" as const,
      },
      {
        title: "The whole world warps accordingly",
        detail:
          "Apply A to EVERY point in the plane. The unit grid becomes " +
          "a parallelogram grid; circles become ellipses; the area " +
          "of any region scales by |det|.",
        value: `area scales by ${Math.abs(det).toFixed(2)}×`,
        tone: "faint" as const,
      },
    ],
    [col1, col2, A, det, result],
  );

  // Build the warped grid: take each grid point, apply A
  const warpedGrid = useMemo(() => {
    const lines: Array<{ from: V; to: V }> = [];
    const N = 8;
    for (let i = -N; i <= N; i++) {
      // horizontal lines (vary y)
      const a = m2mulVec(A, [-N, i]);
      const b = m2mulVec(A, [N, i]);
      lines.push({ from: { x: a[0], y: a[1] }, to: { x: b[0], y: b[1] } });
      // vertical lines (vary x)
      const a2 = m2mulVec(A, [i, -N]);
      const b2 = m2mulVec(A, [i, N]);
      lines.push({ from: { x: a2[0], y: a2[1] }, to: { x: b2[0], y: b2[1] } });
    }
    return lines;
  }, [A]);

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-card border border-line rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-ink">
            Drag the two arrows — watch the whole world warp
          </h3>
          <button
            onClick={() => {
              setCol1({ x: 2, y: 0 });
              setCol2({ x: 0, y: 2 });
              setTestVec({ x: 1, y: 1 });
            }}
            className="text-xs text-dim hover:text-ink flex items-center gap-1"
          >
            <RotateCcw size={11} /> reset
          </button>
        </div>

        <div className="relative">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={8}
            arrows={[
              { from: { x: 0, y: 0 }, to: col1, color: "var(--vector)", label: "col 1", labelOffset: { x: 0, y: -0.4 }, width: 3 },
              { from: { x: 0, y: 0 }, to: col2, color: "var(--matrix)", label: "col 2", labelOffset: { x: 0, y: 0.4 }, width: 3 },
              { from: { x: 0, y: 0 }, to: testVec, color: "var(--ink-dim)", label: "v", labelOffset: { x: 0, y: -0.4 }, dashed: true },
              { from: { x: 0, y: 0 }, to: { x: result[0], y: result[1] }, color: "var(--transform)", label: "Av", labelOffset: { x: 0, y: 0.4 }, width: 3 },
            ]}
            polygons={[
              { points: [{ x: 0, y: 0 }, col1, { x: col1.x + col2.x, y: col1.y + col2.y }, col2], fill: "var(--transform)", stroke: "var(--transform)" },
            ]}
            gridLines={showGrid ? warpedGrid.map((l) => ({ ...l, color: "var(--ink-faint)", width: 0.4 })) : []}
            onPointerMove={(w) => {
              // click-and-drag the column arrow heads
              // simpler: just provide sliders — this is fine
            }}
          />

          <DraggableArrowOverlay
            col1={col1}
            col2={col2}
            onCol1={setCol1}
            onCol2={setCol2}
          />
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-dim">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show warped grid
          </label>
        </div>
        </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">The matrix</div>
          <div className="font-mono text-2xl text-matrix leading-tight">
            <span className="text-ink-faint">[</span>
            <span className="text-vector">{fmt(col1.x, 2)}</span>
            <span className="text-ink-faint">, </span>
            <span className="text-matrix">{fmt(col2.x, 2)}</span>
            <span className="text-ink-faint">]</span>
            <br />
            <span className="text-ink-faint">[</span>
            <span className="text-vector">{fmt(col1.y, 2)}</span>
            <span className="text-ink-faint">, </span>
            <span className="text-matrix">{fmt(col2.y, 2)}</span>
            <span className="text-ink-faint">]</span>
          </div>
          <div className="mt-3 text-xs text-dim">
            The two columns are colored arrows. Drag them.
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Det = area scaling</div>
          <div className="font-mono text-2xl" style={{ color: Math.abs(det) < 0.1 ? "var(--warn)" : "var(--ink)" }}>
            {fmt(det, 3)}
          </div>
          <div className="text-xs text-dim mt-1">
            {Math.abs(det) < 0.1
              ? "≈ 0 — the transformation is squashing a dimension"
              : `The unit square becomes ${Math.abs(det).toFixed(2)}× its area`}
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Test vector v</div>
          <Slider
            label="x"
            value={testVec.x}
            min={-5}
            max={5}
            step={0.1}
            onChange={(x) => setTestVec({ x, y: testVec.y })}
          />
          <Slider
            label="y"
            value={testVec.y}
            min={-5}
            max={5}
            step={0.1}
            onChange={(y) => setTestVec({ x: testVec.x, y })}
          />
          <div className="mt-2 text-xs text-dim font-mono">
            Av = ({fmt(result[0], 2)}, {fmt(result[1], 2)})
          </div>
        </div>

        <Hint>
          Try setting both arrows perpendicular. Notice det grows. Try making them
          parallel — det goes to zero.
        </Hint>
      </div>
      </div>

      {/* Graphs: matrix heatmap + column magnitude bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each column is highlighted with a different color, matching " +
            "the arrows on the canvas. Drag the arrows and watch the " +
            "heatmap shift in sync.
          </p>
          <MatrixStripHeatmap
            matrix={[A[0] ? [...A[0]] : [], A[1] ? [...A[1]] : []]}
            highlightCols={[0, 1]}
            maxAbs={Math.max(4, Math.abs(col1.x), Math.abs(col1.y), Math.abs(col2.x), Math.abs(col2.y))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Column magnitudes + det — feel the area
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            ||col1|| and ||col2|| are the column lengths. The det bar " +
            "(orange) is the SIGNED parallelogram area — zero when " +
            "columns are collinear.
          </p>
          <BarsGraph
            values={[Math.hypot(col1.x, col1.y), Math.hypot(col2.x, col2.y), det]}
            labels={["||col1||", "||col2||", "det"]}
            maxAbs={Math.max(6, Math.abs(det) + 1)}
            highlights={[2]}
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

function DraggableArrowOverlay({
  col1,
  col2,
  onCol1,
  onCol2,
}: {
  col1: V;
  col2: V;
  onCol1: (v: V) => void;
  onCol2: (v: V) => void;
}) {
  // Make the arrow heads themselves draggable via invisible circles
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 520 520"
    >
      <DragHandle
        world={col1}
        onChange={onCol1}
        color="var(--vector)"
        size={520}
        worldSize={8}
      />
      <DragHandle
        world={col2}
        onChange={onCol2}
        color="var(--matrix)"
        size={520}
        worldSize={8}
      />
    </svg>
  );
}

function DragHandle({
  world,
  onChange,
  color,
  size,
  worldSize,
}: {
  world: V;
  onChange: (v: V) => void;
  color: string;
  size: number;
  worldSize: number;
}) {
  const [dragging, setDragging] = useState(false);
  const px = size / 2 + world.x * (size / (2 * worldSize));
  const py = size / 2 - world.y * (size / (2 * worldSize));

  return (
    <circle
      cx={px}
      cy={py}
      r={dragging ? 14 : 12}
      fill={color}
      fillOpacity={0.3}
      stroke={color}
      strokeWidth={2}
      style={{ pointerEvents: "all", cursor: "grab" }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setDragging(true);
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        setDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        e.stopPropagation();
        const svg = (e.currentTarget as unknown as SVGSVGElement);
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const vx = ((e.clientX - rect.left) / rect.width) * size;
        const vy = ((e.clientY - rect.top) / rect.height) * size;
        const wx = (vx - size / 2) / (size / (2 * worldSize));
        const wy = (size / 2 - vy) / (size / (2 * worldSize));
        onChange({ x: wx, y: wy });
      }}
    />
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-elev/40 border border-line rounded-xl p-3 flex gap-2">
      <Lightbulb size={14} className="text-warn shrink-0 mt-0.5" />
      <div className="text-xs text-dim leading-relaxed">{children}</div>
    </div>
  );
}
