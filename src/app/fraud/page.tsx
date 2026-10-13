"use client";

import React, { useState, useEffect } from "react";
import { FraudSignal, api } from "@/lib/api";
import Link from "next/link";
import ThreeDParticleField from "@/components/ThreeDParticleField";
import ThreeDTilt from "@/components/ThreeDTilt";

export default function FraudGuardPage() {
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchFraudSignals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.fraud.list(filterStatus === "ALL" ? undefined : filterStatus, 0, 50);
      setSignals(res.content || []);
    } catch (err: any) {
      setError(err.message || "Failed to load fraud signals from Spring Boot.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudSignals();
  }, [filterStatus]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.fraud.updateStatus(id, status);
      setStatusMessage(`✓ Signal #${id} marked as ${status}!`);
      await fetchFraudSignals();
    } catch (err: any) {
      alert("Failed to update signal status: " + err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* 3D Ambient Hologram Field */}
      <ThreeDParticleField
        className="w-full h-44 -mt-4 mb-2 opacity-80"
        themeColor="pink"
        showCenterHologram={true}
      />

      <div className="max-w-7xl mx-auto space-y-6 -mt-16 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🛡️ AI Bot & Fraud Guard Heuristics</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/60 font-semibold shadow-sm shadow-red-950/30">
                View Velocity & Click Farm Shield
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Automated bot detection, abnormal view velocity spikes, and click-farm IP cluster protection.
            </p>
          </div>

          <button
            onClick={fetchFraudSignals}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors text-xs self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
            title="Refresh"
          >
            <span>🔄</span>
            <span>Refresh Signals</span>
          </button>
        </div>

        {/* Live Notification Banner */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["ALL", "REVIEW", "CONFIRMED", "CLEAR", "RESTRICTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === s
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Signal Cards */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 animate-pulse" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/40 border border-zinc-900 rounded-3xl">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-base font-semibold text-white">No active fraud signals</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              All creator submissions pass algorithmic authenticity checks. No anomalous view velocity detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((sig) => {
              const score = sig.severityScore ?? sig.severity ?? 75;
              const desc = sig.description || sig.evidence || "Anomalous velocity detected against heuristic baseline threshold.";
              return (
                <ThreeDTilt key={sig.id} maxTilt={9} scale={1.02}>
                  <div
                    className="backdrop-blur-md bg-zinc-950/90 border border-zinc-800/90 hover:border-red-500/50 rounded-3xl p-6 transition-all shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {sig.signalType}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            score >= 80
                              ? "bg-red-950/70 text-red-300 border border-red-800"
                              : score >= 50
                              ? "bg-amber-950/70 text-amber-300 border border-amber-800"
                              : "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          Risk: {score}%
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            sig.status === "CONFIRMED"
                              ? "bg-red-900 text-white"
                              : sig.status === "CLEAR"
                              ? "bg-emerald-900 text-white"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {sig.status}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400">
                        {desc}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono pt-1">
                        <span>Creator Profile #{sig.creatorId}</span>
                        <span>Submission #{sig.submissionId || sig.id}</span>
                        <span>
                          Detected: {sig.createdAt ? new Date(sig.createdAt).toLocaleString() : "Recently"}
                        </span>
                      </div>
                    </div>

                    {/* Moderate Signal Actions */}
                    <div className="flex items-center gap-2 flex-wrap border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                      <Link
                        href={`/submissions`}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs transition-colors"
                      >
                        View Video
                      </Link>
                      <button
                        onClick={() => handleUpdateStatus(sig.id, "CLEAR")}
                        className="px-3 py-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        ✓ Clear False Alarm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(sig.id, "CONFIRMED")}
                        className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-800/60 hover:bg-red-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        ⚠ Confirm Bot Fraud
                      </button>
                    </div>
                  </div>
                </ThreeDTilt>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}