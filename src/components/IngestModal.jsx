import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';

export default function IngestModal({ isOpen, onClose, onTopicCreated }) {
  const [topicText, setTopicText] = useState('');
  const [thinkingLevel, setThinkingLevel] = useState('medium');
  const [style, setStyle] = useState('cyberpunk');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const exampleTopics = [
    {
      label: '7-Bit ASCII Encoding',
      text: 'Explain the 7-bit ASCII character encoding table: control characters (0-31), printable characters (32-126), and how bit 5 acts as a toggle between uppercase and lowercase.'
    },
    {
      label: 'TCP 3-Way Handshake',
      text: 'Explain the TCP Three-Way Handshake (SYN, SYN-ACK, ACK), sequence numbers, packet loss, and connection teardown.'
    },
    {
      label: 'Database Indexing (B+ Trees)',
      text: 'Explain B+ Tree database indexes, leaf node linked lists, depth vs branching factor, and why B+ trees are preferred over binary trees for disk storage.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicText.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setProgressStage('Reasoning with Gemini 3.8 Flash...');

    try {
      setTimeout(() => {
        setProgressStage('Synthesizing pedagogical breakdown & visual cues...');
      }, 2500);

      setTimeout(() => {
        setProgressStage('Generating technical anime diagram with Nano Banana...');
      }, 5000);

      const response = await fetch('/api/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicText,
          thinkingLevel,
          style
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to deconstruct topic.');
      }

      const data = await response.json();
      if (data.topic) {
        onTopicCreated(data.topic);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during deconstruction.');
    } finally {
      setIsProcessing(false);
      setProgressStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl bg-zinc-950 border border-white/[0.08] shadow-2xl p-4 sm:p-6 animate-fadeIn">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-md hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 sm:mb-5">
          <h2 className="text-lg font-bold tracking-tight text-white mb-1">
            Deconstruct a Topic
          </h2>
          <p className="text-xs text-zinc-400">
            Paste lecture notes, slide excerpts, or concepts to generate a visual infographic and study guide.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Topic Notes / Slide Content:
            </label>
            <textarea
              rows={4}
              value={topicText}
              onChange={(e) => setTopicText(e.target.value)}
              placeholder="e.g. Explain 7-bit ASCII encoding, how bit 5 toggles uppercase and lowercase, and why control characters exist..."
              className="w-full rounded-lg bg-zinc-900 border border-white/[0.08] focus:border-zinc-500 p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none leading-relaxed transition-colors"
              disabled={isProcessing}
              required
            />
          </div>

          <div>
            <span className="text-xs text-zinc-500 mr-2">Suggestions:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {exampleTopics.map((ex, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setTopicText(ex.text)}
                  disabled={isProcessing}
                  className="px-2 py-1 rounded text-xs bg-zinc-900 border border-white/[0.06] hover:border-white/[0.16] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Thinking Depth:
              </label>
              <div className="flex bg-zinc-900 border border-white/[0.06] rounded-md p-0.5">
                {['low', 'medium', 'high'].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setThinkingLevel(lvl)}
                    className={`flex-1 py-1 text-center text-xs capitalize rounded font-medium transition-colors cursor-pointer ${
                      thinkingLevel === lvl
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Illustration Style:
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-md bg-zinc-900 border border-white/[0.08] text-xs text-zinc-200 outline-none cursor-pointer"
                disabled={isProcessing}
              >
                <option value="cyberpunk">Cyberpunk Blueprint</option>
                <option value="shinkai">Makoto Shinkai (Twilight)</option>
                <option value="guild">Fantasy Guild</option>
                <option value="ghibli">Studio Ghibli</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing || !topicText.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold text-xs sm:text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressStage || 'Processing...'}</span>
                </>
              ) : (
                <span>Deconstruct & Generate Infographic</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
