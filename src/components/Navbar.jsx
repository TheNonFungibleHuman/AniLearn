import React, { useState, useRef, useEffect } from 'react';
import { Plus, Settings, ChevronDown, Download, FileText, Layers, Copy, Check } from 'lucide-react';
import { generateObsidianMarkdown, generateAnkiDeck, downloadFile } from '../utils/exportUtils';

export default function Navbar({ topics, currentTopic, onSelectTopic, onOpenIngest, onOpenSettings }) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    if (isExportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExportOpen]);

  const handleExportObsidian = () => {
    if (!currentTopic) return;
    const md = generateObsidianMarkdown(currentTopic);
    const filename = `${currentTopic.id || 'topic'}_obsidian.md`;
    downloadFile(md, filename, 'text/markdown;charset=utf-8');
    setIsExportOpen(false);
  };

  const handleExportAnki = () => {
    if (!currentTopic) return;
    const tsv = generateAnkiDeck(currentTopic);
    const filename = `${currentTopic.id || 'topic'}_anki.txt`;
    downloadFile(tsv, filename, 'text/tab-separated-values;charset=utf-8');
    setIsExportOpen(false);
  };

  const handleCopyMarkdown = async () => {
    if (!currentTopic) return;
    const md = generateObsidianMarkdown(currentTopic);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsExportOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Topic Selection */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-extrabold text-sm tracking-tighter">
              A
            </div>
            <span className="font-semibold text-sm tracking-tight text-white hidden sm:inline">
              AniLearn
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.1] hidden sm:block shrink-0" />

          {/* Clean Topic Dropdown Selector */}
          <div className="relative flex items-center min-w-0 flex-1 max-w-[190px] sm:max-w-[320px] md:max-w-[420px]">
            <select
              value={currentTopic?.id || ''}
              onChange={(e) => onSelectTopic(e.target.value)}
              className="appearance-none w-full bg-zinc-900/90 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] transition-colors outline-none cursor-pointer truncate"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-zinc-200">
                  {t.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Subtle Model Status */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 px-2.5 py-1 rounded-md border border-white/[0.06] bg-zinc-950">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemini 3.8 Flash • Nano Banana</span>
          </div>

          {/* PKM Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen((prev) => !prev)}
              aria-label="Export Knowledge"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-950/95 backdrop-blur-md border border-white/[0.1] shadow-2xl py-1.5 z-50 divide-y divide-white/[0.06]">
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                    Knowledge Export
                  </span>
                  <span className="text-[11px] text-zinc-300 font-medium truncate block mt-0.5">
                    {currentTopic?.title || 'Current Topic'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleExportObsidian}
                    className="w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-zinc-200">Obsidian Markdown (.md)</div>
                      <div className="text-[10px] text-zinc-500">Includes KaTeX formulas & visual hotspots</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportAnki}
                    className="w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-zinc-200">Anki Flashcard Deck (.txt)</div>
                      <div className="text-[10px] text-zinc-500">TSV format with HTML cards & tags</div>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleCopyMarkdown}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-zinc-200">
                        {copied ? 'Copied to Clipboard!' : 'Copy Raw Markdown'}
                      </div>
                      <div className="text-[10px] text-zinc-500">Paste anywhere (Notion, Logseq, etc.)</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* New Topic Action Button */}
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">New Topic</span>
            <span className="sm:hidden text-[11px]">Topic</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="Settings & API Key"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.06] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
