"use client";
import { useState, useMemo } from "react";
import { VectorCanvas } from "@/components/viz/VectorCanvas";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, RotateCcw } from "lucide-react";

// Question V8-q1: "If a vector space has a basis of 4 vectors, its
// dimension is…"
// Story: Every basis of a space has the same size = the dimension. The
// student drags vectors into the plane, adds new ones, and watches the
// "rank" badge update. As soon as they drag a vector parallel to an
// existing one, it's rejected. The count of independent vectors is
// the dimension.

interface Vec {
  id: string;
  pos: { x: number; y: number };
  color: string;
}

const COLORS = [
  "var(--vector)",
  "var(--matrix)",
  "var(--transform)",
  "var(--eigen)",
  "var(--singular)",
];

export function QV8Q1Playground() {
  const [vecs, setVecs] = useState<Vec[]>([
    { id: "v1", pos: { x: 1, y: 0 }, color: COLORS[0] },
    { id: "v2", pos: { x: 0, y: 1 }, color: COLORS[1] },
  ]);

  // Compute dimension: check if each new vector is independent of the
  // span of the previous ones.
  const dimension = useMemo(() => {
    const basis: number[][] = [];
    for (const v of vecs) {
      const candidate = [v.pos.x, v.pos.y];
      if (basis.length === 0) {
        basis.push(candidate);
        continue;
      }
      const rankBefore = rank(basis);
      const rankAfter = rank([...basis, candidate]);
      if (rankAfter > rankBefore) {
        basis.push(candidate);
      }
    }
    return basis.length;
  }, [vecs]);

  const updateVec = (id: string, pos: { x: number; y: number }) =>
    setVecs((arr) => arr.map((v) => (v.id === id ? { ...v, pos } : v)));

  const addVec = () => {
    if (vecs.length >= 5) return;
    setVecs((arr) => [
      ...arr,
      {
        id: `v${arr.length + 1}`,
        pos: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
        color: COLORS[arr.length % COLORS.length] ?? "var(--ink)",
      },
    ]);
  };

  const reset = () =>
    setVecs([
      { id: "v1", pos: { x: 1, y: 0 }, color: COLORS[0] },
      { id: "v2", pos: { x: 0, y: 1 }, color: COLORS[1] },
    ]);

  // Span indicator: small badge showing dim + parallel-vec warning
  const rejectedThis = useMemo(() => {
    const lastVec = vecs[vecs.length - 1];
    if (!lastVec || vecs.length < 3) return false;
    // Check if lastVec is parallel to any prior
    for (let i = 0; i < vecs.length - 1; i++) {
      const a = vecs[i].pos;
      const b = lastVec.pos;
      const cross = a.x * b.y - a.y * b.x;
      if (Math.abs(cross) < 0.1) return true;
    }
    return false;
  }, [vecs]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Drag vectors into the plane. Count how many stay independent.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Parallel vectors are &ldquo;redundant&rdquo; — only count independent
        ones toward the dimension.
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <VectorCanvas
          width={360}
          height={360}
          worldSize={4}
          arrows={vecs.map((v) => ({
            from: { x: 0, y: 0 },
            to: v.pos,
            color: v.color,
            label: v.id,
            width: 3,
            labelOffset: { x: 0, y: -0.3 },
          }))}
          draggablePoints={vecs.map((v) => ({
            id: v.id,
            pos: v.pos,
            color: v.color,
            label: v.id,
            radius: 7,
          }))}
          onPointDrag={(id, p) =>
            updateVec(id, {
              x: Math.round(p.x * 2) / 2,
              y: Math.round(p.y * 2) / 2,
            })
          }
          clamp={{ min: { x: -3.5, y: -3.5 }, max: { x: 3.5, y: 3.5 } }}
          ariaLabel="Dimension playground"
        />

        <div className="flex-1 space-y-3 text-xs">
          <motion.div
            key={dimension}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="bg-accent/10 border border-accent/40 rounded p-3 text-center"
          >
            <div className="text-[10px] text-faint uppercase tracking-wider">
              Independent vectors (dimension)
            </div>
            <div className="text-3xl font-mono text-accent">{dimension}</div>
            <div className="text-[10px] text-dim">
              of {vecs.length} drawn
            </div>
          </motion.div>

          <AnimatePresence>
            {rejectedThis && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-warn bg-warn/10 border border-warn/40 rounded p-2"
              >
                ⚠ The last vector is parallel to a previous one — it
                doesn&apos;t add to the dimension.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button
              onClick={addVec}
              disabled={vecs.length >= 5}
              className="flex-1 text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus size={10} aria-hidden="true" /> add vector
            </button>
            <button
              onClick={reset}
              className="text-[10px] px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink inline-flex items-center gap-1"
            >
              <RotateCcw size={10} aria-hidden="true" /> reset
            </button>
          </div>

          <div className="text-[10px] text-dim leading-relaxed">
            Every basis has the same number of vectors. That number IS
            the dimension. In R², the maximum is 2 — adding a third
            parallel vector changes nothing.
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick rank computation by Gaussian elimination on a flat matrix.
function rank(rows: number[][]): number {
  if (rows.length === 0) return 0;
  const m = rows.map((r) => [...r]);
  const cols = m[0]?.length ?? 0;
  let r = 0;
  for (let c = 0; c < cols && r < m.length; c++) {
    let pivot = -1;
    for (let i = r; i < m.length; i++) {
      if (Math.abs(m[i]?.[c] ?? 0) > 1e-9) {
        pivot = i;
        break;
      }
    }
    if (pivot === -1) continue;
    const mr = m[r]!;
    const mp = m[pivot]!;
    [m[r], m[pivot]] = [mp, mr];
    const pv = m[r]?.[c] ?? 1;
    for (let j = 0; j < cols; j++) m[r]![j] = (m[r]![j] ?? 0) / pv;
    for (let i = 0; i < m.length; i++) {
      if (i === r) continue;
      const f = m[i]?.[c] ?? 0;
      if (Math.abs(f) < 1e-9) continue;
      for (let j = 0; j < cols; j++) {
        m[i]![j] = (m[i]![j] ?? 0) - f * (m[r]![j] ?? 0);
      }
    }
    r++;
  }
  return r;
}