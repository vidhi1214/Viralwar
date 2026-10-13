"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const { login, register, demoLogin, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CREATOR" | "BRAND" | "ADMIN">("CREATOR");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
        setSuccess("Login successful! Redirecting...");
      } else {
        await register(email, password, role, displayName, handle);
        setSuccess("Account registered and logged in! Redirecting...");
      }
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check backend credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (roleType: "CREATOR" | "BRAND" | "ADMIN") => {
    setError(null);
    setSubmitting(true);
    try {
      await demoLogin(roleType);
      setSuccess(`Signed in as demo ${roleType}! Redirecting...`);
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="backdrop-blur-xl bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl shadow-purple-950/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 mb-3 shadow-lg shadow-pink-500/25">
              <span className="text-white font-extrabold text-xl">VW</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {mode === "login" ? "Welcome Back" : "Create Creator Account"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Synchronized with Spring Boot JWT & PostgreSQL
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-xl mb-6 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2">
              <span className="text-red-400 font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Platform Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CREATOR", "BRAND", "ADMIN"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-2 text-[11px] font-semibold rounded-lg border transition-all ${
                          role === r
                            ? "bg-pink-950/30 border-pink-500 text-pink-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    {role === "BRAND" ? "Company / Brand Name" : "Creator Display Name"}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={role === "BRAND" ? "Nike Athletics Studio" : "Maya Patel"}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-pink-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>

                {role === "CREATOR" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Creator Username Handle (@)
                    </label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="mayaviral"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-pink-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none font-mono transition-all"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 mt-2"
            >
              {submitting
                ? "Contacting Spring Boot..."
                : mode === "login"
                ? "Sign In to Platform"
                : "Create Account"}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold text-center mb-3">
              Or Instant 1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo("CREATOR")}
                disabled={submitting}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/50 hover:bg-zinc-800/80 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-teal-300">
                  Creator
                </div>
                <div className="text-[10px] text-zinc-500">Alex Rivera</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemo("BRAND")}
                disabled={submitting}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/80 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-orange-300">
                  Brand
                </div>
                <div className="text-[10px] text-zinc-500">Nike Athletics</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemo("ADMIN")}
                disabled={submitting}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/80 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-purple-300">
                  Admin
                </div>
                <div className="text-[10px] text-zinc-500">Full Access</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}