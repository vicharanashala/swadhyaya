"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { fmt, m2det } from "@/lib/math";
import { motion } from "framer-motion";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question T3-q1: "If T(i) = (2, 0) and T(j) = (0, 3), what is the matrix of T?"
// Library: framer-motion (live matrix update) + drag-on-canvas.
// The student drags two basis vectors (red and blue) to whatever
// positions they want. The columns of the matrix update live, and the
// matrix is shown symbolically. The student sees the rule: "the matrix
// is where the basis vectors land."

export function QT3Q1Playground() {
  const [iHat, setIHat] = useState({ x: 2, y: 0 });
  const [jHat, setJHat] = useState({ x: 0, y: 3 });
  const [showSteps, setShowSteps] = useState(false);

  const matrix = useMemo<[[number, number], [number, number]]>(
    () => [
      [iHat.x, jHat.x],
      [iHat.y, jHat.y],
    ],
    [iHat, jHat],
  );

  const det = m2det(matrix);
  const isSingular = Math.abs(det) < 1e-6;

  const explainerSteps = useMemo(
    () => [
      {
        title: "Find where î lands — that's column 1",
        detail:
          "î is the unit vector along x. Drag it anywhere on the " +
          "canvas. The coordinates of where it lands become column 1 " +
          "of the matrix.",
        value: `col 1 = (${fmt(iHat.x, 2)}, ${fmt(iHat.y, 2)})`,
        tone: "faint" as const,
      },
      {
        title: "Find where ĵ lands — that's column 2",
        detail:
          "ĵ is the unit vector along y. Drag it independently. Its " +
          "destination becomes column 2. Together the two columns " +
          "completely describe the linear transformation.",
        value: `col 2 = (${fmt(jHat.x, 2)}, ${fmt(jHat.y, 2)})`,
        tone: "faint" as const,
      },
      {
        title: "The matrix is the recipe",
        detail:
          "Any vector v = x·î + y·ĵ gets sent to x·(î's new home) + " +
          "y·(ĵ's new home). That recipe is the matrix — written as " +
          "the two destinations as columns.",
        value: `M = [[${fmt(matrix[0]![0], 2)}, ${fmt(matrix[0]![1], 2)}], [${fmt(matrix[1]![0], 2)}, ${fmt(matrix[1]![1], 2)}]]`,
        tone: "accent" as const,
      },
      {
        title: "Determinant — area of the parallelogram",
        detail:
          "det(M) = (col1.x)·(col2.y) − (col1.y)·(col2.x). It equals " +
          "the SIGNED area of the parallelogram î and ĵ span. Non-zero " +
          "means the transformation is invertible; zero means it " +
          "collapses a dimension.",
        value: `det = ${fmt(det, 2)}`,
        tone: isSingular ? ("warn" as const) : ("accent" as const),
      },
    ],
    [iHat, jHat, matrix, det, isSingular],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag î and ĵ — see the matrix of the transformation build itself.
      </div>
      <p className="text-[10px] text-dim mb-3">
        A linear transformation is completely determined by where it sends
        the basis vectors. The columns of its matrix are exactly those
        destinations.
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
          ariaLabel="Basis-to-matrix playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              The matrix of T
            </div>
            <div className="font-serif text-xl text-center">
              <span className="font-mono">
                [ {fmt(matrix[0][0], 2)} {fmt(matrix[0][1], 2)} ]
              </span>
              <br />
              <span className="font-mono">
                [ {fmt(matrix[1][0], 2)} {fmt(matrix[1][1], 2)} ]
              </span>
            </div>
            <div className="text-[10px] text-dim mt-2 leading-relaxed">
              column 1 = where î lands = ({fmt(iHat.x, 2)}, {fmt(iHat.y, 2)})
              <br />
              column 2 = where ĵ lands = ({fmt(jHat.x, 2)}, {fmt(jHat.y, 2)})
            </div>
          </div>

          <div className="bg-card border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              î = ({fmt(iHat.x, 2)}, {fmt(iHat.y, 2)}), ĵ = (
              {fmt(jHat.x, 2)}, {fmt(jHat.y, 2)})
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  className="text-[10px] text-faint font-mono"
                  style={{ color: "var(--vector)" }}
                >
                  î = (
                </label>
                <input
                  type="number"
                  step={0.25}
                  value={iHat.x}
                  onChange={(e) =>
                    setIHat({ ...iHat, x: parseFloat(e.target.value) || 0 })
                  }
                  className="w-14 px-1 py-0.5 mx-1 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="î x"
                />
                <input
                  type="number"
                  step={0.25}
                  value={iHat.y}
                  onChange={(e) =>
                    setIHat({ ...iHat, y: parseFloat(e.target.value) || 0 })
                  }
                  className="w-14 px-1 py-0.5 mx-1 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="î y"
                />
                <span className="text-[10px] text-faint font-mono">)</span>
              </div>
              <div>
                <label
                  className="text-[10px] text-faint font-mono"
                  style={{ color: "var(--matrix)" }}
                >
                  ĵ = (
                </label>
                <input
                  type="number"
                  step={0.25}
                  value={jHat.x}
                  onChange={(e) =>
                    setJHat({ ...jHat, x: parseFloat(e.target.value) || 0 })
                  }
                  className="w-14 px-1 py-0.5 mx-1 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="ĵ x"
                />
                <input
                  type="number"
                  step={0.25}
                  value={jHat.y}
                  onChange={(e) =>
                    setJHat({ ...jHat, y: parseFloat(e.target.value) || 0 })
                  }
                  className="w-14 px-1 py-0.5 mx-1 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label="ĵ y"
                />
                <span className="text-[10px] text-faint font-mono">)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { name: "Identity", i: { x: 1, y: 0 }, j: { x: 0, y: 1 } },
              { name: "Swap", i: { x: 0, y: 1 }, j: { x: 1, y: 0 } },
              { name: "Scale 2×", i: { x: 2, y: 0 }, j: { x: 0, y: 2 } },
              { name: "Rotate 90°", i: { x: 0, y: 1 }, j: { x: -1, y: 0 } },
              { name: "Shear", i: { x: 1, y: 0 }, j: { x: 1, y: 1 } },
              { name: "Project x", i: { x: 1, y: 0 }, j: { x: 0, y: 0 } },
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

          <motion.div
            key={`${matrix[0]![0]}-${matrix[0]![1]}-${matrix[1]![0]}-${matrix[1]![1]}`}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="bg-accent/10 border border-accent/40 rounded p-2 text-center"
          >
            <div className="text-[10px] text-accent uppercase tracking-wider mb-1">
              Det = {fmt(det, 2)}
            </div>
            <div className="text-[10px] text-dim">
              {isSingular
                ? "Singular — collapses a dimension"
                : "Invertible — full rank"}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Graphs: matrix heatmap + column magnitude bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            The matrix — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each column is where a basis vector lands. Watch the heatmap
            shift as you drag î and ĵ — the matrix IS the destination
            diagram.
          </p>
          <MatrixStripHeatmap
            matrix={[matrix[0] ? [...matrix[0]] : [], matrix[1] ? [...matrix[1]] : []]}
            highlightCols={[0, 1]}
            maxAbs={Math.max(4, Math.abs(iHat.x), Math.abs(iHat.y), Math.abs(jHat.x), Math.abs(jHat.y))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Column magnitudes — feel when columns collapse
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each column is the magnitude of where a basis vector lands.
            When both columns shrink to zero, the transformation crushes
            everything to the origin.
          </p>
          <BarsGraph
            values={[Math.hypot(iHat.x, iHat.y), Math.hypot(jHat.x, jHat.y), Math.abs(det)]}
            labels={["||î'||", "||ĵ'||", "|det|"]}
            maxAbs={Math.max(6, Math.abs(det) + 1)}
            highlights={[2]}
            width={undefined}
            height={140}
            className="w-full"
          />
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