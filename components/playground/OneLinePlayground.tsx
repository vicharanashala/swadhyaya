"use client";
import { useState, useMemo, useCallback } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import {
  PlaygroundExplanation,
  ExplanationSection,
  ExplanationTable,
  ExplanationRow,
  fmt,
} from "./PlaygroundExplanation";
import { Lightbulb, RotateCcw, Shuffle, Target, Trophy } from "lucide-react";

// Concept L1: What is an Equation?
//
// An equation is a question: where do the two sides agree?
//
// Playground shows a line y = mx + c on the plane. The student can:
//
//   1. Drag any point on the line — the equation updates live so the
//      student sees how a single point (x, y) determines the line.
//   2. Drag two specific "anchor" points (the y-intercept and a second
//      point) — the slope triangle fills in to show m = rise / run.
//   3. Use the sliders for fine control.
//   4. Pick a preset (y = x, y = 2x + 1, etc.) to see canonical shapes.
//   5. Play "Match the equation" — a target equation is chosen at random,
//      the student drags until the line matches, and is scored on
//      proximity to the target.
//
// All five modes share the same canvas, so the mental model stays
// single-track: a line is a line, no matter how you got to it.

// Two anchor points we expose as draggable:
//   p0 — the y-intercept, fixed at x = 0 → controls c
//   p1 — a second point on the line, at x = 2 → controls m and c together
const P1_X = 2;

const PRESETS: Array<{ label: string; m: number; c: number; story: string }> = [
  { label: "y = x",      m: 1,   c: 0,  story: "the identity line — for every x, the y is the same" },
  { label: "y = 2x",     m: 2,   c: 0,  story: "every step right, two steps up — twice as steep" },
  { label: "y = x + 1",  m: 1,   c: 1,  story: "parallel to y = x but shifted up by 1" },
  { label: "y = -x",     m: -1,  c: 0,  story: "mirror image of y = x — every step right, one step DOWN" },
  { label: "y = 0",      m: 0,   c: 0,  story: "the x-axis itself — y is always 0, no matter x" },
  { label: "y = 0.5x − 2", m: 0.5, c: -2, story: "gentle rise, well below the origin" },
];

function Challenge({ m, c }: { m: number; c: number }) {
  const target = useMemo(() => ({
    m: Math.round((Math.random() * 4 - 2) * 2) / 2, // half-integers in [-2, 2]
    c: Math.round((Math.random() * 6 - 3) * 2) / 2, // half-integers in [-3, 3]
  }), []);
  // We compute score continuously — distance from target in (m, c) space.
  const dM = Math.abs(m - target.m);
  const dC = Math.abs(c - target.c);
  const dist = Math.sqrt(dM * dM + dC * dC);
  const score = Math.max(0, Math.round(100 * (1 - dist / 4)));
  const won = dist < 0.05;
  return (
    <div className="bg-card border border-line rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-faint flex items-center gap-1.5">
          <Target size={11} className="text-accent" aria-hidden="true" />
          Challenge · match this equation
        </span>
        {won && (
          <span className="text-[10px] text-correct font-medium flex items-center gap-1">
            <Trophy size={11} aria-hidden="true" /> matched!
          </span>
        )}
      </div>
      <div className="font-mono text-vector text-base">
        y = <span className="text-accent">{target.m}</span>x
        {target.c >= 0 ? " + " : " − "}
        <span className="text-accent">{Math.abs(target.c)}</span>
      </div>
      <div className="mt-2 h-1.5 bg-elev rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${won ? "bg-correct" : score > 80 ? "bg-accent" : "bg-warn"}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-mono">
        <span className="text-faint">proximity</span>
        <span className={won ? "text-correct" : score > 80 ? "text-accent" : "text-warn"}>
          {score}%
        </span>
      </div>
    </div>
  );
}

export function OneLinePlayground() {
  const [m, setM] = useState(1);
  const [c, setC] = useState(0);
  const [probeX, setProbeX] = useState(2);
  const [challengeOn, setChallengeOn] = useState(false);
  const [challengeKey, setChallengeKey] = useState(0); // bump to force Challenge remount

  // The line as a polyline — same shape VectorCanvas expects.
  const line = useMemo(() => [
    { x: -10, y: m * -10 + c },
    { x: 10, y: m * 10 + c },
  ], [m, c]);

  // Two draggable points on the line:
  //   p0 = (0, c)         — the y-intercept
  //   p1 = (P1_X, m·P1_X + c)
  const draggablePoints = useMemo(() => [
    { id: "p0", pos: { x: 0, y: c }, color: "var(--accent)", radius: 7, label: "c" },
    { id: "p1", pos: { x: P1_X, y: m * P1_X + c }, color: "var(--vector)", radius: 7, label: `(${P1_X}, ${(m * P1_X + c).toFixed(1)})` },
  ], [m, c]);

  const onPointDrag = useCallback((id: string, pos: { x: number; y: number }) => {
    if (id === "p0") {
      // Move y-intercept — sets c directly. (x stays at 0.)
      setC(pos.y);
    } else if (id === "p1") {
      // Move second point — derives m and c from the two points.
      // p1 always sits at x = P1_X in this playground, so we ignore its x and compute slope from rise/run.
      const newC = pos.y - m * pos.x;
      // Use the rise between (0, c) and (pos.x, pos.y) to recover m.
      if (Math.abs(pos.x) > 0.1) {
        const newM = (pos.y - newC) / pos.x;
        setM(newM);
        setC(newC);
      }
    }
  }, [m]);

  const probeY = m * probeX + c;
  const W = 520;

  // Live quantities for the explanation panel.
  const yAtZero = c;
  const yAtOne = m + c;
  const xIntercept = Math.abs(m) < 1e-6 ? null : -c / m;
  const slopeDesc =
    m > 0
      ? "line goes UP as x increases"
      : m < 0
        ? "line goes DOWN as x increases"
        : "horizontal line (slope = 0)";
  const dirDesc =
    m > 0 ? "↗ rising" : m < 0 ? "↘ falling" : "→ flat";

  // Rise/run triangle: a horizontal run of 1 unit, a vertical rise of m.
  // Drawn in canvas coordinates. Skip when m = 0 to avoid a degenerate triangle.
  const showTriangle = Math.abs(m) > 1e-3;
  const triangleBase = { x: 1, y: 0 }; // run of 1 along the x-axis
  const triangleTop = { x: 1, y: m }; // same x, y = m

  function applyPreset(p: { m: number; c: number }) {
    setM(p.m);
    setC(p.c);
  }

  function randomize() {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)]!;
    applyPreset(p);
  }

  function reset() {
    setM(1);
    setC(0);
    setProbeX(2);
  }

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-ink">
              One equation — find the y for any x on the line
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={randomize}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-dim hover:text-ink border border-line rounded transition"
                aria-label="Pick a random preset"
              >
                <Shuffle size={11} aria-hidden="true" />
                random
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-dim hover:text-ink border border-line rounded transition"
                aria-label="Reset to defaults"
              >
                <RotateCcw size={11} aria-hidden="true" />
                reset
              </button>
            </div>
          </div>

          <VectorCanvas
            width={W}
            height={W}
            worldSize={6}
            showAxisLabels
            gridLines={[
              { from: line[0], to: line[1], color: "var(--vector)", width: 2.5 },
            ]}
            draggablePoints={draggablePoints}
            onPointDrag={onPointDrag}
          >
            {/* Rise/run triangle (the "what is m" diagram) */}
            {showTriangle && (
              (() => {
                const a = worldToPixel({ x: 0, y: 0 }, W, 6);
                const b = worldToPixel(triangleBase, W, 6);
                const c = worldToPixel(triangleTop, W, 6);
                return (
                  <g pointerEvents="none">
                    {/* run (horizontal) */}
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                      opacity={0.6}
                    />
                    {/* rise (vertical) */}
                    <line
                      x1={b.x}
                      y1={b.y}
                      x2={c.x}
                      y2={c.y}
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                      opacity={0.6}
                    />
                    {/* dotted hypotenuse from (0,0) to triangle top */}
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={c.x}
                      y2={c.y}
                      stroke="var(--accent)"
                      strokeWidth={1}
                      strokeDasharray="2 3"
                      opacity={0.5}
                    />
                    {/* run label sits below the x-axis; if the triangle goes
                       below the axis (m < 0) put the run label ABOVE instead
                       so it doesn't collide with the rise label. */}
                    <text
                      x={(a.x + b.x) / 2}
                      y={m >= 0 ? a.y + 14 : a.y - 6}
                      textAnchor="middle"
                      fill="var(--accent)"
                      fontSize="10"
                      fontFamily="ui-monospace, monospace"
                      opacity={0.85}
                    >
                      run = 1
                    </text>
                    {/* rise label sits to the right of the vertical segment,
                       far enough out that the run label never overlaps it. */}
                    <text
                      x={b.x + 32}
                      y={(b.y + c.y) / 2}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fill="var(--accent)"
                      fontSize="10"
                      fontFamily="ui-monospace, monospace"
                      opacity={0.85}
                    >
                      rise = {m.toFixed(2)}
                    </text>
                  </g>
                );
              })()
            )}

            {/* Probe drop-line + point */}
            {(() => {
              const pp = worldToPixel({ x: probeX, y: probeY }, W, 6);
              const px = worldToPixel({ x: probeX, y: 0 }, W, 6);
              return (
                <g pointerEvents="none">
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
                  <circle cx={pp.x} cy={pp.y} r={5} fill="var(--accent)" />
                  <text
                    x={pp.x + 9}
                    y={pp.y - 9}
                    fill="var(--accent)"
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                  >
                    ({probeX.toFixed(1)}, {probeY.toFixed(1)})
                  </text>
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

          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2 py-1 text-[10px] font-mono text-dim hover:text-ink hover:bg-elev border border-line rounded transition"
                title={p.story}
              >
                {p.label}
              </button>
            ))}
          </div>
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

          <button
            type="button"
            onClick={() => {
              setChallengeOn((v) => !v);
              setChallengeKey((k) => k + 1);
            }}
            className={`w-full inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition ${
              challengeOn
                ? "bg-accent/15 border-accent/40 text-accent"
                : "bg-card border-line text-dim hover:text-ink"
            }`}
          >
            <Target size={13} aria-hidden="true" />
            {challengeOn ? "Hide challenge" : "Challenge me"}
          </button>

          {challengeOn && <Challenge key={challengeKey} m={m} c={c} />}
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
              <ExplanationRow label="x-intercept" value={xIntercept === null ? "—" : <span className="text-accent">({fmt(xIntercept)}, 0)</span>} hint={Math.abs(m) < 1e-6 ? "no x-intercept (line never crosses y = 0)" : "where y = 0"} />
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

        <div className="px-5 py-4 border-t border-line">
          <div className="flex items-start gap-2 text-[11px] text-dim leading-relaxed">
            <Lightbulb size={13} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <strong className="text-ink">Drag the orange dot</strong> (at the y-intercept)
              to change <span className="text-vector">c</span>.{" "}
              <strong className="text-ink">Drag the violet dot</strong> (at x = {P1_X})
              to change both <span className="text-vector">m</span> and{" "}
              <span className="text-vector">c</span> at once. The dotted triangle
              shows how slope = rise ÷ run.
            </span>
          </div>
        </div>
      </PlaygroundExplanation>
    </div>
  );
}
