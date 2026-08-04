"use client";
import { useState, useMemo } from "react";
import { VectorCanvas, worldToPixel } from "@/components/viz/VectorCanvas";
import { fmt } from "@/lib/math";

// Question V5-q1: "Three vectors in R² that are not all parallel — what is
// their span?"
// Library: SVG <animate> (native animation) + animated span heatmap.
// The student:
//   * drags two basis vectors v1, v2 around
//   * drags a test point anywhere on the canvas
//   * sees the span (filled translucent region) update live
//   * a heatmap of 400 sample points tints green when in span, red when not
//   * a status pill flips between "in span" / "not in span"

const HEATMAP_RES = 24; // 24x24 grid of test points

export function QV5Q1Playground() {
  const [v1, setV1] = useState({ x: 1, y: 0 });
  const [v2, setV2] = useState({ x: 0, y: 1 });
  const [probe, setProbe] = useState({ x: 2, y: 1 });

  // Test whether probe is in span(v1, v2) — i.e. whether there exist
  // (c1, c2) such that c1·v1 + c2·v2 = probe.
  const inSpan = useMemo(() => {
    const det = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(det) < 1e-6) {
      // Span is a line (or zero). Probe is in span iff it's collinear
      // with either v1 or v2 (whichever is nonzero).
      const v1Len = Math.hypot(v1.x, v1.y);
      const v2Len = Math.hypot(v2.x, v2.y);
      if (v1Len < 1e-6 && v2Len < 1e-6) {
        return probe.x === 0 && probe.y === 0;
      }
      const ref = v1Len > v2Len ? v1 : v2;
      const cross = probe.x * ref.y - probe.y * ref.x;
      return Math.abs(cross) < 1e-3;
    }
    const c1 = (probe.x * v2.y - probe.y * v2.x) / det;
    const c2 = (v1.x * probe.y - v1.y * probe.x) / det;
    return Math.abs(c1) <= 50 && Math.abs(c2) <= 50;
  }, [v1, v2, probe]);

  // Coefficients that solve c1·v1 + c2·v2 = probe (when in span).
  const coeffs = useMemo(() => {
    const det = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(det) < 1e-6) return { c1: 0, c2: 0, ok: false };
    const c1 = (probe.x * v2.y - probe.y * v2.x) / det;
    const c2 = (v1.x * probe.y - v1.y * probe.x) / det;
    return { c1, c2, ok: true };
  }, [v1, v2, probe]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Span — drag the test point to see if it's reachable from v₁ and v₂.
      </div>
      <p className="text-[10px] text-dim mb-3">
        The filled region is the span (everything you can reach by scaling
        and adding). Green dots are in the span; red dots are not.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="relative">
          <VectorCanvas
            width={360}
            height={360}
            worldSize={5}
            draggableArrows={[
              {
                id: "v1",
                from: { x: 0, y: 0 },
                to: v1,
                color: "var(--vector)",
                label: "v₁",
                width: 2.5,
                labelOffset: { x: 0, y: -0.3 },
              },
              {
                id: "v2",
                from: { x: 0, y: 0 },
                to: v2,
                color: "var(--matrix)",
                label: "v₂",
                width: 2.5,
                labelOffset: { x: 0, y: 0.3 },
              },
            ]}
            draggablePoints={[
              {
                id: "probe",
                pos: probe,
                color: inSpan ? "var(--accent)" : "var(--wrong)",
                label: inSpan ? "in span ✓" : "not in span",
                radius: 8,
              },
            ]}
            onArrowDrag={(id, to) => {
              if (id === "v1") setV1({ x: Math.round(to.x * 2) / 2, y: Math.round(to.y * 2) / 2 });
              if (id === "v2") setV2({ x: Math.round(to.x * 2) / 2, y: Math.round(to.y * 2) / 2 });
            }}
            onPointDrag={(id, p) => {
              if (id === "probe")
                setProbe({
                  x: Math.round(p.x * 2) / 2,
                  y: Math.round(p.y * 2) / 2,
                });
            }}
            clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
            ariaLabel="Span visualization playground"
          >
            <SpanHeatmap
              size={360}
              worldSize={5}
              v1={v1}
              v2={v2}
              res={HEATMAP_RES}
            />
          </VectorCanvas>
        </div>

        <div className="flex-1 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <NumRow
              label="v₁"
              pos={v1}
              onChange={(p) => setV1(p)}
              color="var(--vector)"
            />
            <NumRow
              label="v₂"
              pos={v2}
              onChange={(p) => setV2(p)}
              color="var(--matrix)"
            />
            <NumRow
              label="test"
              pos={probe}
              onChange={(p) => setProbe(p)}
              color={inSpan ? "var(--accent)" : "var(--wrong)"}
            />
          </div>

          <div
            className={`rounded p-2 border ${
              inSpan
                ? "bg-accent/10 border-accent/40"
                : "bg-wrong/10 border-wrong/40"
            }`}
          >
            <div
              className="font-medium text-sm"
              style={{ color: inSpan ? "var(--accent)" : "var(--wrong)" }}
            >
              {inSpan ? "✓ in span(v₁, v₂)" : "✗ not in span"}
            </div>
            {inSpan && coeffs.ok && (
              <div className="text-[10px] text-dim mt-1 font-mono">
                {fmt(coeffs.c1, 2)}·v₁ + {fmt(coeffs.c2, 2)}·v₂ = probe
              </div>
            )}
            {!inSpan && (
              <div className="text-[10px] text-dim mt-1">
                No (c₁, c₂) exist with c₁·v₁ + c₂·v₂ = probe.
              </div>
            )}
          </div>

          <div className="text-[10px] text-dim leading-relaxed">
            Two non-parallel vectors in R² already cover the whole plane.
            Adding a third (in R²) doesn&apos;t extend the span.
          </div>
        </div>
      </div>
    </div>
  );
}

function NumRow({
  label,
  pos,
  onChange,
  color,
}: {
  label: string;
  pos: { x: number; y: number };
  onChange: (p: { x: number; y: number }) => void;
  color: string;
}) {
  return (
    <div className="bg-card border border-line rounded p-2">
      <div
        className="text-[10px] uppercase tracking-wider mb-1"
        style={{ color }}
      >
        {label}
      </div>
      <div className="grid grid-cols-2 gap-1">
        <input
          type="number"
          step={0.5}
          value={pos.x}
          onChange={(e) => onChange({ ...pos, x: parseFloat(e.target.value) || 0 })}
          className="px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
          aria-label={`${label} x`}
        />
        <input
          type="number"
          step={0.5}
          value={pos.y}
          onChange={(e) => onChange({ ...pos, y: parseFloat(e.target.value) || 0 })}
          className="px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
          aria-label={`${label} y`}
        />
      </div>
    </div>
  );
}

// Heatmap: a 24x24 grid of test points scattered across the canvas,
// tinted green when they lie in the span of (v1, v2) and red when they
// don't. Uses SVG <animate> on each cell for a gentle pulse when the
// span changes.
function SpanHeatmap({
  size,
  worldSize,
  v1,
  v2,
  res,
}: {
  size: number;
  worldSize: number;
  v1: { x: number; y: number };
  v2: { x: number; y: number };
  res: number;
}) {
  const det = v1.x * v2.y - v1.y * v2.x;
  const cells = [];
  const spanRadius = 6;
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const wx = -spanRadius + (i + 0.5) * (2 * spanRadius) / res;
      const wy = -spanRadius + (j + 0.5) * (2 * spanRadius) / res;
      let inSpan: boolean;
      if (Math.abs(det) < 1e-6) {
        const ref = Math.hypot(v1.x, v1.y) > Math.hypot(v2.x, v2.y) ? v1 : v2;
        const refLen = Math.hypot(ref.x, ref.y);
        if (refLen < 1e-6) {
          inSpan = wx === 0 && wy === 0;
        } else {
          const cross = wx * ref.y - wy * ref.x;
          inSpan = Math.abs(cross) < 1e-3;
        }
      } else {
        const c1 = (wx * v2.y - wy * v2.x) / det;
        const c2 = (v1.x * wy - v1.y * wx) / det;
        inSpan = Math.abs(c1) <= 12 && Math.abs(c2) <= 12;
      }
      const px = worldToPixel({ x: wx, y: wy }, size, worldSize);
      cells.push({ x: px.x, y: px.y, inSpan });
    }
  }
  return (
    <g aria-hidden="true">
      {cells.map((c, i) => (
        <rect
          key={i}
          x={c.x - 4}
          y={c.y - 4}
          width={8}
          height={8}
          fill={c.inSpan ? "var(--correct)" : "var(--wrong)"}
          opacity={c.inSpan ? 0.18 : 0.18}
          rx={1}
        />
      ))}
    </g>
  );
}