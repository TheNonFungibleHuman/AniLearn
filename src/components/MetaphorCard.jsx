import React, { useState } from 'react';
import { ArrowRight, Check, X, RotateCcw } from 'lucide-react';
import MathRenderer from './MathRenderer';

export default function MetaphorCard({ topic, onAskSenpai }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const quiz = topic?.activeRecallQuiz?.[0];

  const handleSelectOption = (index) => {
    if (hasAnswered) return;
    setSelectedOption(index);
    setHasAnswered(true);
  };

  const handleResetQuiz = () => {
    setSelectedOption(null);
    setHasAnswered(false);
  };

  if (!topic) return null;

  return (
    <div className="space-y-4">
      {/* Topic Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1 sm:mb-1.5">
          {topic.subject || 'Computer Science'}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 sm:mb-1.5">
          {topic.title}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-medium">
          {topic.metaphorTitle}
        </p>
      </div>

      {/* The Anime Mental Model */}
      <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
        <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Anime Mental Model
          </span>
          <button
            onClick={() => onAskSenpai(`Senpai, can you break down the mental model for "${topic.title}" in more detail?`)}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ask Senpai</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
          <MathRenderer content={topic.metaphorStory} />
        </div>
      </div>

      {/* Academic Definition & Principles */}
      <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 sm:mb-2.5">
          Academic Concept & Properties
        </span>
        <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3.5 sm:mb-4">
          <MathRenderer content={topic.academicConcept} />
        </div>

        {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
          <div className="border-t border-white/[0.06] pt-3 sm:pt-4">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2 sm:mb-2.5">
              Core Invariants
            </span>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-zinc-300">
              {topic.keyTakeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-500 select-none">•</span>
                  <MathRenderer content={takeaway} inline />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Active Recall Quiz */}
      {quiz && (
        <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Recall Check
            </span>
            {hasAnswered && (
              <button
                onClick={handleResetQuiz}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-sm font-medium text-zinc-100 mb-3.5">
            <MathRenderer content={quiz.question} />
          </div>

          <div className="space-y-2">
            {quiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === quiz.correctIndex;
              let itemStyle = 'border-white/[0.08] bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300';

              if (hasAnswered) {
                if (isCorrect) {
                  itemStyle = 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300';
                } else if (isSelected && !isCorrect) {
                  itemStyle = 'border-rose-500/60 bg-rose-950/20 text-rose-300';
                } else {
                  itemStyle = 'border-white/[0.04] bg-zinc-950 text-zinc-600';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnswered}
                  className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer ${itemStyle}`}
                >
                  <div className="flex-1">
                    <MathRenderer content={opt} inline />
                  </div>
                  {hasAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {hasAnswered && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="mt-3.5 p-3.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <strong className={selectedOption === quiz.correctIndex ? 'text-emerald-400' : 'text-zinc-200'}>
                {selectedOption === quiz.correctIndex ? 'Correct: ' : 'Explanation: '}
              </strong>
              <MathRenderer content={quiz.explanation} inline />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
