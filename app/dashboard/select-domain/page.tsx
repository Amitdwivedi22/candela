"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Domain = "tech" | "commerce" | "engineering";

const DOMAINS = [
  {
    id: "tech",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    badge: "BUILD WITH CODE",
    title: "Tech & Software",
    subtitle: "CS · IT · Data Science",
    description:
      "For coding projects, scripts, apps, APIs, and product builds tied to the exact concepts you just learned.",
    examples: ["Python tools", "React builds", "ML experiments"],
    accentFrom: "rgba(255,122,61,0.22)",
    accentTo: "rgba(255,177,98,0.08)",
    glowColor: "rgba(255,122,61,0.35)",
  },
  {
    id: "commerce",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    badge: "THINK LIKE AN ANALYST",
    title: "Commerce & Finance",
    subtitle: "BBA · MBA · CA · CFA",
    description:
      "For business cases, finance thinking, market analysis, and recommendation-heavy project briefs.",
    examples: ["Case studies", "Market analysis", "Pitch decks"],
    accentFrom: "rgba(255,177,98,0.2)",
    accentTo: "rgba(255,122,61,0.06)",
    glowColor: "rgba(255,177,98,0.32)",
  },
  {
    id: "engineering",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M20.66 8a10 10 0 0 1 0 8" />
        <path d="M3.34 8a10 10 0 0 0 0 8" />
      </svg>
    ),
    badge: "DESIGN WITH CONSTRAINTS",
    title: "Engineering",
    subtitle: "Civil · Mech · Electrical",
    description:
      "For engineering problems with realistic systems, calculations, practical limits, and applied reasoning.",
    examples: ["Structures", "Thermodynamics", "Control systems"],
    accentFrom: "rgba(255,122,61,0.18)",
    accentTo: "rgba(255,220,180,0.06)",
    glowColor: "rgba(255,140,80,0.30)",
  },
] as const;

export default function SelectDomainPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Domain | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await fetch("/api/user/domain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selected }),
      });

      const routes: Record<Domain, string> = {
        tech: "/dashboard",
        commerce: "/dashboard/commerce",
        engineering: "/dashboard/engineering",
      };

      router.push(routes[selected]);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-[#f7efe8]"
      style={{
        background:
          "radial-gradient(circle at 15% 15%, rgba(255,122,61,0.18) 0%, transparent 40%), radial-gradient(circle at 85% 10%, rgba(255,177,98,0.1) 0%, transparent 35%), linear-gradient(180deg,#080808 0%,#0c0c0c 50%,#080808 100%)",
      }}
    >
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -left-32 top-16 h-[28rem] w-[28rem] rounded-full bg-[rgba(255,122,61,0.07)] blur-[80px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[32rem] w-[32rem] rounded-full bg-[rgba(255,177,98,0.05)] blur-[90px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[20rem] w-[40rem] -translate-x-1/2 rounded-full bg-[rgba(255,122,61,0.04)] blur-[60px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-5 py-12 sm:px-8 sm:py-16">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-center text-center sm:mb-14"
        >
          {/* Logo mark */}
          <div className="mb-7 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,122,61,0.28)] bg-[rgba(255,122,61,0.12)]"
              style={{ boxShadow: "0 0 28px rgba(255,122,61,0.18)" }}
            >
              <span className="font-bold text-[18px] text-[#ff7a3d]">N</span>
            </div>
            <span className="text-[22px] font-semibold tracking-tight text-[#f7efe8]">
              Nextstep
            </span>
          </div>

          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-[rgba(247,239,232,0.38)]">
            Switch Domain
          </p>
          <h1
            className="text-[2.2rem] leading-[1.08] text-[#f7efe8] sm:text-[3rem] md:text-[3.4rem]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
          >
            Choose the kind of brief{" "}
            <span className="text-[#ff7a3d]">you want next.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[rgba(247,239,232,0.55)] sm:text-[15px]">
            Each studio thinks differently. Hover a card to see what that domain is actually
            useful for, then jump into the one that fits the kind of work you want to practice.
          </p>
        </motion.div>

        {/* ── Cards Grid ── */}
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-7">
          {DOMAINS.map((domain, i) => {
            const isSelected = selected === domain.id;
            const isHovered = hoveredId === domain.id;

            return (
              <motion.button
                key={domain.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.45 }}
                onClick={() => setSelected(domain.id as Domain)}
                onMouseEnter={() => setHoveredId(domain.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative flex h-full min-h-[20rem] flex-col rounded-2xl border p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,122,61,0.5)] sm:p-7"
                style={{
                  background: isSelected
                    ? `linear-gradient(145deg, ${domain.accentFrom}, rgba(12,12,12,0.92) 50%, ${domain.accentTo})`
                    : isHovered
                    ? `linear-gradient(145deg, rgba(255,122,61,0.1), rgba(12,12,12,0.88) 55%, rgba(255,122,61,0.06))`
                    : "linear-gradient(145deg, rgba(255,255,255,0.055), rgba(10,10,10,0.9) 55%, rgba(255,122,61,0.04))",
                  borderColor: isSelected
                    ? "rgba(255,122,61,0.45)"
                    : isHovered
                    ? "rgba(255,170,110,0.32)"
                    : "rgba(255,255,255,0.1)",
                  boxShadow: isSelected
                    ? `0 0 0 1px rgba(255,122,61,0.22), 0 8px 40px ${domain.glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : isHovered
                    ? `0 4px 32px rgba(255,122,61,0.18), inset 0 1px 0 rgba(255,255,255,0.05)`
                    : "inset 0 1px 0 rgba(255,255,255,0.04)",
                  transform: isHovered && !isSelected ? "translateY(-3px) scale(1.015)" : isSelected ? "translateY(-2px) scale(1.012)" : "translateY(0) scale(1)",
                  transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                  backdropFilter: "blur(16px)",
                }}
              >
                {/* Top row: icon + badge */}
                <div className="mb-5 flex items-start justify-between gap-3">
                  {/* Icon container */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,190,140,0.2)]"
                    style={{
                      background: `linear-gradient(145deg, rgba(255,255,255,0.12), ${domain.accentFrom})`,
                      boxShadow: isSelected || isHovered ? `0 0 18px ${domain.glowColor}` : "none",
                      color: isSelected ? "#ff7a3d" : "rgba(247,239,232,0.7)",
                      transition: "all 0.28s ease",
                    }}
                  >
                    {domain.icon}
                  </div>

                  {/* Badge */}
                  <span
                    className="rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em]"
                    style={{
                      borderColor: isSelected ? "rgba(255,122,61,0.35)" : "rgba(255,255,255,0.1)",
                      color: isSelected ? "rgba(255,177,98,0.9)" : "rgba(247,239,232,0.38)",
                      background: isSelected ? "rgba(255,122,61,0.1)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {domain.badge}
                  </span>
                </div>

                {/* Subtitle */}
                <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[rgba(247,239,232,0.38)]">
                  {domain.subtitle}
                </p>

                {/* Title */}
                <h2
                  className="mb-3 text-[1.55rem] leading-[1.1] sm:text-[1.7rem]"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700,
                    color: isSelected ? "#ff7a3d" : "#f7efe8",
                    transition: "color 0.22s ease",
                  }}
                >
                  {domain.title}
                </h2>

                {/* Description */}
                <p className="flex-1 text-[13.5px] leading-[1.7] text-[rgba(247,239,232,0.55)]">
                  {domain.description}
                </p>

                {/* Example tags */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {domain.examples.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-full px-3 py-1 text-[11px] font-medium"
                      style={{
                        border: isSelected
                          ? "1px solid rgba(255,122,61,0.28)"
                          : "1px solid rgba(255,255,255,0.09)",
                        background: isSelected
                          ? "rgba(255,122,61,0.1)"
                          : "rgba(255,255,255,0.04)",
                        color: isSelected ? "rgba(255,177,98,0.9)" : "rgba(247,239,232,0.5)",
                        transition: "all 0.22s ease",
                      }}
                    >
                      {ex}
                    </span>
                  ))}
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute right-5 bottom-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff7a3d]"
                    style={{ boxShadow: "0 0 14px rgba(255,122,61,0.5)" }}
                  >
                    <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}

                {/* Bottom glow line (only on hover / selected) */}
                <div
                  className="pointer-events-none absolute bottom-0 left-[15%] right-[15%] h-px rounded-full"
                  style={{
                    background: isSelected || isHovered
                      ? `linear-gradient(90deg, transparent, ${domain.glowColor}, transparent)`
                      : "transparent",
                    transition: "background 0.3s ease",
                  }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* ── CTA Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.45 }}
          className="mt-10 w-full max-w-6xl sm:mt-12"
        >
          <button
            onClick={handleContinue}
            disabled={!selected || isSaving}
            className="relative w-full overflow-hidden rounded-2xl py-4 text-sm font-semibold transition-all duration-200 sm:py-[1.05rem] sm:text-[15px]"
            style={
              selected
                ? {
                    background: "linear-gradient(135deg, #ff7a3d 0%, #ffb36b 100%)",
                    color: "#0d0d0d",
                    boxShadow: "0 4px 28px rgba(255,122,61,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
                  }
                : {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(247,239,232,0.38)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "not-allowed",
                  }
            }
          >
            {isSaving
              ? "Opening your workspace…"
              : selected
              ? `Continue with ${DOMAINS.find((d) => d.id === selected)?.title} →`
              : "Select a domain to continue"}

            {/* Shimmer on active */}
            {selected && !isSaving && (
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] animate-[shimmer_2.4s_infinite]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                }}
              />
            )}
          </button>
          <p className="mt-3 text-center text-xs text-[rgba(247,239,232,0.32)]">
            Your choice tunes the examples and language. You can switch anytime from the dashboard.
          </p>
        </motion.div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}
