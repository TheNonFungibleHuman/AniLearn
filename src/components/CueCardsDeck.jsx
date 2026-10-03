import React, { useState, useEffect } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import MathRenderer from './MathRenderer';

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
        className="perspective-1000 w-full min-h-[220px] sm:min-h-[230px] cursor-pointer select-none group"
        onClick={() => toggleFlip(currentCard.id)}
      >
        <div
          className={`relative w-full min-h-[220px] sm:min-h-[230px] preserve-3d card-flip-transition ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE: VISUAL ANCHOR & FORMULA */}
          <div className="absolute inset-0 w-full h-full rounded-lg p-4 sm:p-5 bg-zinc-900 border border-white/[0.08] group-hover:border-white/[0.16] transition-colors backface-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mb-2">
                <span>VISUAL ANCHOR & FORMULA</span>
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
                {cards.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    aria-label={`Go to card ${i + 1}`}
                    className={`transition-all rounded-full cursor-pointer ${
                      i === currentIndex
                        ? 'w-4 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}
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

              <h4 className="text-sm sm:text-base font-semibold text-white mb-2.5">
                {currentCard.title}
              </h4>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded bg-zinc-950/70 border border-white/[0.06]">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
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

            {/* Bottom progress dots */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2.5 mt-2 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase text-zinc-500">
                Self-Check Recall
              </span>
              <div className="flex gap-1.5 items-center">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(i);
                    }}
                    aria-label={`Go to card ${i + 1}`}
                    className={`transition-all rounded-full cursor-pointer ${
                      i === currentIndex
                        ? 'w-4 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
