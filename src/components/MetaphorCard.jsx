import React, { useState } from 'react';
import { ArrowRight, Check, X, RotateCcw, MessageSquare, Award } from 'lucide-react';
import MathRenderer from './MathRenderer';

export default function MetaphorCard({ topic, onAskSenpai }) {
  const quizzes = topic?.activeRecallQuiz || [];
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [quizIndex]: selectedOptionIndex }

  if (!topic) return null;

  const currentQuiz = quizzes[currentQuizIndex] || quizzes[0];
  const selectedOption = userAnswers[currentQuizIndex];
  const hasAnswered = selectedOption !== undefined;

  const handleSelectOption = (index) => {
    if (hasAnswered) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuizIndex]: index
    }));
  };

  const handleResetCurrent = () => {
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuizIndex];
      return next;
    });
  };

  const handleResetAll = () => {
    setUserAnswers({});
    setCurrentQuizIndex(0);
  };

  // Calculate score tally
  let correctCount = 0;
  quizzes.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctIndex) {
      correctCount++;
    }
  });

  const isCurrentCorrect = hasAnswered && selectedOption === currentQuiz?.correctIndex;

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

      {/* 3-Tier Diagnostic Active Recall Quiz */}
      {quizzes.length > 0 && currentQuiz && (
        <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
          {/* Header with Step Tiers & Overall Score */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Diagnostic Active Recall
              </span>
              {Object.keys(userAnswers).length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Score: {correctCount}/{quizzes.length}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {hasAnswered && (
                <button
                  onClick={handleResetCurrent}
                  title="Retry current question"
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
              {Object.keys(userAnswers).length === quizzes.length && (
                <button
                  onClick={handleResetAll}
                  title="Reset all questions"
                  className="text-xs text-zinc-400 hover:text-white font-medium ml-1 cursor-pointer"
                >
                  Restart Test
                </button>
              )}
            </div>
          </div>

          {/* Tier Pills / Step Selector */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            {quizzes.map((q, idx) => {
              const isSelected = idx === currentQuizIndex;
              const answered = userAnswers[idx] !== undefined;
              const isCorrect = answered && userAnswers[idx] === q.correctIndex;
              const isWrong = answered && !isCorrect;

              let badgeStyle = 'bg-zinc-900 text-zinc-400 border-white/[0.06] hover:text-white';
              if (isSelected) {
                badgeStyle = 'bg-white text-black font-semibold shadow-sm';
              } else if (isCorrect) {
                badgeStyle = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
              } else if (isWrong) {
                badgeStyle = 'bg-rose-950/40 text-rose-300 border-rose-500/30';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuizIndex(idx)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${badgeStyle}`}
                >
                  <span className="font-mono text-[10px]">
                    0{idx + 1}
                  </span>
                  <span>{q.tier || `Part ${idx + 1}`}</span>
                  {answered && (
                    isCorrect ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Question */}
          <div className="text-sm font-medium text-zinc-100 mb-3.5 leading-relaxed">
            <MathRenderer content={currentQuiz.question} />
          </div>

          {/* 4 Options */}
          <div className="space-y-2">
            {currentQuiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuiz.correctIndex;
              let itemStyle = 'border-white/[0.08] bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300';

              if (hasAnswered) {
                if (isCorrect) {
                  itemStyle = 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300 font-medium';
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

          {/* Answer Debrief & Socratic Discussion */}
          {hasAnswered && (
            <div className="mt-3.5 p-3.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2">
              <div>
                <strong className={isCurrentCorrect ? 'text-emerald-400' : 'text-zinc-200'}>
                  {isCurrentCorrect ? 'Concept Mastered: ' : 'Conceptual Flaw: '}
                </strong>
                <MathRenderer content={currentQuiz.explanation} inline />
              </div>

              {/* Socratic Debrief Action */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={() => {
                    const chosenText = currentQuiz.options[selectedOption];
                    const correctText = currentQuiz.options[currentQuiz.correctIndex];
                    if (isCurrentCorrect) {
                      onAskSenpai(`Senpai, I correctly answered the ${currentQuiz.tier || 'question'} for "${topic.title}": "${currentQuiz.question}". Can we explore deeper edge cases or proofs?`);
                    } else {
                      onAskSenpai(`Senpai, on the ${currentQuiz.tier || 'question'} for "${topic.title}": "${currentQuiz.question}", I chose "${chosenText}" instead of "${correctText}". Can you explain from first principles why my intuition led me astray?`);
                    }
                  }}
                  className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {isCurrentCorrect ? 'Deep-dive edge cases with Senpai' : 'Debrief this mistake with Senpai'}
                  </span>
                </button>

                {currentQuizIndex < quizzes.length - 1 && (
                  <button
                    onClick={() => setCurrentQuizIndex((prev) => prev + 1)}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    Next Tier →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
