"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import {
  PlaygroundExplanation,
  ExplanationSection,
  ExplanationTable,
  ExplanationRow,
  fmt,
} from "./PlaygroundExplanation";

// Concept L2: Two Unknowns, Two Equations
// "Two lines, meeting at a point. That point is the answer."
// Playground: draw 2 lines, drag slopes/intercepts, watch the intersection move.

export function TwoLinesPlayground() {
  const [m1, setM1] = useState(1);
  const [c1, setC1] = useState(0);
  const [m2, setM2] = useState(-1);
  const [c2, setC2] = useState(3);

  const line1 = useMemo(() => [
    { x: -10, y: m1 * -10 + c1 },
    { x: 10, y: m1 * 10 + c1 },
  ], [m1, c1]);
  const line2 = useMemo(() => [
    { x: -10, y: m2 * -10 + c2 },
    { x: 10, y: m2 * 10 + c2 },
  ], [m2, c2]);

  const intersect = useMemo(() => {
    const det = m1 - m2;
    if (Math.abs(det) < 1e-6) return null;
    const x = (c2 - c1) / det;
    const y = m1 * x + c1;
    return { x, y };
  }, [m1, c1, m2, c2]);

  // Live quantities for the explanation panel.
  const sameSlope = Math.abs(m1 - m2) < 1e-6;
  const angle1 = Math.atan(m1) * (180 / Math.PI);
  const angle2 = Math.atan(m2) * (180 / Math.PI);

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-card border border-line rounded-xl p-4">
          <h3 className="text-sm font-medium text-ink mb-2">
            Two lines — where do they meet?
          </h3>
          <VectorCanvas
            width={520}
            height={520}
            worldSize={8}
            arrows={intersect ? [{ from: { x: 0, y: 0 }, to: intersect, color: "var(--accent)", label: `(${intersect.x.toFixed(2)}, ${intersect.y.toFixed(2)})`, labelOffset: { x: 0, y: -0.5 }, width: 3 }] : []}
            gridLines={[
              { from: line1[0], to: line1[1], color: "var(--vector)", width: 2.5 },
              { from: line2[0], to: line2[1], color: "var(--matrix)", width: 2.5 },
            ]}
          />
        </div>
        <div className="space-y-3">
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--vector)" }}>Line 1</div>
            <div className="font-mono text-lg text-vector mb-2">y = {m1.toFixed(2)}x + {c1.toFixed(2)}</div>
            <Slider label="m" value={m1} min={-3} max={3} step={0.05} onChange={setM1} />
            <Slider label="c" value={c1} min={-5} max={5} step={0.1} onChange={setC1} />
          </div>
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2" style={{ color: "var(--matrix)" }}>Line 2</div>
            <div className="font-mono text-lg text-matrix mb-2">y = {m2.toFixed(2)}x + {c2.toFixed(2)}</div>
            <Slider label="m" value={m2} min={-3} max={3} step={0.05} onChange={setM2} />
            <Slider label="c" value={c2} min={-5} max={5} step={0.1} onChange={setC2} />
          </div>
          {intersect ? (
            <div className="bg-elev/40 border border-line rounded-xl p-3">
              <div className="text-xs text-accent font-medium">They meet at:</div>
              <div className="font-mono text-lg text-ink mt-1">
                ({intersect.x.toFixed(3)}, {intersect.y.toFixed(3)})
              </div>
            </div>
          ) : (
            <div className="bg-elev/40 border border-warn/40 rounded-xl p-3">
              <div className="text-xs text-warn font-medium">Parallel — no meeting</div>
              <div className="text-xs text-dim mt-1">Both lines have the same slope. The system has no solution.</div>
            </div>
          )}
        </div>
      </div>

      <PlaygroundExplanation title="What's happening at the meeting point">
        <ExplanationSection label="The two equations">
          <ExplanationTable>
            <tbody>
              <ExplanationRow
                label="Line 1"
                value={
                  <span className="text-vector">
                    y = {fmt(m1)}x + {fmt(c1)}
                  </span>
                }
                hint={`angle ${angle1.toFixed(1)}° from x-axis`}
              />
              <ExplanationRow
                label="Line 2"
                value={
                  <span className="text-matrix">
                    y = {fmt(m2)}x + {fmt(c2)}
                  </span>
                }
                hint={`angle ${angle2.toFixed(1)}° from x-axis`}
              />
              <ExplanationRow
                label="Δslope"
                value={<span className={sameSlope ? "text-warn" : "text-accent"}>{fmt(m1 - m2)}</span>}
                hint={sameSlope ? "= 0 → lines parallel" : "non-zero → unique meeting"}
              />
            </tbody>
          </ExplanationTable>
        </ExplanationSection>

        <ExplanationSection label="Solving for the intersection">
          <ExplanationTable>
            <tbody>
              <ExplanationRow
                label="set equal"
                value={
                  <span className="text-vector">
                    {fmt(m1)}x + {fmt(c1)} = {fmt(m2)}x + {fmt(c2)}
                  </span>
                }
              />
              <ExplanationRow
                label="move x terms"
                value={
                  <span className="text-matrix">
                    ({fmt(m1)} − {fmt(m2)})x = {fmt(c2)} − {fmt(c1)}
                  </span>
                }
              />
              <ExplanationRow
                label="divide"
                value={
                  <span className="text-matrix">
                    x = ({fmt(c2)} − {fmt(c1)}) / ({fmt(m1)} − {fmt(m2)})
                  </span>
                }
              />
              <ExplanationRow
                label="x ="
                value={
                  intersect ? (
                    <span className="text-accent font-bold">
                      {intersect.x.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-warn">undefined (parallel)</span>
                  )
                }
              />
              <ExplanationRow
                label="y ="
                value={
                  intersect ? (
                    <span className="text-accent font-bold">
                      {intersect.y.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-warn">—</span>
                  )
                }
                hint={
                  intersect
                    ? `plug x into Line 1: ${fmt(m1)}·${intersect.x.toFixed(2)} + ${fmt(c1)}`
                    : undefined
                }
              />
              <ExplanationRow
                label="meeting point"
                value={
                  intersect ? (
                    <span className="text-accent font-bold">
                      ({fmt(intersect.x)}, {fmt(intersect.y)})
                    </span>
                  ) : (
                    <span className="text-warn">no meeting — lines parallel</span>
                  )
                }
              />
            </tbody>
          </ExplanationTable>
        </ExplanationSection>
      </PlaygroundExplanation>
    </div>
  );
}
