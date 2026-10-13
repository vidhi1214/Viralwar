"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CreatorProfile, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ThreeDParticleField from "@/components/ThreeDParticleField";
import ThreeDTilt from "@/components/ThreeDTilt";

export default function CreatorsPage() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchCreators = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.creators.list(0, 50);
      setCreators(res.content || []);
    } catch (err: any) {
      setError(err.message || "Failed to load creators from Spring Boot.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const handleToggleVerify = async (creator: CreatorProfile) => {
    try {
      await api.creators.toggleVerify(creator.id, !creator.verifiedStatus);
      setStatusMessage(`✓ Creator ${creator.displayName} verification updated!`);
      await fetchCreators();
    } catch (err: any) {
      alert("Verification toggle failed: " + err.message);
    }
  };

  const categories = ["ALL", "TECH", "LIFESTYLE", "CREATIVE", "FITNESS", "GAMING", "FASHION"];

  const filtered = useMemo(() => {
    return creators.filter((c) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        if (!c.categories || !c.categories.includes(selectedCategory)) {
          return false;
        }
      }
      // Search term
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        c.displayName?.toLowerCase().includes(term) ||
        c.username?.toLowerCase().includes(term) ||
        c.bio?.toLowerCase().includes(term)
      );
    });
  }, [creators, selectedCategory, search]);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* 3D Ambient Hologram Field */}
      <ThreeDParticleField
        className="w-full h-44 -mt-4 mb-2 opacity-80"
        themeColor="purple"
        showCenterHologram={true}
      />

      <div className="max-w-7xl mx-auto space-y-6 -mt-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>👥 Creator Talent Network</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-400 border border-purple-800/60 font-semibold shadow-sm shadow-purple-950/30">
                PostgreSQL Profiles
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Top viral creators, verified badges, audience reach, and algorithmic reputation scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creator by name or @handle..."
                className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none w-64 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={fetchCreators}
              className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors text-xs cursor-pointer"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-purple-900/60 text-purple-200 border border-purple-600 shadow-sm shadow-purple-900/40"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              {cat === "ALL" ? "All Creators" : `#${cat}`}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Creator Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="text-base font-semibold text-white">No creators match your search</h3>
            <p className="text-xs text-zinc-500 mt-1">Try another category or handle search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((creator) => (
              <ThreeDTilt key={creator.id} maxTilt={12} scale={1.025} className="h-full">
                <div className="backdrop-blur-md bg-zinc-950/90 border border-zinc-800/90 hover:border-purple-500/50 rounded-3xl p-6 transition-all shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between group h-full">
                  <div>
                    {/* Top row: Avatar & Verification */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                          <img
                            src={
                              creator.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${creator.username}`
                            }
                            alt={creator.displayName}
                            className="w-full h-full object-cover rounded-[14px]"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                              {creator.displayName}
                            </h3>
                            {creator.verifiedStatus && (
                              <span className="text-teal-400 text-sm font-bold" title="Verified Creator">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-purple-400 font-mono">
                            @{creator.username}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                          Reputation
                        </div>
                        <div className="text-xs font-black text-emerald-400">
                          {creator.reputationScore?.toFixed(1) || 90.0} / 100
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {creator.bio || "Active content creator in the ViralWar creator pool."}
                    </p>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {creator.categories?.map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300"
                        >
                          #{cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Metrics & Actions */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-500 font-medium block">
                        Audience Reach
                      </span>
                      <span className="text-sm font-bold text-white">
                        {creator.followerCount?.toLocaleString() || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/submissions"
                        className="px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors font-medium"
                      >
                        Submissions
                      </Link>

                      {/* Admin toggle verification */}
                      <button
                        onClick={() => handleToggleVerify(creator)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          creator.verifiedStatus
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        {creator.verifiedStatus ? "✓ Verified" : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              </ThreeDTilt>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}