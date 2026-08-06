"use client";
import { useState } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { Slider } from "./Slider";
import {
  TeX,
  BasisTransform,
  MatrixHeatmap,
} from "@/components/viz/VisualPrimitives";

// Concept T1: What is a Transformation?
// "Take every point, move it somewhere. A function between spaces."

// Map function-name → 2x2 matrix A so v' = Av. This is the "linear" version of T.
const FN_TO_MATRIX: Record<string, [[number, number], [number, number]]> = {
  rotate: [[0, -1], [1, 0]],
  scale: [[1.5, 0], [0, 1.5]],
  shear: [[1, 0.5], [0, 1]],
  flip: [[-1, 0], [0, 1]],
};
const FN_TO_LABEL: Record<string, string> = {
  rotate: "rotation 90°",
  scale: "uniform scale ×1.5",
  shear: "horizontal shear (0.5)",
  flip: "horizontal flip",
};

export function TransformationPlayground() {
  const [mode, setMode] = useState<"point" | "function">("point");
  const [target, setTarget] = useState({ x: 2, y: 3 });
  const [fn, setFn] = useState("rotate");

  const M = FN_TO_MATRIX[fn] ?? FN_TO_MATRIX.rotate!;

  const gridPoints = Array.from({ length: 9 }, (_, i) => {
    const x = (i % 3 - 1) * 2;
    const y = (Math.floor(i / 3) - 1) * 2;
    let tx = x, ty = y;
    if (fn === "rotate") { tx = -y; ty = x; }
    else if (fn === "scale") { tx = x * 1.5; ty = y * 1.5; }
    else if (fn === "shear") { tx = x + y * 0.5; ty = y; }
    else if (fn === "flip") { tx = -x; ty = y; }
    return { from: { x, y }, to: { x: tx, y: ty } };
  });

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-ink">
              A transformation: every point goes somewhere
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setMode("point")}
                className={`text-xs px-2 py-1 rounded ${mode === "point" ? "bg-accent text-canvas" : "border border-line text-dim"}`}
              >
                Single point
              </button>
              <button
                onClick={() => setMode("function")}
                className={`text-xs px-2 py-1 rounded ${mode === "function" ? "bg-accent text-canvas" : "border border-line text-dim"}`}
              >
                Function on grid
              </button>
            </div>
          </div>

          <VectorCanvas
            width={520}
            height={400}
            worldSize={5}
            arrows={mode === "point" ? [
              { from: { x: 0, y: 0 }, to: { x: 1.5, y: 1 }, color: "var(--ink-faint)", label: "v", width: 2, dashed: true },
              { from: { x: 0, y: 0 }, to: target, color: "var(--accent)", label: "T(v)", width: 3 },
            ] : []}
          >
            {mode === "function" && gridPoints.map((p, i) => (
              <g key={i}>
                <line
                  x1={520 / 2 + p.from.x * (520 / 10)}
                  y1={520 / 2 - p.from.y * (520 / 10)}
                  x2={520 / 2 + p.to.x * (520 / 10)}
                  y2={520 / 2 - p.to.y * (520 / 10)}
                  stroke="var(--transform)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.5}
                />
                <circle cx={520 / 2 + p.from.x * (520 / 10)} cy={520 / 2 - p.from.y * (520 / 10)} r={2} fill="var(--ink-faint)" opacity={0.5} />
                <circle cx={520 / 2 + p.to.x * (520 / 10)} cy={520 / 2 - p.to.y * (520 / 10)} r={3} fill="var(--accent)" />
              </g>
            ))}
          </VectorCanvas>
        </div>

        {mode === "function" && (
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Basis vectors under {FN_TO_LABEL[fn]}
            </div>
            <div className="flex items-center gap-3">
              <BasisTransform matrix={M} width={360} height={280} />
              <div className="flex-1 text-xs text-dim leading-relaxed">
                <p>
                  The dashed arrows show where{" "}
                  <span className="text-[#e8864a] font-mono">î</span> and{" "}
                  <span className="text-[#6db3ff] font-mono">ĵ</span> started.
                  The solid arrows are where the matrix{" "}
                  <strong className="text-ink">sent</strong> them — that
                  defines the whole transformation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {mode === "point" ? (
          <div className="bg-card border border-line rounded-xl p-4">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Where the point lands</div>
            <Slider label="x" value={target.x} min={-4} max={4} step={0.1} onChange={(x) => setTarget({ x, y: target.y })} />
            <Slider label="y" value={target.y} min={-4} max={4} step={0.1} onChange={(y) => setTarget({ x: target.x, y })} />
            <div className="mt-3 text-xs text-dim leading-relaxed">
              You are the transformation. Drag to choose where the input point lands.
              This is a &ldquo;point&rdquo; map — not a function (yet).
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-card border border-line rounded-xl p-4">
              <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Pick a function</div>
              <div className="grid grid-cols-2 gap-1">
                {["rotate", "scale", "shear", "flip"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFn(f)}
                    className={`text-xs px-2 py-1.5 rounded ${fn === f ? "bg-accent text-canvas" : "border border-line text-dim"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-dim leading-relaxed">
                The same rule applied to every point. Notice: the grid stays a grid (rotated / scaled / sheared, but still a grid). That&apos;s what &ldquo;well-behaved&rdquo; means.
              </div>
            </div>

            <div className="bg-elev/40 border border-line rounded p-3 text-xs space-y-2">
              <div className="text-[10px] text-faint uppercase tracking-wider">
                The matrix A that does this
              </div>
              <MatrixHeatmap matrix={M} max={2} />
              <div className="text-[10px] text-dim leading-relaxed mt-2">
                <TeX math={`T(\\mathbf{v}) = A\\mathbf{v} = \\begin{pmatrix} ${M[0][0]} & ${M[0][1]} \\\\ ${M[1][0]} & ${M[1][1]} \\end{pmatrix} \\begin{pmatrix} v_1 \\\\ v_2 \\end{pmatrix}`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
