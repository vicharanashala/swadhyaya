"use client";
import Link from "next/link";
import { Lock, Check, Circle, ArrowRight, Trophy, Zap } from "lucide-react";
import {
  CONCEPTS,
  PHASES,
  type ConceptId,
  getUnlocked,
} from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { ProctoringInlineStatus } from "@/components/proctor/ProctoringInlineStatus";
import { cn } from "@/lib/cn";
import { useMemo } from "react";

export default function LearnMap() {
  const completed = useProgress((s) => s.completed);

  // Build concept lookup once per completed change.
  const completedSet = useMemo(() => new Set<ConceptId>(completed), [completed]);
  const unlockedSet = useMemo(() => getUnlocked(completedSet), [completedSet]);
  const phaseConcepts = useMemo(
    () =>
      PHASES.map((p) => ({
        phase: p,
        concepts: CONCEPTS.filter((c) => c.phase === p.id),
      })),
    [],
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-ink">The full chain</h1>
        <p className="mt-1 text-sm text-dim max-w-2xl">
          {CONCEPTS.length} concepts across {PHASES.length} phases. Lock in the
          intuition of one to unlock the next. No skipping. No broken chains.
        </p>
        <ProctoringInlineStatus className="mt-3" />
        <NextUpBanner completedSet={completedSet} />
        {showDevTools && <DevUnlockAll />}
      </header>

      <div className="space-y-10">
        {phaseConcepts.map(({ phase, concepts }) => {
          const done = concepts.filter((c) => completedSet.has(c.id)).length;
          return (
            <section key={phase.id}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-6 rounded-sm"
                      style={{ background: phase.color }}
                      aria-hidden="true"
                    />
                    <span className="text-xs text-dim uppercase tracking-wider">
                      Phase {phase.id}
                    </span>
                  </div>
                  <h2 className="mt-1 font-serif text-xl text-ink">
                    {phase.title}
                  </h2>
                  <p className="text-xs text-dim mt-0.5">{phase.subtitle}</p>
                </div>
                <div className="text-xs text-faint font-mono">
                  {done}/{concepts.length} locked in
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {concepts.map((c) => (
                  <ConceptCard
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    short={c.short}
                    phase={c.phase}
                    xp={c.xp}
                    isDone={completedSet.has(c.id)}
                    isUnlocked={unlockedSet.has(c.id)}
                    color={phase.color}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ConceptCard({
  id,
  title,
  short,
  phase,
  xp,
  isDone,
  isUnlocked,
  color,
}: {
  id: ConceptId;
  title: string;
  short: string;
  phase: number;
  xp: number;
  isDone: boolean;
  isUnlocked: boolean;
  color: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: `${color}20`, color }}
        >
          {id}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-faint">
          {isDone ? (
            <Check size={11} className="text-accent" aria-hidden="true" />
          ) : isUnlocked ? (
            <Circle size={11} aria-hidden="true" />
          ) : (
            <Lock size={11} aria-hidden="true" />
          )}
          <span className="font-mono">+{xp}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-ink leading-snug">{title}</h3>
      <p className="mt-1 text-xs text-dim leading-relaxed line-clamp-2">
        {short}
      </p>
      {isUnlocked && (
        <div className="mt-2 text-[10px] text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <span>Open</span>
          <ArrowRight size={10} aria-hidden="true" />
        </div>
      )}
    </>
  );

  const baseClass = cn(
    "group relative p-3 rounded-lg border transition block",
    isUnlocked
      ? "border-line bg-elev/40 hover:bg-elev/80 hover:border-accent/40 cursor-pointer"
      : "border-line/50 bg-elev/10 opacity-60 cursor-not-allowed",
    isDone && "ring-1 ring-accent/30",
  );

  if (isUnlocked) {
    return (
      <Link href={`/learn/${id}`} className={baseClass}>
        {content}
      </Link>
    );
  }
  return (
    <div
      className={baseClass}
      role="group"
      aria-disabled="true"
      aria-label={`${title} (locked)`}
    >
      {content}
    </div>
  );
}

function NextUpBanner({
  completedSet,
}: {
  completedSet: Set<ConceptId>;
}) {
  const next = useMemo(
    () =>
      CONCEPTS.find((c) => {
        if (completedSet.has(c.id)) return false;
        return c.prereqs.every((p) => completedSet.has(p));
      }),
    [completedSet],
  );

  if (!next) {
    return (
      <div className="mt-4 bg-accent/10 border border-accent/40 rounded-xl p-4 flex items-center gap-3">
        <Trophy size={18} className="text-accent shrink-0" aria-hidden="true" />
        <div>
          <div className="text-sm text-accent font-medium">
            You&apos;ve locked in the full chain.
          </div>
          <div className="text-xs text-dim mt-0.5">
            Every concept is unlocked. Revisit any to deepen the intuition.
          </div>
        </div>
      </div>
    );
  }
  return (
    <Link
      href={`/learn/${next.id}`}
      className="mt-4 block bg-card border border-accent/30 rounded-xl p-4 hover:bg-elev/60 transition group"
    >
      <div className="text-[10px] text-faint uppercase tracking-wider mb-1">
        Up next
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elev/40 text-accent">
          {next.id}
        </span>
        <div className="flex-1">
          <div className="text-sm text-ink group-hover:text-accent transition">
            {next.title}
          </div>
          <div className="text-xs text-dim mt-0.5">{next.short}</div>
        </div>
        <ArrowRight
          size={14}
          className="text-accent shrink-0 group-hover:translate-x-0.5 transition"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

// Dev-only unlock-all. Statically dead-code-eliminated in production builds
// via the `showDevTools` constant — Next.js replaces `process.env.NODE_ENV`
// at build time, so this branch and the component itself are tree-shaken.
const showDevTools = process.env.NODE_ENV !== "production";

function DevUnlockAll() {
  const handleUnlock = () => {
    const store = useProgress.getState();
    const ids = CONCEPTS.map((c) => c.id);
    const xp = CONCEPTS.reduce((s, c) => s + c.xp, 0);
    useProgress.setState({
      completed: ids,
      xp,
      streak: Math.max(store.streak, 1),
      lastVisit: new Date().toISOString().slice(0, 10),
      lensModes: store.lensModes,
    });
  };
  return (
    <button
      onClick={handleUnlock}
      className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-faint hover:text-warn transition"
      title="Dev only — unlock everything for QA"
    >
      <Zap size={11} aria-hidden="true" />
      Dev: unlock all
    </button>
  );
}