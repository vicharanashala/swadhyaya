"use client";
import { useMemo } from "react";
import katex from "katex";
import type { KatexOptions } from "katex";
import { cn } from "@/lib/cn";

// Reusable visual primitives for the playground tab. Each component
// is live — when the parent re-renders with new props (because a
// slider moved or a vector was dragged), the visual re-renders too.

/* ───────────────────────────── KaTeX display ─────────────────────────── */

export function TeX({
  math,
  displayMode = false,
  className,
  color,
}: {
  math: string;
  displayMode?: boolean;
  className?: string;
  color?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        output: "html",
      } as KatexOptions);
    } catch {
      return math;
    }
  }, [math, displayMode]);

  return (
    <span
      className={cn("katex-inline", displayMode && "block my-2", className)}
      style={color ? { color } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─────────────────────────── Matrix heatmap ─────────────────────────── */

// Color-codes a matrix by magnitude. Negative values are cool-blue,
// positive values warm-orange, magnitude controls opacity.
// Makes it instantly clear "where the action is" in a transform.

interface MatrixHeatmapProps {
  matrix: number[][];
  max?: number; // max abs value to normalize against (defaults to computed)
  className?: string;
  showValues?: boolean;
  highlightColumn?: number; // column to emphasize (e.g. the basis-vector column)
  highlightRow?: number;
}

export function MatrixHeatmap({
  matrix,
  max,
  className,
  showValues = true,
  highlightColumn,
  highlightRow,
}: MatrixHeatmapProps) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const maxAbs = useMemo(() => {
    if (max !== undefined) return max;
    let m = 0;
    for (const row of matrix)
      for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [matrix, max]);

  const cellColor = (v: number): string => {
    const norm = Math.min(1, Math.abs(v) / maxAbs);
    if (v === 0) return "transparent";
    return v > 0
      ? `rgba(232, 134, 74, ${0.15 + norm * 0.7})` // warm orange
      : `rgba(107, 179, 255, ${0.15 + norm * 0.7})`; // cool blue
  };

  return (
    <div className={cn("inline-block", className)}>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${cols}, minmax(2.5rem, 1fr))`,
        }}
      >
        {/* Column header */}
        <div />
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={`ch-${j}`}
            className={cn(
              "text-center text-[10px] font-mono",
              highlightColumn === j ? "text-accent" : "text-faint",
            )}
          >
            {j + 1}
          </div>
        ))}
        {matrix.map((row, i) => (
          <>
            <div
              key={`rh-${i}`}
              className={cn(
                "text-right text-[10px] font-mono pr-2 self-center",
                highlightRow === i ? "text-accent" : "text-faint",
              )}
            >
              {i + 1}
            </div>
            {row.map((v, j) => (
              <div
                key={`c-${i}-${j}`}
                className={cn(
                  "relative rounded font-mono text-xs text-center px-2 py-1.5 border",
                  highlightColumn === j || highlightRow === i
                    ? "border-accent/50"
                    : "border-line",
                )}
                style={{ background: cellColor(v) }}
              >
                {showValues && (
                  <span className="text-ink relative z-10">
                    {Number.isInteger(v) ? v : v.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Basis-vector transform ───────────────────────── */

// Shows what a 2x2 matrix A does to the basis vectors î and ĵ, plus any
// other named vectors. Animates the original → transformed position with
// a ghost trail so the student sees the transformation as motion, not
// just a before/after pair.

interface BasisTransformProps {
  matrix: [[number, number], [number, number]];
  width?: number;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export function BasisTransform({
  matrix,
  width = 360,
  height = 360,
  showGrid = true,
  className,
}: BasisTransformProps) {
  const W = width;
  const H = height;
  const world = 4;
  const w2p = (x: number, y: number) => ({
    px: W / 2 + (x / world) * (W / 2),
    py: H / 2 - (y / world) * (H / 2),
  });

  const a = matrix[0]?.[0] ?? 1;
  const b = matrix[0]?.[1] ?? 0;
  const c = matrix[1]?.[0] ?? 0;
  const d = matrix[1]?.[1] ?? 1;

  // Where the basis vectors get mapped to:
  const tiHead = w2p(a, c); // A·î = (a, c)
  const tjHead = w2p(b, d); // A·ĵ = (b, d)

  // Trail samples for the animation ghost
  const trailSamples = useMemo(() => {
    const samples: { x: number; y: number; px: number; py: number }[] = [];
    const N = 8;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = t * a;
      const y = t * c;
      const { px, py } = w2p(x, y);
      samples.push({ x, y, px, py });
    }
    return samples;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, c]);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={cn("bg-canvas rounded border border-line", className)}
    >
      {/* Grid */}
      {showGrid && (
        <g opacity={0.4}>
          {[-3, -2, -1, 1, 2, 3].map((i) => {
            const v1 = w2p(i, -3);
            const v2 = w2p(i, 3);
            const h1 = w2p(-3, i);
            const h2 = w2p(3, i);
            return (
              <g key={i}>
                <line
                  x1={v1.px}
                  y1={v1.py}
                  x2={v2.px}
                  y2={v2.py}
                  stroke="#3a3530"
                  strokeWidth={1}
                />
                <line
                  x1={h1.px}
                  y1={h1.py}
                  x2={h2.px}
                  y2={h2.py}
                  stroke="#3a3530"
                  strokeWidth={1}
                />
              </g>
            );
          })}
          {/* Axes */}
          {(() => {
            const o = w2p(0, 0);
            return (
              <>
                <line
                  x1={o.px}
                  y1={H - 4}
                  x2={o.px}
                  y2={4}
                  stroke="#6b6058"
                  strokeWidth={1}
                />
                <line
                  x1={4}
                  y1={o.py}
                  x2={W - 4}
                  y2={o.py}
                  stroke="#6b6058"
                  strokeWidth={1}
                />
                {/* Numeric tick labels */}
                {[-3, -2, -1, 1, 2, 3].map((t) => {
                  const p = w2p(t, 0);
                  const py = w2p(0, t);
                  return (
                    <g key={`ax-${t}`}>
                      {/* X tick */}
                      <line
                        x1={p.px}
                        y1={o.py - 3}
                        x2={p.px}
                        y2={o.py + 3}
                        stroke="#6b6058"
                        strokeWidth={1}
                      />
                      <text
                        x={p.px}
                        y={o.py + 16}
                        fill="#a89e94"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="ui-monospace, monospace"
                      >
                        {t}
                      </text>
                      {/* Y tick */}
                      <line
                        x1={o.px - 3}
                        y1={py.py}
                        x2={o.px + 3}
                        y2={py.py}
                        stroke="#6b6058"
                        strokeWidth={1}
                      />
                      <text
                        x={o.px - 8}
                        y={py.py + 3}
                        fill="#a89e94"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="ui-monospace, monospace"
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}
                {/* Origin */}
                <text
                  x={o.px - 8}
                  y={o.py + 16}
                  fill="#a89e94"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="ui-monospace, monospace"
                >
                  0
                </text>
              </>
            );
          })()}
        </g>
      )}

      {/* Animation trail — fading dots from origin to T(î) */}
      {trailSamples.map((s, i) => (
        <circle
          key={`ti-${i}`}
          cx={s.px}
          cy={s.py}
          r={2.5}
          fill="#e8864a"
          opacity={(i / trailSamples.length) * 0.6}
        />
      ))}
      {(() => {
        const tjTrail: { px: number; py: number }[] = [];
        const N = 8;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const { px, py } = w2p(t * b, t * d);
          tjTrail.push({ px, py });
        }
        return (
          <>
            {tjTrail.map((s, i) => (
              <circle
                key={`tj-${i}`}
                cx={s.px}
                cy={s.py}
                r={2.5}
                fill="#6db3ff"
                opacity={(i / tjTrail.length) * 0.6}
              />
            ))}
          </>
        );
      })()}

      {/* Original basis (light grey) */}
      {(() => {
        const i = w2p(1, 0);
        const j = w2p(0, 1);
        const o = w2p(0, 0);
        return (
          <g opacity={0.35} strokeWidth={1.5}>
            <line
              x1={o.px}
              y1={o.py}
              x2={i.px}
              y2={i.py}
              stroke="#e8864a"
              strokeDasharray="3 3"
            />
            <line
              x1={o.px}
              y1={o.py}
              x2={j.px}
              y2={j.py}
              stroke="#6db3ff"
              strokeDasharray="3 3"
            />
            <text
              x={i.px + 6}
              y={i.py + 4}
              fill="#e8864a"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
            >
              î
            </text>
            <text
              x={j.px - 14}
              y={j.py - 6}
              fill="#6db3ff"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
            >
              ĵ
            </text>
          </g>
        );
      })()}

      {/* Transformed basis (solid) */}
      <g strokeWidth={2.5}>
        <line
          x1={W / 2}
          y1={H / 2}
          x2={tiHead.px}
          y2={tiHead.py}
          stroke="#e8864a"
        />
        <line
          x1={W / 2}
          y1={H / 2}
          x2={tjHead.px}
          y2={tjHead.py}
          stroke="#6db3ff"
        />
        {/* Arrow tips */}
        <circle cx={tiHead.px} cy={tiHead.py} r={4} fill="#e8864a" />
        <circle cx={tjHead.px} cy={tjHead.py} r={4} fill="#6db3ff" />
        <text
          x={tiHead.px + 8}
          y={tiHead.py + 4}
          fill="#e8864a"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
        >
          A·î
        </text>
        <text
          x={tjHead.px + 8}
          y={tjHead.py + 4}
          fill="#6db3ff"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
        >
          A·ĵ
        </text>
      </g>
    </svg>
  );
}

/* ─────────────────────── Parallelogram span ─────────────────────────── */

// Shows the parallelogram formed by vectors u and v as a filled region.
// Useful for span visualization (V5) — students can see the area
// as they drag u or v.

interface SpanParallelogramProps {
  u: { x: number; y: number };
  v: { x: number; y: number };
  width?: number;
  height?: number;
  world?: number;
  className?: string;
  showGrid?: boolean;
}

export function SpanParallelogram({
  u,
  v,
  width = 360,
  height = 360,
  world = 4,
  className,
  showGrid = true,
}: SpanParallelogramProps) {
  const W = width;
  const H = height;
  const w2p = (x: number, y: number) => ({
    px: W / 2 + (x / world) * (W / 2),
    py: H / 2 - (y / world) * (H / 2),
  });

  const origin = w2p(0, 0);
  const uHead = w2p(u.x, u.y);
  const vHead = w2p(v.x, v.y);
  const uvHead = w2p(u.x + v.x, u.y + v.y);

  const area = Math.abs(u.x * v.y - u.y * v.x);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={cn("bg-canvas rounded border border-line", className)}
    >
      {showGrid && (
        <g opacity={0.4}>
          {[-3, -2, -1, 1, 2, 3].map((i) => {
            const v1 = w2p(i, -3);
            const v2 = w2p(i, 3);
            const h1 = w2p(-3, i);
            const h2 = w2p(3, i);
            return (
              <g key={i}>
                <line
                  x1={v1.px}
                  y1={v1.py}
                  x2={v2.px}
                  y2={v2.py}
                  stroke="#3a3530"
                  strokeWidth={1}
                />
                <line
                  x1={h1.px}
                  y1={h1.py}
                  x2={h2.px}
                  y2={h2.py}
                  stroke="#3a3530"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Axes with numeric labels */}
      <g>
        {/* Vertical */}
        <line
          x1={W / 2}
          y1={4}
          x2={W / 2}
          y2={H - 4}
          stroke="#6b6058"
          strokeWidth={1}
        />
        {/* Horizontal */}
        <line
          x1={4}
          y1={H / 2}
          x2={W - 4}
          y2={H / 2}
          stroke="#6b6058"
          strokeWidth={1}
        />
        {/* Numeric tick labels */}
        {[-3, -2, -1, 1, 2, 3].map((t) => {
          const p = w2p(t, 0);
          const py = w2p(0, t);
          return (
            <g key={`ax-${t}`}>
              <line
                x1={p.px}
                y1={H / 2 - 3}
                x2={p.px}
                y2={H / 2 + 3}
                stroke="#6b6058"
                strokeWidth={1}
              />
              <text
                x={p.px}
                y={H / 2 + 16}
                fill="#a89e94"
                fontSize="9"
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {t}
              </text>
              <line
                x1={W / 2 - 3}
                y1={py.py}
                x2={W / 2 + 3}
                y2={py.py}
                stroke="#6b6058"
                strokeWidth={1}
              />
              <text
                x={W / 2 - 8}
                y={py.py + 3}
                fill="#a89e94"
                fontSize="9"
                textAnchor="end"
                fontFamily="ui-monospace, monospace"
              >
                {t}
              </text>
            </g>
          );
        })}
        <text
          x={W / 2 - 8}
          y={H / 2 + 16}
          fill="#a89e94"
          fontSize="9"
          textAnchor="end"
          fontFamily="ui-monospace, monospace"
        >
          0
        </text>
      </g>

      {/* Filled parallelogram */}
      <polygon
        points={`${origin.px},${origin.py} ${uHead.px},${uHead.py} ${uvHead.px},${uvHead.py} ${vHead.px},${vHead.py}`}
        fill="rgba(232, 134, 74, 0.18)"
        stroke="rgba(232, 134, 74, 0.5)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {/* Vectors */}
      <g strokeWidth={2.5}>
        <line
          x1={origin.px}
          y1={origin.py}
          x2={uHead.px}
          y2={uHead.py}
          stroke="#e8864a"
        />
        <line
          x1={origin.px}
          y1={origin.py}
          x2={vHead.px}
          y2={vHead.py}
          stroke="#6db3ff"
        />
        <line
          x1={uHead.px}
          y1={uHead.py}
          x2={uvHead.px}
          y2={uvHead.py}
          stroke="#6db3ff"
          strokeDasharray="3 3"
        />
        <line
          x1={vHead.px}
          y1={vHead.py}
          x2={uvHead.px}
          y2={uvHead.py}
          stroke="#e8864a"
          strokeDasharray="3 3"
        />
        <circle cx={uHead.px} cy={uHead.py} r={4} fill="#e8864a" />
        <circle cx={vHead.px} cy={vHead.py} r={4} fill="#6db3ff" />
        <circle cx={uvHead.px} cy={uvHead.py} r={4} fill="#ffcc66" />
      </g>

      {/* Area label */}
      <text
        x={W - 12}
        y={H - 12}
        fill="#a89e94"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
        textAnchor="end"
      >
        |u × v| = {area.toFixed(2)}
      </text>
    </svg>
  );
}

/* ─────────────────────── Value indicator ─────────────────────────── */

interface ValueBarProps {
  value: number;
  min: number;
  max: number;
  color?: string;
  label?: string;
}

export function ValueBar({
  value,
  min,
  max,
  color = "var(--accent)",
  label,
}: ValueBarProps) {
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const isNegative = value < 0;
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between text-[10px] font-mono text-faint mb-1">
          <span>{label}</span>
          <span className="text-ink">{value.toFixed(2)}</span>
        </div>
      )}
      <div className="h-1.5 bg-elev/50 rounded relative overflow-hidden">
        <div
          className="absolute top-0 h-full rounded"
          style={{
            width: `${norm * 100}%`,
            background: color,
            transition: "width 200ms ease",
          }}
        />
        {isNegative && (
          <div
            className="absolute top-0 right-0 h-full rounded"
            style={{
              width: `${Math.abs(value / min) * 50}%`,
              background: "rgba(224, 90, 74, 0.7)",
              transition: "width 200ms ease",
            }}
          />
        )}
      </div>
    </div>
  );
}