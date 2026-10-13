"use client";

import React, { useState } from "react";
import { YouTubeLiveStats, api } from "@/lib/api";
import ThreeDParticleField from "@/components/ThreeDParticleField";
import ThreeDTilt from "@/components/ThreeDTilt";
import VideoPreviewModal from "@/components/VideoPreviewModal";

export default function SocialInspectorPage() {
  const [videoInput, setVideoInput] = useState("0e3GPea1Tyg");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoStats, setVideoStats] = useState<YouTubeLiveStats | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const presets = [
    { label: "MrBeast Squid Game (Viral Hit)", id: "0e3GPea1Tyg" },
    { label: "Rick Astley (Classic)", id: "dQw4w9WgXcQ" },
    { label: "Viral Shorts", id: "3JZ_D3ELwOQ" },
  ];

  const handleInspectYouTube = async (idToInspect?: string) => {
    let vid = idToInspect || videoInput;
    // Extract ID if full URL passed
    if (vid.includes("v=")) {
      vid = vid.split("v=")[1].split("&")[0];
    } else if (vid.includes("youtu.be/")) {
      vid = vid.split("youtu.be/")[1].split("?")[0];
    } else if (vid.includes("/shorts/")) {
      vid = vid.split("/shorts/")[1].split("?")[0];
    }

    setLoadingVideo(true);
    setVideoError(null);
    try {
      const res = await api.metrics.getYouTubeVideo(vid.trim());
      setVideoStats(res);
    } catch (err: any) {
      setVideoError(
        err.message ||
          "Failed to fetch YouTube stats. Please verify video ID or check network connection."
      );
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* 3D Ambient Hologram Field */}
      <ThreeDParticleField
        className="w-full h-44 -mt-4 mb-2 opacity-80"
        themeColor="teal"
        showCenterHologram={true}
      />

      <div className="max-w-5xl mx-auto space-y-6 -mt-16 relative z-10">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🔬 Live Social API Inspector</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/60 font-semibold shadow-sm shadow-red-950/30">
              YouTube Data API v3 & Caffeine Cache
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Test real-time social metrics directly via the Spring Boot reactive WebClient integration.
          </p>
        </div>

        {/* YouTube Inspection Sandbox */}
        <div className="backdrop-blur-md bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-red-950/60 text-red-400 border border-red-900/60 flex items-center justify-center font-bold text-lg shadow-md shadow-red-950/40">
                ▶
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">YouTube Video Inspector</h2>
                <span className="text-[11px] text-zinc-500 font-mono">
                  GET /api/metrics/youtube/video/{`{videoId}`}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-lg font-mono">
              ⚡ Reactive WebClient
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs text-zinc-400 font-medium mr-2">Quick Test Presets:</span>
            <div className="inline-flex gap-2 flex-wrap mt-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setVideoInput(p.id);
                    handleInspectYouTube(p.id);
                  }}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Action */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Paste YouTube Video ID or URL (e.g. 0e3GPea1Tyg)..."
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-red-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none font-mono"
            />
            <button
              onClick={() => handleInspectYouTube()}
              disabled={loadingVideo}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loadingVideo ? "Querying..." : "Query Live Social API"}</span>
              <span>⚡</span>
            </button>
          </div>

          {videoError && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-300 text-xs">
              {videoError}
            </div>
          )}

          {/* Inspection Results Card */}
          {videoStats && (
            <ThreeDTilt maxTilt={10} scale={1.02}>
              <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {videoStats.title || "YouTube Video Stats"}
                    </h3>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Channel: <span className="text-zinc-200 font-semibold">{videoStats.channelTitle || "Official Channel"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="px-3.5 py-1.5 bg-red-950/60 text-red-300 border border-red-900/70 hover:bg-red-900/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>▶ Play Preview</span>
                  </button>
                </div>

                {/* Metric stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                    <div className="text-[10px] uppercase text-zinc-500 font-medium">Views</div>
                    <div className="text-xl font-black text-white mt-1">
                      {videoStats.viewCount?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                    <div className="text-[10px] uppercase text-zinc-500 font-medium">Likes</div>
                    <div className="text-xl font-black text-pink-400 mt-1">
                      {videoStats.likeCount?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                    <div className="text-[10px] uppercase text-zinc-500 font-medium">Comments</div>
                    <div className="text-xl font-black text-teal-400 mt-1">
                      {videoStats.commentCount?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                    <div className="text-[10px] uppercase text-zinc-500 font-medium">Engagement Rate</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      {videoStats.engagementRate ? `${videoStats.engagementRate.toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </ThreeDTilt>
          )}
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        url={`https://www.youtube.com/watch?v=${videoInput}`}
        title={videoStats?.title || "Video Preview"}
        creator={videoStats?.channelTitle}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
