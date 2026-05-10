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
      className="bg-[#13131A] border border-white/10 rounded-2xl p-6 overflow-hidden"
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
      className="bg-[#13131A] border border-amber-500/50 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
          !
        </div>
        <h3 className="text-amber-400 font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-amber-400/80 leading-relaxed whitespace-pre-wrap">
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
        language:   "",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Your Project Brief</h2>
          <p className="text-white/60 text-sm mt-1">
            {courseName} • Week {weekNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy Full Brief */}
          <button
            id="copy-full-brief-btn"
            onClick={() =>
              copyToClipboard(fullBriefText, setCopiedFull, "Brief copied to clipboard!")
            }
            disabled={isStreaming}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copiedFull ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {copiedFull ? "Copied!" : "Copy"}
          </button>

          {/* Download PDF */}
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={isStreaming || pdfLoading}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
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
        <div className="bg-[#13131A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <h3 className="text-white font-semibold">Generating your brief…</h3>
          </div>
          <p className="text-white/80 leading-relaxed whitespace-pre-wrap font-mono text-sm">
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
              className="bg-[#13131A] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-bold">
                  01
                </div>
                <h3 className="text-white font-semibold text-lg">The Problem</h3>
              </div>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
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
              className="bg-[#13131A] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">
                  02
                </div>
                <h3 className="text-white font-semibold text-lg">Starter Scaffold</h3>
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
                  className="absolute top-3 right-3 p-2 bg-white/5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copiedCode && <span className="text-xs text-green-400 font-medium pr-1">Copied!</span>}
                </button>
                <pre className="bg-[#0A0A0F] rounded-xl p-4 overflow-x-auto pt-12 sm:pt-4">
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
              className="bg-[#13131A] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
                  03
                </div>
                <h3 className="text-white font-semibold text-lg">Checkpoint Questions</h3>
              </div>
              <div className="space-y-4">
                {brief?.checkpoints?.map((question, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                  >
                    <div className="mt-0.5 shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-violet-500/20 text-violet-400 h-fit">
                      {index + 1}
                    </div>
                    <p className="text-white/80 leading-relaxed">{question}</p>
                  </div>
                ))}
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
              className="bg-[#13131A] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-bold">
                  04
                </div>
                <h3 className="text-white font-semibold text-lg flex items-center gap-3">
                  Stretch Goal
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 uppercase tracking-wider">
                    Challenge
                  </span>
                </h3>
              </div>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                {brief?.stretch}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
