"use client";
import { useMemo } from "react";

// Question E5-q1: "For A = [[2, 1], [0, 2]], the characteristic polynomial is
// p(λ) = λ² - 4λ + 4. What is p(A)?"
//
// Widget: shows A on the left, computes A², -4A, +4I in three boxes, then
// sums them. Each intermediate result is labeled. When the student reads
// the final 2x2 grid, they SEE the zero matrix — the proof of the theorem
// rendered live.

type Mat = [number, number, number, number]; // row-major 2x2

function add(a: Mat, b: Mat): Mat {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}
function mul(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];
}
function scale(a: Mat, s: number): Mat {
  return [a[0] * s, a[1] * s, a[2] * s, a[3] * s];
}

function fmt(n: number): string {
  // prettier than JS toString for negative numbers, large numbers
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

function Mat2({ a }: { a: Mat }) {
  return (
    <div className="inline-grid grid-cols-2 gap-0.5 font-mono text-sm">
      {[a[0], a[1], a[2], a[3]].map((v, i) => (
        <div
          key={i}
          className={`w-9 h-9 flex items-center justify-center rounded border ${
            v === 0
              ? "border-line bg-elev/40 text-faint"
              : "border-ink/40 bg-card text-ink"
          }`}
        >
          {fmt(v)}
        </div>
      ))}
    </div>
  );
}

export function QE5Q1Playground() {
  // A = [[2, 1], [0, 2]]
  const A: Mat = [2, 1, 0, 2];
  const A2 = useMemo(() => mul(A, A), []);
  const neg4A = useMemo(() => scale(A, -4), []);
  const I4: Mat = [4, 0, 0, 4]; // 4·I for 2x2

  // p(A) = A² - 4A + 4I
  const pA = useMemo(
    () => add(add(A2, neg4A), I4),
    [A2, neg4A],
  );

  const isZero = pA[0] === 0 && pA[1] === 0 && pA[2] === 0 && pA[3] === 0;

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-5">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        p(A) = A² − 4A + 4I, computed live
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-faint font-mono">A</div>
          <Mat2 a={A} />
        </div>
        <div className="text-faint text-xl">→</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-faint font-mono">A²</div>
          <Mat2 a={A2} />
        </div>
        <div className="text-faint text-xl">+</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-faint font-mono">−4A</div>
          <Mat2 a={neg4A} />
        </div>
        <div className="text-faint text-xl">+</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-faint font-mono">4I</div>
          <Mat2 a={I4} />
        </div>
        <div className="text-faint text-xl">=</div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-faint font-mono">p(A)</div>
          <div
            className={`p-1 rounded border ${
              isZero
                ? "border-accent bg-accent/10"
                : "border-ink/40"
            }`}
          >
            <Mat2 a={pA} />
          </div>
        </div>
      </div>

      <div className="text-xs text-center">
        {isZero ? (
          <span className="text-accent font-medium">
            The zero matrix. p(A) = 0. Cayley-Hamilton, proved live.
          </span>
        ) : (
          <span className="text-dim">Computing…</span>
        )}
      </div>
    </div>
  );
}