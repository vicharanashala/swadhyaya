"use client";
import { useState, useMemo } from "react";
import { m2eigen, fmt } from "@/lib/math";
import { Slider } from "./Slider";
import { Sparkles } from "lucide-react";

// Concept E5: Cayley-Hamilton — Every matrix satisfies its own characteristic equation
// p(A) = 0. Plug A into its own polynomial. The result is the zero matrix.

export function CayleyHamiltonPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(2);

  const tr = a + d;
  const det = a * d - b * c;
  // p(A) = A² - tr·A + det·I
  // A² = [[a²+bc, ab+bd], [ca+dc, cb+d²]] = [[a²+bc, b(a+d)], [c(a+d), bc+d²]]
  // p(A) = A² - tr·A + det·I
  // p(A)[0][0] = a² + bc - tr·a + det = a² + bc - a² - ad + ad - bc = 0  ✓
  // Always works. Show the components.

  const a2 = a * a + b * c;
  const b2 = b * a + b * d;  // = b(a+d)
  const c2 = c * a + d * c;  // = c(a+d)
  const d2 = c * b + d * d;  // = bc + d²

  const p00 = a2 - tr * a + det;  // should be 0
  const p01 = b2 - tr * b;  // should be 0
  const p10 = c2 - tr * c;  // should be 0
  const p11 = d2 - tr * d + det;  // should be 0

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          p(A) = A² - (tr A)·A + (det A)·I = 0 — always
        </h3>
        <div className="bg-canvas border border-line rounded p-3 font-mono text-sm space-y-2">
          <div className="flex gap-2">
            <span className="text-faint">A =</span>
            <span className="text-ink">[{fmt(a, 2)}  {fmt(b, 2)}]</span>
          </div>
          <div className="flex gap-2 pl-6">
            <span className="text-ink">[{fmt(c, 2)}  {fmt(d, 2)}]</span>
          </div>
          <div className="border-t border-line/40 pt-2 mt-2 text-faint">
            A² =
          </div>
          <div className="flex gap-2"><span>[{fmt(a2, 3)}  {fmt(b2, 3)}]</span></div>
          <div className="flex gap-2 pl-6"><span>[{fmt(c2, 3)}  {fmt(d2, 3)}]</span></div>
          <div className="border-t border-line/40 pt-2 mt-2 text-faint">
            tr(A) = {tr}, &nbsp; det(A) = {fmt(det, 3)}
          </div>
          <div className="border-t border-line/40 pt-2 mt-2 text-faint">
            p(A) = A² - ({tr})·A + ({fmt(det, 2)})·I =
          </div>
          <div className="flex gap-2">
            <span className="text-accent">[{fmt(p00, 6)}  {fmt(p01, 6)}]</span>
          </div>
          <div className="flex gap-2 pl-6">
            <span className="text-accent">[{fmt(p10, 6)}  {fmt(p11, 6)}]</span>
          </div>
        </div>

        <div className="mt-4 bg-accent/10 border border-accent/30 rounded p-3 text-xs">
          <div className="text-accent font-medium mb-1 flex items-center gap-1">
            <Sparkles size={11} /> All four entries are 0.
          </div>
          <div className="text-dim">
            The matrix A is a root of its own characteristic polynomial.
            This is one of the most beautiful theorems in linear algebra.
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
        <div className="bg-elev/40 border border-line rounded p-3 text-xs text-dim leading-relaxed space-y-1">
          <div>The matrix p(A) is computed live. All four entries should be 0.</div>
          <div className="text-accent">Try a singular matrix — the same theorem still holds.</div>
          <div className="text-faint text-[10px] mt-2">
            Used to compute A^1000000 quickly: A^1000000 = c₁A + c₂I (from Cayley-Hamilton),
            no matrix multiplication needed.
          </div>
        </div>
      </div>
    </div>
  );
}
