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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-md">
      <LogoMark />
      <div className="flex items-center gap-3">
        {session ? (
          <Link
            href="/dashboard"
            className="px-5 py-2 bg-[#3b82f6] hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-colors"
          >
            Dashboard →
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="px-5 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 bg-[#3b82f6] hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-colors"
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
      <section className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-28 pb-20 max-w-5xl mx-auto w-full">
        <p className="text-white/50 text-sm mb-8 tracking-wide">
          For 16 to 22 year olds who want to build software in a market that&apos;s stopped hiring juniors.
        </p>

        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-10"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Your degree won&apos;t get you hired.{" "}
          <span className="text-[#3b82f6] italic">What you build will.</span>
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
          Candela turns what you&apos;re studying into projects a hiring manager can open and use.
          In this market, the students getting hired are the ones walking in with work to show.
          Everyone else keeps sending applications.
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          <Link
            href={session ? "/dashboard" : "/signup"}
            id="hero-cta-btn"
            className="px-8 py-3.5 bg-[#3b82f6] hover:bg-blue-500 text-white font-medium rounded-full text-[15px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {session ? "Go to dashboard →" : "Get started — it's free"}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07] px-6 md:px-12 py-8 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
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
