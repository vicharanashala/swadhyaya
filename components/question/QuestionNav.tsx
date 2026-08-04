"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Question } from "@/lib/questions";

interface QuestionNavProps {
  questions: Question[];
  activeIndex: number;
  correctMap: Record<string, boolean>;
  onJump: (index: number) => void;
}

// The Q1/Q2 dots rail on the right side of the test tab.
// Identical for every concept — same chrome, same colors.
export function QuestionNav({
  questions,
  activeIndex,
  correctMap,
  onJump,
}: QuestionNavProps) {
  const correctCount = Object.values(correctMap).filter(Boolean).length;
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-faint uppercase tracking-wider">
        Progress
      </div>
      <div className="bg-card border border-line rounded-xl p-3">
        <div className="text-2xl font-mono text-ink">
          {correctCount}
          <span className="text-faint text-sm"> / {questions.length}</span>
        </div>
        <div className="text-xs text-dim mt-1">correct</div>
      </div>
      <div className="flex flex-col gap-1.5">
        {questions.map((qq, i) => {
          const isCorrect = correctMap[qq.id] === true;
          const isWrong = correctMap[qq.id] === false;
          return (
            <button
              key={qq.id}
              onClick={() => onJump(i)}
              aria-pressed={i === activeIndex}
              aria-label={`Question ${i + 1}${
                isCorrect ? ", correct" : isWrong ? ", try again" : ""
              }`}
              className={cn(
                "flex items-center justify-between p-2 rounded text-xs border transition",
                i === activeIndex
                  ? "border-accent bg-accent/10"
                  : "border-line bg-elev/30 hover:bg-elev/60",
                isCorrect && "text-correct border-correct/40",
                isWrong && "text-warn",
              )}
            >
              <span>Q{i + 1}</span>
              {isCorrect && <Check size={11} aria-hidden="true" />}
              {isWrong && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}