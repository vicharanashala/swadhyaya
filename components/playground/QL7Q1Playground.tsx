"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

// Question L7-q1: "RREF is unique for every matrix."
// Story: The student picks a matrix. The playground shows TWO different
// paths to RREF — one starting from the matrix directly, one starting
// after swapping rows first. Both paths arrive at the same RREF. The
// student sees that the staircase is canonical.

type Path = "direct" | "swap-first" | "scale-first";

export function QL7Q1Playground() {
  const [m, setM] = useState([
    [2, 4, 6],
    [0, 3, 9],
    [0, 0, 5],
  ]);

  const rrefDirect = useMemo(
    () => matRref(m.map((r) => [...r])).rref,
    [m],
  );

  const rrefSwap = useMemo(() => {
    const swapped = [m[1]!, m[0]!, m[2]!].map((r) => [...r]);
    return matRref(swapped).rref;
  }, [m]);

  const rrefScale = useMemo(() => {
    const scaled = m.map((r) => r.map((v) => v * 3));
    return matRref(scaled).rref;
  }, [m]);

  const [path, setPath] = useState<Path>("direct");

  const eq =
    JSON.stringify(rrefDirect) === JSON.stringify(rrefSwap) &&
    JSON.stringify(rrefDirect) === JSON.stringify(rrefScale);

  const matrixEqual = (a: number[][], b: number[][]) =>
    a.every((row, i) =>
      row.every((v, j) => Math.abs(v - (b[i]?.[j] ?? 0)) < 1e-6),
    );

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Edit the matrix — see that RREF is unique regardless of path.
      </div>
      <p className="text-[10px] text-dim mb-3">
        Two different paths to the same matrix should give the same RREF.
      </p>

      <div className="bg-card border border-line rounded p-3 mb-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          Original
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
                    setM((rows) =>
                      rows.map((r, ri) =>
                        ri === i
                          ? r.map((c, rj) => (rj === j ? parseFloat(e.target.value) || 0 : c))
                          : r,
                      ),
                    )
                  }
                  className="w-12 px-1 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
                  aria-label={`m[${i + 1}][${j + 1}]`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          onClick={() => setPath("direct")}
          className={`text-[10px] px-2 py-1 rounded border ${
            path === "direct"
              ? "bg-accent/20 text-accent border-accent/40"
              : "border-line text-dim"
          }`}
        >
          path A: direct
        </button>
        <button
          onClick={() => setPath("swap-first")}
          className={`text-[10px] px-2 py-1 rounded border ${
            path === "swap-first"
              ? "bg-accent/20 text-accent border-accent/40"
              : "border-line text-dim"
          }`}
        >
          path B: swap first
        </button>
        <button
          onClick={() => setPath("scale-first")}
          className={`text-[10px] px-2 py-1 rounded border ${
            path === "scale-first"
              ? "bg-accent/20 text-accent border-accent/40"
              : "border-line text-dim"
          }`}
        >
          path C: scale ×3 first
        </button>
      </div>

      <div className="bg-card border border-line rounded p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          {path === "direct" && "Path A: RREF of original"}
          {path === "swap-first" && "Path B: RREF after swapping R1↔R2"}
          {path === "scale-first" && "Path C: RREF after scaling ×3"}
        </div>
        <div className="space-y-1 font-mono text-xs">
          {(path === "direct"
            ? rrefDirect
            : path === "swap-first"
              ? rrefSwap
              : rrefScale
          ).map((row, i) => (
            <div key={i}>
              [{row.map((v, j) => (
                <span key={j} className="inline-block w-12 text-center">
                  {fmt(v, 2)}
                </span>
              ))}
              ]
            </div>
          ))}
        </div>
      </div>

      <motion.div
        animate={{
          backgroundColor: eq ? "rgba(92,184,122,0.1)" : "rgba(0,0,0,0)",
        }}
        className="mt-3 rounded p-3 border text-center"
        style={{ borderColor: eq ? "var(--correct)" : "var(--line)" }}
      >
        <div className="text-sm font-medium text-correct flex items-center justify-center gap-1">
          <Check size={12} aria-hidden="true" />
          All three paths give the same RREF
        </div>
        <div className="text-[10px] text-dim mt-1">
          {matrixEqual(rrefDirect, rrefSwap) &&
          matrixEqual(rrefDirect, rrefScale)
            ? "RREF is canonical — the same for everyone."
            : "Keep editing until all three match."}
        </div>
      </motion.div>
    </div>
  );
}