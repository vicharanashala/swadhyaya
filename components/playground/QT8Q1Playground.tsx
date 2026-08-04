"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { fmt } from "@/lib/math";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle } from "lucide-react";

// Question T8-q1: "If A = [[1, 2], [2, 4]], what is A⁻¹?"
// Library: framer-motion (animated determinant bar) + drag-on-canvas.
// The student drags basis vectors (which IS the matrix). The determinant
// updates live. When it crosses zero, the matrix becomes singular and
// "A⁻¹ doesn't exist" appears.

export function QT8Q1Playground() {
  const [iHat, setIHat] = useState({ x: 1, y: 2 });
  const [jHat, setJHat] = useState({ x: 2, y: 4 });

  const det = useMemo(() => iHat.x * jHat.y - iHat.y * jHat.x, [iHat, jHat]);
  const isInvertible = Math.abs(det) > 1e-6;
  // Magnitude for the meter, log-scaled.
  const detMag = Math.log10(Math.max(1e-6, Math.abs(det)));
  const meterPct = Math.min(100, Math.max(0, ((detMag + 2) / 4) * 100)); // -2..+2 -> 0..100

  const isCriticalRange = Math.abs(det) < 0.5;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag the basis vectors — feel the determinant cross zero.
      </div>
      <p className="text-[10px] text-dim mb-3">
        A matrix is invertible only when its basis vectors stay independent.
        When the two arrows line up, the determinant is zero — A⁻¹
        doesn&apos;t exist.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={5}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: iHat,
              color: "var(--vector)",
              label: "î",
              width: 3,
              labelOffset: { x: 0, y: -0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: jHat,
              color: "var(--matrix)",
              label: "ĵ",
              width: 3,
              labelOffset: { x: 0, y: 0.3 },
            },
          ]}
          draggableArrows={[
            {
              id: "i",
              from: { x: 0, y: 0 },
              to: iHat,
              color: "var(--vector)",
              label: "î",
              width: 3,
              labelOffset: { x: 0, y: -0.3 },
            },
            {
              id: "j",
              from: { x: 0, y: 0 },
              to: jHat,
              color: "var(--matrix)",
              label: "ĵ",
              width: 3,
              labelOffset: { x: 0, y: 0.3 },
            },
          ]}
          onArrowDrag={(id, to) => {
            if (id === "i") setIHat({ x: Math.round(to.x * 4) / 4, y: Math.round(to.y * 4) / 4 });
            if (id === "j") setJHat({ x: Math.round(to.x * 4) / 4, y: Math.round(to.y * 4) / 4 });
          }}
          clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
          ariaLabel="Invertibility test playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              Matrix
            </div>
            <div className="font-mono text-sm text-center">
              [{fmt(iHat.x, 2)} {fmt(jHat.x, 2)}]<br />
              [{fmt(iHat.y, 2)} {fmt(jHat.y, 2)}]
            </div>
          </div>

          {/* Determinant meter */}
          <div>
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Determinant</span>
              <motion.span
                key={det.toFixed(2)}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-mono text-sm ${
                  isInvertible ? "text-accent" : "text-wrong"
                }`}
              >
                {fmt(det, 3)}
              </motion.span>
            </div>
            <div
              className="relative h-3 rounded-full bg-elev overflow-hidden"
              role="progressbar"
              aria-label="Determinant magnitude"
              aria-valuenow={Math.round(meterPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className={`absolute top-0 h-full ${
                  isCriticalRange ? "bg-wrong" : "bg-accent"
                }`}
                animate={{
                  width: `${meterPct}%`,
                  left: det >= 0 ? `${50 - meterPct / 2}%` : `${50 - meterPct / 2}%`,
                }}
                transition={{ duration: 0.18 }}
              />
              {/* Singularity line at det=0 */}
              <div
                className="absolute top-0 left-1/2 h-full w-px bg-faint"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1 text-[10px] text-dim flex items-center justify-between">
              <span>|det| = {fmt(Math.abs(det), 2)}</span>
              <span>
                {det > 0 ? "↻" : det < 0 ? "↺" : "—"}{" "}
                {isInvertible ? "preserves orientation" : "singular"}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isInvertible ? "yes" : "no"}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`rounded p-3 border ${
                isInvertible
                  ? "bg-accent/10 border-accent/40"
                  : "bg-wrong/10 border-wrong/40"
              }`}
            >
              <div
                className="text-sm font-medium flex items-center gap-1.5"
                style={{
                  color: isInvertible ? "var(--accent)" : "var(--wrong)",
                }}
              >
                {isInvertible ? (
                  <Sparkles size={12} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={12} aria-hidden="true" />
                )}
                {isInvertible ? "A⁻¹ exists" : "A⁻¹ doesn't exist"}
              </div>
              {isInvertible ? (
                <div className="text-[10px] text-dim mt-1 font-mono">
                  A⁻¹ = 1/{fmt(det, 2)} · [
                  {fmt(jHat.y, 2)}, {fmt(-jHat.x, 2)};{" "}
                  {fmt(-iHat.y, 2)}, {fmt(iHat.x, 2)}]
                </div>
              ) : (
                <div className="text-[10px] text-dim mt-1">
                  î and ĵ are collinear — A collapses a dimension.
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap gap-1">
            {[
              {
                name: "Identity",
                i: { x: 1, y: 0 },
                j: { x: 0, y: 1 },
              },
              {
                name: "Singular",
                i: { x: 1, y: 2 },
                j: { x: 2, y: 4 },
              },
              {
                name: "Project x",
                i: { x: 1, y: 0 },
                j: { x: 2, y: 0 },
              },
              {
                name: "Swap",
                i: { x: 0, y: 1 },
                j: { x: 1, y: 0 },
              },
              {
                name: "Rotate 90°",
                i: { x: 0, y: 1 },
                j: { x: -1, y: 0 },
              },
            ].map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setIHat(p.i);
                  setJHat(p.j);
                }}
                className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
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