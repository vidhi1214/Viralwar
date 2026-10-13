"use client";

import React, { useState, useEffect } from "react";
import { LeaderboardEntry, Campaign, api } from "@/lib/api";
import Link from "next/link";
import ThreeDParticleField from "@/components/ThreeDParticleField";
import ThreeDTilt from "@/components/ThreeDTilt";

export default function LeaderboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(1);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await api.campaigns.list(0, 50);
        const list = res.content || [];
        setCampaigns(list);

        // Check query param from URL
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const qId = params.get("campaignId");
          if (qId && list.some((c) => c.id === Number(qId))) {
            setSelectedCampaignId(Number(qId));
            return;
          }
        }

        if (list.length > 0) {
          setSelectedCampaignId(list[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load campaigns.");
      }
    }
    loadCampaigns();
  }, []);

  const loadLeaderboard = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.leaderboard.getByCampaign(selectedCampaignId);
      const sorted = [...data].sort((a, b) => (b.score || 0) - (a.score || 0));
      setEntries(sorted);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCampaignId]);

  const getDisplayName = (entry: any) =>
    entry.creator?.displayName ||
    entry.creatorDisplayName ||
    entry.creator?.username ||
    entry.creatorUsername ||
    "Creator";

  const getUsername = (entry: any) =>
    entry.creator?.username || entry.creatorUsername || "creator";

  const getAvatar = (entry: any) =>
    entry.creator?.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${getUsername(entry)}`;

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* 3D Ambient Holographic Field */}
      <ThreeDParticleField
        className="w-full h-44 -mt-4 mb-2 opacity-80"
        themeColor="amber"
        showCenterHologram={true}
      />

      <div className="max-w-7xl mx-auto space-y-6 -mt-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🏆 Live Campaign Leaderboard</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/60 font-semibold shadow-sm shadow-amber-950/30">
                Postgres Scoring Engine
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Live algorithmic ranking computed from views, engagement velocity, and conversion attribution.
            </p>
          </div>

          {/* Campaign Selector & Quick Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Challenge:</span>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
                className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-semibold cursor-pointer"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href={`/submissions?campaignId=${selectedCampaignId}`}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>+ Submit Content</span>
            </Link>
          </div>
        </div>

        {/* Campaign Info Bar */}
        {selectedCampaign && (
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">
                Current Active Challenge
              </span>
              <div className="font-bold text-white text-sm">
                {selectedCampaign.title}
              </div>
              <p className="text-zinc-400 text-xs">
                {selectedCampaign.description || "Compete for leaderboard rank with high-engagement video content."}
              </p>
            </div>

            <div className="flex items-center gap-4 text-right flex-shrink-0">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Prize Pool</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  ₹{selectedCampaign.prizePool?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Total Budget</span>
                <span className="text-sm font-bold text-white">
                  ₹{selectedCampaign.budget?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Podium for Top 3 */}
        {!isLoading && entries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-2 items-end">
            {/* 2nd Place */}
            {entries[1] ? (
              <ThreeDTilt maxTilt={9} scale={1.02} className="order-2 md:order-1">
                <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col items-center text-center shadow-xl relative overflow-hidden group hover:border-zinc-500 transition-all">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/80 border-2 border-zinc-400 flex items-center justify-center text-2xl mb-2 font-bold text-zinc-300 shadow-md">
                    🥈
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden mb-2 border border-zinc-700">
                    <img src={getAvatar(entries[1])} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {getDisplayName(entries[1])}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    @{getUsername(entries[1])}
                  </div>
                  <div className="mt-3 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400">
                    {entries[1].score?.toLocaleString()} pts
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {entries[1].views?.toLocaleString()} views • {entries[1].engagement?.toLocaleString()} eng
                  </div>
                </div>
              </ThreeDTilt>
            ) : (
              <div className="order-2 md:order-1 hidden md:block" />
            )}

            {/* 1st Place */}
            {entries[0] && (
              <ThreeDTilt maxTilt={10} scale={1.04} className="order-1 md:order-2">
                <div className="p-7 rounded-3xl bg-gradient-to-b from-amber-950/40 via-zinc-950/90 to-zinc-950 border-2 border-amber-500/80 flex flex-col items-center text-center shadow-2xl shadow-amber-500/10 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black uppercase tracking-wider">
                    Champion
                  </div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 p-[2px] mb-2 shadow-lg shadow-amber-500/30">
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-3xl font-bold">
                      🥇
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-2 border-2 border-amber-400 shadow-md">
                    <img src={getAvatar(entries[0])} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {getDisplayName(entries[0])}
                  </div>
                  <div className="text-xs text-amber-400 font-mono">
                    @{getUsername(entries[0])}
                  </div>
                  <div className="mt-3 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
                    {entries[0].score?.toLocaleString()} pts
                  </div>
                  <div className="text-xs text-zinc-300 mt-1 font-medium">
                    {entries[0].views?.toLocaleString()} views • {entries[0].engagement?.toLocaleString()} engagement
                  </div>
                </div>
              </ThreeDTilt>
            )}

            {/* 3rd Place */}
            {entries[2] ? (
              <ThreeDTilt maxTilt={9} scale={1.02} className="order-3">
                <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col items-center text-center shadow-xl relative overflow-hidden group hover:border-amber-900 transition-all">
                  <div className="w-16 h-16 rounded-full bg-amber-950/30 border-2 border-amber-800/70 flex items-center justify-center text-2xl mb-2 font-bold text-amber-600 shadow-md">
                    🥉
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden mb-2 border border-zinc-700">
                    <img src={getAvatar(entries[2])} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {getDisplayName(entries[2])}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    @{getUsername(entries[2])}
                  </div>
                  <div className="mt-3 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900">
                    {entries[2].score?.toLocaleString()} pts
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {entries[2].views?.toLocaleString()} views • {entries[2].engagement?.toLocaleString()} eng
                  </div>
                </div>
              </ThreeDTilt>
            ) : (
              <div className="order-3 hidden md:block" />
            )}
          </div>
        )}

        {/* Detailed Table */}
        <div className="backdrop-blur-md bg-zinc-950/90 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 px-6 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Rankings Table</h2>
            <button
              onClick={loadLeaderboard}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Refresh Table</span>
              <span>🔄</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Loading leaderboard...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No entries recorded for this campaign yet. Submit video content to climb the ranks!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-6">Rank</th>
                    <th className="py-3 px-6">Creator</th>
                    <th className="py-3 px-6">Viral Score</th>
                    <th className="py-3 px-6">Verified Views</th>
                    <th className="py-3 px-6">Total Engagement</th>
                    <th className="py-3 px-6">Momentum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {entries.map((entry, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={entry.id || idx}
                        className="hover:bg-zinc-900/40 transition-colors group"
                      >
                        <td className="py-4 px-6 font-bold text-white">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                              rank === 1
                                ? "bg-amber-500 text-black font-extrabold"
                                : rank === 2
                                ? "bg-zinc-400 text-black font-bold"
                                : rank === 3
                                ? "bg-amber-800 text-white font-bold"
                                : "text-zinc-500"
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800 flex-shrink-0">
                              <img src={getAvatar(entry)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                                {getDisplayName(entry)}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono">
                                @{getUsername(entry)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-amber-400">
                          {entry.score?.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-mono text-zinc-200">
                          {entry.views?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6 font-mono text-zinc-200">
                          {entry.engagement?.toLocaleString() || 0}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              entry.movement === "UP"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                                : entry.movement === "DOWN"
                                ? "bg-red-950/60 text-red-400 border border-red-800/60"
                                : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                            }`}
                          >
                            {entry.movement === "UP" ? "▲ Rising" : entry.movement === "DOWN" ? "▼ Dropping" : "● Stable"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
