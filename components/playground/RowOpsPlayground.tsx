"use client";
import { useState, useMemo } from "react";
import { m2det, fmt } from "@/lib/math";
import { ArrowRight, RotateCcw, Shuffle, Scaling, Plus } from "lucide-react";

// Concept L5: Row Operations — Multiply, Swap, Add
// "Three moves that don't change the answer. Master the toolkit before you use it."

export function RowOpsPlayground() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(1);
  const [swap, setSwap] = useState(false);

  const M = useMemo<[[number, number], [number, number]]>(() => {
    const base: [[number, number], [number, number]] = [[a, b], [c, d]];
    return swap ? [[c, d], [a, b]] : base;
  }, [a, b, c, d, swap]);

  const det = m2det(M);

  // Apply a transformation
  const scaleRow = (row: number, k: number) => {
    if (k === 0) return;
    if (row === 0) {
      if (swap) { setC(c * k); setD(d * k); } else { setA(a * k); setB(b * k); }
    } else {
      if (swap) { setA(a * k); setB(b * k); } else { setC(c * k); setD(d * k); }
    }
  };
  const addRow = (from: number, to: number, k: number) => {
    if (from === to) return;
    // from*k added to to
    if (from === 0) {
      if (swap) {
        if (to === 1) { setA(a + c * k); setB(b + d * k); }
      } else {
        if (to === 1) { setC(c + a * k); setD(d + b * k); }
      }
    } else {
      if (swap) {
        if (to === 0) { setC(c + a * k); setD(d + b * k); }
      } else {
        if (to === 0) { setA(a + c * k); setB(b + d * k); }
      }
    }
  };
  const reset = () => { setA(1); setB(1); setC(1); setD(1); setSwap(false); };

  // The "answer" we're solving for
  const b1 = 5, b2 = 3;
  const m11 = M[0]?.[0] ?? 0;
  const m12 = M[0]?.[1] ?? 0;
  const m21 = M[1]?.[0] ?? 0;
  const m22 = M[1]?.[1] ?? 0;
  const x = (m22 * b1 - m12 * b2) / det;
  const y = (-m21 * b1 + m11 * b2) / det;

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-2">
        Three moves that don't change the answer
      </h3>
      <p className="text-xs text-dim mb-4">
        Solve: x + y = 5, x + y = 3. Wait — they have the same slope! The lines
        are parallel. Use row operations to make the structure visible.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Matrix A */}
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Your matrix [A | b]</div>
          <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
            {M.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-faint text-xs w-6">R{i + 1}</span>
                <span className="text-ink">[</span>
                <span className="text-vector w-8 text-right">{fmt(row[0])}</span>
                <span className="text-matrix w-8 text-right">{fmt(row[1])}</span>
                <span className="text-faint">|</span>
                <span className="text-accent w-8 text-right">{fmt(i === 0 ? b1 : b2)}</span>
                <span className="text-ink">]</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-faint">
            det = {fmt(det, 3)} {Math.abs(det) < 0.1 && "(≈ 0 — the system is degenerate)"}
          </div>
        </div>

        {/* Operations */}
        <div className="space-y-2">
          <div className="bg-elev/30 border border-line rounded-md p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
              <Shuffle size={11} /> 1. Swap rows
            </div>
            <button
              onClick={() => setSwap(!swap)}
              className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60"
            >
              R1 ↔ R2 {!swap ? "(swap)" : "(unswap)"}
            </button>
          </div>

          <div className="bg-elev/30 border border-line rounded-md p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
              <Scaling size={11} /> 2. Scale a row
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => scaleRow(0, 2)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 × 2</button>
              <button onClick={() => scaleRow(0, 0.5)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 ÷ 2</button>
              <button onClick={() => scaleRow(1, 2)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 × 2</button>
              <button onClick={() => scaleRow(1, 0.5)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 ÷ 2</button>
            </div>
          </div>

          <div className="bg-elev/30 border border-line rounded-md p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-faint uppercase tracking-wider mb-2">
              <Plus size={11} /> 3. Add a multiple
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => addRow(0, 1, -1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 − R1</button>
              <button onClick={() => addRow(0, 1, 1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R2 + R1</button>
              <button onClick={() => addRow(1, 0, -1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 − R2</button>
              <button onClick={() => addRow(1, 0, 1)} className="text-xs px-2 py-1 rounded border border-line hover:bg-elev/60">R1 + R2</button>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full text-xs text-dim hover:text-ink flex items-center justify-center gap-1 py-1.5 border border-line rounded-md"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-elev/30 rounded-md p-2 text-center">
          <div className="text-[10px] text-faint uppercase tracking-wider">x</div>
          <div className="font-mono text-sm text-ink">{isFinite(x) ? fmt(x, 3) : "—"}</div>
        </div>
        <div className="bg-elev/30 rounded-md p-2 text-center">
          <div className="text-[10px] text-faint uppercase tracking-wider">y</div>
          <div className="font-mono text-sm text-ink">{isFinite(y) ? fmt(y, 3) : "—"}</div>
        </div>
        <div className="bg-elev/30 rounded-md p-2 text-center">
          <div className="text-[10px] text-faint uppercase tracking-wider">status</div>
          <div className="text-[10px] mt-1" style={{ color: Math.abs(det) < 0.1 ? "var(--warn)" : "var(--accent)" }}>
            {Math.abs(det) < 0.1 ? "no / ∞" : "unique"}
          </div>
        </div>
      </div>
    </div>
  );
}
