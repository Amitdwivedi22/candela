"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Domain = "tech" | "commerce" | "engineering" | "medical";

const DOMAINS: {
  id: Domain;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  examples: string[];
}[] = [
  {
    id: "tech",
    emoji: "⌨️",
    title: "Tech & Software",
    subtitle: "CS / IT / Data Science",
    description:
      "Generate coding projects with runnable starter code, checkpoint questions, and stretch goals tailored to your exact week and stack.",
    color: "text-[#3b82f6]",
    bg: "bg-[#3b82f6]/10",
    border: "border-[#3b82f6]/30",
    examples: ["Python CLI tools", "Web APIs", "ML pipelines", "React apps"],
  },
  {
    id: "commerce",
    emoji: "📊",
    title: "Commerce & Finance",
    subtitle: "BBA / MBA / B.Com / CA / CFA",
    description:
      "Generate real-world business case studies with financial data scaffolds, ratio analysis checkpoints, and pitch deck challenges.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    examples: [
      "Financial case studies",
      "Excel models",
      "SWOT analysis",
      "Market research",
    ],
  },
  {
    id: "engineering",
    emoji: "⚙️",
    title: "Engineering",
    subtitle: "Civil / Mechanical / Electrical",
    description:
      "Generate design problems with calculation scaffolds, MATLAB/Python starter code, material selection checkpoints, and simulation challenges.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    examples: [
      "Structural analysis",
      "Thermodynamics",
      "Fluid mechanics",
      "AutoCAD problems",
    ],
  },
  {
    id: "medical",
    emoji: "🩺",
    title: "Medical & Healthcare",
    subtitle: "MBBS / BDS / Nursing / NEET-PG",
    description:
      "Generate clinical case presentations with investigation scaffolds, differential diagnosis checkpoints, and management plan challenges.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/30",
    examples: [
      "Clinical cases",
      "Drug cards",
      "OSCE checklists",
      "Anatomy flashcards",
    ],
  },
];

export default function SelectDomainPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Domain | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        medical: "/dashboard/medical",
      };
      router.push(routes[selected]);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-[#3b82f6] flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>C</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">Candela</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3"
          style={{ fontFamily: "Georgia, serif" }}
        >
          What's your field?
        </h1>
        <p className="text-white/50 text-base max-w-md mx-auto">
          Candela adapts its brief engine to your domain. Pick your world — you
          can switch any time.
        </p>
      </motion.div>

      {/* Domain grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {DOMAINS.map((domain, i) => (
          <motion.button
            key={domain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setSelected(domain.id)}
            className={`text-left p-5 sm:p-6 rounded-2xl border transition-all duration-200 group ${
              selected === domain.id
                ? `${domain.bg} ${domain.border} border-2`
                : "bg-white/[0.02] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`text-3xl mb-1`}>{domain.emoji}</div>
              {selected === domain.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-5 h-5 rounded-full ${domain.bg} ${domain.border} border flex items-center justify-center`}
                >
                  <svg className={`w-3 h-3 ${domain.color}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </div>

            <h2 className={`font-semibold text-lg leading-tight mb-0.5 ${selected === domain.id ? domain.color : "text-white"}`}>
              {domain.title}
            </h2>
            <p className="text-white/40 text-xs mb-3">{domain.subtitle}</p>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              {domain.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {domain.examples.map((ex) => (
                <span
                  key={ex}
                  className={`text-xs px-2 py-1 rounded-full ${
                    selected === domain.id
                      ? `${domain.bg} ${domain.color}`
                      : "bg-white/[0.04] text-white/40"
                  }`}
                >
                  {ex}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 w-full max-w-3xl"
      >
        <button
          onClick={handleContinue}
          disabled={!selected || isSaving}
          className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 ${
            selected
              ? "bg-white text-[#0A0A0A] hover:bg-white/90 active:scale-[0.98]"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/>
              </svg>
              Setting up your dashboard...
            </span>
          ) : selected ? (
            `Continue with ${DOMAINS.find(d => d.id === selected)?.title} →`
          ) : (
            "Select a domain to continue"
          )}
        </button>
        <p className="text-center text-white/30 text-xs mt-3">
          You can switch your domain anytime from the dashboard.
        </p>
      </motion.div>
    </div>
  );
}
