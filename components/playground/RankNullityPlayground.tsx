"use client";
import { useState, useMemo } from "react";
import { m2det, m2eigen, fmt } from "@/lib/math";
import { Slider } from "./Slider";

// Concept T5: Rank-Nullity Theorem
// "dim(null) + dim(range) = dim(input). Always. The most important equation in linear algebra."

export function RankNullityPlayground() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(2);
  const [inputDim] = useState(2);

  const M = useMemo(() => [[a, b], [c, d]], [a, b, c, d]);
  const det = m2det(M as any);
  const eigen = useMemo(() => m2eigen(M as any), [M]);

  // rank
  const rank = useMemo(() => {
    if (Math.abs(det) > 1e-9) return 2;
    if (Math.abs(a) > 1e-9 || Math.abs(b) > 1e-9 || Math.abs(c) > 1e-9 || Math.abs(d) > 1e-9) return 1;
    return 0;
  }, [det, a, b, c, d]);
  const nullity = inputDim - rank;

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="bg-card border border-line rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink mb-2">
          The most important equation
        </h3>
        <div className="bg-canvas border border-line rounded p-4 font-serif text-2xl text-center my-4">
          <span className="text-eigen">dim(null)</span>
          <span className="text-dim mx-2">+</span>
          <span className="text-accent">dim(range)</span>
          <span className="text-dim mx-2">=</span>
          <span className="text-ink">dim(input)</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-eigen/10 border border-eigen/40 rounded p-3">
            <div className="text-[10px] text-eigen uppercase tracking-wider">Null space</div>
            <div className="text-3xl font-mono text-eigen mt-1">{nullity}D</div>
            <div className="text-[10px] text-dim mt-1">what gets squashed</div>
          </div>
          <div className="bg-accent/10 border border-accent/40 rounded p-3">
            <div className="text-[10px] text-accent uppercase tracking-wider">Range</div>
            <div className="text-3xl font-mono text-accent mt-1">{rank}D</div>
            <div className="text-[10px] text-dim mt-1">what survives</div>
          </div>
          <div className="bg-elev/40 border border-line rounded p-3">
            <div className="text-[10px] text-faint uppercase tracking-wider">Input</div>
            <div className="text-3xl font-mono text-ink mt-1">{inputDim}D</div>
            <div className="text-[10px] text-dim mt-1">domain size</div>
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
        <div className="bg-elev/40 border border-line rounded-xl p-3 text-xs text-dim space-y-1">
          <div>det = {fmt(det, 3)}</div>
          {eigen && (
            <div>eigenvalues ≈ {fmt(eigen.values[0], 2)}, {fmt(eigen.values[1], 2)}</div>
          )}
          <div className="text-accent pt-1">
            Try making the two columns parallel (b/a = d/c). Watch the rank drop to 1, nullity become 1.
          </div>
        </div>
      </div>
    </div>
  );
}
