"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Download, Loader2 } from "lucide-react";
import type { FormInput } from "../types";

export interface BriefData {
  problem: string;
  scaffold: string;
  checkpoints: string[];
  stretch: string;
}

export interface BriefDisplayProps {
  brief: BriefData;
  isStreaming: boolean;
  streamingText: string;
  courseName?: string;
  weekNumber?: string | number;
  onToast?: (message: string, variant?: "default" | "destructive") => void;
  missingFields?: string[];
  /** Full form data — required for the PDF filename and header. */
  formInput?: FormInput;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/8 bg-[rgba(12,12,12,0.76)] p-6"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Badge + title row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="skeleton-shimmer w-8 h-8 rounded-full" />
        <div className="skeleton-shimmer h-5 rounded-lg w-40" />
      </div>
      {/* Body lines */}
      <div className="space-y-3">
        <div className="skeleton-shimmer h-3.5 rounded-md w-full" />
        <div className="skeleton-shimmer h-3.5 rounded-md w-[90%]" />
        <div className="skeleton-shimmer h-3.5 rounded-md w-[75%]" />
        {index === 1 && (
          <>
            <div className="skeleton-shimmer h-3.5 rounded-md w-full mt-2" />
            <div className="skeleton-shimmer h-3.5 rounded-md w-[80%]" />
          </>
        )}
        {index === 2 && (
          <>
            <div className="skeleton-shimmer h-3.5 rounded-md w-full mt-2" />
            <div className="skeleton-shimmer h-3.5 rounded-md w-[60%]" />
          </>
        )}
      </div>
    </div>
  );
}

// ── Warning card ──────────────────────────────────────────────────────────────
function WarningCard({ title, delay }: { title: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-[rgba(255,122,61,0.35)] bg-[rgba(14,10,8,0.88)] p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,122,61,0.16)] text-sm font-bold text-[var(--night-glow)]">
          !
        </div>
        <h3 className="text-lg font-semibold text-[var(--night-glow)]">{title}</h3>
      </div>
      <p className="whitespace-pre-wrap leading-relaxed text-[rgba(255,200,170,0.8)]">
        This section couldn&apos;t be generated — try refining the brief.
      </p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function BriefDisplay({
  brief,
  isStreaming,
  streamingText,
  courseName = "Course Name",
  weekNumber = "1",
  onToast,
  missingFields = [],
  formInput,
}: BriefDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const copyToClipboard = (
    text: string,
    setCopied: React.Dispatch<React.SetStateAction<boolean>>,
    label: string
  ) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onToast?.(label);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fullBriefText = brief
    ? `The Problem\n${brief.problem}\n\nStarter Scaffold\n${brief.scaffold}\n\nCheckpoint Questions\n${brief.checkpoints?.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nStretch Goal\n${brief.stretch}`
    : "";

  const handleDownloadPDF = async () => {
    if (!brief || isStreaming || pdfLoading) return;
    setPdfLoading(true);
    try {
      // Dynamic import keeps jsPDF out of the SSR bundle
      const { exportBriefAsPDF } = await import("../lib/exportPDF");
      const pdfInput: FormInput = formInput ?? {
        course:     courseName,
        week:       Number(weekNumber) || 1,
        difficulty: 3,
        projects:   [],
      };
      // Small delay lets the spinner render before the synchronous PDF work blocks the thread
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      exportBriefAsPDF(
        { problem: brief.problem, scaffold: brief.scaffold, checkpoints: brief.checkpoints ?? [], stretch: brief.stretch },
        pdfInput
      );
      onToast?.("PDF downloaded!");
    } catch (err) {
      console.error("PDF export failed:", err);
      onToast?.("PDF export failed. Please try again.", "destructive");
    } finally {
      // Show spinner for at least 300 ms so it doesn't just flash
      setTimeout(() => setPdfLoading(false), 300);
    }
  };

  // Determine what to show based on state
  const showSkeleton = isStreaming && !streamingText;
  const showStreamingText = isStreaming && streamingText.length > 0;
  const showBrief = !isStreaming;

  return (
    <div className="w-full space-y-6">
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 0.5s step-end infinite;
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.10) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

      {/* Top bar */}
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--night-line)] pb-4 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h2 className="display-font text-2xl text-[var(--text-main)] sm:text-3xl">Your Project Brief</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-dim)]">
            {courseName} • Week {weekNumber} — start tonight
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Copy Full Brief */}
          <button
            id="copy-full-brief-btn"
            onClick={() =>
              copyToClipboard(fullBriefText, setCopiedFull, "Brief copied to clipboard!")
            }
            disabled={isStreaming}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-[var(--text-main)] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm"
          >
            {copiedFull ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {copiedFull ? "Copied!" : "Copy"}
          </button>

          {/* Download PDF */}
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={isStreaming || pdfLoading}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--night-glow)] px-3 py-2 text-xs font-semibold text-[#0d1720] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm"
          >
            {pdfLoading
              ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {pdfLoading ? "Building…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ── Skeleton (before any streaming text arrives) ── */}
      {showSkeleton && (
        <div className="space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      )}

      {/* ── Live streaming text ── */}
      {showStreamingText && (
        <div className="studio-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--night-glow)]" />
            <h3 className="font-semibold text-[var(--text-main)]">Generating your brief…</h3>
          </div>
          <p className="font-mono text-sm leading-relaxed text-[var(--text-dim)] whitespace-pre-wrap">
            {streamingText}
            <span className="ml-1 font-bold animate-blink">|</span>
          </p>
        </div>
      )}

      {/* ── Finished brief ── */}
      {showBrief && (
        <div className="space-y-6">
          {/* Section 1 – Problem */}
          {missingFields.includes("problem") ? (
            <WarningCard title="The Problem" delay={0.1} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="studio-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,122,61,0.16)] text-sm font-bold text-[var(--night-glow)]">
                  01
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-main)]">The Problem</h3>
                <span className="ml-auto rounded bg-[rgba(255,122,61,0.14)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--night-glow)]">Build Tonight</span>
              </div>
              <p className="leading-relaxed text-[var(--text-dim)] whitespace-pre-wrap">
                {brief?.problem}
              </p>
            </motion.div>
          )}

          {/* Section 2 – Starter Scaffold */}
          {missingFields.includes("scaffold") ? (
            <WarningCard title="Starter Scaffold" delay={0.2} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="studio-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,179,107,0.16)] text-sm font-bold text-[var(--night-warm)]">
                  02
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-main)]">Starter Scaffold</h3>
                <span className="ml-auto rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-[rgba(255,184,108,0.14)] text-[var(--night-warm)]">Run This First</span>
              </div>
              <div className="relative group mt-2">
                <button
                  id="copy-scaffold-btn"
                  onClick={() =>
                    copyToClipboard(
                      brief?.scaffold || "",
                      setCopiedCode,
                      "Brief copied to clipboard!"
                    )
                  }
                  className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-white/5 p-2 text-[var(--text-dim)] transition-colors hover:bg-white/10 hover:text-[var(--text-main)]"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedCode && <span className="text-xs text-green-400 font-medium pr-1">Copied!</span>}
                </button>
                <pre className="overflow-x-auto rounded-xl bg-[rgba(6,12,18,0.6)] p-4 pt-12 sm:pt-4">
                  <code className="font-mono text-sm text-green-400 whitespace-pre">
                    {brief?.scaffold}
                  </code>
                </pre>
              </div>
            </motion.div>
          )}

          {/* Section 3 – Checkpoint Questions */}
          {missingFields.includes("checkpoints") ? (
            <WarningCard title="Checkpoint Questions" delay={0.3} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="studio-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,122,61,0.16)] text-sm font-bold text-[var(--night-glow)]">
                  03
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-main)]">Three Checkpoint Questions</h3>
              </div>
              <div className="space-y-4">
                {brief?.checkpoints?.map((question, index) => {
                  const labels = [
                    { text: "Concept",     color: "bg-[rgba(255,122,61,0.14)] text-[var(--night-glow)]" },
                    { text: "Correctness", color: "bg-[rgba(255,179,107,0.14)] text-[var(--night-warm)]" },
                    { text: "Explain Why", color: "bg-white/8 text-white/70" },
                  ];
                  const label = labels[index] ?? labels[0];
                  return (
                    <div
                      key={index}
                      className="flex gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className="mt-0.5 shrink-0 flex flex-col items-center gap-1">
                        <div className={`px-2 py-0.5 rounded text-xs font-bold ${label.color} whitespace-nowrap`}>
                          Q{index + 1}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${label.color} opacity-80 whitespace-nowrap`}>
                          {label.text}
                        </span>
                      </div>
                      <p className="leading-relaxed text-[var(--text-dim)]">{question}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Section 4 – Stretch Goal */}
          {missingFields.includes("stretch") ? (
            <WarningCard title="Stretch Goal" delay={0.4} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="studio-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,179,107,0.16)] text-sm font-bold text-[var(--night-warm)]">
                  04
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-main)]">Stretch Goal</h3>
                <span className="ml-auto rounded bg-[rgba(255,179,107,0.14)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--night-warm)]">2 Weeks Ahead</span>
              </div>
              <p className="leading-relaxed text-[var(--text-dim)] whitespace-pre-wrap">
                {brief?.stretch}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
