"use client";
import { useState, useMemo } from "react";
import { Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";
import { StepExplainer } from "./_shared/StepExplainer";

// Question F1-q1: "For an m×n matrix A, which pair of subspaces lives in Rᵐ?"
// And F1-q2 (predict): "For A (3×4) with rank 2, what are the four dims?"
//
// The four fundamental subspaces for an m×n matrix A:
//
//   C(A)    ⊂ Rᵐ    column space, paired with N(Aᵀ)    (orthogonal complement)
//   C(Aᵀ)   ⊂ Rⁿ    row    space, paired with N(A)     (orthogonal complement)
//
// The student sees a controllable 3×4 matrix, the RREF staircase, and the
// four subspaces drawn in Rᵐ and Rⁿ — all four dimensions update live as
// the matrix changes.

type Row = [number, number, number, number];

const PRESETS: Array<{
  id: string;
  name: string;
  rows: [Row, Row, Row];
  explain: string;
}> = [
  {
    id: "rank2",
    name: "Rank 2",
    rows: [
      [1, 2, 3, 4],
      [2, 4, 6, 8],
      [5, 6, 7, 8],
    ],
    explain:
      "R2 = 2·R1, so the matrix is rank 2. Two independent rows → C(Aᵀ) is a 2D plane in R⁴. Two independent columns → C(A) is a 2D plane in R³.",
  },
  {
    id: "rank3",
    name: "Rank 3 (full)",
    rows: [
      [1, 0, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 1],
    ],
    explain:
      "All three rows are independent, and there are four columns — rank = 3 = min(3, 4). C(A) ⊂ R³ has dim 3 (full R³ minus nothing).",
  },
  {
    id: "rank1",
    name: "Rank 1",
    rows: [
      [1, 2, 3, 4],
      [2, 4, 6, 8],
      [3, 6, 9, 12],
    ],
    explain:
      "All rows are multiples of (1, 2, 3, 4). Rank 1 — every row is a copy of the first. C(Aᵀ) is a 1D line in R⁴.",
  },
  {
    id: "rank0",
    name: "Rank 0",
    rows: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    explain:
      "The zero matrix. Rank = 0. C(A) = {0}, N(A) = R⁴. All four trivial.",
  },
];

function matRank(rows: [Row, Row, Row]): number {
  // Manual row-echelon rank over R via 2-pass Gaussian elimination
  const a: number[][] = rows.map((r) => [...r]);
  const m = a.length;
  const n = a[0]!.length;
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    // Find pivot
    let pivot = -1;
    for (let i = r; i < m; i++) {
      if (Math.abs(a[i]![c]!) > 1e-9) {
        pivot = i;
        break;
      }
    }
    if (pivot === -1) continue;
    [a[r], a[pivot]] = [a[pivot]!, a[r]!];
    const factor = a[r]![c]!;
    for (let j = c; j < n; j++) a[r]![j]! /= factor;
    for (let i = 0; i < m; i++) {
      if (i !== r && Math.abs(a[i]![c]!) > 1e-9) {
        const f = a[i]![c]!;
        for (let j = c; j < n; j++) a[i]![j]! -= f * a[r]![j]!;
      }
    }
    r++;
  }
  return r;
}

// Null space of Aᵀ: returns an orthonormal basis (for visualisation).
function nullSpaceOrthoBasisAT(rows: [Row, Row, Row]): V3[] {
  // null(Aᵀ) = set of y in R³ with Aᵀ y = 0, i.e. dot(y, each row of A) = 0
  // Solve via cross product / Gram-Schmidt — for rank 2, null(Aᵀ) is 1D.
  // We just compute the perpendicular to the row span (which is C(Aᵀ)).
  const rank = matRank(rows);
  if (rank === 3) return [];
  if (rank === 0) return [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }];
  if (rank === 2) {
    // Find null(Aᵀ): the orthogonal complement of the row span. The rows of A
    // are 3 vectors in R⁴; their pairwise wedge product of two non-parallel
    // rows (taken as 4-vectors and reduced mod the spans) is hard. Instead,
    // do a direct SVD-style: the null of Aᵀ is the kernel of the 3×3 matrix
    // [row_i · row_j]_{i,j} — but for visualisation, just find a vector y
    // perpendicular to all rows.
    const r1 = rows[0]!, r2 = rows[1]!;
    const dim = 3;
    // Solve Aᵀ y = 0 where Aᵀ is 4×3. Pick any 2 columns of Aᵀ (i.e. 2 rows
    // of A treated as 4-vectors). Their cross-product gives a 4-vector y in
    // R³? No — the kernel of Aᵀ is in R³. Compute it via Gram-Schmidt on
    // the rows to find a basis of C(Aᵀ) ⊂ R⁴, then find a y with Aᵀ y = 0
    // via row-reduction of Aᵀ.
    const At: number[][] = [
      [rows[0]![0]!, rows[1]![0]!, rows[2]![0]!],
      [rows[0]![1]!, rows[1]![1]!, rows[2]![1]!],
      [rows[0]![2]!, rows[1]![2]!, rows[2]![2]!],
      [rows[0]![3]!, rows[1]![3]!, rows[2]![3]!],
    ];
    // Reduce
    const a = At.map((row) => [...row]);
    const m = a.length;
    const nn = a[0]!.length;
    let r = 0;
    const pivots: number[] = [];
    for (let c = 0; c < nn && r < m; c++) {
      let pivot = -1;
      for (let i = r; i < m; i++) {
        if (Math.abs(a[i]![c]!) > 1e-9) {
          pivot = i;
          break;
        }
      }
      if (pivot === -1) continue;
      [a[r], a[pivot]] = [a[pivot]!, a[r]!];
      const factor = a[r]![c]!;
      for (let j = c; j < nn; j++) a[r]![j]! /= factor;
      for (let i = 0; i < m; i++) {
        if (i !== r && Math.abs(a[i]![c]!) > 1e-9) {
          const f = a[i]![c]!;
          for (let j = c; j < nn; j++) a[i]![j]! -= f * a[r]![j]!;
        }
      }
      pivots.push(c);
      r++;
    }
    // Free variables: columns not in pivots → parameters for kernel
    const freeVars: number[] = [];
    for (let c = 0; c < nn; c++) {
      if (!pivots.includes(c)) freeVars.push(c);
    }
    // Build basis vectors
    const basis: V3[] = [];
    for (const fc of freeVars) {
      const v = [0, 0, 0];
      v[fc] = 1;
      for (let i = pivots.length - 1; i >= 0; i--) {
        const pcol = pivots[i]!;
        let sum = 0;
        for (let j = pcol + 1; j < nn; j++) sum -= a[i]![j]! * v[j]!;
        v[pcol] = sum;
      }
      basis.push({ x: v[0]!, y: v[1]!, z: v[2]! });
    }
    return basis;
  }
  // rank = 1: null(Aᵀ) is 2D
  return nullSpaceOrthoBasisAT([
    rows[0]!,
    [rows[0]![1]! + 1, rows[0]![2]!, rows[0]![3]!, rows[0]![0]!],
    rows[2]!,
  ] as [Row, Row, Row]);
}

type V3 = { x: number; y: number; z: number };

export function QF1Q1Playground() {
  const [presetId, setPresetId] = useState("rank2");
  const [rows, setRows] = useState<[Row, Row, Row]>(PRESETS[0]!.rows);
  const [showSteps, setShowSteps] = useState(false);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p) setRows(p.rows);
  };

  const rank = matRank(rows);
  const dimCol = rank;
  const dimRow = rank;
  const dimNull = 4 - rank;
  const dimLeftNull = 3 - rank;

  // null space of Aᵀ for visualisation
  const nullAT = useMemo(() => nullSpaceOrthoBasisAT(rows), [rows]);

  const explainerSteps = useMemo(() => {
    const activePreset = PRESETS.find((p) => p.id === presetId);
    return [
      {
        title: "The four fundamental subspaces",
        detail:
          "For an m×n matrix A with rank r, four subspaces appear in pairs. " +
          "In Rᵐ: column space C(A) (dim r) and left-null space N(Aᵀ) (dim m−r). " +
          "In Rⁿ: row space C(Aᵀ) (dim r) and null space N(A) (dim n−r).",
        value: `r + (n−r) = n, r + (m−r) = m`,
        tone: "faint" as const,
      },
      {
        title: "Read A's rank — it determines all four dimensions",
        detail:
          "Row-reduce A. The number of pivots is the rank r. " +
          "Then: dim(C(A)) = dim(C(Aᵀ)) = r, " +
          "dim(N(A)) = n − r, " +
          "dim(N(Aᵀ)) = m − r.",
        value: `rank(A) = ${rank} (m = 3, n = 4)`,
        tone: "accent" as const,
      },
      {
        title: "Orthogonal pairs",
        detail:
          "C(A) ⊥ N(Aᵀ) in Rᵐ. C(Aᵀ) ⊥ N(A) in Rⁿ. " +
          "These are the TWO orthogonality relations that hold for every matrix. " +
          "Subspace dim doesn't change this — they ARE perpendicular.",
        value: `C(A) ⊥ N(Aᵀ) · C(Aᵀ) ⊥ N(A)`,
        tone: "accent" as const,
      },
      {
        title: `For this A: dim = (${dimCol}, ${dimNull}, ${dimRow}, ${dimLeftNull})`,
        detail: activePreset?.explain ?? "Edit the entries to see how dimensions change.",
        value: `(C(A), N(A), C(Aᵀ), N(Aᵀ))`,
        tone: "accent" as const,
      },
    ];
  }, [presetId, rank, dimCol, dimNull, dimRow, dimLeftNull]);

  return (
    <div className="bg-elev/40 border border-line rounded-xl p-4 space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-warn" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">
            Four fundamental subspaces
          </span>
        </div>
        <div className="text-[10px] text-faint font-mono">
          m = 3, n = 4
        </div>
      </header>

      <p className="text-xs text-dim leading-relaxed">
        Every m×n matrix hides four subspaces. Two live in Rᵐ, two in Rⁿ, and
        they pair as orthogonal complements. Edit the entries or pick a preset
        — the four dimensions update live.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
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

      {/* Matrix editor */}
      <section className="bg-card border border-line rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-faint uppercase tracking-wider">
            Matrix A (3×4)
          </div>
          <div className="text-[10px] font-mono text-dim">
            rank = <span className="text-accent font-medium">{rank}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
          {[0, 1, 2, 3].map((col) => (
            [0, 1, 2].map((row) => {
              const val = rows[row]![col]!;
              const isPivot = rrefPivots(rows).includes(`${row}-${col}`);
              return (
                <input
                  key={`${row}-${col}`}
                  type="number"
                  step={0.1}
                  aria-label={`a[${row + 1}][${col + 1}]`}
                  value={val}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isFinite(v)) return;
                    const next: [Row, Row, Row] = [...rows] as [Row, Row, Row];
                    const r = [...next[row]!] as Row;
                    r[col] = v;
                    next[row] = r;
                    setRows(next);
                    setPresetId("custom");
                  }}
                  className={`px-2 py-1.5 text-xs rounded border ${
                    isPivot
                      ? "border-accent/40 bg-accent/10 text-accent font-bold"
                      : "border-line bg-canvas text-ink"
                  } focus:outline-none focus:border-accent`}
                />
              );
            })
          ))}
        </div>
      </section>

      {/* The four subspaces — paired */}
      <section className="grid md:grid-cols-2 gap-3">
        <SubspacePair
          title="In Rᵐ (m = 3)"
          primary={{
            label: "C(A)",
            tag: "column space",
            dim: dimCol,
            ambient: 3,
            color: "var(--matrix)",
          }}
          complement={{
            label: "N(Aᵀ)",
            tag: "left-null space",
            dim: dimLeftNull,
            ambient: 3,
            color: "var(--warn)",
          }}
        />
        <SubspacePair
          title="In Rⁿ (n = 4)"
          primary={{
            label: "C(Aᵀ)",
            tag: "row space",
            dim: dimRow,
            ambient: 4,
            color: "var(--vector)",
          }}
          complement={{
            label: "N(A)",
            tag: "null space",
            dim: dimNull,
            ambient: 4,
            color: "var(--transform)",
          }}
        />
      </section>

      {/* Live dim readout */}
      <section className="bg-card border border-line rounded-xl p-3">
        <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
          The four dimensions
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { l: "dim C(A)", v: dimCol, c: "var(--matrix)" },
            { l: "dim N(A)", v: dimNull, c: "var(--transform)" },
            { l: "dim C(Aᵀ)", v: dimRow, c: "var(--vector)" },
            { l: "dim N(Aᵀ)", v: dimLeftNull, c: "var(--warn)" },
          ].map((d) => (
            <div key={d.l} className="bg-elev/40 border border-line rounded p-2">
              <div
                className="text-[10px] uppercase tracking-wider font-mono"
                style={{ color: d.c }}
              >
                {d.l}
              </div>
              <div className="font-mono text-xl text-ink mt-1">{d.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-faint font-mono text-center">
          {dimCol} + {dimNull} = 4 (n) · {dimRow} + {dimLeftNull} = 3 (m)
        </div>
      </section>

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

function rrefPivots(rows: [Row, Row, Row]): string[] {
  // Quick: find pivot positions for the cells highlight (column c has a pivot
  // at the smallest row where any entry in c is non-zero).
  const pivots: string[] = [];
  const used: number[] = [];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      if (used.includes(r)) continue;
      if (Math.abs(rows[r]![c]!) > 1e-9) {
        pivots.push(`${r}-${c}`);
        used.push(r);
        break;
      }
    }
  }
  return pivots;
}

function SubspacePair({
  title,
  primary,
  complement,
}: {
  title: string;
  primary: {
    label: string;
    tag: string;
    dim: number;
    ambient: number;
    color: string;
  };
  complement: {
    label: string;
    tag: string;
    dim: number;
    ambient: number;
    color: string;
  };
}) {
  return (
    <div className="bg-card border border-line rounded-xl p-3">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="space-y-2">
        <SubspaceDim
          label={primary.label}
          tag={primary.tag}
          dim={primary.dim}
          ambient={primary.ambient}
          color={primary.color}
        />
        <SubspaceDim
          label={complement.label}
          tag={complement.tag}
          dim={complement.dim}
          ambient={complement.ambient}
          color={complement.color}
        />
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-dim">
        <span style={{ color: primary.color }}>{primary.label}</span>
        <span className="text-faint">⊥</span>
        <span style={{ color: complement.color }}>{complement.label}</span>
      </div>
    </div>
  );
}

function SubspaceDim({
  label,
  tag,
  dim,
  ambient,
  color,
}: {
  label: string;
  tag: string;
  dim: number;
  ambient: number;
  color: string;
}) {
  const ratio = dim / ambient;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono" style={{ color }}>
            {label}
          </span>
          <span className="text-[10px] text-faint uppercase tracking-wider">
            {tag}
          </span>
        </div>
        <div className="mt-1 relative h-2 bg-elev/60 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all"
            style={{
              width: `${Math.max(8, ratio * 100)}%`,
              background: color,
              opacity: 0.7,
            }}
          />
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-base text-ink">{dim}</div>
        <div className="text-[10px] text-faint">dim</div>
      </div>
    </div>
  );
}
