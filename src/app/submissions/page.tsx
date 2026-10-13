"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Submission, Campaign, MetricSnapshot, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ThreeDParticleField from "@/components/ThreeDParticleField";
import VideoPreviewModal from "@/components/VideoPreviewModal";
import ThreeDTilt from "@/components/ThreeDTilt";

export default function SubmissionsPage() {
  const { user, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Video Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewCreator, setPreviewCreator] = useState("");

  // Snapshot modal state
  const [activeSnapshot, setActiveSnapshot] = useState<MetricSnapshot | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<MetricSnapshot[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // New Submission Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(1);
  const [contentUrl, setContentUrl] = useState("");
  const [platform, setPlatform] = useState<string>("YOUTUBE");
  const [contentType, setContentType] = useState<string>("VIDEO");
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subsRes, campsRes] = await Promise.all([
        api.submissions.list(undefined, undefined, 0, 50),
        api.campaigns.list(0, 50),
      ]);
      setSubmissions(subsRes.content || []);
      setCampaigns(campsRes.content || []);
      if (campsRes.content?.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(campsRes.content[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load submissions from Spring Boot backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Read campaignId from query param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const campId = params.get("campaignId");
      if (campId) {
        setSelectedCampaignId(Number(campId));
        setShowSubmitModal(true);
      }
    }
  }, []);

  // Live Refresh Metrics Action
  const handleRefreshMetrics = async (sub: Submission) => {
    setRefreshingId(sub.id);
    setStatusMessage(null);
    try {
      const snapshot = await api.metrics.refreshSnapshot(sub.id);
      setActiveSnapshot(snapshot);
      setStatusMessage(
        `✓ Live metrics synced! Views: ${snapshot.views.toLocaleString()}, Likes: ${snapshot.likes.toLocaleString()}, Engagement: ${snapshot.engagementRate?.toFixed(2)}%`
      );
    } catch (err: any) {
      setStatusMessage(`⚠ Refresh note: ${err.message}`);
    } finally {
      setRefreshingId(null);
    }
  };

  // View Historical Snapshots
  const handleViewHistory = async (submissionId: number) => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.metrics.getSnapshots(submissionId, 0, 20);
      setSnapshotHistory(res.content || []);
    } catch (err: any) {
      alert("Failed to load metric history: " + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Approve / Reject
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.submissions.updateStatus(id, newStatus);
      setStatusMessage(`✓ Submission #${id} marked as ${newStatus}!`);
      // Optimistic update
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: (newStatus === "APPROVED" ? "LIVE" : newStatus) as any, moderationStatus: newStatus }
            : s
        )
      );
      await fetchData();
    } catch (err: any) {
      alert("Status update failed: " + (err.message || "Please check network or permissions"));
    }
  };

  // Submit Content URL
  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const creatorIdToUse = user?.creatorId || 1;
      await api.submissions.create({
        campaignId: selectedCampaignId,
        creatorId: creatorIdToUse,
        contentUrl,
        platform,
        contentType,
        caption,
      });
      setShowSubmitModal(false);
      setContentUrl("");
      setCaption("");
      await fetchData();
      setStatusMessage("✓ Content submission created and persisted in PostgreSQL database!");
    } catch (err: any) {
      alert("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Searched Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Tab filter
      if (activeTab === "PENDING" && sub.status !== "PENDING") return false;
      if (activeTab === "APPROVED" && sub.status !== "APPROVED" && sub.status !== "LIVE") return false;
      if (activeTab === "REJECTED" && sub.status !== "REJECTED") return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const creatorName = (
          sub.creator?.displayName ||
          sub.creator?.username ||
          sub.creatorDisplayName ||
          sub.creatorUsername ||
          ""
        ).toLowerCase();
        const campTitle = (sub.campaign?.title || sub.campaignTitle || "").toLowerCase();
        const url = (sub.contentUrl || "").toLowerCase();
        return creatorName.includes(q) || campTitle.includes(q) || url.includes(q);
      }

      return true;
    });
  }, [submissions, activeTab, searchQuery]);

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED" || s.status === "LIVE").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* 3D Ambient Holographic Field */}
      <ThreeDParticleField
        className="w-full h-44 -mt-4 mb-2 opacity-80"
        themeColor="teal"
        showCenterHologram={true}
      />

      <div className="max-w-7xl mx-auto space-y-6 -mt-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>⚡ Live Submissions & Real-Time Tracking</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-950/60 text-teal-400 border border-teal-800/60 font-semibold shadow-sm shadow-teal-900/30">
                YouTube & Instagram WebClient
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Verify creator media submissions, moderate video URLs, and query live engagement stats.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Submit Content URL</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors text-xs cursor-pointer"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Live Notification Banner */}
        {statusMessage && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 font-bold ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              All Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "PENDING"
                  ? "bg-amber-950/70 text-amber-300 border border-amber-800 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              Pending Review ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("APPROVED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "APPROVED"
                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              Live / Approved ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab("REJECTED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "REJECTED"
                  ? "bg-red-950/70 text-red-300 border border-red-800 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creator, campaign, or URL..."
              className="px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 focus:border-teal-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none w-full sm:w-64 transition-all"
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

        {/* Submissions Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 animate-pulse" />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
            <div className="text-3xl mb-2">📹</div>
            <h3 className="text-base font-semibold text-white">No submissions matching criteria</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Submit a YouTube video or Instagram reel to trigger real-time metric tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub) => {
              const isRefreshing = refreshingId === sub.id;

              // Resolved Names (No undefined artifacts)
              const creatorDisplayName =
                sub.creator?.displayName ||
                sub.creatorDisplayName ||
                sub.creator?.username ||
                sub.creatorUsername ||
                "Creator";
              const creatorHandle = sub.creator?.username ? `@${sub.creator.username}` : "";
              const campaignTitle =
                sub.campaign?.title ||
                sub.campaignTitle ||
                (sub.campaign?.id ? `Campaign #${sub.campaign.id}` : `Campaign #${sub.campaignId || sub.id}`);
              const isLive = sub.status === "APPROVED" || sub.status === "LIVE";
              const isPending = sub.status === "PENDING";
              const isRejected = sub.status === "REJECTED";

              return (
                <ThreeDTilt key={sub.id} maxTilt={6} scale={1.01} className="w-full">
                  <div className="backdrop-blur-md bg-zinc-950/90 border border-zinc-800/90 hover:border-teal-500/50 rounded-2xl p-5 transition-all shadow-xl hover:shadow-teal-500/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group">
                    {/* Left Column: Creator & Content Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Media Type Icon / Play Preview Button */}
                      <button
                        onClick={() => {
                          setPreviewUrl(sub.contentUrl);
                          setPreviewTitle(campaignTitle);
                          setPreviewCreator(creatorDisplayName);
                          setPreviewModalOpen(true);
                        }}
                        title="Click to preview video clip"
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-transform group-hover:scale-105 cursor-pointer shadow-md ${
                          sub.platform === "YOUTUBE"
                            ? "bg-red-950/60 text-red-400 border border-red-900/80 hover:bg-red-900/50"
                            : "bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-900/80 hover:bg-fuchsia-900/50"
                        }`}
                      >
                        {sub.platform === "YOUTUBE" ? "▶" : "📸"}
                      </button>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {creatorDisplayName}
                          </span>
                          {creatorHandle && (
                            <span className="text-xs text-teal-400 font-mono">
                              {creatorHandle}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md font-mono">
                            {sub.contentType || "VIDEO"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isLive
                                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/80"
                                : isRejected
                                ? "bg-red-950/70 text-red-400 border border-red-800/80"
                                : "bg-amber-950/70 text-amber-400 border border-amber-800/80 animate-pulse"
                            }`}
                          >
                            {isLive ? "LIVE" : sub.status}
                          </span>
                        </div>

                        {/* Content URL with clickable preview */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPreviewUrl(sub.contentUrl);
                              setPreviewTitle(campaignTitle);
                              setPreviewCreator(creatorDisplayName);
                              setPreviewModalOpen(true);
                            }}
                            className="text-xs text-teal-400 hover:text-teal-300 underline font-mono truncate max-w-md text-left cursor-pointer"
                          >
                            {sub.contentUrl}
                          </button>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            (Click to play)
                          </span>
                        </div>

                        {/* Caption */}
                        {sub.caption && (
                          <p className="text-xs text-zinc-400 line-clamp-1 italic">
                            &quot;{sub.caption}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle Column: Campaign Name */}
                    <div className="text-xs text-zinc-400 lg:text-right min-w-[170px]">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                        Campaign Challenge
                      </div>
                      <div className="font-bold text-zinc-200 truncate mt-0.5">
                        {campaignTitle}
                      </div>
                      {sub.campaign?.id && (
                        <Link
                          href={`/leaderboard?campaignId=${sub.campaign.id}`}
                          className="text-[10px] text-amber-400 hover:underline mt-0.5 inline-block"
                        >
                          🏆 View Leaderboard →
                        </Link>
                      )}
                    </div>

                    {/* Right Column: Actions */}
                    <div className="flex items-center gap-2 flex-wrap border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-800">
                      {/* Live Metric Refresh Button */}
                      <button
                        onClick={() => handleRefreshMetrics(sub)}
                        disabled={isRefreshing}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className={isRefreshing ? "animate-spin" : ""}>
                          {isRefreshing ? "🔄" : "⚡"}
                        </span>
                        <span>{isRefreshing ? "Querying..." : "Live Metric Sync"}</span>
                      </button>

                      {/* View History Button */}
                      <button
                        onClick={() => handleViewHistory(sub.id)}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        History
                      </button>

                      {/* Moderation Controls (Approve / Reject) */}
                      {isPending ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(sub.id, "APPROVED")}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60 rounded-xl transition-all shadow-sm shadow-emerald-950/40 cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sub.id, "REJECTED")}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900/60 rounded-xl transition-all shadow-sm shadow-red-950/40 cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(sub.id, isLive ? "REJECTED" : "APPROVED")}
                            className="px-2.5 py-1 text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors cursor-pointer"
                          >
                            {isLive ? "Revoke" : "Re-approve"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </ThreeDTilt>
              );
            })}
          </div>
        )}

        {/* Live Snapshot Result Card */}
        {activeSnapshot && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-teal-500/50 shadow-2xl shadow-teal-950/30 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-teal-300 font-extrabold text-sm">
                  ⚡ Live Social API Sync Results ({activeSnapshot.platform})
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Captured at: {new Date(activeSnapshot.capturedAt).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => setActiveSnapshot(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Views</div>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  {activeSnapshot.views?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Likes</div>
                <div className="text-xl font-extrabold text-pink-400 mt-0.5">
                  {activeSnapshot.likes?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Comments</div>
                <div className="text-xl font-extrabold text-teal-400 mt-0.5">
                  {activeSnapshot.comments?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Shares</div>
                <div className="text-xl font-extrabold text-purple-400 mt-0.5">
                  {activeSnapshot.shares?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Reach</div>
                <div className="text-xl font-extrabold text-orange-400 mt-0.5">
                  {activeSnapshot.reach?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800/80 text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Engagement</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  {activeSnapshot.engagementRate ? `${activeSnapshot.engagementRate.toFixed(2)}%` : "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        url={previewUrl}
        title={previewTitle}
        creator={previewCreator}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />

      {/* Submit Content URL Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="text-base font-bold text-white">Submit Content for Tracking</h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmission} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Select Campaign *</label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Platform *</label>
                <div className="grid grid-cols-2 gap-2">
                  {["YOUTUBE", "INSTAGRAM"].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-2 rounded-xl border font-semibold transition-all cursor-pointer ${
                        platform === p
                          ? "bg-teal-950/50 border-teal-500 text-teal-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {p === "YOUTUBE" ? "▶ YouTube" : "📸 Instagram"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Content URL (YouTube Video/Shorts or Instagram Reel/Post) *
                </label>
                <input
                  type="url"
                  required
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder={
                    platform === "YOUTUBE"
                      ? "https://www.youtube.com/watch?v=0e3GPea1Tyg"
                      : "https://www.instagram.com/reel/Cw99XYZ123/"
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Content Format</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="VIDEO">Standard Video</option>
                  <option value="SHORTS">YouTube Shorts</option>
                  <option value="REEL">Instagram Reel</option>
                  <option value="POST">Photo / Carousel Post</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Caption / Notes</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell the brand about your video..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Tracking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snapshot History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h2 className="text-base font-bold text-white">Historical Snapshot Log</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-zinc-500 text-xs">Loading snapshots...</div>
            ) : snapshotHistory.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No historical snapshots found for this submission yet. Click &quot;Live Metric Sync&quot; to capture one!
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {snapshotHistory.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">
                        {snap.views?.toLocaleString()} Views
                      </span>{" "}
                      •{" "}
                      <span className="text-pink-400">
                        {snap.likes?.toLocaleString()} Likes
                      </span>{" "}
                      •{" "}
                      <span className="text-teal-400">
                        {snap.comments?.toLocaleString()} Comments
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {new Date(snap.capturedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
