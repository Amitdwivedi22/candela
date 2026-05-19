"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import type { BriefSection, FormInput } from "@/types";

interface CommerceBriefDisplayProps {
  rawText: string;
  isStreaming: boolean;
  courseName?: string;
  brief?: BriefSection | null;
  formInput?: FormInput | null;
}

function parseCommerceBrief(text: string) {
  const sections: Record<string, string> = {
    "Case Study Problem": "",
    "Data Scaffold": "",
    "Analysis Checkpoints": "",
    "Advanced Challenge": "",
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

  // Detect if content has a table
  const hasTable = content.includes("|");
  const lines = content.split("\n");

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

      {hasTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white/80 border-collapse">
            {lines.filter(l => l.includes("|")).map((row, ri) => {
              const cells = row.split("|").filter(c => c.trim());
              const isHeader = ri === 0;
              const isSeparator = cells.every(c => c.trim().match(/^[-:]+$/));
              if (isSeparator) return null;
              return (
                <tr key={ri} className={isHeader ? "border-b border-[rgba(255,122,61,0.22)]" : "border-b border-white/5"}>
                  {cells.map((cell, ci) => isHeader
                    ? <th key={ci} className="px-3 py-2 text-left text-xs font-medium text-[var(--night-glow)]">{cell.trim()}</th>
                    : <td key={ci} className="py-2 px-3 text-white/70 text-xs">{cell.trim()}</td>
                  )}
                </tr>
              );
            })}
          </table>
          {/* Any non-table content */}
          {lines.filter(l => !l.includes("|") && l.trim()).map((line, i) => (
            <p key={i} className="mt-2 text-white/70 text-sm leading-relaxed">{line}</p>
          ))}
        </div>
      ) : (
        <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap space-y-2">
          {content.split("\n").map((line, i) => {
            if (line.match(/^\d+\./)) {
              return (
                <div key={i} className="flex gap-3">
                  <span className={`font-semibold ${color} shrink-0 w-5`}>{line.split(".")[0]}.</span>
                  <span>{line.slice(line.indexOf(".") + 1).trim()}</span>
                </div>
              );
            }
            return line ? <p key={i}>{line}</p> : null;
          })}
        </div>
      )}
    </motion.div>
  );
}

export function CommerceBriefDisplay({
  rawText,
  isStreaming,
  courseName,
  brief,
  formInput,
}: CommerceBriefDisplayProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!brief || !formInput || isStreaming || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { exportBriefAsPDFWithOptions } = await import("@/lib/exportPDF");
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      exportBriefAsPDFWithOptions(brief, formInput, {
        labels: {
          problem: "Case Study Problem",
          scaffold: "Data Scaffold",
          checkpoints: "Analysis Checkpoints",
          stretch: "Advanced Challenge",
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
          <div className="text-white/30 text-center py-12">Case study will appear here.</div>
        )}
      </div>
    );
  }

  const sections = parseCommerceBrief(rawText);

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
          id="download-pdf-btn-commerce"
          onClick={handleDownloadPDF}
          disabled={!brief || !formInput || isStreaming || pdfLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--night-glow)] px-4 py-2 text-sm font-semibold text-[#120d09] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {pdfLoading ? "Building..." : "Download PDF"}
        </button>
      </div>

      <SectionCard icon="📋" title="Case Study Problem" content={sections["Case Study Problem"]} color="text-[var(--night-glow)]" delay={0} />
      <SectionCard icon="📊" title="Data Scaffold" content={sections["Data Scaffold"]} color="text-[var(--night-glow)]" delay={0.1} />
      <SectionCard icon="🔍" title="Analysis Checkpoints" content={sections["Analysis Checkpoints"]} color="text-amber-400" delay={0.2} />
      <SectionCard icon="🚀" title="Advanced Challenge" content={sections["Advanced Challenge"]} color="text-[var(--night-glow)]" delay={0.3} />

      {/* Raw fallback if parsing failed */}
      {!Object.values(sections).some(v => v) && (
        <div className="rounded-2xl border border-white/10 bg-[rgba(10,10,10,0.78)] p-6">
          <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
        </div>
      )}
    </div>
  );
}
