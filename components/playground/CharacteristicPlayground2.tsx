"use client";
import { useState, useMemo } from "react";
import { m2eigen, fmt } from "@/lib/math";
import { Slider } from "./Slider";
import { Sparkles } from "lucide-react";

// Concept E3: Characteristic Polynomial — det(A - λI) = 0
// "The equation whose roots are the eigenvalues. The master equation of eigenworld."

export function CharacteristicPlayground2() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(2);

  // p(λ) = det(A - λI) = (a-λ)(d-λ) - bc = λ² - (a+d)λ + (ad-bc)
  // Coefficients: λ² - tr(A)·λ + det(A)
  const tr = a + d;
  const det = a * d - b * c;

  // The polynomial
  // p(λ) = λ² - tr·λ + det
  // roots: λ = (tr ± sqrt(tr² - 4·det)) / 2
  const disc = tr * tr - 4 * det;
  const realRoots = disc >= 0;
  const lambda1 = realRoots ? (tr + Math.sqrt(disc)) / 2 : null;
  const lambda2 = realRoots ? (tr - Math.sqrt(disc)) / 2 : null;

  // Verify with eigen function
  const eigen = useMemo(() => m2eigen([[a, b], [c, d]] as any), [a, b, c, d]);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          det(A - λI) = 0 — find the λ that makes the matrix singular
        </h3>
        <div className="bg-canvas border border-line rounded p-3 font-mono text-sm space-y-2">
          <div className="flex gap-2">
            <span className="text-faint">A =</span>
            <span className="text-ink">[{fmt(a, 2)}  {fmt(b, 2)}]</span>
          </div>
          <div className="flex gap-2 pl-6">
            <span className="text-ink">[{fmt(c, 2)}  {fmt(d, 2)}]</span>
          </div>
          <div className="border-t border-line/40 pt-2 mt-2">
            <div className="text-faint">A - λI =</div>
            <div className="flex gap-2"><span>[{fmt(a, 2)}-λ  &nbsp;{fmt(b, 2)}&nbsp;&nbsp;&nbsp;]</span></div>
            <div className="flex gap-2 pl-6"><span>[{fmt(c, 2)}&nbsp;&nbsp;&nbsp;{fmt(d, 2)}-λ]</span></div>
          </div>
          <div className="border-t border-line/40 pt-2 mt-2">
            <div className="text-faint">det(A - λI) =</div>
            <div className="text-accent text-lg">
              λ² - ({tr})λ + ({fmt(det, 2)})
            </div>
            <div className="text-faint text-[10px] mt-1">
              = (a-λ)(d-λ) - bc
            </div>
          </div>
        </div>

        <div className="mt-4 bg-elev/40 border border-line rounded p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">The roots of p(λ) = 0</div>
          {realRoots ? (
            <div className="space-y-1 font-mono">
              <div className="text-accent text-lg">
                λ₁ = {fmt(lambda1!, 4)}
              </div>
              <div className="text-singular text-lg">
                λ₂ = {fmt(lambda2!, 4)}
              </div>
              <div className="text-[10px] text-faint mt-2 pt-2 border-t border-line/40">
                Verified by m2eigen: [{fmt(eigen?.values[0] ?? 0, 4)}, {fmt(eigen?.values[1] ?? 0, 4)}]
              </div>
            </div>
          ) : (
            <div className="text-warn text-sm">
              discriminant = {fmt(disc, 3)} &lt; 0 — no real eigenvalues. The roots are complex.
              <div className="text-[10px] text-faint mt-2">The matrix is a rotation (or rotation+scaling).</div>
            </div>
          )}
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
        <div className="bg-elev/40 border border-line rounded p-3 text-xs text-dim leading-relaxed space-y-1">
          <div>
            <span className="text-accent">λ² - (tr)λ + (det) = 0</span> is the characteristic polynomial.
          </div>
          <div>
            Its roots are the eigenvalues. The trace (a+d) and determinant (ad-bc) of A
            determine them entirely.
          </div>
          <div className="text-accent">
            For n×n, you get an n-degree polynomial — and exactly n roots (counting complex).
          </div>
        </div>
      </div>
    </div>
  );
}
