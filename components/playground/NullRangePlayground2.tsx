"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { BarsGraph, MatrixStripHeatmap } from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Concept T4: Null Space and Range Space
// "Null space = what gets squashed to zero. Range = what the transformation can produce."

export function NullRangePlayground2() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(2);
  const [testX, setTestX] = useState(3);
  const [testY, setTestY] = useState(0);

  // v_out = M @ v_in
  const A = useMemo(() => [[a, b], [c, d]], [a, b, c, d]);
  const det = a * d - b * c;
  const rank = det !== 0 ? 2 : (a !== 0 || b !== 0 || c !== 0 || d !== 0) ? 1 : 0;
  const nullity = 2 - rank;

  // Null space
  const nullVec = useMemo(() => {
    if (Math.abs(det) > 1e-9) return null;
    // null space: at least one nonzero vector
    // solve A v = 0
    if (Math.abs(a) > 1e-9) {
      // v = (-b, a)
      return { x: -b, y: a };
    }
    if (Math.abs(c) > 1e-9) {
      // v = (-d, c)
      return { x: -d, y: c };
    }
    if (Math.abs(b) > 1e-9) {
      return { x: 1, y: 0 };
    }
    if (Math.abs(d) > 1e-9) {
      return { x: 0, y: 1 };
    }
    return null;
  }, [A, det, a, b, c, d]);

  // Range — pick the columns of A as the "what's reachable" basis
  const col1 = { x: a, y: c };
  const col2 = { x: b, y: d };

  // Test vector output
  const outputX = a * testX + b * testY;
  const outputY = c * testX + d * testY;

  // Highlight if test is in null space
  const testIsNull = Math.abs(outputX) < 1e-6 && Math.abs(outputY) < 1e-6;

  const [showSteps, setShowSteps] = useState(false);

  const explainerSteps = useMemo(
    () => [
      {
        title: "Read A — its two columns",
        detail:
          "Column 1 = where î lands after the transformation; column " +
          "2 = where ĵ lands. Together they describe how the plane " +
          "gets reshaped.",
        value: `col 1 = (${a}, ${c}), col 2 = (${b}, ${d})`,
        tone: "faint" as const,
      },
      {
        title: "Find rank — dimension of the range",
        detail:
          "The range (column space) is the span of the two columns. " +
          "If they&apos;re independent, rank = 2 and range = the whole " +
          "plane. If they&apos;re parallel, rank = 1 and range = a line. " +
          "If both zero, rank = 0.",
        value: `rank = ${rank}`,
        tone: "accent" as const,
      },
      {
        title: "Find nullity — dimension of the kernel",
        detail:
          "The null space is everything that gets sent to 0. If det ≠ 0, " +
          "only the zero vector is in the null space (nullity = 0). " +
          "If det = 0, an entire line of vectors collapses to zero " +
          "(nullity = 1).",
        value: `nullity = ${nullity}`,
        tone: nullity === 0 ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Rank-nullity check",
        detail:
          "rank + nullity = dim(input) = 2. Always. The dimensions " +
          "of what survives plus what gets crushed equals the total " +
          "dimension of the space.",
        value: `${rank} + ${nullity} = 2 ✓`,
        tone: "accent" as const,
      },
      {
        title: "Test vector v — where does it land?",
        detail:
          "Apply A to v = (testX, testY). Result: Av = (a·testX + b·testY, " +
          "c·testX + d·testY). If both components are zero, v was in " +
          "the null space.",
        value: `Av = (${outputX.toFixed(2)}, ${outputY.toFixed(2)})`,
        tone: testIsNull ? ("warn" as const) : ("accent" as const),
      },
    ],
    [a, b, c, d, rank, nullity, testX, testY, outputX, outputY, testIsNull],
  );

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          What gets squashed? What gets produced?
        </h3>
        <VectorCanvas
          width={520}
          height={520}
          worldSize={5}
          arrows={[
            // columns as the "range basis"
            { from: { x: 0, y: 0 }, to: col1, color: "var(--vector)", label: "col 1", width: 2, labelOffset: { x: 0, y: -0.3 } },
            { from: { x: 0, y: 0 }, to: col2, color: "var(--matrix)", label: "col 2", width: 2, labelOffset: { x: 0, y: 0.3 } },
            // null space arrow
            ...(nullVec ? [
              { from: { x: 0, y: 0 }, to: { x: nullVec.x * 3, y: nullVec.y * 3 }, color: "var(--eigen)", label: "null", width: 2, dashed: true },
              { from: { x: 0, y: 0 }, to: { x: -nullVec.x * 3, y: -nullVec.y * 3 }, color: "var(--eigen)", width: 2, dashed: true },
            ] : []),
            // test vector and its image
            { from: { x: 0, y: 0 }, to: { x: testX, y: testY }, color: "var(--ink-dim)", label: "v", width: 2, dashed: true },
            { from: { x: 0, y: 0 }, to: { x: outputX, y: outputY }, color: testIsNull ? "var(--warn)" : "var(--accent)", label: testIsNull ? "→ 0 !" : "Av", width: 3 },
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A = [[a, b], [c, d]]</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Test vector v</div>
          <Slider label="x" value={testX} min={-4} max={4} step={0.1} onChange={setTestX} />
          <Slider label="y" value={testY} min={-4} max={4} step={0.1} onChange={setTestY} />
        </div>
        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim space-y-1">
          <div>dim(null space) = <span className="text-eigen font-mono">{nullity}</span></div>
          <div>dim(range) = <span className="text-accent font-mono">{rank}</span></div>
          <div className="text-accent pt-1">
            {testIsNull
              ? "v is in the null space — it gets squashed to 0!"
              : `Av = (${outputX.toFixed(2)}, ${outputY.toFixed(2)}).`}
          </div>
        </div>
      </div>

      {/* Graphs: matrix heatmap + rank/nullity bars */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Matrix A — sign and magnitude
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The columns of A span the range. When the rows become " +
            "proportional (rank-deficient), A collapses a dimension.
          </p>
          <MatrixStripHeatmap
            matrix={A}
            maxAbs={Math.max(4, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            Rank-nullity split — dim(input) = 2
          </div>
          <p className="text-[10px] text-dim mb-2 leading-relaxed">
            The rank bar (orange) is what survives; the nullity bar " +
            "(highlighted) is what gets crushed.
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
