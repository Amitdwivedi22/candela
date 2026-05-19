"use client";

import { CSSProperties, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signOut, useSession } from "next-auth/react";
import BriefForm, { BriefFormData } from "@/components/BriefForm";
import { BriefDisplay } from "@/components/BriefDisplay";
import { PushbackInput } from "@/components/PushbackInput";
import { ChatPanel } from "@/components/ChatPanel";
import type { BriefSection, FormInput } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
type SavedBrief = {
  _id: string;
  formInput: {
    course: string;
    week: string | number;
    projects: string[];
    language?: string;
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
    syllabus: data.syllabus,
  };
}

function formatBriefForPrompt(brief: BriefSection): string {
  return [
    "## The Problem",
    brief.problem,
    "",
    "## Starter Scaffold",
    `\`\`\`python\n${brief.scaffold}\n\`\`\``,
    "",
    "## Checkpoint Questions",
    brief.checkpoints.map((checkpoint, index) => `Q${index + 1}: ${checkpoint}`).join("\n"),
    "",
    "## Stretch Goal",
    brief.stretch,
  ].join("\n");
}

class ApiClientError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function readApiError(response: Response) {
  const payload = await response
    .json()
    .catch(() => ({ error: "Request failed" }));

  return new ApiClientError(payload.error ?? "Request failed", response.status);
}

function isRateLimitError(error: unknown) {
  const err = error as ApiClientError | Error;
  const status = "status" in (err ?? {}) ? (err as ApiClientError).status : undefined;
  return status === 429 || err.message.toLowerCase().includes("rate limit");
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

const sheryThemeVars: CSSProperties = {
  "--night-glow": "#ff7a3d",
  "--night-warm": "#ffb36b",
  "--night-line": "rgba(255, 122, 61, 0.18)",
  "--night-panel": "#121212",
  "--night-panel-soft": "rgba(18, 18, 18, 0.88)",
  "--text-main": "#f7efe8",
  "--text-dim": "rgba(247, 239, 232, 0.64)",
} as CSSProperties;

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  initialBriefs,
  user,
}: {
  initialBriefs: SavedBrief[];
  user: User;
}) {
  const router = useRouter();
  const { status } = useSession();

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
  const handleGenerate = useCallback(async (data: BriefFormData, retryCount = 0) => {
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
          syllabus: input.syllabus,
        }),
      });

      if (!response.ok) {
        throw await readApiError(response);
      }

      const payload = (await response.json()) as { brief: BriefSection };
      const parsed = payload.brief;

      setStreamingText(formatBriefForPrompt(parsed));
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
      if (isRateLimitError(err) && retryCount < 1) {
        setGenError(
          "Groq is rate limited right now (free tier). Waiting 10 seconds and retrying automatically..."
        );
        window.setTimeout(() => {
          void handleGenerate(data, retryCount + 1);
        }, 10_000);
        return;
      }
      console.error(err);
      setGenError((err as Error).message || "Something went wrong. Try again.");
      setBrief({ problem: `Error: ${(err as Error).message}`, scaffold: "", checkpoints: [], stretch: "" });
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // ── handlePushback ─────────────────────────────────────────────────────────
  const handlePushback = useCallback(async (pushbackText: string, retryCount = 0) => {
    if (!formInput || !brief) return;
    const previousBrief = formatBriefForPrompt(brief);
    const currentBriefSnapshot = brief;
    setBrief(null);
    setStreamingText("");
    setMissingFields([]);
    setGenError("");
    setIsRefining(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formInput,
          course: formInput.course,
          pushback: pushbackText,
          previousBrief,
        }),
      });

      if (!response.ok) {
        throw await readApiError(response);
      }

      const payload = (await response.json()) as { brief: BriefSection };
      const parsed = payload.brief;
      setStreamingText(formatBriefForPrompt(parsed));
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
      if (isRateLimitError(err) && retryCount < 1) {
        setGenError(
          "Groq is rate limited right now (free tier). Waiting 10 seconds and retrying automatically..."
        );
        window.setTimeout(() => {
          void handlePushback(pushbackText, retryCount + 1);
        }, 10_000);
        return;
      }
      console.error(err);
      setGenError((err as Error).message || "Refinement failed. Please try again.");
      setBrief(currentBriefSnapshot);
    } finally {
      setIsStreaming(false);
      setIsRefining(false);
    }
  }, [brief, formInput, currentBriefId]);

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

  if (status === "loading") {
    return (
    <div className="min-h-screen flex flex-col text-[var(--text-main)]" style={sheryThemeVars}>
        <header className="sticky top-0 z-40 border-b border-[var(--night-line)] bg-[rgba(8,16,24,0.88)] px-4 py-3.5 backdrop-blur-md sm:px-6 md:px-10 sm:py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08]" />
            <div className="h-4 w-40 rounded bg-white/[0.03] border border-white/[0.08]" />
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-6 sm:py-10 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="studio-card rounded-2xl p-5 sm:p-6">
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

  if (status === "unauthenticated") {
    // Replace so back button doesn't return to the dashboard.
    router.replace("/login");
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen overflow-hidden text-[var(--text-main)]"
      style={sheryThemeVars}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,125,69,0.2),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(255,182,105,0.12),transparent_20%),linear-gradient(180deg,#070707_0%,#0c0c0c_46%,#070707_100%)]" />
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "68px 68px" }} />
      <div className="absolute left-[-10rem] top-32 h-[24rem] w-[24rem] rounded-full border border-white/8 bg-[rgba(255,122,61,0.05)] blur-3xl" />
      <div className="absolute bottom-[-11rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] blur-3xl" />
      <div className="relative z-10 flex min-h-screen flex-col">

      {/* ── Dashboard top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--night-line)] bg-[rgba(10,10,10,0.82)] px-3 py-3 backdrop-blur-xl sm:px-6 md:px-10 sm:py-4">
        <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-[var(--night-line)] bg-[rgba(255,122,61,0.12)]">
              <span className="display-font text-sm text-[var(--night-glow)]">N</span>
            </div>
            <span className="display-font text-lg text-[var(--text-main)]">Nextstep</span>
          </Link>
          <div className="hidden h-8 w-px bg-[var(--night-line)] sm:block" />
          <div className="min-w-0 flex-1 rounded-2xl border border-[var(--night-line)] bg-[rgba(255,122,61,0.08)] px-3 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">
              Active studio
            </p>
            <p className="truncate text-sm font-semibold text-[var(--night-glow)] sm:text-[15px]">
              Software and Tech Dashboard
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
          <Link href="/dashboard/select-domain"
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--night-line)] px-3 py-1.5 text-xs text-[var(--text-dim)] transition-all hover:border-[rgba(255,122,61,0.3)] hover:text-[var(--text-main)]">
            Switch domain
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(255,122,61,0.28)] bg-[rgba(255,122,61,0.12)] text-xs font-semibold text-[var(--night-glow)]">
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-sm text-[var(--text-dim)]">{firstName}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg border border-[var(--night-line)] px-2.5 py-1.5 text-xs text-[var(--text-dim)] transition-all hover:border-[rgba(255,184,108,0.28)] hover:text-[var(--text-main)] sm:px-3"
          >
            Sign out
          </button>
        </div>
        </div>

        <div className="overflow-x-auto pb-1 scrollbar-none">
          <nav className="flex min-w-max items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setTab("generate")}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                tab === "generate"
                  ? "bg-[rgba(255,122,61,0.14)] text-[var(--night-glow)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setTab("history")}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                tab === "history"
                  ? "bg-[rgba(255,122,61,0.14)] text-[var(--night-glow)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
              }`}
            >
              My Briefs
              {briefs.length > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-xs text-[var(--text-dim)]">
                  {briefs.length}
                </span>
              )}
            </button>
          </nav>
        </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="mx-auto flex-1 w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-10 md:px-10">
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
                <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center">
                  {/* Greeting */}
                  <div className="mb-6 sm:mb-10 flex flex-col items-center px-1">
                    <p className="mb-3 text-xs uppercase tracking-[0.36em] text-white/42">Welcome back, {firstName}</p>
                    <h1
                      className="display-font text-[2.5rem] leading-[0.94] text-[var(--text-main)] sm:text-5xl md:text-6xl lg:text-7xl"
                    >
                      Build from what
                      <span className="block text-[var(--night-glow)]">you finished learning today.</span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-dim)] sm:text-base">
                      Tell Nextstep what you just learned. We&apos;ll shape it into one project brief with enough friction to teach you, not stall you.
                    </p>
                  </div>

                  {genError && (
                    <div className="mb-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300 sm:mb-6">
                      {genError}
                    </div>
                  )}

                  {/* BriefForm */}
                  <div className="w-full text-left rounded-[1.5rem] border border-white/8 bg-[rgba(10,10,10,0.58)] p-2 backdrop-blur-xl sm:rounded-[2rem] sm:p-3">
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
                    className="group mb-5 flex items-center gap-1.5 self-start text-sm font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text-main)] sm:mb-8"
                  >
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                    New brief
                  </button>

                  {genError && (
                    <div className="mb-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300 sm:mb-6">
                      {genError}
                    </div>
                  )}

                  {/* Brief context summary */}
                  {formInput && (
                    <div className="mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
                      <span className="px-2.5 sm:px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full text-xs text-white/60">
                        📚 {formInput.course}
                      </span>
                      <span className="px-2.5 sm:px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full text-xs text-white/60">
                        📅 Week {formInput.week}
                      </span>
                      {formInput.difficulty && (
                        <span className="px-2.5 sm:px-3 py-1 rounded-full border border-[rgba(255,122,61,0.22)] bg-[rgba(255,122,61,0.1)] text-xs text-[var(--night-glow)]">
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
                  className="self-start sm:self-auto rounded-full bg-[var(--night-glow)] px-4 py-2 text-sm font-medium text-[#120d09] transition-colors hover:brightness-105 active:scale-95 sm:self-auto sm:px-5 sm:py-2.5"
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
                          ? "bg-[rgba(255,122,61,0.12)] text-[var(--night-glow)] border-[rgba(255,122,61,0.24)]"
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
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] px-4 py-16 text-center sm:py-24">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-white/50 mb-6 text-base">No briefs generated yet.</p>
                  <button
                    onClick={() => setTab("generate")}
                    className="inline-flex items-center rounded-full bg-[var(--night-glow)] px-6 py-3 text-sm font-medium text-[#120d09] transition-colors hover:brightness-105 active:scale-95"
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
                      className="flex flex-col rounded-[1.75rem] border border-white/[0.08] bg-[rgba(11,11,11,0.72)] p-6 backdrop-blur-xl transition-colors hover:border-[rgba(255,122,61,0.18)]"
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
    </div>
  );
}
