import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, ArrowUp, Loader2 } from 'lucide-react';

export default function SocraticChat({ topic, thinkingLevel, setThinkingLevel, customPrompt, onClearCustomPrompt }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Konnichiwa! I'm your study partner **SenpaiAI**. We're exploring **${topic?.title || 'this topic'}**.\n\nTake a look at the infographic on the right: notice how the abstract mechanics are anchored visually. What part of the diagram or concept feels tricky? Let's unpack it together.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Konnichiwa! I'm your study partner **SenpaiAI**. We're exploring **${topic?.title || 'this topic'}**!\n\nTake a look at the diagram on the right. What part would you like me to clarify with an anime mental model?`
      }
    ]);
  }, [topic?.id]);

  useEffect(() => {
    if (customPrompt) {
      sendMessage(customPrompt);
      if (onClearCustomPrompt) onClearCustomPrompt();
    }
  }, [customPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    `Why is this concept crucial in exams?`,
    `Explain the visual cues in the diagram`,
    `Give me a counter-example or edge case`,
    `Quiz my intuition with a tricky scenario`
  ];

  const sendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicContext: topic,
          messages: newMessages,
          userMessage: query,
          thinkingLevel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from SenpaiAI');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Apologies, I encountered a temporary network issue. Please ask again. (${err.message})`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[580px] rounded-xl bg-zinc-950 border border-white/[0.08] overflow-hidden">
      {/* Sleek Minimal Header */}
      <div className="px-4 py-2.5 border-b border-white/[0.08] bg-zinc-900/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">SenpaiAI</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-white/[0.06]">
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
                className={`px-2 py-0.5 text-[11px] capitalize rounded font-medium transition-colors cursor-pointer ${
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

      {/* Subtle Prompt Suggestions */}
      <div className="px-3.5 py-2 border-b border-white/[0.06] bg-zinc-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(qp)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-md text-xs bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-colors cursor-pointer"
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
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="markdown-content space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-white" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic text-zinc-300" {...props} />
                        ),
                        code: ({ inline, className, children, ...props }) => {
                          return (
                            <code
                              className="font-mono px-1 py-0.5 rounded bg-black/80 text-zinc-200 text-xs border border-white/[0.06]"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        p: ({ node, ...props }) => (
                          <p className="leading-relaxed mb-2 last:mb-0" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside space-y-1 my-1.5 text-zinc-300" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside space-y-1 my-1.5 text-zinc-300" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-zinc-700 pl-2.5 my-1.5 text-zinc-400 italic" {...props} />
                        )
                      }}
                    >
                      {msg.content}
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
            <span>Senpai is reasoning...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Dock */}
      <div className="p-3 bg-zinc-950 border-t border-white/[0.08]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 bg-zinc-900 border border-white/[0.08] focus-within:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Senpai a question about this topic..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-md bg-white text-black hover:bg-zinc-200 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
