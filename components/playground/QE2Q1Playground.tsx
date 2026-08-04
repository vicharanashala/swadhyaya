"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";

// Question E2-q1: "If Av = -2v, what is the eigenvalue?"
// Story: A negative eigenvalue flips the eigenvector. The student drags
// λ and watches the vector either stretch (λ > 1), shrink (0 < λ < 1),
// flip (λ < 0), or collapse (λ = 0).

export function QE2Q1Playground() {
  const [v, setV] = useState({ x: 1, y: 0 });
  const [lambda, setLambda] = useState(-2);

  const Av = useMemo(() => ({ x: lambda * v.x, y: lambda * v.y }), [
    lambda,
    v,
  ]);
  // For verification: Av should equal λ·v (always — it's λ times v).
  const matches = Math.abs(Av.x - lambda * v.x) < 1e-9;

  const description =
    lambda === 0
      ? "λ = 0 → vector collapses to origin"
      : lambda > 0 && lambda < 1
        ? `0 < λ < 1 → vector shrinks by ${lambda}`
        : lambda === 1
          ? "λ = 1 → vector unchanged (eigenvector of identity)"
          : lambda > 1
            ? `λ > 1 → vector stretches by ×${lambda}`
            : lambda === -1
              ? "λ = -1 → vector flips 180°"
              : `λ < 0 → vector flips and stretches by ×|${lambda}|`;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the eigenvalue — see what happens to v.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Av = λv. Negative λ flips the vector. Magnitude |λ| controls how
        far it stretches.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={6}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: v,
              color: "var(--ink)",
              label: "v",
              width: 2.5,
              labelOffset: { x: 0.3, y: 0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: Av,
              color: lambda < 0 ? "var(--warn)" : "var(--accent)",
              label: `λv = ${Av.x.toFixed(1)}, ${Av.y.toFixed(1)}`,
              width: 3,
              labelOffset: { x: 0.3, y: -0.3 },
            },
          ]}
          draggablePoints={[
            { id: "v", pos: v, color: "var(--ink)", label: "v", radius: 8 },
          ]}
          onPointDrag={(id, p) => {
            if (id === "v")
              setV({
                x: Math.round(p.x * 2) / 2,
                y: Math.round(p.y * 2) / 2,
              });
          }}
          clamp={{ min: { x: -3.5, y: -3.5 }, max: { x: 3.5, y: 3.5 } }}
          ariaLabel="Eigenvalue playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              v = ({v.x}, {v.y})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-faint font-mono">λ =</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={lambda}
                onChange={(e) => setLambda(parseFloat(e.target.value))}
                className="flex-1 accent-accent"
                aria-label="eigenvalue slider"
              />
              <span
                className="font-mono w-10 text-right"
                style={{
                  color: lambda < 0 ? "var(--warn)" : "var(--accent)",
                }}
              >
                {lambda.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-faint font-mono mt-1">
              <span>−3 (flip)</span>
              <span>0</span>
              <span>+3 (stretch)</span>
            </div>
          </div>

          <motion.div
            key={lambda.toFixed(1)}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className={`rounded p-3 border ${
              lambda < 0
                ? "bg-warn/10 border-warn/40"
                : lambda === 0
                  ? "bg-faint/10 border-faint/40"
                  : "bg-accent/10 border-accent/40"
            }`}
          >
            <div
              className="text-sm font-medium"
              style={{
                color: lambda < 0 ? "var(--warn)" : "var(--accent)",
              }}
            >
              λ = {lambda.toFixed(1)}
            </div>
            <div className="text-[10px] text-dim mt-1">{description}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}