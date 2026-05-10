"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

// ── Candela logo mark ────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>C</span>
      </div>
      <div className="leading-none">
        <span className="text-white font-semibold text-sm tracking-wide">Candela</span>
        <span className="block text-white/30 text-[9px] tracking-widest uppercase">Build to prove it.</span>
      </div>
    </div>
  );
}

// ── Top-bar (replaces full navbar — just logo + auth buttons) ────────────────
function TopBar() {
  const { data: session } = useSession();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-3.5 sm:py-4 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-md">
      <LogoMark />
      <div className="flex items-center gap-2 sm:gap-3">
        {session ? (
          <Link
            href="/dashboard"
            className="px-4 sm:px-5 py-2 bg-[#3b82f6] hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-colors active:scale-95"
          >
            Dashboard →
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 sm:px-5 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2 bg-[#3b82f6] hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-colors active:scale-95"
            >
              Sign up free
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen flex flex-col">
      <TopBar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-12 lg:px-20 pt-24 sm:pt-28 pb-12 sm:pb-16 max-w-5xl mx-auto w-full">
        <p className="text-white/50 text-xs sm:text-sm mb-5 sm:mb-8 tracking-wide leading-relaxed uppercase">
          For students who want to build a portfolio that actually gets them hired.
        </p>

        <h1
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.08] sm:leading-[1.05] mb-6 sm:mb-10"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Your degree won&apos;t get you hired.{" "}
          <span className="text-[#3b82f6] italic">What you build will.</span>
        </h1>

        <p className="text-white/60 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-8 sm:mb-12">
          Candela turns your university syllabus into real-world projects, case studies, and engineering problems a hiring manager can actually review. Walk in with work to show, while everyone else just sends resumes.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
          <Link
            href={session ? "/dashboard" : "/signup"}
            id="hero-cta-btn"
            className="block sm:inline-block text-center px-8 py-4 sm:py-3.5 bg-white text-black hover:bg-gray-100 font-semibold rounded-full text-[15px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {session ? "Go to dashboard →" : "Start building for free"}
          </Link>
        </div>
      </section>

      {/* ── DOMAINS ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-20 pb-20 sm:pb-32 max-w-5xl mx-auto w-full">
        <p className="text-white/40 text-sm mb-6 font-medium">Supported disciplines:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-2xl p-5 hover:bg-[#3b82f6]/10 transition-colors">
            <div className="text-2xl mb-3">⌨️</div>
            <h3 className="text-white font-semibold mb-1 text-[#3b82f6]">Tech & Software</h3>
            <p className="text-white/50 text-xs leading-relaxed">Turn CS topics into full-stack projects, CLIs, and APIs.</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 hover:bg-emerald-500/10 transition-colors">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-white font-semibold mb-1 text-emerald-400">Commerce</h3>
            <p className="text-white/50 text-xs leading-relaxed">Generate real-world case studies and Excel financial models.</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 hover:bg-amber-500/10 transition-colors">
            <div className="text-2xl mb-3">⚙️</div>
            <h3 className="text-white font-semibold mb-1 text-amber-400">Engineering</h3>
            <p className="text-white/50 text-xs leading-relaxed">Solve real design problems with MATLAB and Python scaffolds.</p>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 hover:bg-rose-500/10 transition-colors">
            <div className="text-2xl mb-3">🩺</div>
            <h3 className="text-white font-semibold mb-1 text-rose-400">Medical</h3>
            <p className="text-white/50 text-xs leading-relaxed">Practice diagnostic skills with realistic clinical case presentations.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07] px-4 sm:px-6 md:px-12 py-6 sm:py-8 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-sm text-white/30">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white/50" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>Candela</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
