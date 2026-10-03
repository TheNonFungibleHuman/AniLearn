import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, X, MessageSquare } from 'lucide-react';

export default function VisualCanvas({ topic, onAskSenpai }) {
  const [zoom, setZoom] = useState(1);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  if (!topic) return null;

  return (
    <div className="space-y-4">
      {/* Canvas Card */}
      <div className="rounded-xl bg-zinc-950 border border-white/[0.08] overflow-hidden">
        {/* Sleek Toolbar */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.08] bg-zinc-900/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-zinc-400 min-w-0">
            <span className="font-medium text-zinc-200">Infographic</span>
            <span>•</span>
            <span className="capitalize truncate">{topic.style || 'Anime'}</span>
          </div>

          {/* Minimal Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              className="p-1 sm:p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] sm:text-xs font-mono text-zinc-400 px-1 min-w-[36px] sm:min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom in"
              className="p-1 sm:p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset zoom"
              className="p-1 sm:p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-zinc-800 mx-0.5 sm:mx-1" />
            <button
              onClick={() => setIsFullscreen(true)}
              title="Fullscreen"
              className="p-1 sm:p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <a
              href={topic.imageUrl}
              download={`${topic.id}_diagram.jpg`}
              target="_blank"
              rel="noreferrer"
              title="Download image"
              className="p-1 sm:p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Viewport & Image */}
        <div className="relative min-h-[250px] sm:min-h-[360px] max-h-[500px] bg-black flex items-center justify-center overflow-auto p-2 sm:p-3">
          <div
            className="transition-transform duration-150 ease-out origin-center flex items-center justify-center max-w-full"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={topic.imageUrl}
              alt={topic.title}
              className="rounded-lg object-contain max-h-[460px] w-auto border border-white/[0.04] shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Diagram Hotspots */}
      {topic.hotspots && topic.hotspots.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2 sm:mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Interactive Hotspots
            </span>
            <span className="text-[11px] text-zinc-500">Tap to inspect</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {topic.hotspots.map((spot, idx) => {
              const isSelected = selectedHotspot?.id === spot.id;
              return (
                <button
                  key={spot.id}
                  onClick={() => setSelectedHotspot(isSelected ? null : spot)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-black font-semibold'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06]'
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 font-mono">0{idx + 1}</span>
                  <span>{spot.label}</span>
                </button>
              );
            })}
          </div>

          {selectedHotspot && (
            <div className="p-3.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-white">{selectedHotspot.label}</span>
                <button
                  onClick={() => onAskSenpai(`Senpai, can you explain the role of "${selectedHotspot.label}" in the diagram?`)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Senpai</span>
                </button>
              </div>
              <p className="text-zinc-300 leading-relaxed">{selectedHotspot.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col p-4 sm:p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">{topic.title}</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <img
              src={topic.imageUrl}
              alt={topic.title}
              className="max-h-[88vh] max-w-full object-contain rounded-lg border border-white/[0.08]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
