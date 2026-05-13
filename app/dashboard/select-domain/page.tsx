"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Domain = "tech" | "commerce" | "engineering";

const DOMAINS = [
  {
    id: "tech",
    emoji: "⌨️",
    title: "Tech & Software",
    subtitle: "CS / IT / Data Science",
    description: "Generate coding projects with runnable starter code, checkpoint questions, and stretch goals tied to your current week.",
    color: "text-[var(--night-glow)]",
    bg: "bg-[rgba(255,122,61,0.12)]",
    border: "border-[rgba(255,122,61,0.28)]",
    examples: ["Python tools", "APIs", "ML experiments", "React builds"],
  },
  {
    id: "commerce",
    emoji: "📊",
    title: "Commerce & Finance",
    subtitle: "BBA / MBA / B.Com / CA / CFA",
    description: "Generate business cases with ratio-analysis checkpoints, spreadsheet scaffolds, and decisions worth defending.",
    color: "text-[var(--night-glow)]",
    bg: "bg-[rgba(255,122,61,0.12)]",
    border: "border-[rgba(255,122,61,0.28)]",
    examples: ["Case studies", "Excel models", "Market analysis", "Pitches"],
  },
  {
    id: "engineering",
    emoji: "⚙️",
    title: "Engineering",
    subtitle: "Civil / Mechanical / Electrical",
    description: "Generate design problems with calculations, simulation-friendly starter work, and practical constraints.",
    color: "text-[var(--night-glow)]",
    bg: "bg-[rgba(255,122,61,0.12)]",
    border: "border-[rgba(255,122,61,0.28)]",
    examples: ["Structures", "Thermo", "Fluids", "Mechanisms"],
  },
] as const;

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
      };

      router.push(routes[selected]);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 text-[var(--text-main)] sm:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,125,69,0.22),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(255,177,98,0.12),transparent_20%),linear-gradient(180deg,#070707_0%,#0b0b0b_48%,#070707_100%)]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="absolute left-[-8rem] top-20 h-[24rem] w-[24rem] rounded-full border border-white/8 bg-[rgba(255,122,61,0.06)] blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] blur-3xl" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center sm:mb-10">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--night-line)] bg-[rgba(255,122,61,0.12)] shadow-[0_0_30px_rgba(255,122,61,0.16)]">
              <span className="display-font text-xl text-[var(--night-glow)]">N</span>
            </div>
            <span className="display-font text-3xl">Nextstep</span>
          </div>
          <h1 className="display-font text-3xl leading-tight sm:text-5xl">Choose your workshop.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-dim)] sm:text-base">
            Pick the subject universe you want the project engine to think in. You can switch later from the dashboard.
          </p>
        </motion.div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {DOMAINS.map((domain, i) => (
            <motion.button
              key={domain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelected(domain.id)}
              className={`text-left rounded-[1.5rem] p-5 transition-all duration-200 sm:rounded-[1.75rem] sm:p-6 ${
                selected === domain.id
                  ? `studio-card ${domain.bg} ${domain.border} border`
                  : "studio-card hover:border-[rgba(255,255,255,0.18)]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="text-3xl">{domain.emoji}</div>
                {selected === domain.id && (
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${domain.border} ${domain.bg}`}>
                    <svg className={`h-3.5 w-3.5 ${domain.color}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <h2 className={`display-font text-[1.7rem] leading-tight sm:text-2xl ${selected === domain.id ? domain.color : "text-[var(--text-main)]"}`}>
                {domain.title}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-dim)]">{domain.subtitle}</p>
              <p className="mt-4 text-sm leading-6 text-[var(--text-dim)]">{domain.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {domain.examples.map((example) => (
                  <span
                    key={example}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      selected === domain.id ? `${domain.bg} ${domain.color}` : "bg-white/[0.05] text-[var(--text-dim)]"
                    }`}
                  >
                    {example}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 w-full max-w-4xl">
          <button
            onClick={handleContinue}
            disabled={!selected || isSaving}
            className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all duration-200 sm:text-base ${
              selected
                ? "bg-[var(--night-glow)] text-[#0d1720] hover:opacity-90 active:scale-[0.99]"
                : "bg-white/10 text-[var(--text-dim)]"
            }`}
          >
            {isSaving ? "Opening your workspace..." : selected ? `Continue with ${DOMAINS.find((d) => d.id === selected)?.title} ->` : "Select a domain to continue"}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--text-dim)]">Your choice just tunes the examples and language. The core workflow stays the same.</p>
        </motion.div>
      </div>
    </div>
  );
}
