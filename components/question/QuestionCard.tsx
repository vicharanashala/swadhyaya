"use client";
import { Check, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Question } from "@/lib/questions";
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

  return (
    <div className="bg-card border border-line rounded-xl p-6">
      <div className="text-[10px] text-faint uppercase tracking-wider mb-3">
        Question {idx + 1} of {total}
        {answeredCorrect && (
          <span className="ml-3 text-correct normal-case tracking-normal">
            ✓ correct
          </span>
        )}
        {answeredWrong && (
          <span className="ml-3 text-warn normal-case tracking-normal">
            × try again
          </span>
        )}
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
        {q.options.map((o) => {
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
          }
          return (
            <label
              key={o.id}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition flex items-center cursor-pointer",
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
              <span className="font-mono text-xs text-faint mr-2">
                {o.id.toUpperCase()}
              </span>
              <span className="flex-1">{o.label}</span>
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