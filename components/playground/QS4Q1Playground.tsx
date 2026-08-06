"use client";
import { useState, useMemo, useCallback } from "react";
import { fmt } from "@/lib/math";
import { Sparkles, RotateCcw, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question S4-q1 (the playground is generic to the concept): "Ax = b has
// no exact solution. Find x that makes Ax as close to b as possible."
//
// The student drags data points on a 2D scatter plot. The playground fits
// the best line y = m·x + c via least squares — x* = (AᵀA)⁻¹Aᵀb. As points
// move, the line and the residuals update live. Add an outlier and watch
// the line bend toward it — the visual punch of why least squares is
// sensitive to outliers.

type Pt = { x: number; y: number };

const DEFAULT_POINTS: Pt[] = [
  { x: 1, y: 2.1 },
  { x: 2, y: 2.9 },
  { x: 3, y: 3.5 },
  { x: 4, y: 5.1 },
  { x: 5, y: 5.0 },
  { x: 6, y: 6.4 },
];

const OUTLIER_PRESETS = {
  clean: "Linear (low noise)",
  outlier: "Add an outlier",
};

function fitLine(points: Pt[]) {
  // Form A = [x_i, 1] and b = [y_i]; solve Ax = b in least squares sense.
  const n = points.length;
  const A: number[][] = points.map((p) => [p.x, 1]);
  const b: number[] = points.map((p) => p.y);
  // Aᵀ A is 2×2
  let a00 = 0, a01 = 0, a11 = 0;
  let r0 = 0, r1 = 0;
  for (let i = 0; i < n; i++) {
    a00 += A[i]![0]! * A[i]![0]!;
    a01 += A[i]![0]! * A[i]![1]!;
    a11 += A[i]![1]! * A[i]![1]!;
    r0 += A[i]![0]! * b[i]!;
    r1 += A[i]![1]! * b[i]!;
  }
  const det = a00 * a11 - a01 * a01;
  if (Math.abs(det) < 1e-9) return { slope: 0, intercept: 0, residuals: [] as number[] };
  const slope = (a11 * r0 - a01 * r1) / det;
  const intercept = (-a01 * r0 + a00 * r1) / det;
  const residuals = points.map((p) => p.y - (slope * p.x + intercept));
  return { slope, intercept, residuals };
}

export function QS4Q1Playground() {
  const [points, setPoints] = useState<Pt[]>(DEFAULT_POINTS);
  const [outlierMode, setOutlierMode] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState(false);

  const { slope, intercept, residuals } = useMemo(() => fitLine(points), [points]);
  const sse = residuals.reduce((s, r) => s + r * r, 0);

  const reset = () => {
    setPoints(DEFAULT_POINTS);
    setOutlierMode(false);
  };

  const toggleOutlier = () => {
    if (!outlierMode) {
      setPoints((prev) => [...prev, { x: 4, y: 9.5 }]);
      setOutlierMode(true);
    } else {
      setPoints(DEFAULT_POINTS);
      setOutlierMode(false);
    }
  };

  const explainerSteps = useMemo(
    () => [
      {
        title: "The setup — points don't lie exactly on a line",
        detail:
          "Real data is noisy. The system Ax = b has no exact solution: no " +
          "single line passes through every point. We want the line that " +
          "comes closest in a least-squares sense.",
        value: `A = [xᵢ, 1], b = [yᵢ] · overdetermined`,
        tone: "faint" as const,
      },
      {
        title: "Project b onto C(A)",
        detail:
          "Geometrically: b isn't in the column space of A, so we project " +
          "b onto C(A) to get p = Ax*. Then x* minimizes ||Ax − b||². " +
          "The error vector b − p is perpendicular to C(A).",
        value: `x* = (AᵀA)⁻¹ Aᵀ b`,
        tone: "accent" as const,
      },
      {
        title: "Watch the residuals shrink",
        detail:
          "Each point's residual is yᵢ − (m·xᵢ + c). The total squared error " +
          "Σ residual² is what least squares minimizes. Drag the points — " +
          "the line and the residuals update instantly.",
        value: `Σ residual² = ${fmt(sse, 3)}`,
        tone: "accent" as const,
      },
      {
        title: "Outliers warp the line — be careful",
        detail:
          "Adding a single outlier pulls the line toward itself because " +
          "least squares squares the residuals. Toggle the outlier preset — " +
          "notice the slope changes more than you'd expect for one point.",
        value: outlierMode
          ? `slope = ${fmt(slope, 3)} (drifted)`
          : `slope = ${fmt(slope, 3)} (clean data)`,
        tone: outlierMode ? ("warn" as const) : ("faint" as const),
      },
    ],
    [sse, slope, outlierMode],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4 space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-warn" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">
            Best-fit line — drag the points, watch the fit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleOutlier}
            className={`text-[10px] px-2 py-1 border rounded transition ${
              outlierMode
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-line text-dim hover:text-ink hover:bg-elev/60"
            }`}
          >
            {outlierMode ? OUTLIER_PRESETS.outlier : OUTLIER_PRESETS.clean}
          </button>
          <button
            onClick={reset}
            className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1 transition"
          >
            <RotateCcw size={10} /> reset
          </button>
        </div>
      </header>

      <p className="text-xs text-dim leading-relaxed">
        No line passes through every point exactly. The least-squares line{" "}
        <span className="text-ink font-mono">
          y = {fmt(slope, 3)} x + {fmt(intercept, 3)}
        </span>{" "}
        minimises the sum of squared vertical errors.
      </p>

      {/* Scatter + best-fit line + residuals */}
      <div className="bg-canvas border border-line rounded-lg p-2">
        <svg
          viewBox="0 0 600 420"
          className="w-full"
          role="img"
          aria-label="Least squares playground"
        >
          <AxesInline />

          {/* Best-fit line */}
          <line
            x1={0}
            y1={210 + (intercept / 6) * 200}
            x2={600}
            y2={210 - ((6 * slope + intercept) / 6) * 200}
            stroke="var(--accent)"
            strokeWidth={2.5}
          />

          {/* Residual segments (vertical lines from each point to the fit line) */}
          {points.map((p, i) => {
            const predicted = slope * p.x + intercept;
            return (
              <line
                key={`r-${i}`}
                x1={300 + (p.x / 6) * 280}
                y1={210 - (p.y / 6) * 200}
                x2={300 + (p.x / 6) * 280}
                y2={210 - (predicted / 6) * 200}
                stroke="var(--faint)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Data points (draggable) */}
          {points.map((p, i) => (
            <DraggableDot
              key={`pt-${i}`}
              cx={300 + (p.x / 6) * 280}
              cy={210 - (p.y / 6) * 200}
              r={6}
              color={i === points.length - 1 && outlierMode ? "var(--warn)" : "var(--vector)"}
              onDrag={(dx, dy) => {
                setPoints((prev) => {
                  const next = [...prev];
                  const old = next[i]!;
                  next[i] = {
                    x: Math.max(-5.5, Math.min(5.5, Math.round((old.x + dx * (12 / 560)) * 10) / 10)),
                    y: Math.max(-5.5, Math.min(5.5, Math.round((old.y - dy * (12 / 420)) * 10) / 10)),
                  };
                  return next;
                });
              }}
            />
          ))}
        </svg>
      </div>

      {/* Numbers + formula */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Fit line
          </div>
          <div className="font-mono text-base text-accent">
            y = {fmt(slope, 3)} x + {fmt(intercept, 3)}
          </div>
          <div className="mt-1 text-[10px] text-dim">
            slope = m · intercept = c
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Total squared error
          </div>
          <div
            className={`font-mono text-base ${
              outlierMode ? "text-warn" : "text-accent"
            }`}
          >
            {fmt(sse, 3)}
          </div>
          <div className="mt-1 text-[10px] text-dim">
            Σ (yᵢ − (m xᵢ + c))²
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Pseudoinverse formula
          </div>
          <div className="font-mono text-xs text-ink">
            x* = (AᵀA)⁻¹ Aᵀ b
          </div>
          <div className="mt-1 text-[10px] text-dim">
            m = slope, c = intercept
          </div>
        </div>
      </div>

      {/* Residuals as bars */}
      <div className="bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Residuals — how far each point sits from the fit
        </div>
        <p className="text-[10px] text-dim mb-2 leading-relaxed">
          Each bar is one point&apos;s vertical error. Positive means the point
          is above the line, negative below. Squaring the lengths gives the
          error the line minimises.
        </p>
        <BarsGraph
          values={residuals}
          labels={points.map((p) => `p${Math.round(p.x)}`)}
          maxAbs={Math.max(...residuals.map(Math.abs), 0.5)}
          width={undefined}
          height={120}
          className="w-full"
        />
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

function DraggableDot({
  cx,
  cy,
  r,
  color,
  onDrag,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  onDrag: (dx: number, dy: number) => void;
}) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const onMove = (m: MouseEvent) => {
        onDrag(m.clientX - startX, m.clientY - startY);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onDrag],
  );

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      stroke="var(--bg)"
      strokeWidth={2}
      style={{ cursor: "grab" }}
      onMouseDown={onMouseDown}
    />
  );
}

function AxesInline() {
  // Coordinate system: worldSize = 6, so viewBox 600×420 maps ±6 in both axes.
  // x: 300 = 0, scale 600/(2*6) = 50 px per unit
  // y: 210 = 0, inverted
  const ticks = [-6, -4, -2, 0, 2, 4, 6];
  return (
    <g pointerEvents="none" aria-hidden="true">
      {/* grid */}
      {ticks.map((t) => (
        <line
          key={`gx-${t}`}
          x1={300 + (t / 6) * 300}
          y1={0}
          x2={300 + (t / 6) * 300}
          y2={420}
          stroke="var(--line)"
          strokeWidth={0.5}
          opacity={t === 0 ? 0.4 : 0.6}
        />
      ))}
      {ticks.map((t) => (
        <line
          key={`gy-${t}`}
          x1={0}
          y1={210 - (t / 6) * 210}
          x2={600}
          y2={210 - (t / 6) * 210}
          stroke="var(--line)"
          strokeWidth={0.5}
          opacity={t === 0 ? 0.4 : 0.6}
        />
      ))}
      {/* axes */}
      <line x1={0} y1={210} x2={600} y2={210} stroke="var(--faint)" strokeWidth={1} />
      <line x1={300} y1={0} x2={300} y2={420} stroke="var(--faint)" strokeWidth={1} />
      {/* labels */}
      {ticks.map((t) =>
        t === 0 ? null : (
          <text
            key={`tx-${t}`}
            x={300 + (t / 6) * 300}
            y={420 - 4}
            fontSize={9}
            fontFamily="ui-monospace, monospace"
            fill="var(--faint)"
            textAnchor="middle"
          >
            {t}
          </text>
        ),
      )}
      {ticks.map((t) =>
        t === 0 ? null : (
          <text
            key={`ty-${t}`}
            x={4}
            y={210 - (t / 6) * 210 + 3}
            fontSize={9}
            fontFamily="ui-monospace, monospace"
            fill="var(--faint)"
          >
            {t}
          </text>
        ),
      )}
      <text
        x={595}
        y={200}
        fontSize={10}
        fontFamily="ui-monospace, monospace"
        fill="var(--dim)"
        textAnchor="end"
      >
        y
      </text>
      <text
        x={310}
        y={12}
        fontSize={10}
        fontFamily="ui-monospace, monospace"
        fill="var(--dim)"
      >
        x
      </text>
    </g>
  );
}
