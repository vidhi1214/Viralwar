import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

import GlobalCursorLighting from "@/components/GlobalCursorLighting";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViralWar — Creator Economy Campaign & Viral Tracking Platform",
  description:
    "Enterprise-grade platform for viral brand challenges, live YouTube & Instagram social metrics tracking, fraud protection, and automated payouts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100 selection:bg-pink-500 selection:text-white relative">
        <GlobalCursorLighting />
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-zinc-900 bg-black/60 py-6 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-400">ViralWar Engine</span>
                <span>•</span>
                <span>Spring Boot 3.4.5</span>
                <span>•</span>
                <span>PostgreSQL 18</span>
                <span>•</span>
                <span>Caffeine Cache</span>
              </div>
              <div className="text-zinc-600">
                JWT Auth • YouTube Data API v3 • Instagram Graph API v20.0
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
