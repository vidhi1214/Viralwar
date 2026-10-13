"use client";

import React from "react";

interface VideoPreviewModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  creator?: string;
}

export default function VideoPreviewModal({
  url,
  isOpen,
  onClose,
  title,
  creator,
}: VideoPreviewModalProps) {
  if (!isOpen || !url) return null;

  // Extract YouTube ID
  let youtubeId: string | null = null;
  if (url.includes("youtube.com/watch?v=")) {
    youtubeId = url.split("v=")[1]?.split("&")[0] || null;
  } else if (url.includes("youtu.be/")) {
    youtubeId = url.split("youtu.be/")[1]?.split("?")[0] || null;
  } else if (url.includes("youtube.com/shorts/")) {
    youtubeId = url.split("youtube.com/shorts/")[1]?.split("?")[0] || null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🎬 Content Media Preview</span>
              {creator && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-950/60 text-teal-400 border border-teal-800/60">
                  {creator}
                </span>
              )}
            </h3>
            {title && <p className="text-xs text-zinc-400 mt-0.5 truncate">{title}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Player */}
        <div className="p-4 bg-black flex items-center justify-center min-h-[360px]">
          {youtubeId ? (
            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="text-4xl">📸</div>
              <p className="text-sm text-zinc-300 font-medium">Instagram Media Link</p>
              <p className="text-xs text-zinc-500 font-mono break-all max-w-md mx-auto">{url}</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-xl text-xs font-semibold hover:from-fuchsia-500 hover:to-pink-500 transition-all shadow-lg shadow-fuchsia-500/20"
              >
                <span>Open in Instagram</span>
                <span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-white underline font-mono truncate max-w-sm"
          >
            {url}
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
