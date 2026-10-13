"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Campaign, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ThreeDParticleField from "@/components/ThreeDParticleField";
import ThreeDTilt from "@/components/ThreeDTilt";

export default function CampaignsPage() {
  const { user, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newObjective, setNewObjective] = useState("BRAND_AWARENESS");
  const [newBudget, setNewBudget] = useState("100000");
  const [newPrizePool, setNewPrizePool] = useState("50000");
  const [newDescription, setNewDescription] = useState("");
  const [newRules, setNewRules] = useState("");
  const [newEligibility, setNewEligibility] = useState("");
  const [newPlatforms, setNewPlatforms] = useState<string[]>(["YOUTUBE", "INSTAGRAM"]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.campaigns.list(0, 50);
      setCampaigns(res.content || []);
    } catch (err: any) {
      setError(err.message || "Failed to load campaigns from Spring Boot.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    setNewSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const brandIdToUse = user?.brandId || 1;
      await api.campaigns.create(brandIdToUse, {
        title: newTitle,
        slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        product: newProduct,
        objective: newObjective,
        budget: parseFloat(newBudget) || 100000,
        prizePool: parseFloat(newPrizePool) || 50000,
        description: newDescription,
        rules: newRules,
        eligibility: newEligibility,
        platforms: newPlatforms,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewSlug("");
      setNewProduct("");
      setNewDescription("");
      setStatusMessage("✓ New viral challenge launched and active!");
      await fetchCampaigns();
    } catch (err: any) {
      alert("Failed to create campaign: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, nextStatus: string) => {
    try {
      await api.campaigns.updateStatus(id, nextStatus);
      setStatusMessage(`✓ Campaign #${id} status changed to ${nextStatus}`);
      await fetchCampaigns();
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (filter !== "ALL" && c.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (c.title || "").toLowerCase();
        const b = (c.brandName || "").toLowerCase();
        const p = (c.product || "").toLowerCase();
        return t.includes(q) || b.includes(q) || p.includes(q);
      }
      return true;
    });
  }, [campaigns, filter, searchQuery]);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* 3D Ambient Hologram Field */}
      <ThreeDParticleField
        className="w-full h-44 -mt-4 mb-2 opacity-80"
        themeColor="pink"
        showCenterHologram={true}
      />

      <div className="max-w-7xl mx-auto space-y-6 -mt-16 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🚀 Viral Brand Challenges</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-950/60 text-pink-400 border border-pink-800/60 font-semibold shadow-sm shadow-pink-900/30">
                PostgreSQL Engine
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Browse brand challenges, submit creator content, and inspect live prize distributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-pink-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Launch Campaign</span>
            </button>
            <button
              onClick={fetchCampaigns}
              className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors text-xs cursor-pointer"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Live Notification Banner */}
        {statusMessage && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 font-bold ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["ALL", "ACTIVE", "DRAFT", "COMPLETED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges, brands, or products..."
              className="px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 focus:border-pink-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none w-full sm:w-64 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-base font-semibold text-white">No campaigns found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No campaigns match the filter &quot;{filter}&quot;. Launch a new challenge to get creators posting!
            </p>
          </div>
        ) : (
          /* Campaign Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((camp) => (
              <ThreeDTilt key={camp.id} maxTilt={7} scale={1.02} className="h-full">
                <div
                  className="group backdrop-blur-md bg-zinc-950/90 border border-zinc-800/90 hover:border-pink-500/50 rounded-3xl p-6 transition-all shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Top Bar: Brand & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-pink-400 bg-pink-950/50 border border-pink-900/60 px-3 py-0.5 rounded-full">
                        {camp.brandName || "Verified Brand"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          camp.status === "ACTIVE"
                            ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/70"
                            : camp.status === "DRAFT"
                            ? "bg-amber-950/70 text-amber-400 border border-amber-800/70"
                            : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    {/* Title & Product */}
                    <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                      {camp.title}
                    </h3>
                    {camp.product && (
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Target Product: <span className="text-zinc-200 font-medium">{camp.product}</span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                      {camp.description || "No description provided."}
                    </p>

                    {/* Platforms */}
                    <div className="flex items-center gap-1.5 mt-4">
                      {camp.platforms?.map((plat) => (
                        <span
                          key={plat}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            plat === "YOUTUBE"
                              ? "bg-red-950/50 text-red-300 border-red-900/60"
                            : "bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-900/60"
                          }`}
                        >
                          {plat === "YOUTUBE" ? "▶ YouTube" : "📸 Instagram"}
                        </span>
                      ))}
                    </div>

                    {/* Budget & Prize Pool Metrics */}
                    <div className="grid grid-cols-2 gap-3 mt-5 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                          Total Budget
                        </div>
                        <div className="text-sm font-bold text-white">
                          ₹{camp.budget?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                          Prize Pool
                        </div>
                        <div className="text-sm font-bold text-emerald-400">
                          ₹{camp.prizePool?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/submissions?campaignId=${camp.id}`}
                        className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-pink-500/20"
                      >
                        ⚡ Submit Content
                      </Link>
                      <Link
                        href={`/leaderboard?campaignId=${camp.id}`}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 rounded-xl text-xs font-medium transition-colors"
                      >
                        🏆 Leaderboard
                      </Link>
                    </div>

                    {/* Status toggle action */}
                    {camp.status === "DRAFT" && (
                      <button
                        onClick={() => handleStatusChange(camp.id, "ACTIVE")}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer"
                      >
                        Activate
                      </button>
                    )}
                    {camp.status === "ACTIVE" && (
                      <button
                        onClick={() => handleStatusChange(camp.id, "COMPLETED")}
                        className="px-2 py-1 text-[11px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </ThreeDTilt>
            ))}
          </div>
        )}
      </div>

      {/* Launch Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="text-base font-bold text-white">Launch New Creator Campaign</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Puma Deviate Nitro Speed Challenge"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Target Product</label>
                <input
                  type="text"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="e.g. Nitro 3 Elite Shoes"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Total Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Prize Pool (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newPrizePool}
                    onChange={(e) => setNewPrizePool(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description & Guidelines</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain video prompt, required hashtags, and creative constraints..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Eligible Platforms</label>
                <div className="flex gap-2">
                  {["YOUTUBE", "INSTAGRAM"].map((p) => {
                    const isSelected = newPlatforms.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => {
                          setNewPlatforms((prev) =>
                            isSelected ? prev.filter((x) => x !== p) : [...prev, p]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                          isSelected
                            ? "bg-pink-950/60 border-pink-500 text-pink-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {p === "YOUTUBE" ? "▶ YouTube" : "📸 Instagram"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Launching..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}