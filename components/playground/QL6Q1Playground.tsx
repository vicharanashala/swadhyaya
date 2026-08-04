"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { motion } from "framer-motion";

// Question L6-q1: "In row-echelon form, where are the leading non-zero
// entries?"
// Story: Pivots staircase from top-left to bottom-right, each strictly to
// the right of the one above. The student edits a 3×3 matrix and
// watches the echelon form with pivots highlighted.

export function QL6Q1Playground() {
  const [m, setM] = useState([
    [2, 4, 6],
    [0, 3, 9],
    [0, 0, 5],
  ]);

  const echelon = useMemo(() => {
    const { rref, pivots } = matRref(
      m.map((r) => [...r]),
    );
    return { rref, pivots };
  }, [m]);

  const update = (i: number, j: number, v: number) =>
    setM((rows) => rows.map((row, ri) => (ri === i ? row.map((c, rj) => (rj === j ? v : c)) : row)));

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Edit the matrix — watch the echelon form with pivots lit up.
      </div>
      <p className="text-[10px] text-dim mb-3">
        In echelon form, pivots staircase — each one strictly to the right
        of the one above. Try making the matrix singular and see the
        staircase break.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Original matrix
          </div>
          <div className="space-y-1">
            {m.map((row, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[10px] text-faint w-4">R{i + 1}</span>
                {row.map((v, j) => (
                  <input
                    key={j}
                    type="number"
                    step={0.5}
                    value={v}
                    onChange={(e) =>
                      update(i, j, parseFloat(e.target.value) || 0)
                    }
                    className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                    aria-label={`m[${i + 1}][${j + 1}]`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Echelon form
          </div>
          <div className="space-y-1">
            {echelon.rref.map((row, i) => {
              const pivotCol = echelon.pivots[i];
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[10px] text-faint w-4">R{i + 1}</span>
                  {row.map((v, j) => {
                    const isPivot = pivotCol === j;
                    return (
                      <motion.span
                        key={j}
                        animate={{
                          backgroundColor: isPivot
                            ? "rgba(232,134,74,0.4)"
                            : "rgba(0,0,0,0)",
                        }}
                        className={`w-12 px-1 py-0.5 text-[10px] font-mono rounded text-center ${
                          isPivot ? "text-accent font-bold" : "text-ink"
                        }`}
                      >
                        {fmt(v, 1)}
                      </motion.span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 bg-elev/40 border border-line rounded p-2 text-[10px] text-dim flex items-center gap-2">
        <span>Pivots:</span>
        {echelon.pivots.map((p, i) => (
          <span key={i} className="font-mono text-accent">
            R{i + 1} → col {p + 1}
          </span>
        ))}
        <span className="ml-auto text-faint">
          rank = {echelon.pivots.length}
        </span>
      </div>
    </div>
  );
}