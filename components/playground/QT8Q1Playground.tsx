"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { fmt, m2inv } from "@/lib/math";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question T8-q1: "If A = [[1, 2], [2, 4]], what is A⁻¹?"
// Library: framer-motion (animated determinant bar) + drag-on-canvas.
// The student drags basis vectors (which IS the matrix). The determinant
// updates live. When it crosses zero, the matrix becomes singular and
// "A⁻¹ doesn't exist" appears.

export function QT8Q1Playground() {
  const [iHat, setIHat] = useState({ x: 1, y: 2 });
  const [jHat, setJHat] = useState({ x: 2, y: 4 });
  const [showSteps, setShowSteps] = useState(false);

  const det = useMemo(() => iHat.x * jHat.y - iHat.y * jHat.x, [iHat, jHat]);
  const isInvertible = Math.abs(det) > 1e-6;
  // Magnitude for the meter, log-scaled.
  const detMag = Math.log10(Math.max(1e-6, Math.abs(det)));
  const meterPct = Math.min(100, Math.max(0, ((detMag + 2) / 4) * 100)); // -2..+2 -> 0..100

  const isCriticalRange = Math.abs(det) < 0.5;

  // Pre-compute the inverse matrix (when it exists).
  const Ainv = useMemo(() => {
    if (!isInvertible) return null;
    return m2inv([[iHat.x, jHat.x], [iHat.y, jHat.y]] as const);
  }, [iHat, jHat, isInvertible]);

  // A · A⁻¹ for visual sanity check that the result is identity.
  const checkProduct = useMemo(() => {
    if (!Ainv) return null;
    const a = [[iHat.x, jHat.x], [iHat.y, jHat.y]];
    return [
      [a[0]![0]! * Ainv[0]![0]! + a[0]![1]! * Ainv[1]![0]!, a[0]![0]! * Ainv[0]![1]! + a[0]![1]! * Ainv[1]![1]!],
      [a[1]![0]! * Ainv[0]![0]! + a[1]![1]! * Ainv[1]![0]!, a[1]![0]! * Ainv[0]![1]! + a[1]![1]! * Ainv[1]![1]!],
    ];
  }, [iHat, jHat, Ainv]);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — its two columns are î and ĵ destinations",
        detail:
          "Drag î and ĵ. Where they land becomes the matrix columns. " +
          "Same as T3-q1, but here the focus is on whether A⁻¹ exists.",
        value: `A = [[${fmt(iHat.x, 2)}, ${fmt(jHat.x, 2)}], [${fmt(iHat.y, 2)}, ${fmt(jHat.y, 2)}]]`,
        tone: "faint" as const,
      },
      {
        title: "Compute det(A)",
        detail:
          "det(A) = col1.x · col2.y − col1.y · col2.x. It's the SIGNED " +
          "area of the parallelogram î and ĵ span. Non-zero ⟹ " +
          "A⁻¹ exists. Zero ⟹ î and ĵ are collinear, A collapses a " +
          "dimension, and A⁻¹ doesn't exist.",
        value: `det(A) = ${fmt(det, 3)}`,
        tone: isInvertible ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Apply the inverse formula",
        detail:
          "For a 2×2 matrix [[a, b], [c, d]], A⁻¹ = 1/(ad − bc) · " +
          "[[d, −b], [−c, a]] — swap the diagonal, flip the off-diagonal " +
          "signs, and divide by det.",
        value: Ainv
          ? `A⁻¹ = (1/${fmt(det, 2)}) · [[${fmt(Ainv[0]![0], 2)}, ${fmt(Ainv[0]![1], 2)}], [${fmt(Ainv[1]![0], 2)}, ${fmt(Ainv[1]![1], 2)}]]`
          : "det = 0 — A⁻¹ doesn't exist",
        tone: Ainv ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Sanity check — A · A⁻¹ = I",
        detail:
          "Multiplying A by its inverse must give the identity. " +
          "The bars graph shows every cell of A · A⁻¹ — they should " +
          "all be 1 on the diagonal and 0 off it.",
        value: checkProduct
          ? `[[${fmt(checkProduct[0]![0], 2)}, ${fmt(checkProduct[0]![1], 2)}], [${fmt(checkProduct[1]![0], 2)}, ${fmt(checkProduct[1]![1], 2)}]]`
          : "—",
        tone: "accent" as const,
      },
    ],
    [iHat, jHat, det, Ainv, checkProduct, isInvertible],
  );

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

      {/* Graphs: A and A⁻¹ as heatmaps + A·A⁻¹ as bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            A and A⁻¹ side by side
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            {isInvertible
              ? "Notice A⁻¹ undoes A. Their columns are different — that's the whole point of the inverse."
              : "A is singular — A⁻¹ doesn't exist. The columns of A are collinear, so there's no way to undo the collapse."}
          </p>
          <div className="grid grid-cols-2 gap-2 items-start">
            <div>
              <div className="text-[10px] text-faint font-mono mb-1">A</div>
              <MatrixStripHeatmap
                matrix={[[iHat.x, jHat.x], [iHat.y, jHat.y]]}
                maxAbs={Math.max(4, Math.abs(iHat.x), Math.abs(jHat.x), Math.abs(iHat.y), Math.abs(jHat.y))}
                className="w-full"
              />
            </div>
            <div>
              <div className="text-[10px] text-faint font-mono mb-1">A⁻¹</div>
              {Ainv ? (
                <MatrixStripHeatmap
                  matrix={[Array.from(Ainv[0]!), Array.from(Ainv[1]!)]}
                  maxAbs={Math.max(4, ...Ainv.flat().map((v) => Math.abs(v)))}
                  className="w-full"
                />
              ) : (
                <div className="text-[10px] text-warn font-mono italic">
                  undefined — det = 0
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            A · A⁻¹ — sanity check
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each cell of A · A⁻¹ should be 1 on the diagonal and 0 " +
            "off-diagonal — that&apos;s the identity matrix, proof that " +
            "A⁻¹ correctly undoes A.
          </p>
          {checkProduct ? (
            <BarsGraph
              values={checkProduct.flat()}
              labels={["AA⁻¹[1,1]", "AA⁻¹[1,2]", "AA⁻¹[2,1]", "AA⁻¹[2,2]"]}
              maxAbs={1.5}
              width={undefined}
              height={120}
              className="w-full"
            />
          ) : (
            <div className="text-[10px] text-dim italic">A⁻¹ undefined</div>
          )}
        </div>
      </div>

      {/* Step-by-step explainer */}
      <div className="mt-3 bg-card border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-elev/30 transition"
          aria-expanded={showSteps}
        >
          <div className="flex items-center gap-2">
            <Info size={12} className="text-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">
              What&apos;s happening — step by step
            </span>
          </div>
          <span className="text-faint">
            {showSteps ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </span>
        </button>
        {showSteps && (
          <div className="border-t border-line p-3">
            <StepExplainer steps={explainerSteps} compact />
          </div>
        )}
      </div>
    </div>
  );
}