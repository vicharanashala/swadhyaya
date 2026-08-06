"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

// Question V7-q1: "How many vectors are in a basis of R⁵?"
// Concept: a basis has exactly dim(V) vectors. In Rⁿ the magic number is n.
// Story: in R² you can pick 1 arrow (line), 2 arrows (the plane), or 3+ (one
// always redundant). The student constructs a basis by dragging vectors,
// sees live: how many are independent, how many span the whole plane.

type V = { x: number; y: number };

function det2(a: V, b: V) {
  return a.x * b.y - a.y * b.x;
}

function independentCount(vectors: V[]) {
  // Greedy: rank vectors sequentially via 2D cross product.
  let count = 0;
  let baseline: V | null = null;
  for (const v of vectors) {
    if (Math.hypot(v.x, v.y) < 1e-6) continue;
    if (baseline === null) {
      baseline = v;
      count++;
    } else if (Math.abs(det2(baseline, v)) > 0.1) {
      // Add a second independent vector
      count++;
      break;
    }
  }
  return Math.min(count, 2); // max dim in 2D is 2
}

export function QV7Q1Playground() {
  const [v1, setV1] = useState<V>({ x: 2, y: 0 });
  const [v2, setV2] = useState<V>({ x: 0, y: 2 });
  const [v3, setV3] = useState<V>({ x: 0, y: 0 }); // optional third

  const show3 = Math.hypot(v3.x, v3.y) > 0.2;
  const vectors = useMemo(() => [v1, v2, ...(show3 ? [v3] : [])], [v1, v2, v3, show3]);

  const rank = independentCount(vectors);
  const det = v1.x * v2.y - v1.y * v2.x;
  const basisOk = rank === 2 && vectors.length >= 2 && Math.abs(det) > 0.05;

  // For any picked vector t, test "is t in the span?" by trying to solve
  // t = a*v1 + b*v2.
  const spanCheck = (t: V) => {
    if (Math.abs(det) < 0.05) return { inSpan: false, coeffs: [0, 0] as [number, number] };
    const a = (t.x * v2.y - t.y * v2.x) / det;
    const b = (v1.x * t.y - v1.y * t.x) / det;
    const reconstructed = { x: a * v1.x + b * v2.x, y: a * v1.y + b * v2.y };
    const err = Math.hypot(t.x - reconstructed.x, t.y - reconstructed.y);
    return { inSpan: err < 0.01, coeffs: [a, b] as [number, number] };
  };

  const probes: { pos: V; label: string }[] = [
    { pos: { x: 1.5, y: 0.8 }, label: "p₁" },
    { pos: { x: -1.2, y: 2.1 }, label: "p₂" },
    { pos: { x: 2, y: -1 }, label: "p₃" },
  ];

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4 space-y-3">
      <div>
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          Build a basis of R² — drag the arrows
        </div>
        <p className="text-[10px] text-dim leading-relaxed">
          A basis needs two independent arrows that span the whole plane.
          If they aren&apos;t parallel and one isn&apos;t a multiple of the
          other, they form a basis.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={5}
          arrows={[
            {
              from: { x: 0, y: 0 },
              to: v1,
              color: "var(--vector)",
              label: "v₁",
              width: 2.5,
              labelOffset: { x: 0.2, y: 0.3 },
            },
            {
              from: { x: 0, y: 0 },
              to: v2,
              color: "var(--matrix)",
              label: "v₂",
              width: 2.5,
              labelOffset: { x: 0.2, y: -0.3 },
            },
            ...(show3
              ? [
                  {
                    from: { x: 0, y: 0 } as const,
                    to: v3,
                    color: "var(--eigen)",
                    label: "v₃",
                    width: 2,
                    labelOffset: { x: 0.3, y: 0.3 } as const,
                  },
                ]
              : []),
          ]}
          draggablePoints={[
            { id: "v1", pos: v1, color: "var(--vector)", label: "v₁", radius: 7 },
            { id: "v2", pos: v2, color: "var(--matrix)", label: "v₂", radius: 7 },
            ...(show3
              ? [{ id: "v3", pos: v3, color: "var(--eigen)", label: "v₃", radius: 7 }]
              : []),
          ]}
          onPointDrag={(id, p) => {
            const r = { x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 };
            if (id === "v1") setV1(r);
            if (id === "v2") setV2(r);
            if (id === "v3") setV3(r);
          }}
          clamp={{ min: { x: -4.5, y: -4.5 }, max: { x: 4.5, y: 4.5 } }}
          ariaLabel="Basis construction"
        />

        <div className="flex-1 space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-1.5">
            <motion.div
              className={`rounded p-2 border ${
                Math.hypot(v1.x, v1.y) > 0.2
                  ? "bg-card border-[var(--vector)]/50"
                  : "bg-elev/40 border-line opacity-50"
              }`}
            >
              <div
                className="text-[10px] uppercase tracking-wider font-mono"
                style={{ color: "var(--vector)" }}
              >
                v₁
              </div>
              <div className="font-mono">({v1.x}, {v1.y})</div>
            </motion.div>
            <motion.div
              className={`rounded p-2 border ${
                Math.hypot(v2.x, v2.y) > 0.2
                  ? "bg-card border-[var(--matrix)]/50"
                  : "bg-elev/40 border-line opacity-50"
              }`}
            >
              <div
                className="text-[10px] uppercase tracking-wider font-mono"
                style={{ color: "var(--matrix)" }}
              >
                v₂
              </div>
              <div className="font-mono">({v2.x}, {v2.y})</div>
            </motion.div>
            <motion.div
              className={`rounded p-2 border ${
                show3
                  ? "bg-card border-[var(--eigen)]/50"
                  : "bg-elev/40 border-line border-dashed"
              }`}
            >
              <div
                className="text-[10px] uppercase tracking-wider font-mono"
                style={{ color: show3 ? "var(--eigen)" : "var(--faint)" }}
              >
                v₃
              </div>
              <div className="font-mono">
                {show3 ? `(${v3.x}, ${v3.y})` : "— drag to add —"}
              </div>
            </motion.div>
          </div>

          <div className="space-y-1.5">
            <Stat
              ok={Math.hypot(v1.x, v1.y) > 0.2 && Math.hypot(v2.x, v2.y) > 0.2}
              label="two non-zero arrows"
            />
            <Stat ok={Math.abs(det) > 0.1} label="not parallel (det ≠ 0)" />
            <Stat ok={basisOk} label="forms a basis of R²" highlight />
          </div>

          <motion.div
            key={basisOk ? "ok" : "no"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`rounded p-3 border ${
              basisOk
                ? "bg-correct/10 border-correct/40"
                : "bg-elev/40 border-line"
            }`}
          >
            <div
              className="text-sm font-medium"
              style={{
                color: basisOk ? "var(--correct)" : "var(--dim)",
              }}
            >
              {basisOk
                ? "✓ This is a basis of R²"
                : rank === 0
                  ? "Pick at least one arrow"
                  : rank === 1
                    ? "Two arrows but they're parallel — they don't span"
                    : "Independent, but vectors don't both move at once"}
            </div>
            <div className="text-[10px] text-dim mt-1 font-mono">
              det(v₁, v₂) = {det.toFixed(2)} ·{" "}
              {basisOk ? "rank = 2 = dim(R²)" : "rank = " + rank}
            </div>
          </motion.div>

          {/* Span check */}
          <div className="border-t border-line pt-3">
            <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
              Are these probe points in the span?
            </div>
            <div className="space-y-1">
              {probes.map((p, i) => {
                const s = spanCheck(p.pos);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px] font-mono"
                  >
                    <span className="text-dim">
                      {p.label} = ({p.pos.x}, {p.pos.y})
                    </span>
                    <span
                      className="inline-flex items-center gap-1"
                      style={{
                        color: s.inSpan ? "var(--correct)" : "var(--wrong)",
                      }}
                    >
                      {s.inSpan ? (
                        <>
                          <Check size={10} /> in span
                        </>
                      ) : (
                        <>
                          <X size={10} /> outside
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  ok,
  label,
  highlight,
}: {
  ok: boolean;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-[11px] ${
        highlight ? "font-medium" : ""
      }`}
      style={{ color: ok ? "var(--correct)" : "var(--faint)" }}
    >
      {ok ? <Check size={11} /> : <X size={11} />}
      <span>{label}</span>
    </div>
  );
}
