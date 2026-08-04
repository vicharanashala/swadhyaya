"use client";
import { useState, useMemo, useEffect } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { m2eigen, fmt } from "@/lib/math";
import { Sparkles } from "lucide-react";

// Concept E1: Eigenvectors are the special vectors that don't change direction.
// Three ways to find one:
//   1. Drag the test vector v anywhere on the canvas.
//   2. Edit v's components numerically for precision.
//   3. Snap v to the nearest eigenvector with the "snap" button.
// An "eigenvalue meter" shows how collinear v and Mv are — closer to 1 means
// closer to an eigenvector.

const PRESETS: Array<{ name: string; M: [[number, number], [number, number]] }> =
  [
    { name: "Symmetric", M: [[2, 1], [1, 2]] },
    { name: "Shear", M: [[1, 1], [0, 1]] },
    { name: "Scale", M: [[2, 0], [0, 0.5]] },
    { name: "Identity", M: [[1, 0], [0, 1]] },
    { name: "Reflection", M: [[1, 0], [0, -1]] },
    { name: "Rotation (no real eigen)", M: [[0, -1], [1, 0]] },
    { name: "Defective", M: [[1, 1], [0, 1]] },
  ];

export function EigenDiscoverPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(2);

  const M = useMemo<[[number, number], [number, number]]>(
    () => [[a, b], [c, d]],
    [a, b, c, d],
  );
  const eigen = useMemo(() => m2eigen(M), [M]);

  // The test vector v and what M maps it to.
  const [v, setV] = useState({ x: 2, y: 1 });
  const out = useMemo(
    () => ({ x: a * v.x + b * v.y, y: c * v.x + d * v.y }),
    [a, b, c, d, v],
  );

  // "Collinearity" — how parallel v and Mv are. 1.0 means collinear
  // (v is an eigenvector). 0.0 means perpendicular. -1.0 means anti-parallel.
  const vLen = Math.hypot(v.x, v.y) || 1e-9;
  const outLen = Math.hypot(out.x, out.y) || 1e-9;
  const collinearity =
    (v.x * out.x + v.y * out.y) / (vLen * outLen);
  const closeEigenvector = Math.abs(Math.abs(collinearity) - 1) < 0.05;

  // Eigenvectors scaled to a visible length (sqrt of eigenvalue magnitude).
  const ev1 = eigen
    ? {
        x: eigen.vectors[0][0] * Math.min(3, Math.abs(eigen.values[0])),
        y: eigen.vectors[0][1] * Math.min(3, Math.abs(eigen.values[0])),
      }
    : { x: 0, y: 0 };
  const ev2 = eigen
    ? {
        x: eigen.vectors[1][0] * Math.min(3, Math.abs(eigen.values[1])),
        y: eigen.vectors[1][1] * Math.min(3, Math.abs(eigen.values[1])),
      }
    : { x: 0, y: 0 };

  // Snap v to the nearest eigenvector direction.
  const snap = () => {
    if (!eigen) return;
    const candidates = [ev1, ev2].filter(
      (e) => Math.abs(e.x) + Math.abs(e.y) > 0.01,
    );
    if (!candidates.length) return;
    // Pick the eigenvector most aligned with current v.
    let best = candidates[0]!;
    let bestScore = -Infinity;
    for (const e of candidates) {
      const s = (e.x * v.x + e.y * v.y) / (Math.hypot(e.x, e.y) || 1);
      if (s > bestScore) {
        bestScore = s;
        best = e;
      }
    }
    // Preserve |v| but align direction.
    const len = Math.hypot(v.x, v.y) || 2;
    const m = Math.hypot(best.x, best.y) || 1;
    setV({ x: (best.x / m) * len, y: (best.y / m) * len });
  };

  // Animated trajectory trail: applying M repeatedly to v.
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  useEffect(() => {
    setTrail([{ x: v.x, y: v.y }]);
  }, [a, b, c, d]);
  useEffect(() => {
    setTrail([{ x: v.x, y: v.y }]);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      setTrail((prev) => {
        if (prev.length === 0) return [{ x: v.x, y: v.y }];
        const last = prev[prev.length - 1]!;
        const nx = a * last.x + b * last.y;
        const ny = c * last.x + d * last.y;
        const next = [...prev, { x: nx, y: ny }];
        if (next.length > 25) next.shift();
        return next;
      });
    }, 400);
    return () => clearInterval(id);
  }, [a, b, c, d, v.x, v.y]);

  // Eigenvalue meter position: -1 (anti-parallel) at left, 1 (parallel)
  // at right. Show the position as a small dot on a horizontal track.
  const meterPct = ((collinearity + 1) / 2) * 100;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-1">
          Drag v anywhere — find the vector that just gets stretched
        </h3>
        <p className="text-xs text-dim mb-3">
          When v is an eigenvector, Mv is collinear with v (same line, just
          longer or shorter). The collinearity meter fills as you approach
          one.
        </p>

        <div className="bg-canvas border border-line rounded p-2">
          <VectorCanvas
            width={520}
            height={520}
            worldSize={5}
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
              ...(eigen && Math.abs(eigen.vectors[0][0]) +
                Math.abs(eigen.vectors[0][1]) >
              0.01
                ? [
                    {
                      from: { x: 0, y: 0 },
                      to: ev1,
                      color: "var(--eigen)",
                      label: `λ₁=${fmt(eigen.values[0], 2)}`,
                      width: 2.5,
                      dashed: true,
                      labelOffset: { x: 0, y: -0.4 },
                    },
                    {
                      from: { x: 0, y: 0 },
                      to: { x: -ev1.x, y: -ev1.y },
                      color: "var(--eigen)",
                      width: 2,
                      dashed: true,
                    },
                    {
                      from: { x: 0, y: 0 },
                      to: ev2,
                      color: "var(--singular)",
                      label: `λ₂=${fmt(eigen.values[1], 2)}`,
                      width: 2.5,
                      dashed: true,
                      labelOffset: { x: 0, y: 0.4 },
                    },
                    {
                      from: { x: 0, y: 0 },
                      to: { x: -ev2.x, y: -ev2.y },
                      color: "var(--singular)",
                      width: 2,
                      dashed: true,
                    },
                  ]
                : []),
              {
                from: { x: 0, y: 0 },
                to: { x: v.x, y: v.y },
                color: closeEigenvector ? "var(--accent)" : "var(--ink)",
                label: closeEigenvector ? "✓ v" : "v",
                width: 3,
                labelOffset: { x: 0.3, y: 0.3 },
              },
              {
                from: { x: 0, y: 0 },
                to: { x: out.x, y: out.y },
                color: closeEigenvector ? "var(--accent)" : "var(--warn)",
                label: closeEigenvector
                  ? `≈ λ·v`
                  : "Mv",
                width: 3,
                dashed: !closeEigenvector,
                labelOffset: { x: 0.3, y: -0.3 },
              },
            ]}
            draggablePoints={[
              { id: "v", pos: v, color: "var(--ink)", label: "v", radius: 8 },
            ]}
            onPointDrag={(id, p) => {
              if (id === "v") {
                setV({
                  x: Math.round(p.x * 10) / 10,
                  y: Math.round(p.y * 10) / 10,
                });
              }
            }}
            clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
            ariaLabel="Eigenvector discovery canvas"
          >
            {trail.length > 1 && (
              <polyline
                points={trail
                  .map((p) => {
                    const pp = worldToPixel(p, 520, 5);
                    return `${pp.x},${pp.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="var(--transform)"
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={0.4}
              />
            )}
          </VectorCanvas>
        </div>

        {/* Collinearity meter */}
        <div className="mt-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Collinearity of v and Mv (|cos θ|)
          </div>
          <div
            className="relative h-3 rounded-full bg-elev overflow-hidden"
            role="progressbar"
            aria-label="Collinearity"
            aria-valuenow={Math.round(Math.abs(collinearity) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute top-0 left-1/2 h-full w-px bg-faint"
              aria-hidden="true"
            />
            <div
              className={`absolute top-0 h-full transition-all ${
                closeEigenvector ? "bg-accent" : "bg-warn"
              }`}
              style={{
                width: `${Math.abs(collinearity) * 50}%`,
                left: collinearity >= 0 ? "50%" : `${50 - Math.abs(collinearity) * 50}%`,
              }}
            />
          </div>
          <div className="mt-1 text-xs font-mono text-ink">
            cos θ = {fmt(collinearity, 3)}
            {closeEigenvector && (
              <span className="text-accent ml-2">— eigenvector!</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Matrix A
          </div>
          <Slider label="a" value={a} min={-2} max={2} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-2} max={2} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-2} max={2} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-2} max={2} step={0.1} onChange={setD} />
        </div>

        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-faint uppercase tracking-wider">
              Test vector v
            </div>
            <button
              onClick={snap}
              disabled={!eigen}
              className="text-[10px] px-2 py-1 rounded border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Align v with the nearest eigenvector"
            >
              <Sparkles size={10} className="inline mr-1" aria-hidden="true" />
              snap to eigen
            </button>
          </div>
          <Slider label="x" value={v.x} min={-4} max={4} step={0.05} onChange={(x) => setV({ ...v, x })} />
          <Slider label="y" value={v.y} min={-4} max={4} step={0.05} onChange={(y) => setV({ ...v, y })} />
        </div>

        <div
          className={`rounded-xl p-3 text-xs leading-relaxed ${
            closeEigenvector
              ? "bg-accent/10 border border-accent/40 text-accent"
              : "bg-elev/40 border border-line text-dim"
          }`}
        >
          {closeEigenvector ? (
            <>
              <div className="font-medium flex items-center gap-1 mb-1">
                <Sparkles size={12} aria-hidden="true" /> You found an eigenvector!
              </div>
              <div>
                Mv = {fmt(out.x / (v.x || 1), 3)} · v. The vector v got
                stretched by ~{fmt(outLen / vLen, 2)}× — same direction,
                new length.
              </div>
            </>
          ) : (
            <>
              Drag v on the canvas (or use sliders). The dashed Mv arrow is
              what A does to v. When Mv lines up with v — eigenvector!
            </>
          )}
        </div>

        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            presets
          </div>
          <div className="grid grid-cols-2 gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setA(p.M[0][0]);
                  setB(p.M[0][1]);
                  setC(p.M[1][0]);
                  setD(p.M[1][1]);
                }}
                className="text-[10px] px-1.5 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink text-left"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}