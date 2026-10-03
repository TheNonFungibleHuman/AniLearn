import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MetaphorCard from './components/MetaphorCard';
import SocraticChat from './components/SocraticChat';
import VisualCanvas from './components/VisualCanvas';
import CueCardsDeck from './components/CueCardsDeck';
import IngestModal from './components/IngestModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [topics, setTopics] = useState([]);
  const [currentTopicId, setCurrentTopicId] = useState('');
  const [activeTab, setActiveTab] = useState('metaphor'); // 'metaphor' | 'chat'
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
    setActiveTab('chat');
  };

  const handleTopicCreated = (newTopic) => {
    setTopics((prev) => [newTopic, ...prev]);
    setCurrentTopicId(newTopic.id);
    setActiveTab('metaphor');
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Concept Deconstruction & Chat */}
          <div className="lg:col-span-6 space-y-4">
            {/* Minimal Segment Toggle */}
            <div className="flex bg-zinc-900 border border-white/[0.08] rounded-lg p-1 w-full sm:w-fit">
              <button
                onClick={() => setActiveTab('metaphor')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'metaphor'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Concept & Metaphor
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                SenpaiAI Chat
              </button>
            </div>

            {/* Tab View */}
            {activeTab === 'metaphor' ? (
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
