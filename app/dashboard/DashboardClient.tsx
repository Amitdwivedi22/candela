"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signOut } from "next-auth/react";
import BriefForm, { BriefFormData } from "@/components/BriefForm";
import { BriefDisplay } from "@/components/BriefDisplay";
import { PushbackInput } from "@/components/PushbackInput";
import { ChatPanel } from "@/components/ChatPanel";
import { parseBrief } from "@/lib/parseBrief";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { BriefSection, FormInput } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
type SavedBrief = {
  _id: string;
  formInput: {
    course: string;
    week: string | number;
    projects: string[];
    language: string;
    difficulty?: number;
    syllabus?: string;
  };
  brief: { problem: string };
  status: "saved" | "in_progress" | "completed" | "abandoned";
  createdAt: string;
};

type User = { name: string; email: string; id: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function toFormInput(data: BriefFormData): FormInput {
  return {
    course: data.courseName,
    week: data.week,
    difficulty: data.difficulty,
    projects: data.projects,
    language: data.language,
    syllabus: data.syllabus,
  };
}

async function readStream(
  response: Response,
  onChunk: (text: string) => void
): Promise<string> {
  if (!response.body) throw new Error("Response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      onChunk(full);
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") throw err;
  }
  return full;
}

// ── Status badge colours ──────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  saved: "bg-white/5 text-white/50",
  in_progress: "bg-amber-400/10 text-amber-400",
  completed: "bg-emerald-400/10 text-emerald-400",
  abandoned: "bg-red-400/10 text-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  in_progress: "In progress",
  completed: "Completed",
  abandoned: "Abandoned",
};

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = "generate" | "history";

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  initialBriefs,
  user,
}: {
  initialBriefs: SavedBrief[];
  user: User;
}) {
  const router = useRouter();

  const { loading: authLoading, user: firebaseUser } = useAuthGuard();

  // ── Navigation state ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("generate");

  // ── Brief generation state ────────────────────────────────────────────────
  const [genView, setGenView] = useState<"form" | "brief">("form");
  const [formInput, setFormInput] = useState<FormInput | null>(null);
  const [brief, setBrief] = useState<BriefSection | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [genError, setGenError] = useState("");
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Saved briefs state ────────────────────────────────────────────────────
  const [briefs, setBriefs] = useState<SavedBrief[]>(initialBriefs);
  const [historyFilter, setHistoryFilter] = useState<"All" | "In Progress" | "Completed">("All");

  // ── handleGenerate ─────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (data: BriefFormData) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const input = toFormInput(data);
    setFormInput(input);
    setBrief(null);
    setStreamingText("");
    setMissingFields([]);
    setGenError("");
    setCurrentBriefId(null);
    setIsStreaming(true);
    setGenView("brief");

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          course: input.course,
          week: input.week,
          difficulty: input.difficulty,
          projects: input.projects,
          language: input.language,
          syllabus: input.syllabus,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      const fullText = await readStream(response, setStreamingText);
      const parsed = parseBrief(fullText);
      setBrief(parsed);
      setIsStreaming(false);

      // Save to DB
      fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: "tech", formInput: input, brief: parsed }),
      })
        .then((r) => r.json())
        .then((saved) => {
          if (saved?._id) {
            setBriefs((prev) => [saved, ...prev]);
            setCurrentBriefId(saved._id);
          }
        })
        .catch(console.error);

      const missing: string[] = [];
      if (!parsed.problem.trim()) missing.push("problem");
      if (!parsed.scaffold.trim()) missing.push("scaffold");
      if (!parsed.checkpoints || parsed.checkpoints.length === 0) missing.push("checkpoints");
      if (!parsed.stretch.trim()) missing.push("stretch");
      setMissingFields(missing);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error(err);
      setGenError((err as Error).message || "Something went wrong. Try again.");
      setBrief({ problem: `Error: ${(err as Error).message}`, scaffold: "", checkpoints: [], stretch: "" });
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // ── handlePushback ─────────────────────────────────────────────────────────
  const handlePushback = useCallback(async (pushbackText: string) => {
    if (!formInput) return;
    setBrief(null);
    setStreamingText("");
    setMissingFields([]);
    setIsRefining(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formInput, course: formInput.course, pushback: pushbackText }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      const fullText = await readStream(response, setStreamingText);
      const parsed = parseBrief(fullText);
      setBrief(parsed);

      if (currentBriefId) {
        fetch(`/api/briefs/${currentBriefId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief: parsed,
            refinement: { pushbackText, result: parsed },
          }),
        })
          .then((r) => r.json())
          .then((updated) => {
            if (updated?._id) {
              setBriefs((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
            }
          })
          .catch(console.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setIsRefining(false);
    }
  }, [formInput, currentBriefId]);

  // ── handleReset ────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setGenView("form");
    setFormInput(null);
    setBrief(null);
    setStreamingText("");
    setMissingFields([]);
    setIsStreaming(false);
    setIsRefining(false);
    setGenError("");
    setCurrentBriefId(null);
  }, []);

  // ── handleStatusChange ─────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/briefs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBriefs((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus as SavedBrief["status"] } : b))
        );
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const filteredBriefs = briefs.filter((b) => {
    if (historyFilter === "All") return true;
    if (historyFilter === "In Progress") return b.status === "in_progress";
    if (historyFilter === "Completed") return b.status === "completed";
    return true;
  });

  const firstName = user.name?.split(" ")[0] || "there";

  // ── Auth guard (client-side, based on Firebase onAuthStateChanged) ───────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
        <header className="border-b border-white/[0.07] px-4 sm:px-6 md:px-10 py-3.5 sm:py-4 bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08]" />
            <div className="h-4 w-40 rounded bg-white/[0.03] border border-white/[0.08]" />
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-6 sm:py-10 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
                <div className="h-4 w-2/3 rounded bg-white/[0.04] border border-white/[0.08]" />
                <div className="mt-4 h-3 w-full rounded bg-white/[0.04] border border-white/[0.08]" />
                <div className="mt-2 h-3 w-5/6 rounded bg-white/[0.04] border border-white/[0.08]" />
                <div className="mt-8 h-7 w-2/3 rounded-xl bg-white/[0.03] border border-white/[0.08]" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!firebaseUser) {
    // Replace so back button doesn't return to the dashboard.
    router.replace("/login");
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">

      {/* ── Dashboard top bar ─────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.07] px-3 sm:px-6 md:px-10 py-3 sm:py-4 flex items-center justify-between bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
              <span className="text-white font-bold text-xs" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>C</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">Candela</span>
            <span className="text-[#3b82f6] text-xs font-medium hidden sm:block">/ Tech</span>
          </Link>

          {/* Tab navigation */}
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setTab("generate")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                tab === "generate"
                  ? "bg-[#3b82f6]/15 text-[#3b82f6]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setTab("history")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                tab === "history"
                  ? "bg-[#3b82f6]/15 text-[#3b82f6]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              My Briefs
              {briefs.length > 0 && (
                <span className="bg-white/10 text-white/60 text-xs px-1.5 py-0.5 rounded-full">
                  {briefs.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Domain switcher */}
          <Link href="/dashboard/select-domain"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-white/40 hover:text-white text-xs border border-white/[0.07] hover:border-white/20 rounded-lg transition-all">
            ⌨️ Switch domain
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-xs font-semibold text-[#3b82f6]">
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-white/60 text-sm">{firstName}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-2.5 sm:px-3 py-1.5 text-white/40 hover:text-white text-xs border border-white/[0.07] hover:border-white/20 rounded-lg transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-3 sm:px-6 md:px-10 py-6 sm:py-10 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── GENERATE TAB ─────────────────────────────────────────────── */}
          {tab === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={genView === "form" ? "flex flex-col items-center justify-center min-h-[70vh]" : "w-full"}
            >
              {genView === "form" && (
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
                  {/* Greeting */}
                  <div className="mb-6 sm:mb-10 flex flex-col items-center px-1">
                    <p className="text-white/40 text-sm mb-1">Welcome back, {firstName}.</p>
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      What are you{" "}
                      <span className="text-[#3b82f6] italic">studying today?</span>
                    </h1>
                    <p className="mt-3 text-white/45 text-sm sm:text-base max-w-xl leading-relaxed">
                      Tell Candela where you are. We&apos;ll generate a project brief one step past your
                      comfort zone — something you can walk into an interview with.
                    </p>
                  </div>

                  {genError && (
                    <div className="mb-4 sm:mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm w-full text-left">
                      {genError}
                    </div>
                  )}

                  {/* BriefForm */}
                  <div className="w-full text-left">
                    <BriefForm onSubmit={handleGenerate} isSubmitting={isStreaming} />
                  </div>
                </div>
              )}

              {genView === "brief" && (
                <div className="flex flex-col w-full">
                  {/* Back */}
                  <button
                    id="back-to-form-btn"
                    onClick={handleReset}
                    className="self-start mb-5 sm:mb-8 flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm font-medium group"
                  >
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                    New brief
                  </button>

                  {/* Brief context summary */}
                  {formInput && (
                    <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
                      <span className="px-2.5 sm:px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full text-xs text-white/60">
                        📚 {formInput.course}
                      </span>
                      <span className="px-2.5 sm:px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full text-xs text-white/60">
                        📅 Week {formInput.week}
                      </span>
                      <span className="px-2.5 sm:px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full text-xs text-white/60">
                        💻 {formInput.language}
                      </span>
                      {formInput.difficulty && (
                        <span className="px-2.5 sm:px-3 py-1 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-full text-xs text-[#3b82f6]">
                          ⚡ {["", "Beginner", "Easy", "Standard", "Advanced", "Expert"][formInput.difficulty]}
                        </span>
                      )}
                    </div>
                  )}

                  <BriefDisplay
                    brief={brief ?? { problem: "", scaffold: "", checkpoints: [], stretch: "" }}
                    isStreaming={isStreaming}
                    streamingText={streamingText}
                    courseName={formInput?.course}
                    weekNumber={formInput?.week}
                    onToast={(msg) => console.log(msg)}
                    missingFields={missingFields}
                    formInput={formInput ?? undefined}
                  />

                  <AnimatePresence>
                    {brief && !isStreaming && (
                      <motion.div
                        key="pushback"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } }}
                        exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                        className="mt-8 flex flex-col gap-4"
                      >
                        <PushbackInput onPushback={handlePushback} isRefining={isRefining} />
                        {formInput && (
                          <ChatPanel brief={brief} formInput={formInput} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-white"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    Your Briefs
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    {briefs.length === 0
                      ? "No briefs yet — generate your first one."
                      : `${briefs.length} brief${briefs.length !== 1 ? "s" : ""} generated`}
                  </p>
                </div>
                <button
                  onClick={() => { setTab("generate"); handleReset(); }}
                  className="self-start sm:self-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-[#3b82f6] hover:bg-blue-500 text-white text-sm font-medium rounded-full transition-colors active:scale-95"
                >
                  + New brief
                </button>
              </div>

              {/* Filter tabs */}
              {briefs.length > 0 && (
                <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-1 scrollbar-none">
                  {(["All", "In Progress", "Completed"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border whitespace-nowrap ${
                        historyFilter === f
                          ? "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30"
                          : "text-white/40 border-white/[0.07] hover:text-white hover:border-white/20"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {briefs.length === 0 ? (
                /* Empty state */
                <div className="text-center py-16 sm:py-24 border border-white/[0.07] rounded-2xl bg-white/[0.01] px-4">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-white/50 mb-6 text-base">No briefs generated yet.</p>
                  <button
                    onClick={() => setTab("generate")}
                    className="inline-flex items-center px-6 py-3 bg-[#3b82f6] hover:bg-blue-500 text-white font-medium rounded-full text-sm transition-colors active:scale-95"
                  >
                    Generate your first brief →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredBriefs.map((b, i) => (
                    <motion.div
                      key={b._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.35 }}
                      className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 flex flex-col hover:border-white/[0.15] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 flex-1 pr-2">
                          {b.formInput.course}
                        </h3>
                        <span className="text-white/30 text-xs whitespace-nowrap">
                          Wk {b.formInput.week}
                        </span>
                      </div>

                      <p className="text-white/45 text-sm leading-relaxed line-clamp-3 flex-grow mb-5">
                        {b.brief?.problem
                          ? b.brief.problem.substring(0, 120) + "…"
                          : "No problem statement"}
                      </p>

                      <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {b.formInput.language && (
                            <span className="text-xs text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded-full">
                              {b.formInput.language}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[b.status] || STATUS_STYLES.saved}`}>
                            {STATUS_LABELS[b.status] || "Saved"}
                          </span>
                        </div>
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b._id, e.target.value)}
                          className="bg-transparent text-xs text-white/40 cursor-pointer focus:outline-none hover:text-white transition-colors"
                        >
                          <option value="saved" className="bg-[#111]">Saved</option>
                          <option value="in_progress" className="bg-[#111]">In Progress</option>
                          <option value="completed" className="bg-[#111]">Completed</option>
                          <option value="abandoned" className="bg-[#111]">Abandoned</option>
                        </select>
                      </div>

                      <p className="mt-3 text-white/20 text-xs">
                        {new Date(b.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </motion.div>
                  ))}
                  {filteredBriefs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-white/30 text-sm">
                      No briefs match this filter.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
