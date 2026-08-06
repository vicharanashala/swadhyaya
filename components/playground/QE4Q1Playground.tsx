"use client";
import { useState, useMemo } from "react";
import { fmt, m2det, m2mul, m2transpose } from "@/lib/math";
import { Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarsGraph,
  MatrixStripHeatmap,
} from "./_shared/MatrixGraph";
import { StepExplainer } from "./_shared/StepExplainer";

// Question E4-q1: "A matrix is diagonalizable iff it has n linearly
// independent eigenvectors."
//
// The playground shows a 2×2 matrix, computes its eigenvalues + eigenvectors,
// forms P and D, verifies A = P D P⁻¹. Pick a preset (or type entries) —
// rotation by 90° is the canonical non-diagonalizable example (complex
// eigenvalues). A shear matrix is real-eigenvalued but DEFICIENT — only one
// line of eigenvectors → not diagonalizable. A reflection IS diagonalizable.

type M = [[number, number], [number, number]];

const PRESETS: Array<{
  id: string;
  name: string;
  M: M;
  note: string;
  diagonalizable: boolean;
  reason: string;
}> = [
  {
    id: "diag",
    name: "Already diagonal",
    M: [
      [2, 0],
      [0, 3],
    ],
    note: "Eigenvalues 2, 3 on the diagonal. Already D. Trivial case.",
    diagonalizable: true,
    reason: "P = I, D = A.",
  },
  {
    id: "rot",
    name: "Rotate 90°",
    M: [
      [0, -1],
      [1, 0],
    ],
    note: "No real eigenvalues — purely imaginary ±i. Over R, not diagonalizable.",
    diagonalizable: false,
    reason: "No real eigenvectors. Diagonalization would need i.",
  },
  {
    id: "shear",
    name: "Shear",
    M: [
      [1, 1],
      [0, 1],
    ],
    note: "λ = 1 repeated. Only ONE eigenvector (î). Two needed for diagonalization.",
    diagonalizable: false,
    reason: "Repeated eigenvalue with only one line of eigenvectors.",
  },
  {
    id: "refl",
    name: "Reflection",
    M: [
      [0, 1],
      [1, 0],
    ],
    note: "λ = 1 (eigenvector (1, 1)) and λ = -1 (eigenvector (1, -1)). Two distinct.",
    diagonalizable: true,
    reason: "Two distinct real eigenvalues → two independent eigenvectors.",
  },
  {
    id: "scale",
    name: "Scale 2×",
    M: [
      [2, 0],
      [0, 2],
    ],
    note: "λ = 2 repeated, but EVERY vector is an eigenvector. Diagonalizable!",
    diagonalizable: true,
    reason: "Repeated λ but the matrix IS λ I — already diagonal.",
  },
  {
    id: "rotneg",
    name: "Reflect + rotate",
    M: [
      [1, -1],
      [1, 1],
    ],
    note: "Trace 2, det 2. λ = 1 ± i. Complex eigenvalues → not diagonalizable over R.",
    diagonalizable: false,
    reason: "Complex eigenvalues — no real eigenvectors.",
  },
];

function eigenpair(M: M) {
  const a = M[0][0]!;
  const b = M[0][1]!;
  const c = M[1][0]!;
  const d = M[1][1]!;
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (disc < -1e-9) {
    return {
      eigenvalues: [] as Array<{ re: number; im: number }>,
      eigenvectors: [] as Array<{ x: number; y: number }>,
      repeated: false,
      hasComplex: true,
      diagonalizable: false,
      realEigenvalues: false,
    };
  }
  const sqrt = Math.sqrt(Math.max(0, disc));
  const l1 = (tr + sqrt) / 2;
  const l2 = (tr - sqrt) / 2;
  const repeated = Math.abs(disc) < 1e-9;

  function eigenvector(lambda: number): { x: number; y: number } | null {
    // (A - λI) v = 0
    const e11 = a - lambda;
    const e12 = b;
    const e21 = c;
    const e22 = d - lambda;
    // Solve the system. If first row is OK use it, else use second.
    if (Math.abs(e11) > 1e-9 || Math.abs(e12) > 1e-9) {
      // (e11) x + (e12) y = 0 → x = -e12, y = e11 (or any scaling)
      // Special case: e12 ≠ 0
      if (Math.abs(e12) > 1e-9) {
        return { x: -e12, y: e11 };
      }
      // e12 = 0, e11 ≠ 0 → x = 0, y = anything
      return { x: 0, y: 1 };
    }
    if (Math.abs(e21) > 1e-9 || Math.abs(e22) > 1e-9) {
      if (Math.abs(e21) > 1e-9) {
        return { x: -e22, y: e21 };
      }
      return { x: 1, y: 0 };
    }
    return null; // degenerate
  }

  const v1 = eigenvector(l1);
  const v2 = eigenvector(l2);

  // For realDiag: if both vectors exist and are linearly independent (not parallel)
  const eigs = [
    { re: l1, im: 0 },
    { re: l2, im: 0 },
  ];
  const vecs = [v1, v2].filter(Boolean) as Array<{ x: number; y: number }>;

  let diag2 = false;
  if (!repeated && v1 && v2) {
    const cross = v1.x * v2.y - v1.y * v2.x;
    diag2 = Math.abs(cross) > 1e-6;
  } else if (repeated) {
    // A = λI case: every v works, diagonalizable
    if (Math.abs(a - l1) < 1e-6 && Math.abs(b) < 1e-6 && Math.abs(c) < 1e-6 && Math.abs(d - l1) < 1e-6) {
      diag2 = true;
    } else {
      diag2 = false; // defective
    }
  }

  return {
    eigenvalues: eigs,
    eigenvectors: vecs,
    repeated,
    hasComplex: false,
    diagonalizable: diag2,
    realEigenvalues: true,
  };
}

// m2 inverse (since m2mul + m2trans don't include inverse)
function m2inv(M: M): M | null {
  const det = M[0][0]! * M[1][1]! - M[0][1]! * M[1][0]!;
  if (Math.abs(det) < 1e-9) return null;
  return [
    [M[1][1]! / det, -M[0][1]! / det],
    [-M[1][0]! / det, M[0][0]! / det],
  ];
}

export function QE4Q1Playground() {
  const [presetId, setPresetId] = useState("refl");
  const [M, setM] = useState<M>(PRESETS.find((p) => p.id === "refl")!.M);
  const [showSteps, setShowSteps] = useState(false);

  const apply = (id: string) => {
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p) setM(p.M);
  };

  const det = m2det(M);
  const eig = useMemo(() => eigenpair(M), [M]);

  // Build P, D, P^{-1} — only valid for diagonalizable case
  const P = useMemo<M | null>(() => {
    if (!eig.diagonalizable || eig.eigenvectors.length < 2) return null;
    const [v1, v2] = eig.eigenvectors;
    if (!v1 || !v2) return null;
    // Normalise
    const n1 = Math.hypot(v1.x, v1.y);
    const n2 = Math.hypot(v2.x, v2.y);
    const e1 = { x: v1.x / n1, y: v1.y / n1 };
    const e2 = { x: v2.x / n2, y: v2.y / n2 };
    // Columns of P are normalised eigenvectors
    return [
      [e1.x, e2.x],
      [e1.y, e2.y],
    ];
  }, [eig]);

  const Pinv = useMemo(() => (P ? m2inv(P) : null), [P]);
  const D = useMemo<M | null>(() => {
    if (!eig.diagonalizable) return null;
    return [
      [eig.eigenvalues[0]!.re, 0],
      [0, eig.eigenvalues[1]!.re],
    ];
  }, [eig]);

  // Verify: PDP^{-1}
  const verification = useMemo<M | null>(() => {
    if (!P || !D || !Pinv) return null;
    const pd = m2mul(P, D);
    const pdp = m2mul(pd, Pinv);
    // m2mul returns readonly Mat2 — unpack into M
    return [
      [pd[0][0], pd[0][1]],
      [pd[1][0], pd[1][1]],
    ];
  }, [P, D, Pinv]);

  const explainerSteps = useMemo(() => {
    const preset = PRESETS.find((p) => p.id === presetId);
    const tr = M[0][0]! + M[1][1]!;
    return [
      {
        title: "Eigenvalues solve det(A − λI) = 0",
        detail:
          "For a 2×2 matrix, the characteristic polynomial is λ² − tr(A)λ + det(A) = 0. " +
          "Its roots are the eigenvalues.",
        value: `λ² − ${fmt(tr, 2)}λ + ${fmt(det, 3)} = 0`,
        tone: "faint" as const,
      },
      {
        title: "Diagonalizability needs n independent eigenvectors",
        detail:
          eig.diagonalizable
            ? "This matrix has two independent eigenvectors. Put them as columns " +
              "of P, eigenvalues on D's diagonal, and A = PDP⁻¹."
            : eig.hasComplex
              ? "Complex eigenvalues (no real eigenvectors). Over ℝ, not diagonalizable. " +
                "Over ℂ, every matrix is triangularizable, not diagonalizable."
              : eig.repeated
                ? "Repeated eigenvalue, but A ≠ λI — only one line of eigenvectors. " +
                  "Not enough to span R²."
                : "Insufficient independent eigenvectors.",
        value: `eigenvalues: ${
          eig.eigenvalues.length > 0
            ? eig.eigenvalues
                .map((l) => `${fmt(l.re, 3)}${Math.abs(l.im) > 1e-9 ? " + " + fmt(l.im, 2) + "i" : ""}`)
                .join(", ")
            : "complex pair"
        }`,
        tone: eig.diagonalizable ? ("accent" as const) : ("warn" as const),
      },
      {
        title: "Form P (eigenvectors) and D (eigenvalues)",
        detail:
          "P's columns are the eigenvectors. D is diagonal with eigenvalues. " +
          "The equation A = PDP⁻¹ says A acts like a simple stretch D in " +
          "the eigenbasis — and P⁻¹ snaps you back to the original basis.",
        value:
          P && D
            ? `P = [[${fmt(P[0][0]!, 2)}, ${fmt(P[0][1]!, 2)}], [${fmt(P[1][0]!, 2)}, ${fmt(P[1][1]!, 2)}]]`
            : "n/a",
        tone: "accent" as const,
      },
      {
        title: `Verdict: ${eig.diagonalizable ? "diagonalizable ✓" : "not diagonalizable"}`,
        detail: preset?.reason ?? "Edit the entries and watch the eigenvalues change.",
        value: eig.diagonalizable
          ? "A = PDP⁻¹"
          : eig.hasComplex
            ? "complex eigenvalues"
            : "defective",
        tone: eig.diagonalizable ? ("accent" as const) : ("warn" as const),
      },
    ];
  }, [M, eig, P, D, det, presetId]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4 space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-warn" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">
            Diagonalization stepper — see A = PDP⁻¹
          </span>
        </div>
        <div className="text-[10px] font-mono">
          {eig.diagonalizable ? (
            <span className="text-correct">diagonalizable ✓</span>
          ) : (
            <span className="text-warn">not diagonalizable</span>
          )}
        </div>
      </header>

      <p className="text-xs text-dim leading-relaxed">
        Pick a matrix. We compute its eigenvalues and eigenvectors, form{" "}
        <code className="text-ink">P</code> (eigenvectors as columns) and{" "}
        <code className="text-ink">D</code> (eigenvalues on the diagonal),
        and check whether <code className="text-ink">A = PDP⁻¹</code>.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => apply(p.id)}
            className={`text-[10px] px-2.5 py-1 rounded border transition ${
              presetId === p.id
                ? "bg-accent/15 border-accent/40 text-accent font-medium"
                : "border-line bg-canvas text-dim hover:text-ink hover:bg-elev/60"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* The matrix and the formula */}
      <section className="grid md:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            Matrix A
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-[160px] font-mono">
            {[
              { v: M[0][0], set: (val: number) => setM([[val, M[0][1]], M[1]]), label: "a" },
              { v: M[0][1], set: (val: number) => setM([[M[0][0], val], M[1]]), label: "b" },
              { v: M[1][0], set: (val: number) => setM([M[0], [val, M[1][1]]]), label: "c" },
              { v: M[1][1], set: (val: number) => setM([M[0], [M[1][0], val]]), label: "d" },
            ].map(({ v, set, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-faint font-mono w-3">
                  {label}
                </span>
                <input
                  type="number"
                  step={0.1}
                  aria-label={label}
                  value={v}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val)) set(val);
                    setPresetId("custom");
                  }}
                  className="w-full px-2 py-1.5 text-xs rounded border border-line bg-canvas text-ink focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-dim">
            <div>
              trace = <span className="text-ink">{fmt(M[0][0]! + M[1][1]!, 3)}</span>
            </div>
            <div>
              det ={" "}
              <span
                className={
                  Math.abs(det) < 1e-6 ? "text-warn" : "text-accent"
                }
              >
                {fmt(det, 3)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            The decomposition
          </div>
          {eig.diagonalizable && P && D && Pinv && verification ? (
            <div className="space-y-2 font-mono text-xs">
              <Block label="P (eigenvectors)" M={P} highlight />
              <Block label="D (eigenvalues on diagonal)" M={D} highlight />
              <Block label="P⁻¹" M={Pinv} highlight />
              <div className="border-t border-line pt-2 mt-2">
                <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
                  PDP⁻¹ ≈ A
                </div>
                <Block
                  label=""
                  M={verification}
                  highlight={false}
                  match={approxEqual(M, verification)}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-dim leading-relaxed py-3 px-1">
              {eig.hasComplex
                ? "Complex eigenvalues — A cannot be diagonalized over the reals. " +
                  "The two eigenvalues are conjugates; there are no real eigenvectors."
                : eig.repeated
                  ? `Repeated eigenvalue λ = ${fmt(eig.eigenvalues[0]?.re ?? 0, 3)}. ` +
                    `Check: is A = λI? ${Math.abs(M[0][0]! - (eig.eigenvalues[0]?.re ?? 0)) < 1e-6 && Math.abs(M[0][1]!) < 1e-6 && Math.abs(M[1][0]!) < 1e-6 ? "Yes" : "No — defective"}.`
                  : "Diagonalization not available."}
            </div>
          )}
        </div>
      </section>

      {/* Eigenvalue bars */}
      <div className="bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
          Eigenvalues · λ² − trace·λ + det = 0
        </div>
        {eig.hasComplex ? (
          <p className="text-xs text-warn font-mono">
            Eigenvalues are complex: λ = {fmt(eig.eigenvalues[0]?.re ?? 0, 3)} ±{" "}
            {fmt(Math.abs(eig.eigenvalues[0]?.im ?? 1), 3)} i · discriminant ={" "}
            {(M[0][0]! + M[1][1]!) ** 2 - 4 * det < 0 ? "negative" : "0"}
          </p>
        ) : (
          <BarsGraph
            values={eig.eigenvalues.map((l) => l.re)}
            labels={["λ₁", "λ₂"]}
            maxAbs={Math.max(
              3,
              ...eig.eigenvalues.map((l) => Math.abs(l.re)),
            )}
            width={undefined}
            height={120}
            className="w-full"
            highlights={[0, 1]}
          />
        )}
      </div>

      {/* Matrix heatmap */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-line rounded-xl p-3">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            A — the matrix being analyzed
          </div>
          <MatrixStripHeatmap
            matrix={M}
            maxAbs={Math.max(2, Math.abs(M[0][0]!), Math.abs(M[0][1]!), Math.abs(M[1][0]!), Math.abs(M[1][1]!))}
            className="w-full"
          />
        </div>
        <div className="bg-card border border-line rounded-xl p-3 flex flex-col justify-center">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 font-medium">
            The formula
          </div>
          <div className="font-mono text-base text-center text-ink py-3">
            A = P D P⁻¹
          </div>
          <p className="text-xs text-dim text-center">
            Snap to eigenbasis → scale by D → snap back.
          </p>
        </div>
      </div>

      {/* Step explainer */}
      <section className="bg-card border border-line rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-elev/30 transition"
          aria-expanded={showSteps}
        >
          <div className="flex items-center gap-2">
            <Info size={12} className="text-accent" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">
              What&apos;s happening — step by step
            </span>
          </div>
          <span className="text-faint">
            {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
        {showSteps && (
          <div className="border-t border-line p-3">
            <StepExplainer steps={explainerSteps} compact />
          </div>
        )}
      </section>
    </div>
  );
}

function Block({
  label,
  M,
  highlight,
  match,
}: {
  label: string;
  M: M;
  highlight?: boolean;
  match?: boolean;
}) {
  return (
    <div>
      {label && (
        <div className="text-[10px] text-faint uppercase tracking-wider mb-0.5">
          {label}
        </div>
      )}
      <div
        className={`grid grid-cols-2 gap-1 max-w-[140px] text-center text-[11px] rounded p-1 ${
          match
            ? "bg-correct/10 border border-correct/30"
            : highlight
              ? "bg-elev/40 border border-line"
              : "bg-elev/30 border border-line"
        }`}
      >
        <Cell v={M[0][0]} match={match} />
        <Cell v={M[0][1]} match={match} />
        <Cell v={M[1][0]} match={match} />
        <Cell v={M[1][1]} match={match} />
      </div>
    </div>
  );
}

function Cell({ v, match }: { v: number; match?: boolean }) {
  return (
    <div
      className={`px-1.5 py-0.5 font-mono ${match ? "text-correct" : "text-ink"}`}
    >
      {fmt(v, 3)}
    </div>
  );
}

function approxEqual(a: M, b: M, tol = 1e-6) {
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (Math.abs(a[i]![j]! - b[i]![j]!) > tol) return false;
    }
  }
  return true;
}
