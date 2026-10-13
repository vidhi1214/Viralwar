"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThreeDHero from "@/components/ThreeDHero";
import ThreeDTilt from "@/components/ThreeDTilt";
import { api, Campaign, Submission } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeSubmissions: 0,
    totalCreators: 0,
    fraudAlerts: 0,
    totalPrizePool: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [campsRes, subsRes, creatorsRes, fraudRes] = await Promise.allSettled([
          api.campaigns.list(0, 10),
          api.submissions.list(undefined, undefined, 0, 10),
          api.creators.list(0, 10),
          api.fraud.list(undefined, 0, 10),
        ]);

        const campaigns = campsRes.status === "fulfilled" ? campsRes.value.content || [] : [];
        const submissions = subsRes.status === "fulfilled" ? subsRes.value.content || [] : [];
        const creators = creatorsRes.status === "fulfilled" ? creatorsRes.value.content || [] : [];
        const fraud = fraudRes.status === "fulfilled" ? fraudRes.value.content || [] : [];

        const prizeSum = campaigns.reduce((acc, c) => acc + (c.prizePool || 0), 0);

        setStats({
          totalCampaigns: campaigns.length,
          activeSubmissions: submissions.length,
          totalCreators: creators.length,
          fraudAlerts: fraud.length,
          totalPrizePool: prizeSum,
        });

        setRecentCampaigns(campaigns.slice(0, 3));
        setRecentSubmissions(submissions.slice(0, 3));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 3D Interactive Hero Canvas */}
      <div className="relative">
        <ThreeDHero className="h-[460px] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

        {/* Hero Overlay Text */}
        <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-950/60 text-pink-300 border border-pink-800/80 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              Creator Economy 2.0 • Live Algorithmic Tracking
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-none">
              Where Creators Fight for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                Viral Supremacy
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Real-time YouTube Data API v3 and Instagram Graph API metrics synchronization. Automated leaderboard ranking, fraud detection heuristics, and instant payouts.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Live Counters Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ThreeDTilt maxTilt={12} scale={1.03}>
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-pink-500/50 transition-colors h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Active Campaigns
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {stats.totalCampaigns}
              </div>
              <div className="text-[11px] text-pink-400 mt-2 flex items-center gap-1 font-medium">
                <span>🚀 Postgres Synced</span>
              </div>
            </div>
          </ThreeDTilt>

          <ThreeDTilt maxTilt={12} scale={1.03}>
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-teal-500/50 transition-colors h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Live Submissions
              </div>
              <div className="text-3xl font-black text-teal-400 mt-1">
                {stats.activeSubmissions}
              </div>
              <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1 font-medium">
                <span>▶ YouTube • 📸 Instagram</span>
              </div>
            </div>
          </ThreeDTilt>

          <ThreeDTilt maxTilt={12} scale={1.03}>
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Prize Pool Available
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                ₹{stats.totalPrizePool.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                <span>💰 INR Smart Allocations</span>
              </div>
            </div>
          </ThreeDTilt>

          <ThreeDTilt maxTilt={12} scale={1.03}>
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Fraud Alerts Guarded
              </div>
              <div className="text-3xl font-black text-purple-400 mt-1">
                {stats.fraudAlerts}
              </div>
              <div className="text-[11px] text-purple-400 mt-2 flex items-center gap-1 font-medium">
                <span>🛡️ Velocity & IP Heuristics</span>
              </div>
            </div>
          </ThreeDTilt>
        </div>

        {/* Core Workflow Action Tiles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Platform Command Center
            </h2>
            <span className="text-xs text-zinc-500">
              Select module to manage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ThreeDTilt maxTilt={12} scale={1.03} className="h-full">
              <Link
                href="/campaigns"
                className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-pink-500/60 transition-all group shadow-xl block h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  🚀
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                  Brand Challenges & Campaigns
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Launch prize pools, set qualification rules, and manage live campaign lifecycles.
                </p>
              </Link>
            </ThreeDTilt>

            <ThreeDTilt maxTilt={12} scale={1.03} className="h-full">
              <Link
                href="/submissions"
                className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-teal-500/60 transition-all group shadow-xl block h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                  Submissions & Live Metrics Sync
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Submit YouTube/Instagram content and trigger real-time metric updates via WebClient.
                </p>
              </Link>
            </ThreeDTilt>

            <ThreeDTilt maxTilt={12} scale={1.03} className="h-full">
              <Link
                href="/leaderboard"
                className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-amber-500/60 transition-all group shadow-xl block h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  🏆
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Dynamic Leaderboards
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Inspect live creator rankings, scoring velocity, and reward allocations in real time.
                </p>
              </Link>
            </ThreeDTilt>

            <ThreeDTilt maxTilt={12} scale={1.03} className="h-full">
              <Link
                href="/creators"
                className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-purple-500/60 transition-all group shadow-xl block h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  👥
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Creator Talent Network
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Discover verified short-form video creators, cross-platform reach, and reputation scores.
                </p>
              </Link>
            </ThreeDTilt>

            <ThreeDTilt maxTilt={12} scale={1.03} className="h-full">
              <Link
                href="/fraud"
                className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-red-500/60 transition-all group shadow-xl block h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  🛡️
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-red-300 transition-colors">
                  AI Bot & Fraud Guard
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Protect brand budgets with velocity spike detection and click farm IP clustering.
                </p>
              </Link>
            </ThreeDTilt>

            <ThreeDTilt maxTilt={12} scale={1.03} className="h-full">
              <Link
                href="/metrics"
                className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-indigo-500/60 transition-all group shadow-xl block h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  🔬
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Live Social Inspector Sandbox
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Direct developer sandbox to test YouTube Data API and Instagram Graph API responses.
                </p>
              </Link>
            </ThreeDTilt>
          </div>
        </div>

        {/* Live System Architecture Badge */}
        <ThreeDTilt maxTilt={8} scale={1.015}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-sm font-bold text-white">
                  Enterprise Microservices Backend Architecture
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Spring Boot 3.4.5 (Java 21) • PostgreSQL Database • Spring Security 6 JWT • WebClient Social Integrations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="http://localhost:8080/api/swagger-ui.html"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Swagger UI Docs</span>
                <span>↗</span>
              </a>
              <a
                href="http://localhost:8080/api/v3/api-docs"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>OpenAPI v3 JSON</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </ThreeDTilt>
      </main>
    </div>
  );
}