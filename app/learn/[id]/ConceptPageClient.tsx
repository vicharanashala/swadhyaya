"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CONCEPT_BY_ID,
  PHASES,
  getNextConceptId,
  getUnlocked,
  type ConceptId,
} from "@/lib/curriculum";
import { useProgress, useIsUnlocked } from "@/lib/progress";
import { QUESTIONS_BY_CONCEPT, type Question } from "@/lib/questions";
import { Playground } from "@/components/playground/Playground";
import { QuestionCard } from "@/components/question/QuestionCard";
import { QuestionNav } from "@/components/question/QuestionNav";
import {
  ConceptCompletionCard,
  PASS_THRESHOLD,
} from "@/components/chrome/ConceptCompletionCard";
import { ProctorPanel } from "@/components/proctor/ProctorPanel";
import { Lock, Check, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

// Themed confetti (warm-brown / orange / gold / cream) — matches the
// SVG keyframes in ConceptCompletionCard's score ring.
const fireConfetti = async () => {
  if (typeof window === "undefined") return;
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  const mod = await import("canvas-confetti");
  mod.default({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.55 },
    colors: ["#e8864a", "#ff9800", "#ffb300", "#d27c3c", "#a16738", "#ede8e3"],
    disableForReducedMotion: true,
  });
  mod.default({
    particleCount: 40,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.65 },
    colors: ["#e8864a", "#ffb300", "#a16738"],
    disableForReducedMotion: true,
  });
  mod.default({
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.65 },
    colors: ["#ff9800", "#d27c3c", "#ede8e3"],
    disableForReducedMotion: true,
  });
};

type Tab = "story" | "play" | "test";

export function ConceptPage({ id }: { id: ConceptId }) {
  const router = useRouter();
  const concept = CONCEPT_BY_ID[id];

  const isUnlocked = useIsUnlocked(concept.id);
  const isDone = useProgress((s) => s.completed.includes(concept.id));
  const complete = useProgress((s) => s.complete);
  const completed = useProgress((s) => s.completed);

  const [tab, setTab] = useState<Tab>("story");
  const [puzzleSolved, setPuzzleSolved] = useState(isDone);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const map: Record<string, Tab | ""> = {
        "1": "story",
        "2": "play",
        "3": "test",
      };
      const next = map[e.key];
      if (next) {
        e.preventDefault();
        setTab(next);
      } else if (e.key === "Escape") {
        router.back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const phaseMeta = useMemo(
    () => PHASES.find((p) => p.id === concept.phase)!,
    [concept.phase],
  );

  const nextId = useMemo(() => getNextConceptId(concept.id), [concept.id]);
  const nextConcept = nextId ? CONCEPT_BY_ID[nextId] : null;
  const nextUnlocked = nextId
    ? getUnlocked(new Set(completed)).has(nextId)
    : false;

  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="bg-card border border-line rounded-xl p-8 text-center">
          <Lock size={32} className="mx-auto text-faint" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-2xl text-ink">Locked</h1>
          <p className="mt-2 text-sm text-dim">
            Complete the prerequisites first to unlock this concept.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {concept.prereqs.map((p) => {
              const c = CONCEPT_BY_ID[p];
              const done = completed.includes(p);
              return (
                <Link
                  key={p}
                  href={`/learn/${p}`}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs border",
                    done
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-line bg-elev text-dim",
                  )}
                >
                  {done && (
                    <Check
                      size={10}
                      className="inline mr-1"
                      aria-hidden="true"
                    />
                  )}
                  {c.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const questions = QUESTIONS_BY_CONCEPT[concept.id] ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-xs text-dim hover:text-ink mb-4"
      >
        <ArrowLeft size={12} aria-hidden="true" /> Course map
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: `${phaseMeta.color}20`, color: phaseMeta.color }}
          >
            {concept.id}
          </span>
          <span className="text-[10px] text-faint uppercase tracking-wider">
            Phase {concept.phase} · {phaseMeta.title}
          </span>
          <span className="text-[10px] text-faint" aria-hidden="true">
            ·
          </span>
          <span className="text-[10px] text-warn">+{concept.xp} XP</span>
        </div>
        <h1 className="font-serif text-3xl text-ink">{concept.title}</h1>
        <p className="mt-1 text-base text-dim">{concept.short}</p>
      </header>

      <nav
        className="flex items-center gap-1 border-b border-line mb-6 overflow-x-auto"
        role="tablist"
        aria-label="Concept sections"
      >
        <TabButton
          active={tab === "story"}
          onClick={() => setTab("story")}
          n={1}
          id="tab-story"
        >
          Story
        </TabButton>
        <TabButton
          active={tab === "play"}
          onClick={() => setTab("play")}
          n={2}
          id="tab-play"
        >
          Playground
        </TabButton>
        <TabButton
          active={tab === "test"}
          onClick={() => setTab("test")}
          n={3}
          id="tab-test"
        >
          Test
        </TabButton>
        {puzzleSolved && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-accent">
            <Check size={12} aria-hidden="true" /> Locked in
          </span>
        )}
        <span className="ml-auto hidden lg:inline-flex items-center gap-2 text-[10px] text-faint font-mono">
          <kbd className="px-1.5 py-0.5 rounded border border-line bg-elev/50">
            1–3
          </kbd>
          tabs
          <kbd className="px-1.5 py-0.5 rounded border border-line bg-elev/50 ml-1">
            Esc
          </kbd>
          back
        </span>
      </nav>

      {tab === "story" && <StoryTab story={concept.story} />}
      {tab === "play" && <Playground id={concept.playground} />}
      {tab === "test" && (
        <TestTab
          conceptId={concept.id}
          questions={questions}
          onPass={() => {
            complete(concept.id, concept.xp);
            setPuzzleSolved(true);
            fireConfetti();
          }}
          alreadyDone={isDone}
          nextConcept={
            nextConcept
              ? {
                  id: nextConcept.id,
                  title: nextConcept.title,
                  short: nextConcept.short,
                  phase: nextConcept.phase,
                  xp: nextConcept.xp,
                }
              : null
          }
          nextUnlocked={nextUnlocked}
          onGoToNext={() => router.push(`/learn/${nextConcept?.id}`)}
          onRetake={() => {
            // Force the student to re-watch the story & play with the
            // playground before retaking. Reset all answers and switch
            // to the story tab.
            setTab("story");
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  n,
  id,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  n: number;
  id: string;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      id={id}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      className={cn(
        "px-4 py-2.5 text-sm border-b-2 -mb-px transition",
        active
          ? "border-accent text-ink"
          : "border-transparent text-dim hover:text-ink",
      )}
    >
      <span className="text-faint mr-1.5 font-mono text-[10px]">{n}</span>
      {children}
    </button>
  );
}

function StoryTab({ story }: { story: string }) {
  return (
    <div className="grid md:grid-cols-[1fr_240px] gap-6">
      <div className="prose prose-invert max-w-none">
        <div className="font-serif text-lg leading-relaxed text-ink/90 whitespace-pre-line">
          {story}
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-card border border-line rounded-xl p-4">
          <div className="text-[10px] text-faint uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles size={10} className="text-warn" aria-hidden="true" />
            What to notice
          </div>
          <ul className="text-xs text-dim space-y-1.5 list-disc list-inside leading-relaxed">
            <li>The story is the entry — the math is the formal layer</li>
            <li>When you see a number, ask: what does it MEAN in the story?</li>
            <li>Open the playground — play with the controls</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Minimum score to advance to the next story. Below this the student
// must re-watch the story / play with the playground before retaking.
// Lives in ConceptCompletionCard (re-exported here for ergonomics).

function TestTab({
  conceptId,
  questions,
  onPass,
  alreadyDone,
  nextConcept,
  nextUnlocked,
  onGoToNext,
  onRetake,
}: {
  conceptId: string;
  questions: Question[];
  onPass: () => void;
  alreadyDone: boolean;
  nextConcept: {
    id: string;
    title: string;
    short: string;
    phase: number;
    xp: number;
  } | null;
  nextUnlocked: boolean;
  onGoToNext: () => void;
  onRetake: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});

  // Proctor wiring: attemptId is local to this TestTab lifetime; we
  // hand it to the <ProctorPanel> which manages the rest via localStorage.
  const [proctorAttemptId, setProctorAttemptId] = useState<string | null>(null);

  const correctCount = useMemo(
    () => Object.values(correctMap).filter(Boolean).length,
    [correctMap],
  );

  if (!questions.length) {
    return (
      <div className="bg-card border border-line rounded-xl p-6 text-center text-dim">
        Questions coming soon for this concept.
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;
  const answeredCount = Object.keys(submitted).length;
  const finished = answeredCount === questions.length;
  const scorePct = finished ? (correctCount / questions.length) * 100 : 0;
  const passed = finished && scorePct >= PASS_THRESHOLD * 100;
  const needed = Math.ceil(PASS_THRESHOLD * questions.length);

  const handleCheck = () => {
    const chosenId = answers[q.id];
    if (!chosenId) return;
    const chosen = q.options.find((o) => o.id === chosenId);
    if (chosen?.correct) {
      setSubmitted({ ...submitted, [q.id]: true });
      setCorrectMap({ ...correctMap, [q.id]: true });
    } else {
      setSubmitted({ ...submitted, [q.id]: true });
      setCorrectMap({ ...correctMap, [q.id]: false });
      setWrongAttempts({
        ...wrongAttempts,
        [q.id]: (wrongAttempts[q.id] || 0) + 1,
      });
    }
  };

  const handleRetry = () => {
    const newSub = { ...submitted };
    delete newSub[q.id];
    setSubmitted(newSub);
  };

  const handleFullReset = () => {
    setIdx(0);
    setAnswers({});
    setSubmitted({});
    setCorrectMap({});
    setShowHint({});
    setWrongAttempts({});
    setProctorAttemptId(null);
    onRetake();
  };

  return (
    <div className="grid md:grid-cols-[1fr_240px] gap-6">
      <div className="space-y-4">
        <ProctorPanel
          conceptId={conceptId}
          status={
            finished ? "finished" : proctorAttemptId ? "running" : "idle"
          }
          result={
            finished
              ? {
                  score: correctCount,
                  total: questions.length,
                  passed,
                }
              : undefined
          }
          onStart={(id) => setProctorAttemptId(id)}
          onEnd={() => setProctorAttemptId(null)}
          resumeAttemptId={proctorAttemptId}
        />

        <QuestionCard
          question={q}
          index={idx}
          total={questions.length}
          selected={answers[q.id]}
          submitted={!!submitted[q.id]}
          isCorrect={correctMap[q.id] === true}
          showHint={!!showHint[q.id]}
          wrongAttempts={wrongAttempts[q.id] || 0}
          isLast={idx === questions.length - 1}
          onSelect={(id) => setAnswers({ ...answers, [q.id]: id })}
          onCheck={handleCheck}
          onShowHint={() => setShowHint({ ...showHint, [q.id]: true })}
          onRetry={handleRetry}
          onNext={() => setIdx(idx + 1)}
        />

        {finished && (
          <ConceptCompletionCard
            correct={correctCount}
            total={questions.length}
            needed={needed}
            passed={passed}
            nextConcept={nextConcept}
            nextUnlocked={nextUnlocked}
            alreadyDone={alreadyDone}
            onCelebrate={fireConfetti}
            onContinue={() => {
              onPass();
              onGoToNext();
            }}
            onMarkCompleteOnly={onPass}
            onRetake={handleFullReset}
          />
        )}
      </div>

      <QuestionNav
        questions={questions}
        activeIndex={idx}
        correctMap={correctMap}
        onJump={setIdx}
      />
    </div>
  );
}