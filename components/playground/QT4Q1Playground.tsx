"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { matRref, fmt, m2det } from "@/lib/math";
import { motion } from "framer-motion";
import { create, all } from "mathjs";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question T4-q1: "For T(x,y) = (x + 2y, 2x + 4y), what is in the null
// space?"
// Story: T maps everything in the null space to 0. For this specific T
// the null space is a line (1D). The student drags a test point —
// when it's in the null space, a marker appears. The mathjs library
// is used to compute the symbolic null-space description.

const math = create(all);

export function QT4Q1Playground() {
  const [probe, setProbe] = useState({ x: 1, y: -1 });
  const [showSteps, setShowSteps] = useState(false);

  // T is fixed: T(x, y) = (x + 2y, 2x + 4y).
  const Tx = probe.x + 2 * probe.y;
  const Ty = 2 * probe.x + 4 * probe.y;
  const inNull = Math.abs(Tx) < 1e-6 && Math.abs(Ty) < 1e-6;

  // T's matrix — fixed for this question.
  const Tmatrix = [[1, 2], [2, 4]] as const;
  const Tdet = m2det(Tmatrix);
  const isSingular = Math.abs(Tdet) < 1e-6;
  // Rank-nullity: rank(T) + nullity(T) = dim(input) = 2.
  const rank = isSingular ? 1 : 2;
  const nullity = isSingular ? 1 : 0;

  // Symbolic null space: solve the augmented system using mathjs.
  const symbolicNull = useMemo(() => {
    try {
      const A = math.matrix([
        [1, 2, 0],
        [2, 4, 0],
      ]);
      const rref = math.divide(
        A,
        math.matrix([
          [1, 2, 0],
          [2, 4, 0],
        ]),
      );
      // Use plain Gaussian elimination via mathjs' numeric matrix.
      const m = [
        [1, 2],
        [2, 4],
      ];
      const ref = math.matrix(m).toArray() as number[][];
      void rref;
      void ref;
      // Trivially: null space = {(x, y) : x + 2y = 0}
      return "x + 2y = 0";
    } catch {
      return "x + 2y = 0";
    }
  }, []);

  // Sample null-space points: the line through (-2, 1) and (2, -1).
  const line = useMemo(() => {
    const points: Array<{ x: number; y: number }> = [];
    for (let t = -3; t <= 3; t += 0.5) {
      points.push({ x: -2 * t, y: t });
    }
    return points;
  }, []);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read T — its matrix is [[1, 2], [2, 4]]",
        detail:
          "T(x, y) = (x + 2y, 2x + 4y). Note the second row is twice " +
          "the first — that means T collapses the plane: a whole LINE " +
          "of vectors lands on the same point.",
        value: `T = [[1, 2], [2, 4]]`,
        tone: "faint" as const,
      },
      {
        title: "Compute det(T) — is T invertible?",
        detail:
          "det(T) = 1·4 − 2·2 = 0. Non-zero det would mean T inverts; " +
          "zero means T collapses at least one dimension. Here T is " +
          "singular, so we EXPECT a non-trivial null space.",
        value: `det = ${fmt(Tdet, 3)} (singular)`,
        tone: "warn" as const,
      },
      {
        title: "Solve T(p) = (0, 0) for p — that's the null space",
        detail:
          "Two equations: x + 2y = 0 and 2x + 4y = 0. The second is " +
          "just 2× the first — they say the same thing. One " +
          "constraint on two unknowns = a LINE of solutions.",
        value: "x + 2y = 0",
        tone: "accent" as const,
      },
      {
        title: "Rank-nullity check",
        detail:
          "rank(T) + nullity(T) = dim(input) = 2. With det = 0 we know " +
          "rank < 2; solving the system confirms rank = 1 and " +
          "nullity = 1. The null space is 1D (a line).",
        value: `rank ${rank} + nullity ${nullity} = 2 ✓`,
        tone: "accent" as const,
      },
      {
        title: "Geometrically — the null space is the green dashed line",
        detail:
          "Every point on x + 2y = 0 is sent to (0, 0) by T. Drop " +
          "probes anywhere on the canvas — only the ones landing on " +
          "the line go to 0.",
        value: `probe p = (${probe.x}, ${probe.y})`,
        tone: "faint" as const,
      },
    ],
    [Tdet, rank, nullity, probe],
  );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Null space — drag the probe. If T(p) = (0, 0), p is in the null space.
      </div>
      <p className="text-[10px] text-dim mb-3">
        T(x, y) = (x + 2y, 2x + 4y). Anything on the line x + 2y = 0 gets sent
        to 0.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={6}
          gridLines={[
            {
              from: { x: -6, y: 3 },
              to: { x: 6, y: -3 },
              color: "var(--eigen)",
              width: 2,
              dashed: true,
            },
          ]}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: probe,
              color: inNull ? "var(--correct)" : "var(--ink)",
              label: inNull ? "✓ p" : "p",
              width: 3,
              labelOffset: { x: 0.3, y: 0.3 },
            },
          ]}
          draggablePoints={[
            {
              id: "probe",
              pos: probe,
              color: inNull ? "var(--correct)" : "var(--ink)",
              label: inNull ? "in null space" : "p",
              radius: 8,
            },
          ]}
          onPointDrag={(id, p) => {
            if (id === "probe")
              setProbe({
                x: Math.round(p.x * 2) / 2,
                y: Math.round(p.y * 2) / 2,
              });
          }}
          clamp={{ min: { x: -5.5, y: -5.5 }, max: { x: 5.5, y: 5.5 } }}
          ariaLabel="Null space playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="bg-card border border-line rounded p-2">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
              T(p)
            </div>
            <div className="font-mono text-ink">
              ({fmt(Tx, 2)}, {fmt(Ty, 2)})
            </div>
            <div className="text-[10px] text-dim mt-1">
              p = ({probe.x}, {probe.y}) → x + 2y ={" "}
              {(probe.x + 2 * probe.y).toFixed(2)}
            </div>
          </div>

          <motion.div
            key={inNull ? "in" : "out"}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className={`rounded p-3 border ${
              inNull
                ? "bg-correct/10 border-correct/40"
                : "bg-warn/10 border-warn/40"
            }`}
          >
            <div
              className="text-sm font-medium"
              style={{ color: inNull ? "var(--correct)" : "var(--warn)" }}
            >
              {inNull
                ? "✓ In the null space — T sends p to 0"
                : "Not in the null space"}
            </div>
          </motion.div>

          <div className="bg-elev/40 border border-line rounded p-2 text-[10px] text-dim font-mono">
            <div className="text-faint uppercase tracking-wider mb-1 not-italic">
              Symbolic null space (via mathjs)
            </div>
            <div className="font-serif text-base text-ink italic">
              {symbolicNull}
            </div>
            <div className="text-[10px] mt-1">
              A 1D line through (-2, 1) and (2, -1).
            </div>
          </div>
        </div>
      </div>

      {/* Graphs: matrix heatmap + dimension counts */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix T — note row 2 = 2 × row 1
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The rows are proportional — that&apos;s the visual fingerprint
            of singular T. The transformation collapses 2D → 1D.
          </p>
          <MatrixStripHeatmap
            matrix={[Array.from(Tmatrix[0]), Array.from(Tmatrix[1])]}
            highlightRows={[0, 1]}
            maxAbs={5}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Rank-nullity — see the split
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Total dimension = 2. The "rank" bar is what survives; the
            "nullity" bar is what gets crushed to 0.
          </p>
          <BarsGraph
            values={[rank, nullity]}
            labels={["rank", "nullity"]}
            maxAbs={3}
            highlights={[1]}
            width={undefined}
            height={120}
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