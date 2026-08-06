"use client";
import { useState, useMemo } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import {
  PlaygroundExplanation,
  ExplanationSection,
  ExplanationTable,
  ExplanationRow,
  fmt,
} from "./PlaygroundExplanation";

// Concept L1: What is an Equation?
// "An equation is a question: where do the two sides agree?"
// Playground: draw y = mx + c, drag m and c, watch the line move on the plane.
// Then pick a specific x and find y on the line.

export function OneLinePlayground() {
  const [m, setM] = useState(1);
  const [c, setC] = useState(0);
  const [probeX, setProbeX] = useState(2);

  const line = useMemo(() => [
    { x: -10, y: m * -10 + c },
    { x: 10, y: m * 10 + c },
  ], [m, c]);

  const probeY = m * probeX + c;
  const W = 520;

  // Live quantities for the explanation panel.
  const yAtZero = c;
  const yAtOne = m + c;
  const xIntercept = m === 0 ? null : -c / m;
  const isHorizontal = m === 0;
  const isVertical = false; // y = mx + c is never vertical
  const slopeDesc =
    m > 0
      ? "line goes UP as x increases"
      : m < 0
        ? "line goes DOWN as x increases"
        : "horizontal line (slope = 0)";
  const dirDesc =
    m > 0
      ? "↗ rising"
      : m < 0
        ? "↘ falling"
        : "→ flat";

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-card border border-line rounded-xl p-4">
          <h3 className="text-sm font-medium text-ink mb-2">
            One equation — find the y for any x on the line
          </h3>
          <VectorCanvas
            width={W}
            height={W}
            worldSize={8}
            gridLines={[
              { from: line[0], to: line[1], color: "var(--vector)", width: 2.5 },
            ]}
          >
            {/* probe point on the line */}
            {(() => {
              const pp = worldToPixel({ x: probeX, y: probeY }, W, 8);
              const px = worldToPixel({ x: probeX, y: 0 }, W, 8);
              return (
                <g pointerEvents="none">
                  {/* dotted drop-line down to x-axis */}
                  <line
                    x1={px.x}
                    y1={px.y}
                    x2={pp.x}
                    y2={pp.y}
                    stroke="var(--accent)"
                    strokeWidth={1.5}
                    strokeDasharray="3 4"
                    opacity={0.8}
                  />
                  {/* the probe point */}
                  <circle cx={pp.x} cy={pp.y} r={5} fill="var(--accent)" />
                  {/* point label */}
                  <text
                    x={pp.x + 9}
                    y={pp.y - 9}
                    fill="var(--accent)"
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                  >
                    ({probeX.toFixed(1)}, {probeY.toFixed(1)})
                  </text>
                  {/* x tick label */}
                  <text
                    x={px.x}
                    y={px.y + 16}
                    fill="var(--accent)"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                    textAnchor="middle"
                  >
                    x = {probeX.toFixed(1)}
                  </text>
                </g>
              );
            })()}
          </VectorCanvas>
        </div>
        <div className="space-y-3">
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Equation</div>
            <div className="font-mono text-lg text-vector mb-2">y = {m.toFixed(2)}x + {c.toFixed(2)}</div>
            <Slider label="m (slope)" value={m} min={-3} max={3} step={0.05} onChange={setM} />
            <Slider label="c (intercept)" value={c} min={-5} max={5} step={0.1} onChange={setC} />
          </div>
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Probe</div>
            <Slider label="x" value={probeX} min={-5} max={5} step={0.1} onChange={setProbeX} />
            <div className="mt-3 bg-accent/10 border border-accent/30 rounded p-3">
              <div className="text-[10px] text-faint uppercase tracking-wider mb-1">Answer</div>
              <div className="font-mono text-xl text-accent">y = {probeY.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live-updating explanation panel */}
      <PlaygroundExplanation title="What's happening on this line">
        <ExplanationSection label="Equation form">
          <ExplanationTable>
            <tbody>
              <ExplanationRow label="form" value={<span className="text-vector">y = mx + c</span>} />
              <ExplanationRow label="m" value={fmt(m)} hint="slope — rise over run" />
              <ExplanationRow label="c" value={fmt(c)} hint="y-intercept — value of y when x = 0" />
              <ExplanationRow label="direction" value={<span className="text-accent">{dirDesc}</span>} hint={slopeDesc} />
            </tbody>
          </ExplanationTable>
        </ExplanationSection>

        <ExplanationSection label="Key points on the line">
          <ExplanationTable>
            <tbody>
              <ExplanationRow label="at x = 0" value={<span className="text-accent">(0, {fmt(yAtZero)})</span>} hint="where the line crosses the y-axis" />
              <ExplanationRow label="at x = 1" value={<span className="text-accent">(1, {fmt(yAtOne)})</span>} hint="one step right, m steps up" />
              <ExplanationRow label="x-intercept" value={xIntercept === null ? "—" : <span className="text-accent">({fmt(xIntercept)}, 0)</span>} hint={isHorizontal ? "no x-intercept (line never crosses y = 0)" : "where y = 0"} />
              <ExplanationRow label="y-intercept" value={<span className="text-accent">(0, {fmt(yAtZero)})</span>} hint="always exists (this is c)" />
            </tbody>
          </ExplanationTable>
        </ExplanationSection>

        <ExplanationSection label="Probe evaluation">
          <ExplanationTable>
            <tbody>
              <ExplanationRow label="x" value={<span className="text-accent">{probeX.toFixed(2)}</span>} hint="input" />
              <ExplanationRow label="formula" value={<span className="text-vector">y = {fmt(m)} · {probeX.toFixed(2)} + {fmt(c)}</span>} />
              <ExplanationRow label="y" value={<span className="text-accent">{probeY.toFixed(3)}</span>} hint="output" />
              <ExplanationRow
                label="status"
                value={
                  <span className="text-dim">
                    ({fmt(probeX)}, {fmt(probeY)}) is on the line
                  </span>
                }
              />
            </tbody>
          </ExplanationTable>
        </ExplanationSection>
      </PlaygroundExplanation>
    </div>
  );
}