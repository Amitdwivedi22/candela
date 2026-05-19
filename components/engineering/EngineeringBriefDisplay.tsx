"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import type { BriefSection, FormInput } from "@/types";

interface EngineeringBriefDisplayProps {
  rawText: string;
  isStreaming: boolean;
  courseName?: string;
  brief?: BriefSection | null;
  formInput?: FormInput | null;
}

function parseEngineeringBrief(text: string) {
  const sections: Record<string, string> = {
    "Design Problem": "",
    "Calculation Scaffold": "",
    "Checkpoint Questions": "",
    "Stretch Goal": "",
  };

  const keys = Object.keys(sections);
  for (let i = 0; i < keys.length; i++) {
    const header = `## ${keys[i]}`;
    const nextHeader = keys[i + 1] ? `## ${keys[i + 1]}` : null;
    const start = text.indexOf(header);
    if (start === -1) continue;
    const contentStart = start + header.length;
    const end = nextHeader ? text.indexOf(nextHeader) : text.length;
    sections[keys[i]] = text.slice(contentStart, end === -1 ? text.length : end).trim();
  }
  return sections;
}

function CodeOrTextDisplay({ content, color }: { content: string; color: string }) {
  if (!content) return null;

  // Render markdown code blocks nicely if they exist
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap space-y-4">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].slice(3).trim() || "code";
          const code = lines.slice(1, -1).join("\n");
          return (
            <div key={i} className="my-3 overflow-hidden rounded-xl border border-[var(--night-line)] bg-[#070707]">
              <div className="flex justify-between border-b border-[var(--night-line)] bg-[rgba(255,122,61,0.08)] px-4 py-1.5 text-xs font-mono text-[var(--night-glow)]">
                <span>{lang}</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-[13px] leading-relaxed text-[#f7efe8]">{code}</pre>
              </div>
            </div>
          );
        }

        // Normal text
        return part.split("\n").map((line, j) => {
          if (!line.trim()) return null;
          if (line.match(/^\d+\./)) {
            return (
              <div key={`${i}-${j}`} className="flex gap-3 my-2">
                <span className={`font-semibold ${color} shrink-0 w-5`}>{line.split(".")[0]}.</span>
                <span>{line.slice(line.indexOf(".") + 1).trim()}</span>
              </div>
            );
          }
          return <p key={`${i}-${j}`}>{line}</p>;
        });
      })}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  content,
  color,
  delay,
}: {
  icon: string;
  title: string;
  content: string;
  color: string;
  delay: number;
}) {
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/[0.08] bg-[rgba(10,10,10,0.78)] p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className={`font-semibold text-base ${color}`}>{title}</h3>
      </div>
      <CodeOrTextDisplay content={content} color={color} />
    </motion.div>
  );
}

export function EngineeringBriefDisplay({
  rawText,
  isStreaming,
  courseName,
  brief,
  formInput,
}: EngineeringBriefDisplayProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!brief || !formInput || isStreaming || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { exportBriefAsPDFWithOptions } = await import("@/lib/exportPDF");
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      exportBriefAsPDFWithOptions(brief, formInput, {
        labels: {
          problem: "Design Problem",
          scaffold: "Calculation Scaffold",
          checkpoints: "Checkpoint Questions",
          stretch: "Stretch Goal",
        },
      });
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setTimeout(() => setPdfLoading(false), 300);
    }
  };

  if (isStreaming || !rawText) {
    return (
      <div className="rounded-2xl border border-[var(--night-line)] bg-[rgba(10,10,10,0.78)] p-6 sm:p-8">
        {isStreaming ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--night-glow)] animate-pulse" />
              <span className="text-sm font-medium text-[var(--night-glow)]">Generating brief...</span>
            </div>
            <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
          </div>
        ) : (
          <div className="text-white/30 text-center py-12">Brief will appear here.</div>
        )}
      </div>
    );
  }

  const sections = parseEngineeringBrief(rawText);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-[var(--night-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        {courseName ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/40 text-sm">
            Brief generated for <span className="text-[var(--night-glow)]">{courseName}</span>
          </motion.p>
        ) : (
          <div />
        )}

        <button
          id="download-pdf-btn-engineering"
          onClick={handleDownloadPDF}
          disabled={!brief || !formInput || isStreaming || pdfLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--night-glow)] px-4 py-2 text-sm font-semibold text-[#120d09] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {pdfLoading ? "Building..." : "Download PDF"}
        </button>
      </div>

      <SectionCard icon="📐" title="Design Problem" content={sections["Design Problem"]} color="text-[var(--night-glow)]" delay={0} />
      <SectionCard icon="⚙️" title="Calculation Scaffold" content={sections["Calculation Scaffold"]} color="text-[var(--night-glow)]" delay={0.1} />
      <SectionCard icon="🔍" title="Checkpoint Questions" content={sections["Checkpoint Questions"]} color="text-amber-400" delay={0.2} />
      <SectionCard icon="🚀" title="Stretch Goal" content={sections["Stretch Goal"]} color="text-[var(--night-glow)]" delay={0.3} />

      {/* Raw fallback if parsing failed */}
      {!Object.values(sections).some(v => v) && (
        <div className="rounded-2xl border border-white/10 bg-[rgba(10,10,10,0.78)] p-6">
          <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
        </div>
      )}
    </div>
  );
}
