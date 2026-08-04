"use client";
import { useMemo } from "react";
import {
  Check,
  X,
  ChevronRight,
  Calculator,
  ToggleLeft,
  Search,
  ListOrdered,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Question, QuestionType } from "@/lib/questions";
import { Playground } from "@/components/playground/Playground";
import type { PlaygroundId } from "@/lib/curriculum";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  selected: string | undefined;
  submitted: boolean;
  isCorrect: boolean;
  showHint: boolean;
  wrongAttempts: number;
  isLast: boolean;
  onSelect: (optionId: string) => void;
  onCheck: () => void;
  onShowHint: () => void;
  onRetry: () => void;
  onNext: () => void;
}

// Map question types to a small visual marker. Keeps the test readable
// at a glance: predict = calculator, truefalse = toggle, identify =
// search, match = image, rank = ordered list, fill = edit.
const TYPE_META: Record<QuestionType, { label: string; Icon: typeof Calculator }> = {
  predict: { label: "Predict", Icon: Calculator },
  truefalse: { label: "True / False", Icon: ToggleLeft },
  identify: { label: "Identify", Icon: Search },
  match: { label: "Match", Icon: ImageIcon },
  rank: { label: "Rank", Icon: ListOrdered },
  fill: { label: "Fill", Icon: Edit3 },
};

// Shared rendering for every question across every concept.
// One source of truth — prompt, options, check, feedback, hint.
// Same chrome regardless of concept, playground, or question type.
// When q.playground is set, the question-specific interactive widget
// renders above the options — the playground drives the question.
export function QuestionCard({
  question: q,
  index: idx,
  total,
  selected,
  submitted,
  isCorrect,
  showHint,
  isLast,
  onSelect,
  onCheck,
  onShowHint,
  onRetry,
  onNext,
}: QuestionCardProps) {
  const answeredCorrect = isCorrect;
  const answeredWrong = submitted && !isCorrect;

  const groupName = `q-${q.id}-options`;
  const meta = TYPE_META[q.type];
  const TypeIcon = meta?.Icon ?? Calculator;

  // Shuffle option order so no one can guess by position.
  // The shuffle is deterministic per question id — stable while the
  // student interacts with one question, but reshuffled each time a
  // new question is shown or the test is restarted.
  const shuffledOptions = useMemo(() => {
    const seed = q.id
      .split("")
      .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
    const opts = [...q.options];
    // Mulberry32 — small, fast, good-enough PRNG seeded per-question.
    let s = seed >>> 0;
    const rand = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [q.id, q.options]);

  return (
    <div className="bg-card border border-line rounded-xl p-6">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] text-faint uppercase tracking-wider"
            aria-label={`Question type: ${meta?.label ?? q.type}`}
          >
            <TypeIcon size={11} aria-hidden="true" />
            {meta?.label ?? q.type}
          </span>
          <span className="text-[10px] text-faint">·</span>
          <span className="text-[10px] text-faint uppercase tracking-wider">
            Question {idx + 1} of {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {answeredCorrect && (
            <span className="text-[10px] text-correct inline-flex items-center gap-1">
              <Check size={10} aria-hidden="true" /> correct
            </span>
          )}
          {answeredWrong && (
            <span className="text-[10px] text-warn inline-flex items-center gap-1">
              <X size={10} aria-hidden="true" /> try again
            </span>
          )}
        </div>
      </div>
      <h3 className="font-serif text-xl text-ink mb-5">{q.prompt}</h3>

      {q.playground && (
        <div className="mb-5">
          <Playground id={q.playground as PlaygroundId} />
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={q.prompt}
        aria-required="true"
        className="space-y-2"
      >
        {shuffledOptions.map((o) => {
          const isAnswered = submitted;
          const isSelected = selected === o.id;
          const isCorrectOpt = o.correct;
          let cls = "border-line bg-elev/30 hover:bg-elev/60 text-ink";
          let icon: React.ReactNode = null;
          if (isAnswered) {
            if (isCorrectOpt) {
              cls = "border-correct bg-correct/10 text-correct font-medium";
              icon = (
                <Check size={14} className="inline ml-2 -mt-0.5" aria-hidden="true" />
              );
            } else if (isSelected) {
              cls = "border-warn bg-warn/10 text-warn line-through";
              icon = (
                <X size={14} className="inline ml-2 -mt-0.5" aria-hidden="true" />
              );
            } else {
              cls = "border-line bg-elev/20 text-dim opacity-50";
            }
          } else if (isSelected) {
            // Pre-submit: highlight the currently-picked option so the
            // student has a clear visual confirmation of their choice.
            cls =
              "border-accent bg-accent/15 text-ink font-medium ring-1 ring-accent/40";
            icon = (
              <Check
                size={14}
                className="inline ml-2 -mt-0.5 text-accent"
                aria-hidden="true"
              />
            );
          }
          return (
            <label
              key={o.id}
              className={cn(
                "w-full min-h-[3.25rem] text-left px-3 py-2.5 rounded-lg border transition flex items-center cursor-pointer",
                cls,
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={o.id}
                checked={isSelected}
                disabled={isAnswered}
                onChange={() => onSelect(o.id)}
                className="sr-only"
              />
              <span className="font-mono text-xs text-faint mr-2 shrink-0">
                {o.id.toUpperCase()}
              </span>
              <span className="flex-1 leading-snug break-words line-clamp-3">
                {o.label}
              </span>
              {icon}
            </label>
          );
        })}
      </div>

      {!submitted ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onCheck}
            disabled={!selected}
            className="px-4 py-2 rounded bg-accent text-canvas font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition"
          >
            Check
          </button>
          <button
            onClick={onShowHint}
            className="text-xs text-warn hover:text-warn/80"
          >
            {showHint ? "Hint shown" : "Show hint"}
          </button>
        </div>
      ) : answeredWrong ? (
        <div className="mt-4 space-y-3">
          <div className="bg-warn/10 border border-warn/30 rounded p-3 text-sm leading-relaxed">
            <div className="text-warn font-medium mb-1">
              Not quite — the correct option is highlighted in green above.
            </div>
            <div className="text-dim text-xs">{q.explanation}</div>
          </div>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded border border-line hover:bg-elev transition text-sm"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="bg-correct/10 border border-correct/30 rounded p-3 text-sm text-correct leading-relaxed">
            <span className="text-correct font-medium">Correct! </span>
            {q.explanation}
          </div>
          {!isLast && (
            <button
              onClick={onNext}
              className="px-4 py-2 rounded border border-line text-ink hover:bg-elev transition"
            >
              Next question <ChevronRight size={14} className="inline" aria-hidden="true" />
            </button>
          )}
          {isLast && (
            <div className="text-xs text-correct font-mono">
              All questions answered correctly. Mark complete below.
            </div>
          )}
        </div>
      )}

      {showHint && (
        <div
          role="note"
          className="mt-3 bg-warn/10 border border-warn/30 rounded p-3 text-xs text-warn leading-relaxed"
        >
          <span className="font-medium">Hint: </span>
          {q.hint}
        </div>
      )}
    </div>
  );
}