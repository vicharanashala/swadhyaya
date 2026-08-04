"use client";
import { useState, useMemo, useEffect } from "react";
import { Slider } from "./Slider";
import { matMul, matTranspose, matSVD } from "@/lib/math";

// Convert image to grayscale matrix
async function imageToMatrix(url: string, size: number = 64): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas context"));
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const M: number[][] = [];
      for (let y = 0; y < size; y++) {
        const row: number[] = [];
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          row.push((data[i] + data[i + 1] + data[i + 2]) / (3 * 255));
        }
        M.push(row);
      }
      resolve(M);
    };
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = url;
  });
}

// Generate a synthetic image (a face-like pattern)
function syntheticFace(size: number = 64): number[][] {
  const M: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const r = Math.hypot(cx, cy) / (size / 2);
      let v = Math.max(0, 1 - r);
      const eyeL = Math.hypot(x - size * 0.35, y - size * 0.4);
      const eyeR = Math.hypot(x - size * 0.65, y - size * 0.4);
      if (eyeL < size * 0.05) v *= 0.2;
      if (eyeR < size * 0.05) v *= 0.2;
      const mouth = Math.hypot(x - size * 0.5, y - size * 0.7);
      if (mouth < size * 0.06 && y < size * 0.7) v *= 0.3;
      v *= 0.7 + 0.3 * (1 - r);
      row.push(Math.max(0, Math.min(1, v)));
    }
    M.push(row);
  }
  return M;
}

// Reconstruct A from top-k SVD: A_k = U_k · diag(S[0..k]) · V_k^T
function reconstruct(U: number[][], S: number[], V: number[][], k: number): number[][] {
  const m = U.length;
  const n = V.length;
  const A: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < k; r++) {
    const s = S[r] ?? 0;
    if (s < 1e-12) continue;
    // A[i][j] += s * U[i][r] * V[j][r] (V column r, so V^T row r)
    for (let i = 0; i < m; i++) {
      const uRow = U[i]?.[r] ?? 0;
      if (uRow === 0) continue;
      for (let j = 0; j < n; j++) {
        A[i][j] += s * uRow * (V[j]?.[r] ?? 0);
      }
    }
  }
  return A;
}

export function SVDImagePlayground() {
  const [M, setM] = useState<number[][] | null>(null);
  const [k, setK] = useState(5);
  const [decomp, setDecomp] = useState<{
    U: number[][];
    S: number[];
    V: number[][];
  } | null>(null);
  const [size, setSize] = useState(48);

  useEffect(() => {
    const mat = syntheticFace(size);
    setM(mat);
    // Defer the (potentially slow) SVD to the next tick so the UI updates
    // with the new image first.
    const handle = setTimeout(() => {
      setDecomp(matSVD(mat, 200));
    }, 50);
    return () => clearTimeout(handle);
  }, [size]);

  const reconstructed = useMemo(() => {
    if (!decomp) return null;
    return reconstruct(decomp.U, decomp.S, decomp.V, k);
  }, [decomp, k]);

  const maxSV = decomp ? (decomp.S[0] ?? 1) : 1;

  if (!M || !decomp) {
    return (
      <div className="bg-card border border-line rounded-xl p-8 text-center text-dim">
        Computing SVD…
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <h3 className="text-sm font-medium text-ink mb-3">
        Compress a real image — keep the top{" "}
        <span className="text-singular">k</span> singular values
      </h3>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Original (rank {decomp.S.filter((s) => s > 1e-3).length})
          </div>
          <ImageGrid M={M} />
        </div>
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Reconstructed with k ={" "}
            <span className="text-singular">{k}</span>
          </div>
          <ImageGrid M={reconstructed!} />
        </div>
      </div>

      <div className="mt-4">
        <Slider
          label="k"
          value={k}
          min={1}
          max={Math.min(decomp.S.length, 40)}
          step={1}
          onChange={(v) => setK(Math.round(v))}
        />
        <div className="mt-3 text-[10px] text-faint uppercase tracking-wider mb-1">
          Singular values (sorted)
        </div>
        <div className="flex items-end gap-px h-12">
          {decomp.S.slice(0, 40).map((s, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${(s / maxSV) * 100}%`,
                background: i < k ? "var(--singular)" : "var(--ink-faint)",
                opacity: i < k ? 1 : 0.4,
              }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="mt-2 text-xs text-dim">
          Storage:{" "}
          <span className="text-ink font-mono">
            k × ({size} + {size}) = {k * size * 2}
          </span>{" "}
          vs original{" "}
          <span className="text-ink font-mono">
            {size} × {size} = {size * size}
          </span>{" "}
          (<span className="text-accent">
            {((100 * (k * size * 2)) / (size * size)).toFixed(1)}%
          </span>{" "}
          of original)
        </div>
      </div>
    </div>
  );
}

function ImageGrid({ M }: { M: number[][] }) {
  const m = M.length;
  const n = M[0]?.length ?? 0;
  const cell = 4;
  return (
    <svg
      viewBox={`0 0 ${n} ${m}`}
      className="w-full max-w-[360px] bg-canvas border border-line rounded"
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label="SVD image grid"
    >
      {M.map((row, y) =>
        row.map((v, x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={`rgb(${Math.round(v * 255)}, ${Math.round(v * 255)}, ${Math.round(
              v * 255,
            )})`}
          />
        )),
      )}
    </svg>
  );
}

// Re-export helpers for tests.
export { matMul, matTranspose };