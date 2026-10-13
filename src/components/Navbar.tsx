"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await api.health();
        if (isMounted) {
          setBackendStatus(res.status === "UP" ? "online" : "offline");
        }
      } catch {
        if (isMounted) setBackendStatus("offline");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/campaigns", label: "Campaigns", icon: "🚀" },
    { href: "/submissions", label: "Submissions & Live Metrics", icon: "⚡" },
    { href: "/leaderboard", label: "Leaderboards", icon: "🏆" },
    { href: "/creators", label: "Creators", icon: "👥" },
    { href: "/fraud", label: "Fraud Guard", icon: "🛡️" },
    { href: "/metrics", label: "Social Inspector", icon: "🔬" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 p-[1px] shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow">
                <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 font-extrabold text-lg">
                    VW
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                  VIRAL WAR
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium -mt-1">
                  Spring Boot • Postgres
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-zinc-800 text-white shadow-sm shadow-zinc-800"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions: Backend status & Auth */}
          <div className="flex items-center gap-3">
            {/* Backend Status indicator */}
            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                backendStatus === "online"
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400 shadow-sm shadow-emerald-900/20"
                  : backendStatus === "checking"
                  ? "bg-amber-950/40 border-amber-800/60 text-amber-400"
                  : "bg-red-950/40 border-red-800/60 text-red-400"
              }`}
              title="Spring Boot Backend on http://localhost:8080/api"
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  backendStatus === "online"
                    ? "bg-emerald-400"
                    : backendStatus === "checking"
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              <span className="hidden sm:inline">
                {backendStatus === "online"
                  ? "API Online (8080)"
                  : backendStatus === "checking"
                  ? "Checking API..."
                  : "API Offline"}
              </span>
            </div>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-white max-w-[120px] truncate">
                      {user.email}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        user.role === "ADMIN"
                          ? "text-purple-400"
                          : user.role === "BRAND"
                          ? "text-orange-400"
                          : "text-teal-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowDemoMenu(!showDemoMenu)}
                    className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 rounded-lg transition-all flex items-center gap-1"
                  >
                    <span>⚡ Quick Demo</span>
                    <span className="text-[10px]">▼</span>
                  </button>

                  {showDemoMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                      <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        Instant 1-Click Login
                      </div>
                      <button
                        onClick={async () => {
                          await demoLogin("CREATOR");
                          setShowDemoMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                      >
                        <span>👤 Creator (Alex)</span>
                        <span className="text-[10px] text-teal-400">CREATOR</span>
                      </button>
                      <button
                        onClick={async () => {
                          await demoLogin("BRAND");
                          setShowDemoMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                      >
                        <span>🏢 Brand (Nike)</span>
                        <span className="text-[10px] text-orange-400">BRAND</span>
                      </button>
                      <button
                        onClick={async () => {
                          await demoLogin("ADMIN");
                          setShowDemoMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                      >
                        <span>🛡️ Admin</span>
                        <span className="text-[10px] text-purple-400">ADMIN</span>
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  href="/auth"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg shadow-sm shadow-pink-500/30 transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-zinc-800/60 no-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
