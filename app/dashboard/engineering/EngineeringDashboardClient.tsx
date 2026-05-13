"use client";

import { CSSProperties, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import EngineeringBriefForm, { EngineeringBriefFormData } from "@/components/engineering/EngineeringBriefForm";
import { EngineeringBriefDisplay } from "@/components/engineering/EngineeringBriefDisplay";
import { PushbackInput } from "@/components/PushbackInput";
import { ChatPanel } from "@/components/ChatPanel";
import type { BriefSection, FormInput } from "@/types";

type User = { name: string; email: string; id: string };
type Tab = "generate" | "history";
type SavedBrief = {
  _id: string;
  formInput: { course: string; week: string | number };
  brief: { problem: string };
  status: string;
  createdAt: string;
};

const sheryThemeVars: CSSProperties = {
  "--night-glow": "#ff7a3d",
  "--night-warm": "#ffb36b",
  "--night-line": "rgba(255, 122, 61, 0.18)",
  "--night-panel": "#121212",
  "--night-panel-soft": "rgba(18, 18, 18, 0.88)",
  "--text-main": "#f7efe8",
  "--text-dim": "rgba(247, 239, 232, 0.64)",
} as CSSProperties;

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

function toFormInput(data: EngineeringBriefFormData): FormInput {
  return {
    course: `${data.branch} - ${data.subject}`,
    week: data.week,
    difficulty: data.difficulty,
    projects: data.priorWork,
    language: data.branch,
    syllabus: data.syllabus,
  };
}

function formatEngineeringBrief(brief: BriefSection) {
  return [
    "## Design Problem",
    brief.problem,
    "",
    "## Calculation Scaffold",
    `\`\`\`python\n${brief.scaffold}\n\`\`\``,
    "",
    "## Checkpoint Questions",
    brief.checkpoints.map((checkpoint, index) => `${index + 1}. ${checkpoint}`).join("\n"),
    "",
    "## Stretch Goal",
    brief.stretch,
  ].join("\n");
}

export default function EngineeringDashboardClient({
  initialBriefs,
  user,
}: {
  initialBriefs: SavedBrief[];
  user: User;
}) {
  const router = useRouter();
  const { loading: authLoading, user: firebaseUser } = useAuthGuard();

  const [tab, setTab] = useState<Tab>("generate");
  const [genView, setGenView] = useState<"form" | "brief">("form");
  const [formInput, setFormInput] = useState<FormInput | null>(null);
  const [generationInput, setGenerationInput] = useState<EngineeringBriefFormData | null>(null);
  const [brief, setBrief] = useState<BriefSection | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [genError, setGenError] = useState("");
  const [currentSubject, setCurrentSubject] = useState<string | undefined>();
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<SavedBrief[]>(initialBriefs);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async (data: EngineeringBriefFormData, retryCount = 0) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setCurrentSubject(data.subject);
    setFormInput(toFormInput(data));
    setGenerationInput(data);
    setBrief(null);
    setStreamingText("");
    setGenError("");
    setCurrentBriefId(null);
    setIsStreaming(true);
    setGenView("brief");

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({ domain: "engineering", ...data }),
      });
      if (!response.ok) {
        throw await readApiError(response);
      }

      const payload = (await response.json()) as { brief: BriefSection };
      const parsed = payload.brief;
      setBrief(parsed);
      setStreamingText(formatEngineeringBrief(parsed));
      setIsStreaming(false);

      fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "engineering",
          formInput: {
            course: `${data.branch} - ${data.subject}`,
            week: data.week,
            projects: data.priorWork,
            language: data.branch,
            difficulty: data.difficulty,
            syllabus: data.syllabus,
          },
          brief: parsed,
        }),
      })
        .then((r) => r.json())
        .then((saved) => {
          if (saved?._id) {
            setBriefs((prev) => [saved, ...prev]);
            setCurrentBriefId(saved._id);
          }
        })
        .catch(console.error);
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
      setGenError((err as Error).message || "Something went wrong.");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const handlePushback = useCallback(async (pushbackText: string, retryCount = 0) => {
    if (!brief || !generationInput) return;

    const previousBrief = formatEngineeringBrief(brief);
    const currentBriefSnapshot = brief;
    setBrief(null);
    setStreamingText("");
    setGenError("");
    setIsRefining(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "engineering",
          ...generationInput,
          pushback: pushbackText,
          previousBrief,
        }),
      });

      if (!response.ok) {
        throw await readApiError(response);
      }

      const payload = (await response.json()) as { brief: BriefSection };
      const parsed = payload.brief;
      setBrief(parsed);
      setStreamingText(formatEngineeringBrief(parsed));

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
              setBriefs((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
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
      setGenError((err as Error).message || "Refinement failed. Please try again.");
      setBrief(currentBriefSnapshot);
      setStreamingText(formatEngineeringBrief(currentBriefSnapshot));
    } finally {
      setIsStreaming(false);
      setIsRefining(false);
    }
  }, [brief, generationInput, currentBriefId]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setGenView("form");
    setFormInput(null);
    setGenerationInput(null);
    setBrief(null);
    setStreamingText("");
    setIsStreaming(false);
    setIsRefining(false);
    setGenError("");
    setCurrentSubject(undefined);
    setCurrentBriefId(null);
  }, []);

  const firstName = user.name?.split(" ")[0] || "there";

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col text-[var(--text-main)]" style={sheryThemeVars}>
        <header className="sticky top-0 z-40 border-b border-[var(--night-line)] bg-[rgba(10,10,10,0.82)] px-4 py-3.5 backdrop-blur-xl sm:px-6 md:px-10 sm:py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border border-white/[0.08] bg-white/[0.03]" />
            <div className="h-4 w-40 rounded border border-white/[0.08] bg-white/[0.03]" />
          </div>
        </header>
      </div>
    );
  }
  if (!firebaseUser) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--text-main)]" style={sheryThemeVars}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,125,69,0.2),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(255,182,105,0.12),transparent_20%),linear-gradient(180deg,#070707_0%,#0c0c0c_46%,#070707_100%)]" />
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "68px 68px" }} />
      <div className="absolute left-[-10rem] top-32 h-[24rem] w-[24rem] rounded-full border border-white/8 bg-[rgba(255,122,61,0.05)] blur-3xl" />
      <div className="absolute bottom-[-11rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full border border-white/8 bg-[rgba(255,255,255,0.03)] blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--night-line)] bg-[rgba(10,10,10,0.82)] px-3 py-3 backdrop-blur-xl sm:px-6 md:px-10 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-[var(--night-line)] bg-[rgba(255,122,61,0.12)]">
                <span className="display-font text-sm text-[var(--night-glow)]">N</span>
              </div>
              <span className="hidden display-font text-lg sm:block">Nextstep</span>
              <span className="hidden text-xs font-medium text-[var(--night-glow)] sm:block">/ Engineering studio</span>
            </Link>

            <nav className="flex items-center gap-0.5 sm:gap-1">
              {(["generate", "history"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all sm:px-4 sm:text-sm ${
                    tab === item
                      ? "bg-[rgba(255,122,61,0.14)] text-[var(--night-glow)]"
                      : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {item === "generate" ? "Generate" : `My Briefs${briefs.length > 0 ? ` (${briefs.length})` : ""}`}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/select-domain"
              className="hidden items-center gap-1 rounded-lg border border-[var(--night-line)] px-3 py-1.5 text-xs text-[var(--text-dim)] transition-all hover:border-[rgba(255,122,61,0.3)] hover:text-[var(--text-main)] sm:flex"
            >
              Switch domain
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
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
        </header>

        <main className="mx-auto flex-1 w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-10 md:px-10">
          <AnimatePresence mode="wait">
            {tab === "generate" && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className={genView === "form" ? "flex min-h-[70vh] flex-col items-center justify-center" : "w-full"}
              >
                {genView === "form" && (
                  <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
                    <div className="mb-6 flex flex-col items-center px-1 sm:mb-10">
                      <p className="mb-3 text-xs uppercase tracking-[0.36em] text-white/42">Welcome back, {firstName}</p>
                      <h1 className="display-font text-4xl leading-[0.96] text-[var(--text-main)] sm:text-5xl md:text-6xl">
                        Build from the systems
                        <span className="block text-[var(--night-glow)]">you studied today.</span>
                      </h1>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-dim)] sm:text-base">
                        Tell Nextstep what you&apos;re studying. We&apos;ll shape it into one engineering brief grounded in real constraints, calculations, and decisions.
                      </p>
                    </div>

                    {genError && (
                      <div className="mb-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300 sm:mb-6">
                        {genError}
                      </div>
                    )}

                    <div className="w-full rounded-[2rem] border border-white/8 bg-[rgba(10,10,10,0.58)] p-2 text-left backdrop-blur-xl sm:p-3">
                      <EngineeringBriefForm onSubmit={handleGenerate} isSubmitting={isStreaming} />
                    </div>
                  </div>
                )}

                {genView === "brief" && (
                  <div className="flex w-full flex-col">
                    <button
                      onClick={handleReset}
                      className="group mb-5 flex items-center gap-1.5 self-start text-sm font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text-main)] sm:mb-8"
                    >
                      <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                      New brief
                    </button>

                    {currentSubject && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[rgba(255,122,61,0.22)] bg-[rgba(255,122,61,0.1)] px-3 py-1 text-xs text-[var(--night-glow)]">
                          {currentSubject}
                        </span>
                      </div>
                    )}

                    <EngineeringBriefDisplay rawText={streamingText} isStreaming={isStreaming} courseName={currentSubject} />

                    {brief && !isStreaming && formInput && (
                      <div className="mt-6 space-y-4">
                        <PushbackInput onPushback={handlePushback} isRefining={isRefining} />
                        <ChatPanel brief={brief} formInput={formInput} />
                      </div>
                    )}

                    {streamingText && !isStreaming && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6 rounded-2xl border border-[rgba(255,122,61,0.16)] bg-[rgba(255,122,61,0.06)] p-4 text-sm text-[var(--text-dim)]"
                      >
                        <strong className="text-[var(--night-glow)]">Next step:</strong> start with the core assumptions, work through the scaffold, and validate the design choice against the stated constraints.
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="display-font text-3xl text-white">Your Engineering Briefs</h2>
                    <p className="mt-1 text-sm text-white/40">
                      {briefs.length === 0 ? "No briefs yet." : `${briefs.length} generated`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTab("generate");
                      handleReset();
                    }}
                    className="self-start rounded-full bg-[var(--night-glow)] px-4 py-2 text-sm font-medium text-[#120d09] transition-colors hover:brightness-105 sm:self-auto sm:px-5 sm:py-2.5"
                  >
                    + New brief
                  </button>
                </div>

                {briefs.length === 0 ? (
                  <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] px-4 py-16 text-center">
                    <div className="mb-4 text-4xl">⚙️</div>
                    <p className="mb-6 text-white/50">No engineering briefs generated yet.</p>
                    <button
                      onClick={() => setTab("generate")}
                      className="inline-flex items-center rounded-full bg-[var(--night-glow)] px-6 py-3 text-sm font-medium text-[#120d09] transition-colors hover:brightness-105"
                    >
                      Generate your first brief →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {briefs.map((b, i) => (
                      <motion.div
                        key={b._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex flex-col rounded-[1.75rem] border border-white/[0.08] bg-[rgba(11,11,11,0.72)] p-5 backdrop-blur-xl transition-colors hover:border-[rgba(255,122,61,0.18)]"
                      >
                        <h3 className="mb-2 text-base font-semibold leading-tight text-white">{b.formInput.course}</h3>
                        <p className="mb-4 flex-grow text-sm leading-relaxed text-white/45">
                          {b.brief?.problem?.substring(0, 120)}…
                        </p>
                        <p className="text-xs text-white/20">
                          {new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </motion.div>
                    ))}
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
