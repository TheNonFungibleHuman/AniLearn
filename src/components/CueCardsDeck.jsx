import React, { useState, useEffect } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function CueCardsDeck({ topic }) {
  const cards = topic?.visualCueCards || [];
  const [flippedCards, setFlippedCards] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset index on topic change
    setCurrentIndex(0);
    setFlippedCards({});
  }, [topic?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % (cards.length || 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + (cards.length || 1)) % (cards.length || 1));
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (cards[currentIndex]) {
          toggleFlip(cards[currentIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards]);

  if (!cards.length) return null;

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const currentCard = cards[currentIndex];
  const isFlipped = Boolean(flippedCards[currentCard?.id]);

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Mnemonic Cue Cards
          </span>
          <span className="text-[11px] font-mono text-zinc-500 ml-2">
            {currentIndex + 1} of {cards.length}
          </span>
        </div>

        {/* Minimal Nav & Keyboard Hint */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono text-zinc-500 mr-2 hidden sm:inline">
            [Space] to flip • [← / →]
          </span>
          <button
            onClick={handlePrev}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clean Interactive Card */}
      <div
        onClick={() => toggleFlip(currentCard.id)}
        className="relative min-h-[190px] rounded-lg p-4 sm:p-5 bg-zinc-900 border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition-colors select-none flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mb-2">
          <span>{isFlipped ? 'INTUITION & RECALL' : 'VISUAL ANCHOR & FORMULA'}</span>
          <span className="flex items-center gap-1 hover:text-zinc-300">
            <RotateCcw className="w-3 h-3" />
            Click to flip
          </span>
        </div>

        {!isFlipped ? (
          <div className="my-auto py-1">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
              {currentCard.title}
            </h4>
            <div className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-md border border-white/[0.06] mb-2.5">
              <Eye className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>{currentCard.visualAnchor}</span>
            </div>
            <div className="p-2.5 rounded bg-black/60 border border-white/[0.04] font-mono text-xs text-zinc-200 overflow-x-auto">
              {currentCard.formulaOrFact}
            </div>
          </div>
        ) : (
          <div className="my-auto py-1">
            <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
              Active Question:
            </span>
            <p className="text-sm font-medium text-white mb-3">
              {currentCard.intuitionQuestion}
            </p>
            <div className="p-2.5 rounded bg-zinc-950 border border-white/[0.06] text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-white">Recall: </span>
              {currentCard.answer}
            </div>
          </div>
        )}

        {/* Bottom progress dots */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-zinc-500">Active Recall Deck</span>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === currentIndex ? 'bg-white' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
