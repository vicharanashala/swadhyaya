"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { matDet } from "@/lib/math";

// Concept: L1 → L2 → L3 (intersection of 2 lines, 3 lines, 2 lines + 1 different)
// "An equation is a question. A system is a conversation between equations."

interface Line {
  m: number;
  c: number;
  label: string;
  color: string;
}

export function IntersectPlayground() {
  const [m1, setM1] = useState(1);
  const [c1, setC1] = useState(0);
  const [m2, setM2] = useState(-1);
  const [c2, setC2] = useState(2);
  const [m3, setM3] = useState(0.5);
  const [c3, setC3] = useState(-1);
  const [show3, setShow3] = useState(false);

  const lines: Line[] = [
    { m: m1, c: c1, label: "L1", color: "var(--vector)" },
    { m: m2, c: c2, label: "L2", color: "var(--matrix)" },
  ];
  if (show3) lines.push({ m: m3, c: c3, label: "L3", color: "var(--transform)" });

  const intersects = useMemo(() => {
    const out: Array<{ x: number; y: number; labels: string; color: string } | null> = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const a = lines[i]!;
        const b = lines[j]!;
        const det = a.m - b.m;
        if (Math.abs(det) < 1e-6) {
          out.push(null);
          continue;
        }
        const x = (b.c - a.c) / det;
        const y = a.m * x + a.c;
        out.push({ x, y, labels: `${a.label}∩${b.label}`, color: "var(--accent)" });
      }
    }
    return out;
  }, [m1, c1, m2, c2, m3, c3, show3]);

  // Triple intersection via Cramer's rule using matDet.
  // Each line y = m*x + c becomes -m*x + y = c, i.e. row [-m, 1, c] in the
  // 2x2 system [A] [x;y] = [c1; c2; c3]. We solve with 3×3 determinant
  // trick (homogeneous-style) by padding with [x, y, -c] unknowns.
  const triple = useMemo(() => {
    if (!show3) return null;
    const det = (m1 - m2) * (m2 - m3) * (m1 - m3);
    if (Math.abs(det) < 1e-6) return null;

    // System: -m*x + y = c. Build 3×3 augmented matrix and solve via Cramer.
    const A: number[][] = [
      [-m1, 1, c1],
      [-m2, 1, c2],
      [-m3, 1, c3],
    ];
    const detA = matDet(A);
    if (Math.abs(detA) < 1e-6) return null;

    // Replace column 0 with RHS to solve for x.
    const Ax: number[][] = [
      [c1, 1, c1],
      [c2, 1, c2],
      [c3, 1, c3],
    ];
    const detAx = matDet(Ax);

    // Replace column 1 with RHS to solve for y.
    const Ay: number[][] = [
      [-m1, c1, c1],
      [-m2, c2, c2],
      [-m3, c3, c3],
    ];
    const detAy = matDet(Ay);

    return { x: detAx / detA, y: detAy / detA };
  }, [show3, m1, c1, m2, c2, m3, c3]);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Drag the line controls — where do they all meet?
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={6}
          gridLines={lines.map((l) => ({
            from: { x: -6, y: l.m * -6 + l.c },
            to: { x: 6, y: l.m * 6 + l.c },
            color: l.color,
            width: 2.5,
          }))}
          arrows={
            triple
              ? [
                  {
                    from: { x: 0, y: 0 },
                    to: triple,
                    color: "var(--accent)",
                    label: `(${triple.x.toFixed(2)}, ${triple.y.toFixed(2)})`,
                    width: 3,
                    labelOffset: { x: 0, y: -0.4 },
                  },
                ]
              : intersects
                  .filter((p): p is NonNullable<typeof p> => Boolean(p))
                  .map((p, i) => ({
                    from: { x: 0, y: 0 },
                    to: p,
                    color: p.color,
                    label: p.labels,
                    width: 2.5,
                    labelOffset: { x: 0, y: -0.3 - i * 0.3 },
                  }))
          }
        />
      </div>
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={i} className="bg-card border border-line rounded-xl p-4">
            <div
              className="text-[10px] uppercase tracking-wider mb-2"
              style={{ color: l.color }}
            >
              {l.label}: y = {l.m.toFixed(2)}x + {l.c.toFixed(2)}
            </div>
            <Slider
              label="m"
              value={l.m}
              min={-3}
              max={3}
              step={0.05}
              onChange={(v) => {
                if (i === 0) setM1(v);
                else if (i === 1) setM2(v);
                else setM3(v);
              }}
            />
            <Slider
              label="c"
              value={l.c}
              min={-4}
              max={4}
              step={0.1}
              onChange={(v) => {
                if (i === 0) setC1(v);
                else if (i === 1) setC2(v);
                else setC3(v);
              }}
            />
          </div>
        ))}
        {lines.length < 3 && (
          <button
            onClick={() => setShow3(true)}
            className="w-full text-xs text-dim hover:text-ink border border-dashed border-line rounded-xl py-2 hover:bg-elev/40 transition"
          >
            + Add a third line
          </button>
        )}

        {intersects.includes(null) && (
          <div className="bg-warn/10 border border-warn/30 rounded-xl p-3 text-xs text-warn">
            Two lines are parallel — they never meet.
          </div>
        )}
        {show3 && !triple && !intersects.includes(null) && (
          <div className="bg-warn/10 border border-warn/30 rounded-xl p-3 text-xs text-warn">
            The three lines don&apos;t all meet at one point — no triple
            intersection.
          </div>
        )}
      </div>
    </div>
  );
}