"use client";
import { useState, useMemo } from "react";
import { matRref, matRank, fmt } from "@/lib/math";
import { ArrowRight, RotateCcw } from "lucide-react";

const PRESETS: Array<{ name: string; M: number[][] }> = [
  {
    name: "Simple 2x2",
    M: [[2, 3, 7], [3, 4, 10]],
  },
  {
    name: "Three planes",
    M: [[1, 1, 1, 6], [1, 2, 3, 14], [2, 1, 0, 5]],
  },
  {
    name: "No solution",
    M: [[1, 1, 1], [1, 1, 2], [1, 1, 3]],
  },
  {
    name: "Hill cipher",
    M: [[2, 3, 96], [3, 4, 134]],
  },
];

type Op = "swap" | "scale" | "add";

export function RREFPlayground() {
  const [M, setM] = useState(PRESETS[0].M);

  const { rref, pivots, rank } = useMemo(() => matRref(M), [M]);
  const [m, n] = [M.length, M[0].length - 1]; // augmented

  const applyOp = (op: Op, i: number, j: number, k: number = 1) => {
    const next = M.map((r) => [...r]);
    if (op === "swap") {
      [next[i], next[j]] = [next[j], next[i]];
    } else if (op === "scale") {
      if (k === 0) return;
      for (let c = 0; c < next[i].length; c++) next[i][c] *= k;
    } else if (op === "add") {
      for (let c = 0; c < next[i].length; c++) next[i][c] += k * next[j][c];
    }
    setM(next);
  };

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-ink">
          Solve the system — click the operations
        </h3>
        <select
          value={M.flat().join(",")}
          onChange={(e) => {
            const p = PRESETS.find((p) => p.M.flat().join(",") === e.target.value);
            if (p) setM(p.M);
          }}
          className="bg-elev border border-line text-ink text-xs rounded px-2 py-1"
        >
          {PRESETS.map((p) => (
            <option key={p.name} value={p.M.flat().join(",")}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Your matrix</div>
          <MatrixEditor M={M} setM={setM} onOp={applyOp} />
        </div>
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>RREF (computed automatically)</span>
            <span className="text-accent">rank = {rank}</span>
          </div>
          <div className="bg-elev/30 border border-line rounded-md p-3 font-mono text-sm">
            {rref.map((row, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-faint w-6">{i + 1}.</span>
                <span>
                  {row.slice(0, n).map((x, j) => (
                    <span key={j} className={pivots.includes(j) ? "text-accent" : "text-ink"}>
                      {fmt(x, 3)}
                      {j < n - 1 ? "  " : ""}
                    </span>
                  ))}
                  <span className="text-faint"> | </span>
                  <span className={pivots.length === m ? "text-warn" : "text-ink"}>
                    {fmt(row[n], 3)}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-dim leading-relaxed">
            {pivots.length === m && (
              <span className="text-accent">Unique solution. </span>
            )}
            {pivots.length < m && pivots.length > 0 && (
              <span className="text-warn">Infinite solutions. </span>
            )}
            {pivots.length === 0 && (
              <span className="text-warn">No solution or trivial. </span>
            )}
            Read the answer from the RREF — the right column gives x, y, z.
          </div>
        </div>
      </div>
    </div>
  );
}

function MatrixEditor({
  M,
  setM,
  onOp,
}: {
  M: number[][];
  setM: (m: number[][]) => void;
  onOp: (op: "swap" | "scale" | "add", i: number, j: number, k?: number) => void;
}) {
  const [ops, setOps] = useState<{ row: number; col: number; op: string }[]>([]);
  void setM;
  return (
    <div>
      <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm">
        {M.map((row, i) => (
          <div key={i} className="flex gap-3 items-center">
            <span className="text-faint w-6">R{i + 1}</span>
            <span className="flex-1">
              {row.map((x, j) => (
                <span key={j}>
                  {j === M[0].length - 1 && <span className="text-faint"> | </span>}
                  <span className="text-ink">{fmt(x, 2)}</span>
                  {j < row.length - 1 ? "  " : ""}
                </span>
              ))}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onOp("scale", i, 0, 0.5)}
                className="text-[10px] text-faint hover:text-ink px-1"
                title="scale by 0.5"
              >½</button>
              <button
                onClick={() => onOp("scale", i, 0, 2)}
                className="text-[10px] text-faint hover:text-ink px-1"
                title="scale by 2"
              >2×</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10px] text-faint uppercase tracking-wider mb-1">Row operations</div>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => onOp("swap", 0, 1)}
          className="px-2 py-1 bg-elev border border-line rounded text-dim hover:text-ink"
        >
          swap R1 ↔ R2
        </button>
        <button
          onClick={() => onOp("add", 1, 0, -1)}
          className="px-2 py-1 bg-elev border border-line rounded text-dim hover:text-ink"
        >
          R2 = R2 - R1
        </button>
        <button
          onClick={() => onOp("add", 0, 1, -1)}
          className="px-2 py-1 bg-elev border border-line rounded text-dim hover:text-ink"
        >
          R1 = R1 - R2
        </button>
      </div>
    </div>
  );
}
