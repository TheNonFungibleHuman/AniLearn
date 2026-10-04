import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ArrowUp, Loader2, Sparkles, BookOpen, Swords, Lightbulb } from 'lucide-react';
import { sanitizeMathText } from '../utils/mathUtils';

const MODES = [
  { id: 'socratic', label: 'Socratic', icon: Lightbulb, desc: 'Guided inquiry & first principles' },
  { id: 'teach_senpai', label: 'Teach Senpai', icon: BookOpen, desc: 'Reverse Feynman: you teach Senpai' },
  { id: 'exam_boss', label: 'Exam Boss', icon: Swords, desc: 'Adversarial oral exam testing edge cases' },
  { id: 'analogy', label: 'Analogy Lab', icon: Sparkles, desc: 'Physical everyday toy analogies' }
];

export default function SocraticChat({ topic, thinkingLevel, setThinkingLevel, customPrompt, onClearCustomPrompt }) {
  const [learningMode, setLearningMode] = useState('socratic');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Konnichiwa! I'm your study partner **SenpaiAI**. We're exploring **${topic?.title || 'this topic'}**.\n\nI follow Richard Feynman's golden rule: if we can't explain something simply from first principles so a 5-year-old can grasp it, we don't truly understand it yet!\n\nTake a look at the infographic on the right. Want me to break down the physical cause-and-effect with everyday analogies, walk through a formula, or test your gut intuition?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const getQuickPrompts = (mode) => {
    switch (mode) {
      case 'teach_senpai':
        return [
          `Here is my ELI5 explanation of the core mechanism...`,
          `Test my understanding with an intuitive edge-case question`,
          `Grade my conceptual explanation out of 10 for clarity`
        ];
      case 'exam_boss':
        return [
          `Hit me with a brutal university oral exam question`,
          `Probe me on edge cases, limits, and failure modes`,
          `Test my knowledge of algorithmic invariants`
        ];
      case 'analogy':
        return [
          `What physical toy or machine does this work like?`,
          `Give me a water pipe or domino analogy for this`,
          `Break down the variables as physical objects`
        ];
      case 'socratic':
      default:
        return [
          `ELI5: Explain this to a 5-year-old from first principles`,
          `Explain the physical analogies in the diagram`,
          `Break down the core formula in plain English`,
          `Quiz my gut intuition with a physical scenario`
        ];
    }
  };

  const sendMessage = useCallback(async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg = { role: 'user', content: query };
    const placeholderAssistantMsg = { role: 'assistant', content: '' };
    const historyForBackend = [...messages, userMsg];

    setMessages((prev) => [...prev, userMsg, placeholderAssistantMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicContext: topic,
          messages: historyForBackend,
          userMessage: query,
          thinkingLevel,
          learningMode
        })
      });

      if (!response.ok) {
        throw new Error('Streaming connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: accumulated
                };
                return next;
              });
            }
          } catch {
            // Ignore incomplete frames
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          next[next.length - 1] = {
            role: 'assistant',
            content: `Apologies, I encountered an issue. (${err.message})`
          };
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, topic, thinkingLevel, learningMode]);

  useEffect(() => {
    if (customPrompt) {
      sendMessage(customPrompt);
      if (onClearCustomPrompt) onClearCustomPrompt();
    }
  }, [customPrompt, sendMessage, onClearCustomPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleModeChange = (newMode) => {
    setLearningMode(newMode);
    let promptMsg = '';
    if (newMode === 'teach_senpai') {
      promptMsg = `🔄 **Reverse Feynman Activated ("Teach Senpai")!**\n\nI'm now your curious junior classmate (*Kohai*). I have a basic idea of **${topic?.title || 'this topic'}**, but some parts confuse me!\n\n**Can you teach me how it works from first principles?** Explain it simply, and I will ask questions and grade your explanation!`;
    } else if (newMode === 'exam_boss') {
      promptMsg = `⚔️ **Exam Boss Battle Initiated!**\n\nI am your exacting University Examiner. Rote definitions will receive zero marks. I will probe boundary conditions, edge cases, and mathematical invariants.\n\nAre you ready for your oral examination on **${topic?.title || 'this topic'}**? Type "Start" or answer: *What is the fundamental constraint that makes this problem non-trivial?*`;
    } else if (newMode === 'analogy') {
      promptMsg = `🧩 **Analogy Lab Ready!**\n\nLet's throw away academic textbook jargon. Ask me about any equation or mechanic, and I'll construct a tactile physical analogy (water pipes, flashlights, dominoes, rock candy, Legos).`;
    } else {
      promptMsg = `💡 **Socratic Guide Active.**\n\nI'll walk alongside you, using first-principles ELI5 intuitions and asking targeted questions to guide your discovery.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: promptMsg
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-230px)] min-h-[460px] sm:h-[580px] rounded-xl bg-zinc-950 border border-white/[0.08] overflow-hidden">
      {/* Sleek Minimal Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.08] bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-white">SenpaiAI</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 sm:px-2 py-0.5 rounded border border-white/[0.06] hidden sm:inline">
            Gemini 3.8 Flash
          </span>
        </div>

        {/* Minimal Thinking Level Segment Control */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Thinking:</span>
          <div className="flex bg-zinc-900 border border-white/[0.06] rounded-md p-0.5">
            {['low', 'medium', 'high'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setThinkingLevel(lvl)}
                className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] capitalize rounded font-medium transition-colors cursor-pointer ${
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
      </div>

      {/* Cognitive Learning Modes Toolbar */}
      <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1 shrink-0">Pedagogy:</span>
        {MODES.map((m) => {
          const Icon = m.icon;
          const isSelected = learningMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              title={m.desc}
              className={`shrink-0 px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-semibold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtle Prompt Suggestions */}
      <div className="px-3 sm:px-3.5 py-1.5 sm:py-2 border-b border-white/[0.06] bg-zinc-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {getQuickPrompts(learningMode).map((qp, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(qp)}
            disabled={isLoading}
            className="shrink-0 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-colors cursor-pointer"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-900/70 border border-white/[0.06] text-zinc-200'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                    >
                      {sanitizeMathText(msg.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="markdown-content space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                      components={{
                        strong: ({ ...props }) => (
                          <strong className="font-semibold text-white" {...props} />
                        ),
                        em: ({ ...props }) => (
                          <em className="italic text-zinc-300" {...props} />
                        ),
                        code: ({ children, ...props }) => (
                          <code
                            className="font-mono px-1 py-0.5 rounded bg-black/80 text-zinc-200 text-xs border border-white/[0.06]"
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        p: ({ ...props }) => (
                          <p className="leading-relaxed mb-2 last:mb-0" {...props} />
                        ),
                        ul: ({ ...props }) => (
                          <ul className="list-disc list-inside space-y-1 my-1.5 text-zinc-300" {...props} />
                        ),
                        ol: ({ ...props }) => (
                          <ol className="list-decimal list-inside space-y-1 my-1.5 text-zinc-300" {...props} />
                        ),
                        li: ({ ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        blockquote: ({ ...props }) => (
                          <blockquote className="border-l-2 border-zinc-700 pl-2.5 my-1.5 text-zinc-400 italic" {...props} />
                        )
                      }}
                    >
                      {sanitizeMathText(msg.content)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 py-1 px-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
            <span>Senpai is reasoning ({learningMode.replace('_', ' ')})...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Dock */}
      <div className="p-2.5 sm:p-3 bg-zinc-950 border-t border-white/[0.08]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 bg-zinc-900 border border-white/[0.08] focus-within:border-zinc-500 rounded-lg px-2.5 sm:px-3 py-1.5 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              learningMode === 'teach_senpai'
                ? 'Teach Senpai your explanation from first principles...'
                : learningMode === 'exam_boss'
                ? 'Defend your answer to the Professor...'
                : 'Ask Senpai about this topic...'
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none min-w-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-md bg-white text-black hover:bg-zinc-200 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
