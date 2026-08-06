"use client";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

// A live, dynamic graph showing the state of a linear system. Used
// by every matrix-based playground so students can VISUALIZE what the
// numbers mean — not just stare at a table of coefficients.
//
// Two main modes:
//   "lines"  — plot lines (y = mx + c) for 2×2 systems. Each line is
//              a row of the system. Intersection = the answer.
//   "bars"   — bar chart of each coefficient / right-hand side entry.
//              Useful for 3×3+ where you can't plot all planes in 2D.
//   "rank"   — visualizes how many pivots there are as filled
//              staircase blocks. Shows rank drop instantly.
//   "plane-stripes" — 2D representation of 3 planes in 3D, where
//              each plane shows up as a tilted stripe whose angle is
//              the normal direction projected onto the x-axis.
//
// Each mode accepts plain number arrays — the component handles all
// the scaling and ticks.

const TICK_STEP = 1;
const PAD = 24;
const COLOR = {
  ink: "#e7e0d4",
  dim: "#a89e94",
  faint: "#6b6058",
  line: "#3a3530",
  accent: "#e8864a",
  warn: "#ffcc66",
  good: "#5cb87a",
  v1: "#e8864a",
  v2: "#6db3ff",
  v3: "#4dd9a8",
  b: "#c98aff",
};

function useScale(width: number, height: number, half: number) {
  const usable = Math.min(width, height) - 2 * PAD;
  const px = (x: number) => width / 2 + (x / half) * (usable / 2);
  const py = (y: number) => height / 2 - (y / half) * (usable / 2);
  return { px, py, half };
}

function AxisFrame({
  width,
  height,
  half,
  label = "",
  tickStep = TICK_STEP,
  drawX = true,
  drawY = true,
  color = COLOR.faint,
}: {
  width: number;
  height: number;
  half: number;
  label?: string;
  tickStep?: number;
  drawX?: boolean;
  drawY?: boolean;
  color?: string;
}) {
  const { px, py } = useScale(width, height, half);
  const ticks: number[] = [];
  for (let t = -half; t <= half; t += tickStep) {
    if (Math.abs(t) > 0.0001) ticks.push(t);
  }
  return (
    <g aria-hidden="true">
      {/* frame */}
      {drawX && (
        <line
          x1={PAD}
          y1={height / 2}
          x2={width - PAD}
          y2={height / 2}
          stroke={color}
          strokeWidth={1}
        />
      )}
      {drawY && (
        <line
          x1={width / 2}
          y1={PAD}
          x2={width / 2}
          y2={height - PAD}
          stroke={color}
          strokeWidth={1}
        />
      )}
      {/* ticks */}
      {ticks.map((t) => (
        <g key={t}>
          {drawX && (
            <>
              <line
                x1={px(t)}
                y1={height / 2 - 3}
                x2={px(t)}
                y2={height / 2 + 3}
                stroke={color}
                strokeWidth={0.75}
              />
              <text
                x={px(t)}
                y={height / 2 + 14}
                fill={COLOR.dim}
                fontSize="9"
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {t}
              </text>
            </>
          )}
          {drawY && (
            <>
              <line
                x1={width / 2 - 3}
                y1={py(t)}
                x2={width / 2 + 3}
                y2={py(t)}
                stroke={color}
                strokeWidth={0.75}
              />
              <text
                x={width / 2 - 6}
                y={py(t) + 3}
                fill={COLOR.dim}
                fontSize="9"
                textAnchor="end"
                fontFamily="ui-monospace, monospace"
              >
                {t}
              </text>
            </>
          )}
        </g>
      ))}
      {/* origin */}
      <circle cx={width / 2} cy={height / 2} r={2} fill={color} />
      {label && (
        <text
          x={width - PAD - 4}
          y={height / 2 - 6}
          fill={color}
          fontSize="9"
          textAnchor="end"
          fontFamily="ui-monospace, monospace"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* ──────────────────── Lines graph (2×2 systems) ──────────────────── */

// Plots up to 3 lines as y = mx + c. Each row (m, c) is one line.
// Optionally draws an "intersection point" derived from the system.
export function LinesGraph({
  rows,
  width = 360,
  height = 280,
  half = 5,
  intersection,
  className,
  legend = true,
}: {
  rows: Array<{ m: number; c: number }>;
  width?: number;
  height?: number;
  half?: number;
  intersection?: { x: number; y: number } | null;
  className?: string;
  legend?: boolean;
}) {
  const { px, py } = useScale(width, height, half);
  const colors = [COLOR.v1, COLOR.v2, COLOR.v3];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("bg-canvas border border-line rounded-lg", className)}
      role="img"
      aria-label="System of lines graph"
    >
      <AxisFrame width={width} height={height} half={half} />
      {/* lines */}
      {rows.map((row, i) => {
        const x1 = -half;
        const x2 = half;
        const y1 = row.m * x1 + row.c;
        const y2 = row.m * x2 + row.c;
        return (
          <g key={i}>
            <line
              x1={px(x1)}
              y1={py(y1)}
              x2={px(x2)}
              y2={py(y2)}
              stroke={colors[i % colors.length]}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <text
              x={px(x2) - 6}
              y={py(y2) - 6}
              fill={colors[i % colors.length]}
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              textAnchor="end"
            >
              L{i + 1}: y = {row.m.toFixed(2)}x + {row.c.toFixed(2)}
            </text>
          </g>
        );
      })}
      {/* intersection */}
      {intersection && Math.abs(intersection.x) <= half && Math.abs(intersection.y) <= half && (
        <g>
          <circle
            cx={px(intersection.x)}
            cy={py(intersection.y)}
            r={6}
            fill={COLOR.accent}
            stroke={COLOR.ink}
            strokeWidth={1.5}
          />
          <text
            x={px(intersection.x) + 10}
            y={py(intersection.y) - 8}
            fill={COLOR.accent}
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
          >
            ({intersection.x.toFixed(2)}, {intersection.y.toFixed(2)})
          </text>
        </g>
      )}
      {/* parallel indicator */}
      {intersection === null && (
        <g>
          <text
            x={width / 2}
            y={PAD + 16}
            fill={COLOR.warn}
            fontSize="11"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
          >
            parallel — no intersection
          </text>
        </g>
      )}
      {legend && (
        <g>
          {rows.map((row, i) => (
            <g key={`leg-${i}`}>
              <rect
                x={PAD}
                y={PAD + i * 14}
                width={10}
                height={10}
                fill={colors[i % colors.length]}
                rx={2}
              />
              <text
                x={PAD + 14}
                y={PAD + 9 + i * 14}
                fill={COLOR.ink}
                fontSize="9"
                fontFamily="ui-monospace, monospace"
              >
                L{i + 1}: slope {row.m.toFixed(2)}, intercept {row.c.toFixed(2)}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/* ──────────────────── Bars graph (matrix coefficients) ──────────────────── */

// Visualises a flat array of numbers as a bar chart. Color encodes
// sign (warm = positive, cool = negative), opacity encodes magnitude.
// Used for "rank staircase" — the bars naturally show which pivots
// survived elimination (the rest go to zero).
export function BarsGraph({
  values,
  labels,
  highlights = [],
  width = 360,
  height = 140,
  maxAbs,
  className,
}: {
  values: number[];
  labels?: string[];
  highlights?: number[]; // indices to emphasize (e.g. pivots)
  width?: number;
  height?: number;
  maxAbs?: number;
  className?: string;
}) {
  const computedMax = useMemo(
    () => maxAbs ?? Math.max(0.001, ...values.map((v) => Math.abs(v))),
    [maxAbs, values],
  );
  const innerH = height - 20;
  const barW = (width - 16) / Math.max(1, values.length);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("bg-canvas border border-line rounded-lg", className)}
      role="img"
      aria-label="Matrix coefficient bars"
    >
      {/* zero line */}
      <line
        x1={8}
        y1={height / 2}
        x2={width - 8}
        y2={height / 2}
        stroke={COLOR.faint}
        strokeWidth={1}
      />
      {values.map((v, i) => {
        const norm = v / computedMax;
        const barH = Math.abs(norm) * (innerH / 2 - 4);
        const x = 8 + i * barW + 2;
        const w = barW - 4;
        const isHi = highlights.includes(i);
        const fill =
          v === 0
            ? "transparent"
            : v > 0
              ? `rgba(232,134,74,${0.3 + Math.min(0.6, Math.abs(norm))})`
              : `rgba(107,179,255,${0.3 + Math.min(0.6, Math.abs(norm))})`;
        return (
          <g key={i}>
            <rect
              x={x}
              y={v >= 0 ? height / 2 - barH : height / 2}
              width={w}
              height={Math.max(1, barH)}
              fill={fill}
              stroke={isHi ? COLOR.accent : "transparent"}
              strokeWidth={isHi ? 1.5 : 0}
              rx={2}
            />
            {labels?.[i] !== undefined && (
              <text
                x={x + w / 2}
                y={height - 4}
                fill={COLOR.dim}
                fontSize="8"
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {labels[i]}
              </text>
            )}
            <text
              x={x + w / 2}
              y={v >= 0 ? height / 2 - barH - 3 : height / 2 + barH + 9}
              fill={COLOR.ink}
              fontSize="9"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {Math.abs(v) < 0.005 ? "0" : v.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ──────────────────── Plane-stripes graph (3D planes in 2D) ──────────────────── */

// Renders each plane as a tilted stripe. The stripe's angle encodes
// the direction the plane faces (specifically the projection of its
// normal vector onto the x-axis). The distance from the centerline
// encodes the plane's offset.
//
// Why this matters: in 3D, three planes meet at a point only when
// their stripes here converge. We can SEE singular systems coming —
// two parallel stripes = two parallel planes = infinite or no answer.
export function PlaneStripesGraph({
  rows,
  width = 360,
  height = 280,
  solution,
  className,
}: {
  rows: [number, number, number, number][];
  width?: number;
  height?: number;
  solution?:
    | { type: "unique"; sol: number[] }
    | { type: "infinite"; rank: number }
    | { type: "none" };
  className?: string;
}) {
  const colors = [COLOR.v1, COLOR.v2, COLOR.v3];
  const labels = ["P1", "P2", "P3"];
  const centerY = height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("bg-canvas border border-line rounded-lg", className)}
      role="img"
      aria-label="Plane orientations as stripes"
    >
      {/* centerline */}
      <line
        x1={8}
        y1={centerY}
        x2={width - 8}
        y2={centerY}
        stroke={COLOR.faint}
        strokeDasharray="2 4"
        strokeWidth={1}
      />
      {rows.map((r, i) => {
        const [a, b, c, d] = r;
        const nLen = Math.hypot(a, b, c);
        const isDeg = nLen < 1e-6;
        const tilt = isDeg ? 0 : (Math.atan2(c, a) * 180) / Math.PI;
        const offset = isDeg ? 0 : (d / nLen) * 12;
        const yMid = centerY + Math.max(-60, Math.min(60, offset));
        const len = width - 60;
        return (
          <g key={i}>
            <line
              x1={30}
              y1={yMid - Math.tan((tilt * Math.PI) / 180) * (len / 2)}
              x2={30 + len}
              y2={yMid + Math.tan((tilt * Math.PI) / 180) * (len / 2)}
              stroke={colors[i]!}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={isDeg ? 0.4 : 1}
              strokeDasharray={isDeg ? "3 4" : undefined}
            />
            <text
              x={40}
              y={yMid - Math.tan((tilt * Math.PI) / 180) * (len / 2) - 6}
              fill={colors[i]!}
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {labels[i]} (tilt {(tilt % 180).toFixed(1)}°, offset{" "}
              {(isDeg ? "—" : offset.toFixed(2))})
            </text>
          </g>
        );
      })}
      {solution?.type === "unique" && (
        <g>
          <circle cx={width / 2} cy={centerY} r={6} fill={COLOR.accent} />
          <text
            x={width / 2 + 10}
            y={centerY + 4}
            fill={COLOR.accent}
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fontWeight={600}
          >
            meet at ({solution.sol.map((s) => s.toFixed(2)).join(", ")})
          </text>
        </g>
      )}
      {solution?.type === "none" && (
        <text
          x={width / 2}
          y={PAD + 12}
          fill={COLOR.warn}
          fontSize="11"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
        >
          parallel/contradicting — no common point
        </text>
      )}
      {solution?.type === "infinite" && (
        <text
          x={width / 2}
          y={PAD + 12}
          fill={COLOR.warn}
          fontSize="11"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
        >
          rank {solution.rank} — infinitely many on a line
        </text>
      )}
    </svg>
  );
}

/* ──────────────────── Heatmap strip (full matrix visualization) ──────────────────── */

// A small horizontal heatmap of a matrix. Each cell coloured by sign
// and magnitude. Includes row + column labels so the student can
// immediately see "row 3 col 2 = 0" → "that pivot disappeared".
export function MatrixStripHeatmap({
  matrix,
  highlightRows = [],
  highlightCols = [],
  maxAbs,
  width = 360,
  cellW = 36,
  cellH = 28,
  className,
}: {
  matrix: number[][];
  highlightRows?: number[];
  highlightCols?: number[];
  maxAbs?: number;
  width?: number;
  cellW?: number;
  cellH?: number;
  className?: string;
}) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const computed = useMemo(
    () => maxAbs ?? Math.max(0.001, ...matrix.flat().map((v) => Math.abs(v))),
    [maxAbs, matrix],
  );
  const totalW = cellW * cols + 24;
  const totalH = cellH * rows + 20;
  return (
    <svg
      width={width}
      height={Math.max(60, totalH + 14)}
      viewBox={`0 0 ${Math.max(width, totalW + 8)} ${totalH + 14}`}
      className={cn("bg-canvas border border-line rounded-lg", className)}
      role="img"
      aria-label="Matrix heatmap strip"
    >
      {/* col labels */}
      {Array.from({ length: cols }).map((_, j) => (
        <text
          key={`ch-${j}`}
          x={20 + j * cellW + cellW / 2}
          y={10}
          fill={highlightCols.includes(j) ? COLOR.accent : COLOR.dim}
          fontSize="9"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
        >
          c{j + 1}
        </text>
      ))}
      {matrix.map((row, i) => (
        <g key={i}>
          <text
            x={12}
            y={20 + i * cellH + cellH / 2 + 3}
            fill={highlightRows.includes(i) ? COLOR.accent : COLOR.dim}
            fontSize="9"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
          >
            r{i + 1}
          </text>
          {row.map((v, j) => {
            const norm = Math.min(1, Math.abs(v) / computed);
            const fill =
              Math.abs(v) < 1e-9
                ? "transparent"
                : v > 0
                  ? `rgba(232,134,74,${0.2 + norm * 0.7})`
                  : `rgba(107,179,255,${0.2 + norm * 0.7})`;
            const isHi =
              highlightRows.includes(i) || highlightCols.includes(j);
            return (
              <g key={`c-${i}-${j}`}>
                <rect
                  x={20 + j * cellW}
                  y={20 + i * cellH}
                  width={cellW - 2}
                  height={cellH - 2}
                  fill={fill}
                  stroke={isHi ? COLOR.accent : COLOR.line}
                  strokeWidth={isHi ? 1.5 : 0.5}
                  rx={3}
                />
                <text
                  x={20 + j * cellW + (cellW - 2) / 2}
                  y={20 + i * cellH + (cellH - 2) / 2 + 3}
                  fill={COLOR.ink}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                >
                  {Math.abs(v) < 0.005 ? "0" : v.toFixed(1)}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/* ──────────────────── Pivot staircase (rank visualisation) ──────────────────── */

// For an m×n matrix in echelon form, shows the staircase of pivots:
// row k has its pivot in column pivots[k]. Non-pivot positions in
// each row are shaded "killed". Used by the RREF / echelon / row-ops
// playgrounds to make the staircase visible at a glance.
export function PivotStaircase({
  rows,
  pivots,
  width = 360,
  cellW = 32,
  cellH = 28,
  className,
}: {
  rows: number[][];
  pivots: number[];
  width?: number;
  cellW?: number;
  cellH?: number;
  className?: string;
}) {
  const m = rows.length;
  const n = rows[0]?.length ?? 0;
  return (
    <svg
      width={width}
      height={m * cellH + 24}
      viewBox={`0 0 ${n * cellW + 20} ${m * cellH + 24}`}
      className={cn("bg-canvas border border-line rounded-lg", className)}
      role="img"
      aria-label="Pivot staircase visualisation"
    >
      {rows.map((row, i) => {
        const pivotCol = pivots[i];
        return (
          <g key={i}>
            <text
              x={10}
              y={20 + i * cellH + cellH / 2 + 3}
              fill={COLOR.dim}
              fontSize="9"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              R{i + 1}
            </text>
            {row.map((v, j) => {
              const isPivot = pivotCol === j && Math.abs(v) > 1e-6;
              const fill = isPivot
                ? COLOR.accent
                : Math.abs(v) < 1e-6
                  ? "rgba(92,184,122,0.18)"
                  : "rgba(232,134,74,0.18)";
              return (
                <g key={`s-${i}-${j}`}>
                  <rect
                    x={20 + j * cellW}
                    y={20 + i * cellH}
                    width={cellW - 2}
                    height={cellH - 2}
                    fill={fill}
                    stroke={isPivot ? COLOR.accent : COLOR.line}
                    strokeWidth={isPivot ? 1.5 : 0.5}
                    rx={3}
                  />
                  <text
                    x={20 + j * cellW + (cellW - 2) / 2}
                    y={20 + i * cellH + (cellH - 2) / 2 + 3}
                    fill={isPivot ? "#1a1614" : COLOR.ink}
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    fontWeight={isPivot ? 700 : 400}
                  >
                    {Math.abs(v) < 0.005 ? "0" : v.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      {/* staircase overlay */}
      {pivots.map((c, i) => (
        <line
          key={`st-${i}`}
          x1={20 + (c ?? 0) * cellW + (cellW - 2) / 2}
          y1={20 + i * cellH + (cellH - 2) / 2}
          x2={20 + (c ?? 0) * cellW + (cellW - 2) / 2}
          y2={20 + i * cellH + (cellH - 2) / 2}
          stroke={COLOR.accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
