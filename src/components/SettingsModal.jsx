import React, { useState, useEffect } from 'react';
import { X, Cpu, Image as ImageIcon } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [savedKeyPrefix, setSavedKeyPrefix] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          if (data.keyPrefix) setSavedKeyPrefix(data.keyPrefix);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'API Key updated successfully.' });
        setSavedKeyPrefix(apiKey.substring(0, 6) + '...');
        setApiKey('');
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to update key.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl bg-zinc-950 border border-white/[0.08] shadow-2xl p-4 sm:p-6 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 rounded-md hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 sm:mb-5">
          <h3 className="text-lg font-bold tracking-tight text-white mb-1">
            Engine Settings
          </h3>
          <p className="text-xs text-zinc-400">
            Configure Google Gemini 3.8 Flash and Nano Banana.
          </p>
        </div>

        {/* Model status cards */}
        <div className="space-y-2 mb-5">
          <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reasoning: Gemini 3.8 Flash</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Visual: Nano Banana Pro</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveKey} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Gemini API Key
              </label>
              {savedKeyPrefix && (
                <span className="text-[10px] font-mono text-zinc-500">
                  {savedKeyPrefix}
                </span>
              )}
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste Google AI Studio API key"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.08] focus:border-zinc-500 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none font-mono"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-2.5 rounded text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving || !apiKey.trim()}
              className="px-4 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
