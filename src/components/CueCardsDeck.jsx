import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Eye, CheckCircle2, AlertCircle, Sparkles, Download } from 'lucide-react';
import MathRenderer from './MathRenderer';
import { generateAnkiDeck, downloadFile } from '../utils/exportUtils';

export default function CueCardsDeck({ topic }) {
  const cards = useMemo(() => topic?.visualCueCards || [], [topic?.visualCueCards]);
  const [flippedCards, setFlippedCards] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardRatings, setCardRatings] = useState(() => {
    if (!topic?.id) return {};
    try {
      const saved = localStorage.getItem(`anilearn_ratings_${topic.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleFlip = useCallback((id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleRateCard = useCallback((cardId, rating) => {
    setCardRatings((prev) => {
      const next = { ...prev, [cardId]: rating };
      if (topic?.id) {
        try {
          localStorage.setItem(`anilearn_ratings_${topic.id}`, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });

    // Automatically advance to next card after rating
    if (cards.length > 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
      }, 250);
    }
  }, [cards.length, topic]);

  const handleNext = useCallback(() => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const handleExportAnki = useCallback(() => {
    if (!topic) return;
    const tsv = generateAnkiDeck(topic);
    const filename = `${topic.id || 'topic'}_anki.txt`;
    downloadFile(tsv, filename, 'text/tab-separated-values;charset=utf-8');
  }, [topic]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const card = cards[currentIndex];
        if (card) {
          toggleFlip(card.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards, handleNext, handlePrev, toggleFlip]);

  if (!cards.length) return null;

  const currentCard = cards[currentIndex];
  const isFlipped = Boolean(flippedCards[currentCard?.id]);
  const currentRating = cardRatings[currentCard?.id];

  const masteredCount = cards.filter((c) => cardRatings[c.id] === 'mastered').length;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Active Recall Deck
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            {currentIndex + 1} of {cards.length}
          </span>
          {masteredCount > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded ml-1 hidden sm:inline">
              {masteredCount}/{cards.length} Mastered
            </span>
          )}
        </div>

        {/* Minimal Nav & Keyboard Hint */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportAnki}
            title="Export Flashcards to Anki (.txt)"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] bg-zinc-900 text-[11px] font-mono transition-colors cursor-pointer mr-1"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Anki</span>
          </button>
          <span className="text-[11px] font-mono text-zinc-500 mr-1 hidden md:inline">
            [Space] flip • [← / →]
          </span>
          <button
            onClick={handlePrev}
            aria-label="Previous Card"
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Card"
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* True 3D Flip Card Container */}
      <div
        className="perspective-1000 w-full min-h-[250px] sm:min-h-[260px] cursor-pointer select-none group"
        onClick={() => toggleFlip(currentCard.id)}
      >
        <div
          className={`relative w-full min-h-[250px] sm:min-h-[260px] preserve-3d card-flip-transition ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE: VISUAL ANCHOR & FORMULA */}
          <div className="absolute inset-0 w-full h-full rounded-lg p-4 sm:p-5 bg-zinc-900 border border-white/[0.08] group-hover:border-white/[0.16] transition-colors backface-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mb-2">
                <span className="flex items-center gap-1.5">
                  <span>VISUAL ANCHOR & FORMULA</span>
                  {currentRating && (
                    <span
                      className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                        currentRating === 'mastered'
                          ? 'text-emerald-400 bg-emerald-950/40'
                          : currentRating === 'good'
                          ? 'text-amber-400 bg-amber-950/40'
                          : 'text-rose-400 bg-rose-950/40'
                      }`}
                    >
                      {currentRating}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  <span>Tap to Flip</span>
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-semibold text-white mb-2.5">
                {currentCard.title}
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-md border border-white/[0.06]">
                  <Eye className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>{currentCard.visualAnchor}</span>
                </div>

                <div className="p-2.5 rounded bg-black/60 border border-white/[0.04] text-xs text-zinc-200 overflow-x-auto flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-medium shrink-0">Core Law:</span>
                  <div className="text-zinc-100 text-sm py-0.5">
                    <MathRenderer content={currentCard.formulaOrFact} inline />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom progress dots */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2.5 mt-2 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-zinc-500">
                Cognitive Anchor
              </span>
              <div className="flex gap-1.5 items-center">
                {cards.map((c, i) => {
                  const rating = cardRatings[c.id];
                  let dotColor = 'bg-zinc-700 hover:bg-zinc-500';
                  if (rating === 'mastered') dotColor = 'bg-emerald-500';
                  else if (rating === 'good') dotColor = 'bg-amber-500';
                  else if (rating === 'again') dotColor = 'bg-rose-500';

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(i);
                      }}
                      aria-label={`Go to card ${i + 1}`}
                      className={`transition-all rounded-full cursor-pointer ${
                        i === currentIndex
                          ? 'w-4 h-1.5 bg-white'
                          : `w-1.5 h-1.5 ${dotColor}`
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* BACK FACE: ACTIVE RECALL & INTUITION */}
          <div className="absolute inset-0 w-full h-full rounded-lg p-4 sm:p-5 bg-zinc-900 border border-white/[0.08] group-hover:border-white/[0.16] transition-colors backface-hidden rotate-y-180 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mb-2">
                <span>ACTIVE RECALL & INTUITION</span>
                <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  <span>Show Anchor</span>
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
                {currentCard.title}
              </h4>

              <div className="space-y-2">
                <div className="p-2.5 rounded bg-zinc-950/70 border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">
                    Active Question:
                  </span>
                  <div className="text-xs sm:text-sm font-medium text-zinc-100">
                    <MathRenderer content={currentCard.intuitionQuestion} />
                  </div>
                </div>

                <div className="p-2.5 rounded bg-zinc-950 border border-white/[0.06] text-xs text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-white">Recall Answer: </span>
                  <MathRenderer content={currentCard.answer} inline />
                </div>
              </div>
            </div>

            {/* SRS Active Recall Self-Rating Buttons */}
            <div
              className="pt-2.5 mt-2 border-t border-white/[0.06] flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-mono uppercase text-zinc-500 hidden sm:inline">
                Rate Recall:
              </span>
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleRateCard(currentCard.id, 'again')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                    currentRating === 'again'
                      ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                      : 'border-white/[0.06] bg-zinc-950 text-zinc-400 hover:text-rose-300 hover:border-rose-500/40'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Again</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard(currentCard.id, 'good')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                    currentRating === 'good'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                      : 'border-white/[0.06] bg-zinc-950 text-zinc-400 hover:text-amber-300 hover:border-amber-500/40'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Good</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard(currentCard.id, 'mastered')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                    currentRating === 'mastered'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-white/[0.06] bg-zinc-950 text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/40'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Mastered</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
