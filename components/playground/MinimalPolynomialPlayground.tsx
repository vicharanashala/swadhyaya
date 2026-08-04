"use client";
import { useState, useMemo } from "react";
import { m2eigen, fmt } from "@/lib/math";
import { Slider } from "./Slider";

// Concept E6: The Minimal Polynomial
// "The smallest polynomial m(λ) such that m(A) = 0. It always divides the characteristic polynomial."

export function MinimalPolynomialPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(2);

  // For a 2x2 matrix:
  // - If two distinct eigenvalues: minimal poly is (λ-λ₁)(λ-λ₂) = char poly
  // - If repeated eigenvalue λ: minimal poly is (λ-λ) = λ - λ, which is degree 1
  //   AND divides the char poly (which is (λ-λ)²)
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  const repeated = Math.abs(disc) < 0.01;
  const lambda = tr / 2;

  // Build minimal poly: if repeated → λ - λ, if distinct → (λ-λ₁)(λ-λ₂)
  // The char poly is always λ² - tr·λ + det
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          Minimal polynomial — the smallest equation A satisfies
        </h3>
        <div className="bg-canvas border border-line rounded p-3 font-mono text-sm space-y-2">
          <div className="text-faint">Characteristic polynomial:</div>
          <div className="text-ink pl-3">
            χ(λ) = λ² - ({tr})λ + ({fmt(det, 2)})
          </div>
          <div className="text-faint mt-2">Minimal polynomial:</div>
          {repeated ? (
            <>
              <div className="text-accent pl-3">
                m(λ) = λ - ({fmt(lambda, 2)})
              </div>
              <div className="text-dim text-xs pl-3 mt-1">
                — degree 1, NOT 2! Because the eigenvalue is repeated, A² is already a
                multiple of A, so the minimal polynomial is linear.
              </div>
            </>
          ) : (
            <>
              <div className="text-accent pl-3">
                m(λ) = (λ-λ₁)(λ-λ₂)
              </div>
              <div className="text-dim text-xs pl-3 mt-1">
                = λ² - ({tr})λ + ({fmt(det, 2)})
              </div>
              <div className="text-dim text-xs pl-3 mt-1">
                — same as the characteristic polynomial. The minimal poly equals the
                char poly when the eigenvalues are distinct.
              </div>
            </>
          )}
        </div>

        <div className="mt-3 bg-elev/40 border border-line rounded p-3 text-xs text-dim leading-relaxed space-y-1">
          <div>
            m(λ) is the smallest-degree polynomial such that m(A) = 0.
          </div>
          <div>
            It always <span className="text-accent">divides</span> the characteristic
            polynomial.
          </div>
          <div className="text-faint text-[10px]">
            Why it matters: the minimal polynomial tells you the smallest invariant
            subspace decomposition of A. Diagonalizable = minimal poly has no repeated roots.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">A</div>
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
        <div className="bg-elev/40 border border-line rounded p-3 text-xs text-dim leading-relaxed">
          <div>Try to make the matrix have <span className="text-accent">repeated</span> eigenvalues
          (drag a, d toward the same value with b=c=0).</div>
          <div className="mt-2 text-faint text-[10px]">
            When the minimal poly has degree 1, A is already "minimal" — A itself is
            enough to generate the algebra.
          </div>
        </div>
      </div>
    </div>
  );
}
