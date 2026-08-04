"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { fmt } from "@/lib/math";
import { create, all, det as mathjsDet } from "mathjs";

const math = create(all);
void math;
void mathjsDet;

// Question E3-q1: "The characteristic polynomial of a 3×3 matrix has
// degree…"
// Story: det(A - λI) is a polynomial in λ of degree n. The student picks
// the matrix size (2×2, 3×3, 4×4) and the polynomial degree appears.
// mathjs symbolically computes det(A - λI) for a sample matrix.

export function QE3Q1Playground() {
  const [n, setN] = useState(3);
  const [seed, setSeed] = useState(0);

  const poly = useMemo(() => {
    try {
      // Sample matrix A for the given size (deterministic by seed).
      const rng = (s: number) => () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const r = rng(seed + n * 7);
      const A: number[][] = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => Math.round((r() - 0.5) * 4)),
      );
      // Symbolic det(A - λI): compute the literal polynomial without
      // relying on mathjs's symbolic manipulation (which has limited
      // TS types). Build the polynomial coefficients directly.
      const lambda = (k: number): number[] => {
        // returns coefficients [c_0, c_1, ..., c_k] for λ^k
        const c = new Array(k + 1).fill(0);
        c[k] = 1;
        return c;
      };
      // Characteristic polynomial: det(A - λI) = sum over i of
      // λ^i * (-1)^(n-i) * e_i(A)  where e_i is the i-th elementary
      // symmetric function of eigenvalues (sum of (n-i)×(n-i) principal
      // minors). For 2×2: -tr(A)·λ + det(A). For 3×3: ...
      let polyCoeffs: number[] = [1]; // det(A - λI) = (-λ)^n + ... ; leading coeff = (-1)^n
      // Compute trace, sum of 2×2 principal minors, det
      const tr = (M: number[][]) =>
        M.reduce((s, row, i) => s + (row[i] ?? 0), 0);
      const detFn = (M: number[][]): number => {
        const n = M.length;
        if (n === 1) return M[0]![0]!;
        if (n === 2) return M[0]![0]! * M[1]![1]! - M[0]![1]! * M[1]![0]!;
        let d = 0;
        for (let j = 0; j < n; j++) {
          const minor = M.slice(1).map((row) => [
            ...row.slice(0, j),
            ...row.slice(j + 1),
          ]);
          d += (j % 2 === 0 ? 1 : -1) * (M[0]![j] ?? 0) * detFn(minor);
        }
        return d;
      };
      const sumPrincipalMinors = (M: number[][], k: number) => {
        // sum of all k×k principal minors
        const n = M.length;
        if (k > n || k <= 0) return 0;
        if (k === n) return detFn(M);
        // Pick indices for a k×k principal minor
        const indices = Array.from({ length: n }, (_, i) => i);
        const combos = (arr: number[], choose: number): number[][] => {
          if (choose === 0) return [[]];
          if (arr.length < choose) return [];
          const [head, ...rest] = arr;
          const withHead = combos(rest, choose - 1).map((c) => [head, ...c]);
          const withoutHead = combos(rest, choose);
          return [...withHead, ...withoutHead];
        };
        const all = combos(indices, k);
        let s = 0;
        for (const c of all) {
          const sub: number[][] = c.map((i) => M[i]!.filter((_, j) => c.includes(j)));
          s += detFn(sub);
        }
        return s;
      };
      // det(A - λI) = (-λ)^n + (-λ)^(n-1) * e_1 + ... + det(A)
      const coeffs: number[] = [];
      for (let k = 0; k <= n; k++) {
        // coefficient of λ^k
        const ek = k === 0 ? 1 : sumPrincipalMinors(A, n - k);
        coeffs.push(((-1) ** (n - k)) * ek);
      }
      void lambda;
      const expanded = coeffs
        .map((c, k) => {
          const power = n - k;
          if (power === 0) return `${c}`;
          if (power === 1) return `${c}·λ`;
          return `${c}·λ^${power}`;
        })
        .join(" + ");
      void mathjsDet;
      void math;
      return { A, expanded, deg: n };
    } catch {
      return { A: [], expanded: "λ^n ...", deg: n };
    }
  }, [n, seed]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Pick a matrix size — the characteristic polynomial has degree n.
      </div>
      <p className="text-[10px] text-dim mb-3">
        det(A − λI) is a polynomial in λ. Its degree equals the matrix
        size n.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-faint font-mono">size n =</span>
        {[2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => {
              setN(s);
              setSeed((x) => x + 1);
            }}
            className={`text-xs px-2 py-1 rounded border ${
              n === s
                ? "bg-accent/20 text-accent border-accent/40"
                : "border-line text-dim hover:text-ink"
            }`}
          >
            {s}×{s}
          </button>
        ))}
      </div>

      <div className="bg-card border border-line rounded p-3 space-y-2">
        <div className="text-[10px] text-faint uppercase tracking-wider">
          Sample {n}×{n} matrix A
        </div>
        <div className="font-mono text-xs text-center">
          {poly.A.map((row, i) => (
            <div key={i}>
              [{row.map((v, j) => (
                <span key={j} className="inline-block w-6 text-center">
                  {v}
                </span>
              ))}
              ]
            </div>
          ))}
        </div>

        <div className="text-[10px] text-faint uppercase tracking-wider">
          det(A − λI) =
        </div>
        <motion.div
          key={`${n}-${seed}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-xs text-accent break-words"
        >
          {poly.expanded}
        </motion.div>

        <div
          className="rounded p-2 bg-accent/10 border border-accent/40 text-center"
        >
          <div className="text-[10px] text-faint uppercase tracking-wider">
            degree
          </div>
          <div className="text-2xl font-mono text-accent">{poly.deg}</div>
        </div>
      </div>
    </div>
  );
}