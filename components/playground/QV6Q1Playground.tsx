"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";

// Question V6-q1: "Two vectors v, w in R² are linearly independent if and
// only if not parallel."
// Story: The student drags two vectors. The parallelogram area they
// span appears. When the area is non-zero → independent. When the area
// collapses to 0 → parallel → dependent. The student sees the geometric
// reason behind "non-zero area = non-parallel = independent".

export function QV6Q1Playground() {
  const [v, setV] = useState({ x: 2, y: 1 });
  const [w, setW] = useState({ x: -1, y: 2 });

  const det = v.x * w.y - v.y * w.x;
  const parallel = Math.abs(det) < 0.1;
  const area = Math.abs(det);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the vectors — the parallelogram area IS the determinant.
      </div>
      <p className="text-[10px] text-dim mb-3">
        If two vectors span a parallelogram with area ≠ 0, they&apos;re
        linearly independent. If the area collapses to 0, they&apos;re
        parallel (one is a multiple of the other).
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={5}
          polygons={[
            {
              points: [
                { x: 0, y: 0 },
                v,
                { x: v.x + w.x, y: v.y + w.y },
                w,
              ],
              fill: parallel ? "var(--wrong)" : "var(--accent)",
              stroke: parallel ? "var(--wrong)" : "var(--accent)",
              fillOpacity: 0.15,
              strokeWidth: 1,
              strokeDasharray: parallel ? "3 3" : undefined,
            },
          ]}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: v,
              color: "var(--vector)",
              label: "v",
              width: 3,
              labelOffset: { x: 0, y: -0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: w,
              color: "var(--matrix)",
              label: "w",
              width: 3,
              labelOffset: { x: 0, y: 0.3 },
            },
          ]}
          draggablePoints={[
            { id: "v", pos: v, color: "var(--vector)", label: "v", radius: 8 },
            { id: "w", pos: w, color: "var(--matrix)", label: "w", radius: 8 },
          ]}
          onPointDrag={(id, p) => {
            if (id === "v") setV({ x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 });
            if (id === "w") setW({ x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 });
          }}
          clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
          ariaLabel="Linear independence playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div
              className="bg-card border rounded p-2"
              style={{ borderColor: "var(--vector)" }}
            >
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: "var(--vector)" }}
              >
                v
              </div>
              <div className="font-mono text-ink">
                ({v.x}, {v.y})
              </div>
            </div>
            <div
              className="bg-card border rounded p-2"
              style={{ borderColor: "var(--matrix)" }}
            >
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: "var(--matrix)" }}
              >
                w
              </div>
              <div className="font-mono text-ink">
                ({w.x}, {w.y})
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Parallelogram area = |det|</span>
              <span className="font-mono text-ink">{area.toFixed(2)}</span>
            </div>
            <div
              className="relative h-3 rounded-full bg-elev overflow-hidden"
              role="progressbar"
              aria-label="Determinant magnitude"
              aria-valuenow={Math.min(100, area * 10)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className={`absolute top-0 h-full ${
                  parallel ? "bg-warn" : "bg-accent"
                }`}
                animate={{ width: `${Math.min(100, area * 10)}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          <motion.div
            key={parallel ? "dep" : "ind"}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className={`rounded p-3 border ${
              parallel
                ? "bg-warn/10 border-warn/40"
                : "bg-correct/10 border-correct/40"
            }`}
          >
            <div
              className="text-sm font-medium"
              style={{ color: parallel ? "var(--warn)" : "var(--correct)" }}
            >
              {parallel
                ? "Dependent (parallel)"
                : "Linearly independent ✓"}
            </div>
            <div className="text-[10px] text-dim mt-1 font-mono">
              det = {det.toFixed(2)} ={" "}
              {v.x}·{w.y} − {v.y}·{w.x}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}