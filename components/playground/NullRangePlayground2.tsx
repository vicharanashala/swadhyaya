"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";

// Concept T4: Null Space and Range Space
// "Null space = what gets squashed to zero. Range = what the transformation can produce."

export function NullRangePlayground2() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(2);
  const [testX, setTestX] = useState(3);
  const [testY, setTestY] = useState(0);

  // v_out = M @ v_in
  const A = useMemo(() => [[a, b], [c, d]], [a, b, c, d]);
  const det = a * d - b * c;
  const rank = det !== 0 ? 2 : (a !== 0 || b !== 0 || c !== 0 || d !== 0) ? 1 : 0;
  const nullity = 2 - rank;

  // Null space
  const nullVec = useMemo(() => {
    if (Math.abs(det) > 1e-9) return null;
    // null space: at least one nonzero vector
    // solve A v = 0
    if (Math.abs(a) > 1e-9) {
      // v = (-b, a)
      return { x: -b, y: a };
    }
    if (Math.abs(c) > 1e-9) {
      // v = (-d, c)
      return { x: -d, y: c };
    }
    if (Math.abs(b) > 1e-9) {
      return { x: 1, y: 0 };
    }
    if (Math.abs(d) > 1e-9) {
      return { x: 0, y: 1 };
    }
    return null;
  }, [A, det, a, b, c, d]);

  // Range — pick the columns of A as the "what's reachable" basis
  const col1 = { x: a, y: c };
  const col2 = { x: b, y: d };

  // Test vector output
  const outputX = a * testX + b * testY;
  const outputY = c * testX + d * testY;

  // Highlight if test is in null space
  const testIsNull = Math.abs(outputX) < 1e-6 && Math.abs(outputY) < 1e-6;

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          What gets squashed? What gets produced?
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={[
            // columns as the "range basis"
            { from: { x: 0, y: 0 }, to: col1, color: "var(--vector)", label: "col 1", width: 2, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: col2, color: "var(--matrix)", label: "col 2", width: 2, labelOffset: { x: 0, y: 0.3 } },
            // null space arrow
            ...(nullVec ? [
              { from: { x: 0, y: 0 }, to: { x: nullVec.x * 3, y: nullVec.y * 3 }, color: "var(--eigen)", label: "null", width: 2, dashed: true },
              { from: { x: 0, y: 0 }, to: { x: -nullVec.x * 3, y: -nullVec.y * 3 }, color: "var(--eigen)", width: 2, dashed: true },
            ] : []),
            // test vector and its image
            { from: { x: 0, y: 0 }, to: { x: testX, y: testY }, color: "var(--ink-dim)", label: "v", width: 2, dashed: true },
            { from: { x: 0, y: 0 }, to: { x: outputX, y: outputY }, color: testIsNull ? "var(--warn)" : "var(--accent)", label: testIsNull ? "→ 0 !" : "Av", width: 3 },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A = [[a, b], [c, d]]</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Test vector v</div>
          <Slider label="x" value={testX} min={-4} max={4} step={0.1} onChange={setTestX} />
          <Slider label="y" value={testY} min={-4} max={4} step={0.1} onChange={setTestY} />
        </div>
        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim space-y-1">
          <div>dim(null space) = <span className="text-eigen font-mono">{nullity}</span></div>
          <div>dim(range) = <span className="text-accent font-mono">{rank}</span></div>
          <div className="text-accent pt-1">
            {testIsNull
              ? "v is in the null space — it gets squashed to 0!"
              : `Av = (${outputX.toFixed(2)}, ${outputY.toFixed(2)}).`}
          </div>
        </div>
      </div>
    </div>
  );
}
