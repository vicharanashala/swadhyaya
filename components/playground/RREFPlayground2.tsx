"use client";
import { useState, useMemo } from "react";
import { matRref, fmt } from "@/lib/math";
import { Sparkles, RotateCcw } from "lucide-react";

// Concept L7: RREF — Row-Reduced Echelon Form
// "Take the staircase FURTHER. Every pivot = 1, everything above is zero too. UNIQUE."

const PRESETS = [
  { name: "Unique answer", M: [[2, 3, 16], [5, 8, 37]] },
  { name: "Infinite answers", M: [[1, 2, 1], [2, 4, 2]] },
  { name: "No answer", M: [[1, 1, 3], [2, 2, 5]] },
  { name: "Hill cipher", M: [[2, 3, 7], [3, 5, 11]] },
];

export function RREFPlayground2() {
  const [M, setM] = useState(PRESETS[0].M);

  const { rref, pivots } = useMemo(() => matRref(M), [M]);
  const [m, n] = [M.length, M[0].length - 1];

  // Determine solution type
  const solution = useMemo(() => {
    // Check last column: if any pivot column is in the augmented column, no solution
    const augRank = pivots.filter((c) => c < n).length;
    const augFullRank = rref.every((row, i) => {
      const augVal = row[n];
      const restZero = row.slice(0, n).every((v) => Math.abs(v) < 1e-9);
      if (restZero && Math.abs(augVal) > 1e-9) return false;
      return true;
    });
    if (!augFullRank) return { type: "none", text: "No solution — the equations contradict." };
    if (augRank < n) return { type: "infinite", text: `Infinite solutions — ${n - augRank} free variable(s).` };
    return { type: "unique", text: "One unique solution." };
  }, [rref, pivots, n]);

  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-ink">
          The unique final form
        </h3>
        <button
          onClick={() => setM(PRESETS[0].M.map(r => [...r]))}
          className="text-xs text-dim hover:text-ink flex items-center gap-1"
        >
          <RotateCcw size={11} /> reset
        </button>
      </div>
      <p className="text-xs text-dim mb-4">
        Take echelon form one step further. Every pivot is <span className="text-accent">1</span>,
        and everything <span className="text-ink">above</span> each pivot is zero too.
        The result is RREF — and it's <span className="text-accent font-medium">unique</span> for
        every system.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">Original [A | b]</div>
          <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
            {M.map((row, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-faint text-xs w-4">{i + 1}.</span>
                {row.map((v, j) => (
                  <span key={j} className={`w-12 text-right ${j === n ? "text-warn" : "text-ink"}`}>
                    {fmt(v)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2">
            RREF (unique)
          </div>
          <div className="bg-canvas border border-line rounded-md p-3 font-mono text-sm space-y-1">
            {rref.map((row, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-faint text-xs w-4">{i + 1}.</span>
                {row.slice(0, n).map((x, j) => {
                  const isPivot = pivots.includes(j);
                  return (
                    <span
                      key={j}
                      className={`w-12 text-right ${
                        isPivot ? "text-accent font-medium" :
                        Math.abs(x) < 1e-9 ? "text-faint" : "text-ink"
                      }`}
                    >
                      {fmt(x, 3)}
                    </span>
                  );
                })}
                <span className="text-faint">|</span>
                <span className={`w-12 text-right ${pivots.length < m && row.slice(0,n).every(v=>Math.abs(v)<1e-9) ? "text-warn" : "text-accent"}`}>
                  {fmt(row[n], 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setM(p.M.map(r => [...r]))}
            className="text-xs px-2 py-1 border border-line rounded hover:bg-elev/60 text-dim hover:text-ink"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className={`mt-4 rounded-md p-3 text-sm flex items-start gap-2 ${
        solution.type === "none" ? "bg-warn/10 text-warn border border-warn/30" :
        solution.type === "infinite" ? "bg-warn/10 text-warn border border-warn/30" :
        "bg-accent/10 text-accent border border-accent/30"
      }`}>
        <Sparkles size={14} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-medium mb-0.5">
            {solution.type === "unique" && "Unique solution."}
            {solution.type === "infinite" && "Infinite solutions."}
            {solution.type === "none" && "No solution."}
          </div>
          <div className="text-xs opacity-80">{solution.text}</div>
        </div>
      </div>
    </div>
  );
}
