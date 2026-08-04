"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { matMul, matTranspose, matSVD } from "@/lib/math";
import { motion } from "framer-motion";

// Question S2-q1: "In SVD, the columns of U and V are…"
// Library: framer-motion + an interactive SVD preview that does real
// image compression. The student:
//   * picks a synthetic image (face, checkerboard, gradient, stripes)
//   * drags the k slider to see the rank-k approximation update live
//   * sees storage used vs original
//   * watches the singular values rank-ordered
//
// Side panel teaches: the columns of U and V are orthonormal, so this
// makes intuitive sense — they're just new coordinate systems.

type Pattern = "face" | "checkerboard" | "gradient" | "stripes" | "circle";

function buildPattern(p: Pattern, size: number): number[][] {
  const M: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const r = Math.hypot(cx, cy) / (size / 2);
      let v = 0;
      switch (p) {
        case "face":
          v = Math.max(0, 1 - r);
          if (Math.hypot(x - size * 0.35, y - size * 0.4) < size * 0.05) v *= 0.2;
          if (Math.hypot(x - size * 0.65, y - size * 0.4) < size * 0.05) v *= 0.2;
          if (Math.hypot(x - size * 0.5, y - size * 0.7) < size * 0.06 && y < size * 0.7) v *= 0.3;
          v *= 0.7 + 0.3 * (1 - r);
          break;
        case "checkerboard":
          v = ((Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0) ? 0.9 : 0.1;
          break;
        case "gradient":
          v = (Math.sin(x * 0.3) + 1) / 2;
          break;
        case "stripes":
          v = ((Math.floor(x / 8) % 2 === 0) ? 0.85 : 0.15) * (1 - r * 0.6);
          break;
        case "circle":
          v = Math.max(0, 1 - r * 2);
          break;
      }
      row.push(Math.max(0, Math.min(1, v)));
    }
    M.push(row);
  }
  return M;
}

function reconstruct(
  U: number[][],
  S: number[],
  V: number[][],
  k: number,
): number[][] {
  const m = U.length;
  const n = V.length;
  const A: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < k; r++) {
    const s = S[r] ?? 0;
    if (s < 1e-12) continue;
    for (let i = 0; i < m; i++) {
      const uRow = U[i]?.[r] ?? 0;
      if (uRow === 0) continue;
      for (let j = 0; j < n; j++) {
        A[i][j] = (A[i]?.[j] ?? 0) + s * uRow * (V[j]?.[r] ?? 0);
      }
    }
  }
  return A;
}

const PATTERN_LABELS: Record<Pattern, string> = {
  face: "Face",
  checkerboard: "Checkerboard",
  gradient: "Gradient",
  stripes: "Stripes",
  circle: "Circle",
};

export function QS2Q1Playground() {
  const [size] = useState(40);
  const [pattern, setPattern] = useState<Pattern>("face");
  const [k, setK] = useState(5);
  const [decomp, setDecomp] = useState<{
    U: number[][];
    S: number[];
    V: number[][];
  } | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [patternMatrix, setPatternMatrix] = useState<number[][]>(() =>
    buildPattern("face", 40),
  );

  useEffect(() => {
    const M = buildPattern(pattern, size);
    setPatternMatrix(M);
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    // Defer SVD to next tick so UI updates with the new pattern first.
    pendingTimer.current = setTimeout(() => {
      setDecomp(matSVD(M, 200));
    }, 30);
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [pattern, size]);

  const reconstructed = useMemo(() => {
    if (!decomp) return null;
    return reconstruct(decomp.U, decomp.S, decomp.V, k);
  }, [decomp, k]);

  const maxSV = decomp?.S[0] ?? 1;
  const usableRank = decomp?.S.filter((s) => s > 1e-3).length ?? 0;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        SVD image compression — pick a pattern, slide k.
      </div>
      <p className="text-[10px] text-dim mb-3">
        The columns of U and V are orthonormal — new coordinate systems
        tailored to the image. The singular values S rank the importance
        of each column.
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {(Object.keys(PATTERN_LABELS) as Pattern[]).map((p) => (
          <button
            key={p}
            onClick={() => setPattern(p)}
            className={`text-[10px] px-2 py-1 border rounded ${
              pattern === p
                ? "bg-accent/20 text-accent border-accent/40"
                : "border-line text-dim hover:text-ink"
            }`}
          >
            {PATTERN_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Original (rank {usableRank})
          </div>
          <ImageGrid M={patternMatrix} />
        </div>
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
            Rank-k approximation (k = {k})
          </div>
          {reconstructed ? (
            <ImageGrid M={reconstructed} />
          ) : (
            <div className="bg-canvas border border-line rounded aspect-square flex items-center justify-center text-[10px] text-faint">
              Computing…
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-faint font-mono w-8">k =</span>
        <input
          type="range"
          min={1}
          max={Math.min(40, decomp?.S.length ?? 40)}
          step={1}
          value={k}
          onChange={(e) => setK(parseInt(e.target.value, 10))}
          className="flex-1 accent-accent"
          aria-label="k"
        />
        <input
          type="number"
          min={1}
          max={Math.min(40, decomp?.S.length ?? 40)}
          step={1}
          value={k}
          onChange={(e) => setK(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-14 px-2 py-0.5 text-[10px] font-mono rounded border border-line bg-canvas text-ink text-center"
        />
      </div>

      {/* Singular value spectrum */}
      <div>
        <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
          Singular values (sorted, log-scale)
        </div>
        <div className="flex items-end gap-px h-12">
          {(decomp?.S ?? []).slice(0, 30).map((s, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              animate={{
                height: `${Math.min(100, (Math.log10(Math.max(1e-6, s)) / Math.log10(Math.max(1e-6, maxSV))) * 100)}%`,
                background:
                  i < k ? "var(--singular)" : "var(--ink-faint)",
                opacity: i < k ? 1 : 0.4,
              }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="mt-3 text-[10px] text-dim">
        Storage:{" "}
        <span className="font-mono text-ink">
          k × ({size} + {size}) = {k * size * 2}
        </span>{" "}
        vs original{" "}
        <span className="font-mono text-ink">
          {size}² = {size * size}
        </span>{" "}
        (
        <span className="text-accent">
          {((100 * (k * size * 2)) / (size * size)).toFixed(0)}%
        </span>{" "}
        of original)
      </div>
    </div>
  );
}

function ImageGrid({ M }: { M: number[][] }) {
  const m = M.length;
  const n = M[0]?.length ?? 0;
  return (
    <svg
      viewBox={`0 0 ${n} ${m}`}
      className="w-full bg-canvas border border-line rounded"
      style={{ imageRendering: "pixelated", aspectRatio: "1/1" }}
      role="img"
      aria-label="Image preview"
    >
      {M.map((row, y) =>
        row.map((v, x) => {
          const c = Math.round(v * 255);
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={`rgb(${c}, ${c}, ${c})`}
            />
          );
        }),
      )}
    </svg>
  );
}