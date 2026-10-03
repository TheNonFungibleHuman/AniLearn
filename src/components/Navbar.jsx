import React from 'react';
import { Plus, Settings, ChevronDown, BookOpen } from 'lucide-react';

export default function Navbar({ topics, currentTopic, onSelectTopic, onOpenIngest, onOpenSettings }) {
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
