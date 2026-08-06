"use client";
import { useId } from "react";
import { cn } from "@/lib/cn";

// Reusable step-explainer for matrix-based playgrounds. Two layouts:
//
//   • "list"     — default. Compact, monospaced numbered grid. Good when
//                  the student is scanning for a value.
//   • "timeline" — vertical timeline with numbered circles connected by
//                  a line. Easier to follow as a story. Used when the
//                  explainer is the main focus of the panel (e.g. folded
//                  into a small space as a "step by step" expander).
//
// Pattern lifted from vicharanashala/tenali's `solve-timeline` block
// (App.jsx ~renderFeedback). Swadhyaya chose line+circle-with-glow over
// solid dots so the warm theme doesn't fight a heavy block.
//
// Steps are objects with:
//   - title: short noun phrase (e.g. "Form the augmented matrix")
//   - detail: a longer explanation of WHAT we're computing and WHY
//   - value: live, formatter-applied string shown in the right column
//   - tone: optional accent ("accent" | "warn" | "faint") to colour
//           the value column when it's a key insight (e.g. det = 0)

export type StepVariant = "list" | "timeline";

export interface Step {
  title: string;
  detail: string;
  value: string;
  tone?: "accent" | "warn" | "faint";
}

export function StepExplainer({
  steps,
  title = "What's happening — the math behind the picture",
  className,
  compact = false,
  variant = "timeline",
}: {
  steps: Step[];
  title?: string;
  className?: string;
  compact?: boolean;
  variant?: StepVariant;
}) {
  const uid = useId();
  return (
    <div
      className={cn(
        "bg-card border border-line rounded-xl overflow-hidden",
        className,
      )}
    >
      <div className="px-4 py-2 border-b border-line bg-elev/30">
        <div className="text-[10px] text-faint uppercase tracking-wider font-medium">
          {title}
        </div>
      </div>
      {variant === "timeline" ? (
        <Timeline steps={steps} uid={uid} compact={compact} />
      ) : (
        <List steps={steps} uid={uid} compact={compact} />
      )}
    </div>
  );
}

function List({
  steps,
  uid,
  compact,
}: {
  steps: Step[];
  uid: string;
  compact: boolean;
}) {
  return (
    <ol className="divide-y divide-line">
      {steps.map((s, i) => (
        <li
          key={`${uid}-${i}`}
          className={cn(
            "px-4 py-3 grid gap-3",
            compact ? "grid-cols-[20px_1fr_auto]" : "grid-cols-[24px_1fr_auto]",
          )}
        >
          <div
            className="text-[10px] font-mono text-faint pt-0.5 tabular-nums"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                "text-xs font-medium text-ink",
                compact && "text-[11px]",
              )}
            >
              {s.title}
            </div>
            <div
              className={cn(
                "text-[11px] text-dim leading-relaxed mt-0.5",
                compact && "text-[10px]",
              )}
            >
              {s.detail}
            </div>
          </div>
          <ValuePill step={s} compact={compact} />
        </li>
      ))}
    </ol>
  );
}

function Timeline({
  steps,
  uid,
  compact,
}: {
  steps: Step[];
  uid: string;
  compact: boolean;
}) {
  return (
    <ol className="px-4 py-4 space-y-3">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const toneRing =
          s.tone === "warn"
            ? "border-warn/60 bg-warn/10 text-warn"
            : s.tone === "accent"
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-line bg-elev/50 text-ink";
        return (
          <li
            key={`${uid}-${i}`}
            className="relative flex gap-3 items-start"
          >
            {/* Connector line. `aria-hidden` so screen-readers don't
                read it as a separate item. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-[28px] bottom-[-12px] w-px bg-line/80"
              />
            )}
            <div
              aria-hidden="true"
              className={cn(
                "shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-mono tabular-nums relative z-10",
                toneRing,
              )}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div
                className={cn(
                  "font-medium text-ink",
                  compact ? "text-[11px]" : "text-xs",
                )}
              >
                {s.title}
              </div>
              <div
                className={cn(
                  "text-dim leading-relaxed mt-0.5",
                  compact ? "text-[10px]" : "text-[11px]",
                )}
              >
                {s.detail}
              </div>
              <ValuePill step={s} compact={compact} className="mt-1.5" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ValuePill({
  step,
  compact,
  className,
}: {
  step: Step;
  compact: boolean;
  className?: string;
}) {
  const toneClass =
    step.tone === "accent"
      ? "text-accent"
      : step.tone === "warn"
        ? "text-warn"
        : "text-ink";
  return (
    <div
      className={cn(
        "font-mono whitespace-nowrap self-start",
        compact ? "text-[10px]" : "text-xs",
        toneClass,
        // When used standalone (timeline case) it's inline-block; in the
        // list case it's a grid column.
        !className && "pt-0.5",
        className,
      )}
      aria-label={`${step.title}: ${step.value}`}
    >
      {step.value}
    </div>
  );
}

// Helper to build the "story" of solving a 3×3 linear system. Returns
// the steps array for <StepExplainer>. We split the work into pieces
// that students can read sequentially: form the matrix, compute the
// determinant, row-reduce, find pivots, classify the solution.
//
// Used by QL3Q1Playground + the main Planes3DPlayground's collapsed
// DetailsTable so the live story is consistent across the two
// surfaces.
export function buildSystemSolveSteps(args: {
  rows: [number, number, number, number][];
  rref: number[][];
  pivots: number[];
  rank: number;
  solution:
    | { type: "unique"; sol: number[] }
    | { type: "infinite"; rank: number }
    | { type: "none" };
  det?: number;
  formatNum?: (n: number) => string;
}): Step[] {
  const f = args.formatNum ?? ((n: number) => n.toFixed(2));
  const steps: Step[] = [];

  steps.push({
    title: "Form the augmented matrix [A | b]",
    detail:
      "Stack the three planes' coefficients into a 3×3 matrix A, " +
      "then append the right-hand side (b) as a fourth column. " +
      "This converts three equations into one object we can manipulate.",
    value: `[${args.rows.map((r) => `[${r.slice(0, 3).map(f).join(", ")}]`).join(" ")} | [${args.rows.map((r) => f(r[3]!)).join(", ")}]]`,
    tone: "faint",
  });

  if (args.det !== undefined) {
    steps.push({
      title: "Compute det(A) — does the system have a unique answer?",
      detail:
        "det(A) ≠ 0 means A inverts — the three rows are linearly " +
        "independent and exactly one (x, y, z) satisfies all three " +
        "equations. det(A) = 0 means at least two planes are parallel " +
        "or coincident — unique answer is lost.",
      value: `det(A) = ${f(args.det)}`,
      tone:
        Math.abs(args.det) < 1e-6
          ? "warn"
          : Math.abs(args.det) < 0.5
            ? "warn"
            : "accent",
    });
  }

  steps.push({
    title: "Row-reduce — eliminate below the diagonal",
    detail:
      "Use three moves that preserve the solution: swap rows, " +
      "scale by non-zero, add a multiple. Sweep down-left to " +
      "create a staircase shape where every entry below each pivot " +
      "is zero.",
    value: `${args.rank} of 3 pivots`,
    tone: args.rank === 3 ? "accent" : "warn",
  });

  steps.push({
    title: "Read the pivots — they identify which variables are determined",
    detail:
      "A pivot in column j means xⱼ is uniquely solvable from " +
      "that row. Columns without a pivot are 'free' — the system " +
      "can't pin them down, so it has infinitely many solutions.",
    value:
      args.pivots.length === 0
        ? "no pivots"
        : `pivots at ${args.pivots.map((p) => "xyz"[p] ?? "?").join(", ")}`,
    tone: "faint",
  });

  if (args.solution.type === "unique") {
    steps.push({
      title: "Read off the answer from the pivots",
      detail:
        "Each pivot row reads xⱼ = (RHS entry). Three pivots give " +
        "a complete (x, y, z) — the gold sphere in the 3D picture " +
        "lands on this point.",
      value: `(${args.solution.sol.map(f).join(", ")})`,
      tone: "accent",
    });
  } else if (args.solution.type === "infinite") {
    steps.push({
      title: "Find the free variable — it parameterises an infinite family",
      detail:
        "The non-pivot column lets x vary. Write the pivot variables " +
        "as linear functions of the free one — every choice of t " +
        "produces a new (x, y, z) on the dashed line.",
      value: `rank ${args.solution.rank}, ${3 - args.solution.rank} free`,
      tone: "warn",
    });
  } else {
    steps.push({
      title: "Spot the inconsistency — a row says 0 = nonzero",
      detail:
        "After reduction one row reads 0 · x + 0 · y + 0 · z = " +
        "something nonzero. No (x, y, z) can satisfy that, so the " +
        "three planes contradict — there's no common point.",
      value: "inconsistent",
      tone: "warn",
    });
  }

  return steps;
}
