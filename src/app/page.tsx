"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import BriefForm, { BriefFormData } from "../../components/BriefForm";
import { BriefDisplay } from "../../components/BriefDisplay";
import { PushbackInput } from "../../components/PushbackInput";
import { Toaster } from "../../components/Toaster";
import { parseBrief } from "../../lib/parseBrief";
import { useToast } from "../lib/use-toast";
import type { BriefSection, FormInput } from "../../types";

// ── View transition variants ──────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" as const } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map BriefForm's local BriefFormData (field: courseName) to the global
 * FormInput shape (field: course) that the API route and buildPrompt expect.
 */
function toFormInput(data: BriefFormData): FormInput {
  return {
    course:     data.courseName,
    week:       data.week,
    difficulty: data.difficulty,
    projects:   data.projects,
    language:   data.language,
  };
}

/**
 * Reads a streaming Response body, appending decoded chunks to state via
 * `onChunk`, then returns the full accumulated text.
 */
async function readStream(
  response: Response,
  onChunk: (text: string) => void
): Promise<string> {
  if (!response.body) throw new Error("Response has no body");

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   full    = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(full);  // pass accumulated text so cursor always renders correctly
  }

  return full;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [view,          setView]          = useState<"form" | "brief">("form");
  const [formInput,     setFormInput]     = useState<FormInput | null>(null);
  const [brief,         setBrief]         = useState<BriefSection | null>(null);
  const [streamingText, setStreamingText] = useState<string>("");
  const [isStreaming,   setIsStreaming]   = useState<boolean>(false);
  const [isRefining,    setIsRefining]    = useState<boolean>(false);

  const { toasts, toast, dismiss } = useToast();

  // ── handleGenerate ─────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (data: BriefFormData) => {
    const input = toFormInput(data);

    setFormInput(input);
    setBrief(null);
    setStreamingText("");
    setIsStreaming(true);
    setView("brief");

    try {
      const response = await fetch("/api/generate-brief", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          course:     input.course,
          week:       input.week,
          difficulty: input.difficulty,
          projects:   input.projects,
          language:   input.language,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      const fullText = await readStream(response, setStreamingText);
      setBrief(parseBrief(fullText));
    } catch (err) {
      console.error("Generation error:", err);
      toast({ title: "Something went wrong. Try again.", variant: "destructive" });
      setBrief({ problem: `Error: ${(err as Error).message}`, scaffold: "", checkpoints: [], stretch: "" });
    } finally {
      setIsStreaming(false);
    }
  }, [toast]);

  // ── handlePushback ─────────────────────────────────────────────────────────
  const handlePushback = useCallback(async (pushbackText: string) => {
    if (!formInput) return;

    setBrief(null);
    setStreamingText("");
    setIsRefining(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/generate-brief", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          course:     formInput.course,
          week:       formInput.week,
          difficulty: formInput.difficulty,
          projects:   formInput.projects,
          language:   formInput.language,
          pushback:   pushbackText,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      const fullText = await readStream(response, setStreamingText);
      setBrief(parseBrief(fullText));
    } catch (err) {
      console.error("Pushback error:", err);
      toast({ title: "Something went wrong. Try again.", variant: "destructive" });
      setBrief({ problem: `Error: ${(err as Error).message}`, scaffold: "", checkpoints: [], stretch: "" });
    } finally {
      setIsStreaming(false);
      setIsRefining(false);
    }
  }, [formInput, toast]);

  // ── handleReset ────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setView("form");
    setFormInput(null);
    setBrief(null);
    setStreamingText("");
    setIsStreaming(false);
    setIsRefining(false);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">

      {/* Animated background orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600 opacity-15 blur-[120px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600 opacity-15 blur-[120px] animate-pulse"
          style={{ animationDuration: "10s" }}
        />
      </div>

      {/* Page content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-12 sm:py-20">
        <AnimatePresence mode="wait">

          {/* ── FORM VIEW ── */}
          {view === "form" && (
            <motion.div
              key="form"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center w-full"
            >
              {/* Hero */}
              <div className="text-center mb-12 flex flex-col items-center">
                <div className="relative mb-6">
                  <div
                    className="absolute -inset-0.5 rounded-full blur bg-gradient-to-r from-violet-600 to-indigo-600 opacity-75 animate-pulse"
                    style={{ animationDuration: "3s" }}
                  />
                  <div className="relative px-4 py-1.5 bg-[#13131A] rounded-full text-xs font-medium text-white/80 border border-white/10 uppercase tracking-wider">
                    AI-Powered · Personalized · Actionable
                  </div>
                </div>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
                  Build something{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                    real
                  </span>{" "}
                  tonight.
                </h1>
                <p className="text-lg sm:text-xl text-white/70 max-w-2xl font-normal">
                  Tell us where you are. Get a project brief that fits.
                </p>
              </div>

              {/* Form */}
              <div className="w-full max-w-2xl">
                <BriefForm onSubmit={handleGenerate} />
              </div>
            </motion.div>
          )}

          {/* ── BRIEF VIEW ── */}
          {view === "brief" && (
            <motion.div
              key="brief"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col w-full"
            >
              {/* Back button */}
              <button
                id="back-to-form-btn"
                onClick={handleReset}
                className="self-start mb-8 flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm font-medium group"
                aria-label="Start a new brief"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                New Brief
              </button>

              {/* Brief display */}
              <BriefDisplay
                brief={brief ?? { problem: "", scaffold: "", checkpoints: [], stretch: "" }}
                isStreaming={isStreaming}
                streamingText={streamingText}
                courseName={formInput?.course}
                weekNumber={formInput?.week}
                onToast={(msg, variant) => toast({ title: msg, variant })}
                formInput={formInput ?? undefined}
              />

              {/* Pushback — only shown once generation is complete */}
              <AnimatePresence>
                {brief && !isStreaming && (
                  <motion.div
                    key="pushback"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } }}
                    exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                    className="mt-8"
                  >
                    <PushbackInput
                      onPushback={handlePushback}
                      isRefining={isRefining}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Toast notifications */}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
