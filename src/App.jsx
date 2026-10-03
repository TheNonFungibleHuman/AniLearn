import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MetaphorCard from './components/MetaphorCard';
import SocraticChat from './components/SocraticChat';
import VisualCanvas from './components/VisualCanvas';
import CueCardsDeck from './components/CueCardsDeck';
import IngestModal from './components/IngestModal';
import SettingsModal from './components/SettingsModal';

import { Image as ImageIcon, BookOpen, MessageSquare } from 'lucide-react';

export default function App() {
  const [topics, setTopics] = useState([]);
  const [currentTopicId, setCurrentTopicId] = useState('');
  const [mobileTab, setMobileTab] = useState('visuals'); // 'visuals' | 'metaphor' | 'chat'
  const [desktopTab, setDesktopTab] = useState('metaphor'); // 'metaphor' | 'chat'
  const [thinkingLevel, setThinkingLevel] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
        if (data.length > 0 && !currentTopicId) {
          setCurrentTopicId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const currentTopic = topics.find((t) => t.id === currentTopicId) || topics[0];

  const handleAskSenpai = (promptText) => {
    setCustomPrompt(promptText);
    setMobileTab('chat');
    setDesktopTab('chat');
  };

  const handleTopicCreated = (newTopic) => {
    setTopics((prev) => [newTopic, ...prev]);
    setCurrentTopicId(newTopic.id);
    setMobileTab('visuals');
    setDesktopTab('metaphor');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        topics={topics}
        currentTopic={currentTopic}
        onSelectTopic={(id) => setCurrentTopicId(id)}
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Mobile Navigation Segment Controller (< lg) */}
        <div className="flex lg:hidden bg-zinc-900 border border-white/[0.08] rounded-xl p-1 w-full shadow-lg">
          <button
            onClick={() => setMobileTab('visuals')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'visuals'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Visuals</span>
          </button>

          <button
            onClick={() => setMobileTab('metaphor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'metaphor'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Concept</span>
          </button>

          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'chat'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>SenpaiAI</span>
          </button>
        </div>

        {/* Mobile View Render (< lg) */}
        <div className="block lg:hidden">
          {mobileTab === 'visuals' && (
            <div className="space-y-4 animate-fadeIn">
              <VisualCanvas topic={currentTopic} onAskSenpai={handleAskSenpai} />
              <CueCardsDeck topic={currentTopic} />
            </div>
          )}

          {mobileTab === 'metaphor' && (
            <div className="animate-fadeIn">
              <MetaphorCard topic={currentTopic} onAskSenpai={handleAskSenpai} />
            </div>
          )}

          {mobileTab === 'chat' && (
            <div className="animate-fadeIn">
              <SocraticChat
                topic={currentTopic}
                thinkingLevel={thinkingLevel}
                setThinkingLevel={setThinkingLevel}
                customPrompt={customPrompt}
                onClearCustomPrompt={() => setCustomPrompt('')}
              />
            </div>
          )}
        </div>

        {/* Desktop Split Grid (>= lg) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Concept Deconstruction & Chat */}
          <div className="lg:col-span-6 space-y-4">
            {/* Desktop Segment Toggle */}
            <div className="flex bg-zinc-900 border border-white/[0.08] rounded-lg p-1 w-fit">
              <button
                onClick={() => setDesktopTab('metaphor')}
                className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  desktopTab === 'metaphor'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Concept & Metaphor
              </button>

              <button
                onClick={() => setDesktopTab('chat')}
                className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  desktopTab === 'chat'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                SenpaiAI Chat
              </button>
            </div>

            {/* Desktop Tab View */}
            {desktopTab === 'metaphor' ? (
              <MetaphorCard topic={currentTopic} onAskSenpai={handleAskSenpai} />
            ) : (
              <SocraticChat
                topic={currentTopic}
                thinkingLevel={thinkingLevel}
                setThinkingLevel={setThinkingLevel}
                customPrompt={customPrompt}
                onClearCustomPrompt={() => setCustomPrompt('')}
              />
            )}
          </div>

          {/* Right Column: Visual Canvas & Cue Cards */}
          <div className="lg:col-span-6 space-y-4">
            <VisualCanvas topic={currentTopic} onAskSenpai={handleAskSenpai} />
            <CueCardsDeck topic={currentTopic} />
          </div>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-5 px-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">AniLearn</span>
            <span>•</span>
            <span>Visual Cognitive Companion for University Students</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <span>Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Nano Banana Pro</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onTopicCreated={handleTopicCreated}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
