"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept F2: Row Space and Column Space
// "Row space of A = column space of Aᵀ. Same dimension (the rank), different home."

export function RowColPlayground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(6);
  const [e, setE] = useState(0);
  const [f, setF] = useState(0);

  // A is 2x3
  // Col(A) ⊂ R^2: span of (a,c), (b,d), (e,f)
  // Row(A) ⊂ R^3: span of (a,b,e), (c,d,f)

  const colSpace = useMemo(() => {
    // 2D space — show the span
    const points: Array<{ x: number; y: number; a: number }> = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        points.push({
          x: i * a + j * b + (e ? i * e : 0),
          y: i * c + j * d + (f ? i * f : 0),
          a: 0.3,
        });
      }
    }
    return points;
  }, [a, b, c, d, e, f]);

  // Row space: span of (a,b,e) and (c,d,f) in 3D — but we can only show 2D
  // Project onto the plane: take first 2 components
  const rowSpace2D = useMemo(() => {
    const points: Array<{ x: number; y: number; a: number }> = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        points.push({
          x: i * a + j * c,
          y: i * b + j * d,
          a: 0.3,
        });
      }
    }
    return points;
  }, [a, b, c, d]);

  // Build the matrix A and its transpose for visualisation.
  const A2x3 = useMemo(() => [[a, b, e], [c, d, f]], [a, b, c, d, e, f]);
  const At = useMemo(() => [[a, c], [b, d], [e, f]], [a, b, c, d, e, f]);

  // Rank of A: check if the two columns are independent.
  const col1 = { x: a, y: c };
  const col2 = { x: b, y: d };
  const col3 = { x: e, y: f };
  const rank2 = useMemo(() => {
    const det12 = a * d - b * c;
    const det13 = a * f - c * e;
    const det23 = b * f - d * e;
    const nonZero = [det12, det13, det23].filter((d) => Math.abs(d) > 1e-9);
    if (nonZero.length >= 1) {
      // Check if any 2 columns are linearly independent
      return 2;
    }
    return a === 0 && b === 0 && e === 0 ? 0 : 1;
  }, [a, b, c, d, e, f]);

  const [showSteps, setShowSteps] = useState(false);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — 2×3 matrix",
        detail:
          "A has 3 columns in R² and 2 rows in R³. The column space " +
          "lives in R²; the row space lives in R³. Same dimension " +
          "(the rank) but different homes.",
        value: `A is ${A2x3.length}×${A2x3[0]?.length ?? 0}`,
        tone: "faint" as const,
      },
      {
        title: "Find C(A) — column space",
        detail:
          "C(A) is the span of A&apos;s columns. It&apos;s a subspace of " +
          "R² (the OUTPUT space of A). Rank = dimension of C(A).",
        value: `C(A) ⊂ ℝ², dim = ${rank2}`,
        tone: "accent" as const,
      },
      {
        title: "Find R(A) = C(Aᵀ) — row space",
        detail:
          "R(A) is the span of A&apos;s rows. Equivalently, R(A) = " +
          "C(Aᵀ) — the column space of A&apos;s transpose. It&apos;s a " +
          "subspace of R³ (the INPUT space of A).",
        value: `R(A) ⊂ ℝ³, dim = ${rank2}`,
        tone: "accent" as const,
      },
      {
        title: "Same rank — different spaces",
        detail:
          "C(A) and R(A) have the same dimension (= rank). But they " +
          "live in different spaces: C(A) in R^m (output), R(A) in " +
          "R^n (input). They are the SAME SHAPE in different homes.",
        value: `dim(C(A)) = dim(R(A)) = ${rank2}`,
        tone: "accent" as const,
      },
      {
        title: "Why this matters — orthogonal complements",
        detail:
          "C(A) and N(Aᵀ) (left null space) are orthogonal complements " +
          "in R^m. R(A) and N(A) are orthogonal complements in R^n. " +
          "These pairings give the four fundamental subspaces.",
        value: "four-subspaces pairing",
        tone: "faint" as const,
      },
    ],
    [A2x3, rank2],
  );

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        Row space of A = Column space of Aᵀ
      </h3>
      <p className="text-xs text-dim mb-3">
        Both have the same dimension (= rank of A). They live in different spaces,
        but they are the "same thing" under transposition.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-canvas border border-line rounded p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">C(A) ⊂ R² (column space)</div>
          <VectorCanvas
            width={320}
            height={320}
            worldSize={6}
            arrows={[
              { from: { x: 0, y: 0 }, to: { x: a, y: c }, color: "var(--matrix)", label: "col 1", width: 2.5 },
              { from: { x: 0, y: 0 }, to: { x: b, y: d }, color: "var(--matrix)", label: "col 2", width: 2.5 },
            ]}
          >
            {colSpace.map((p, i) => (
              <circle key={i} cx={320/2 + p.x * (320/12)} cy={320/2 - p.y * (320/12)} r={2} fill="var(--matrix)" opacity={p.a} />
            ))}
          </VectorCanvas>
        </div>
        <div className="bg-canvas border border-line rounded p-2">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">R(A) = C(Aᵀ) (row space, projected)</div>
          <VectorCanvas
            width={320}
            height={320}
            worldSize={6}
            arrows={[
              { from: { x: 0, y: 0 }, to: { x: a, y: b }, color: "var(--eigen)", label: "row 1", width: 2.5 },
              { from: { x: 0, y: 0 }, to: { x: c, y: d }, color: "var(--eigen)", label: "row 2", width: 2.5 },
            ]}
          >
            {rowSpace2D.map((p, i) => (
              <circle key={i} cx={320/2 + p.x * (320/12)} cy={320/2 - p.y * (320/12)} r={2} fill="var(--eigen)" opacity={p.a} />
            ))}
          </VectorCanvas>
        </div>
      </div>

      <div className="mt-3 bg-elev/40 border border-line rounded p-3 text-xs text-dim space-y-1">
        <div>Edit A:</div>
        <div className="grid grid-cols-6 gap-1 mt-1">
          <input type="number" step={0.1} value={a} onChange={(e) => setA(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={b} onChange={(e) => setB(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={c} onChange={(e) => setC(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={d} onChange={(e) => setD(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={e} onChange={(e) => setE(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
          <input type="number" step={0.1} value={f} onChange={(e) => setF(parseFloat(e.target.value) || 0)} className="bg-canvas border border-line/40 rounded px-1 py-0.5 text-xs text-ink font-mono" />
        </div>
        <div className="text-accent mt-2">
          Both spaces have rank = (visible blue/eigen area). The blue points and eigen points are
          always equal in extent — the "shape" is the same, just the home is different.
        </div>
      </div>

      {/* Graphs: A heatmap + Aᵀ heatmap + column-magnitude bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            A and Aᵀ — same rank, different homes
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Left: A (2×3) with 3 columns. Right: Aᵀ (3×2) with 3 rows. " +
            "Column space of Aᵀ equals row space of A.
          </p>
          <div className="grid grid-cols-2 gap-2 items-start">
            <div>
              <div className="text-[10px] text-faint font-mono mb-1">A</div>
              <MatrixStripHeatmap
                matrix={A2x3}
                highlightCols={[0, 1, 2]}
                maxAbs={Math.max(6, ...A2x3.flat().map((v) => Math.abs(v) || 0))}
                className="w-full"
              />
            </div>
            <div>
              <div className="text-[10px] text-faint font-mono mb-1">Aᵀ</div>
              <MatrixStripHeatmap
                matrix={At}
                highlightRows={[0, 1, 2]}
                maxAbs={Math.max(6, ...At.flat().map((v) => Math.abs(v) || 0))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Column magnitudes — rank check
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            Each column of A gets a magnitude. Two non-zero columns " +
            "of different directions ⟹ rank 2; one or fewer non-zero " +
            "directions ⟹ rank drops.
          </p>
          <BarsGraph
            values={[Math.hypot(col1.x, col1.y), Math.hypot(col2.x, col2.y), Math.hypot(col3.x, col3.y)]}
            labels={["||col 1||", "||col 2||", "||col 3||"]}
            maxAbs={Math.max(6, Math.hypot(col1.x, col1.y), Math.hypot(col2.x, col2.y), Math.hypot(col3.x, col3.y))}
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
