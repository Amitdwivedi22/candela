"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import MedicalBriefForm, { MedicalBriefFormData } from "@/components/medical/MedicalBriefForm";
import { MedicalBriefDisplay } from "@/components/medical/MedicalBriefDisplay";

type User = { name: string; email: string; id: string };
type Tab = "generate" | "history";
type SavedBrief = {
  _id: string;
  formInput: { course: string; week: string | number };
  brief: { problem: string };
  status: string;
  createdAt: string;
};

async function readStream(response: Response, onChunk: (text: string) => void): Promise<string> {
  if (!response.body) throw new Error("No body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk(full);
  }
  return full;
}

export default function MedicalDashboardClient({ initialBriefs, user }: { initialBriefs: SavedBrief[]; user: User }) {
  const router = useRouter();
  const { loading: authLoading, user: firebaseUser } = useAuthGuard();

  const [tab, setTab] = useState<Tab>("generate");
  const [genView, setGenView] = useState<"form" | "brief">("form");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [genError, setGenError] = useState("");
  const [currentSubject, setCurrentSubject] = useState<string | undefined>();
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<SavedBrief[]>(initialBriefs);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async (data: MedicalBriefFormData) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setCurrentSubject(data.subject);
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
        body: JSON.stringify({ domain: "medical", ...data }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }
      const fullText = await readStream(response, setStreamingText);
      setIsStreaming(false);

      // Save to DB
      fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "medical",
          formInput: { course: data.subject, week: data.year, projects: data.priorCases, language: data.caseType },
          brief: { problem: fullText.slice(0, 500), scaffold: "", checkpoints: [], stretch: "" },
        }),
      }).then(r => r.json()).then(saved => {
        if (saved?._id) { setBriefs(prev => [saved, ...prev]); setCurrentBriefId(saved._id); }
      }).catch(console.error);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setGenError((err as Error).message || "Something went wrong.");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setGenView("form");
    setStreamingText("");
    setIsStreaming(false);
    setGenError("");
    setCurrentBriefId(null);
  }, []);

  const firstName = user.name?.split(" ")[0] || "there";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0305] text-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }
  if (!firebaseUser) { router.replace("/login"); return null; }

  return (
    <div className="min-h-screen bg-[#0A0305] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-rose-500/[0.08] px-3 sm:px-6 md:px-10 py-3 sm:py-4 flex items-center justify-between bg-[#0A0305]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs" style={{ fontFamily: "Georgia, serif" }}>C</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">Candela</span>
            <span className="text-rose-400 text-xs font-medium hidden sm:block">/ Medical</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {(["generate", "history"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all capitalize ${tab === t ? "bg-rose-500/15 text-rose-400" : "text-white/50 hover:text-white"}`}>
                {t === "generate" ? "Generate" : `My Cases ${briefs.length > 0 ? `(${briefs.length})` : ""}`}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Domain switcher */}
          <Link href="/dashboard/select-domain"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-white/40 hover:text-white text-xs border border-white/[0.07] hover:border-white/20 rounded-lg transition-all">
            🩺 Switch domain
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xs font-semibold text-rose-400">
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-white/60 text-sm">{firstName}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="px-2.5 sm:px-3 py-1.5 text-white/40 hover:text-white text-xs border border-white/[0.07] hover:border-white/20 rounded-lg transition-all">
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-3 sm:px-6 md:px-10 py-6 sm:py-10 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {tab === "generate" && (
            <motion.div key="generate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className={genView === "form" ? "flex flex-col items-center justify-center min-h-[70vh]" : "w-full"}>
              {genView === "form" && (
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
                  <div className="mb-6 sm:mb-10 flex flex-col items-center px-1">
                    <p className="text-white/40 text-sm mb-1">Welcome back, {firstName}.</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                      What case are we{" "}
                      <span className="text-rose-400 italic">reviewing today?</span>
                    </h1>
                    <p className="mt-3 text-white/45 text-sm sm:text-base max-w-xl leading-relaxed">
                      Tell Candela what you&apos;re studying. We&apos;ll generate a clinical case presentation to test your diagnostic skills.
                    </p>
                  </div>
                  {genError && (
                    <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm w-full text-left">{genError}</div>
                  )}
                  <div className="w-full text-left">
                    <MedicalBriefForm onSubmit={handleGenerate} isSubmitting={isStreaming} />
                  </div>
                </div>
              )}

              {genView === "brief" && (
                <div className="flex flex-col w-full">
                  <button onClick={handleReset}
                    className="self-start mb-5 sm:mb-8 flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm font-medium group">
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span> New case
                  </button>
                  {currentSubject && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs text-rose-400">🩺 {currentSubject}</span>
                    </div>
                  )}
                  <MedicalBriefDisplay rawText={streamingText} isStreaming={isStreaming} courseName={currentSubject} />
                  {streamingText && !isStreaming && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="mt-6 p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl text-rose-400/70 text-sm">
                      💡 <strong className="text-rose-300">Next step:</strong> Complete the investigation scaffold and build your differential diagnosis list.
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Your Clinical Cases</h2>
                  <p className="text-white/40 text-sm mt-1">{briefs.length === 0 ? "No cases yet." : `${briefs.length} generated`}</p>
                </div>
                <button onClick={() => { setTab("generate"); handleReset(); }}
                  className="self-start sm:self-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-full transition-colors">
                  + New case
                </button>
              </div>
              {briefs.length === 0 ? (
                <div className="text-center py-16 border border-rose-500/10 rounded-2xl bg-rose-500/[0.02]">
                  <div className="text-4xl mb-4">🩺</div>
                  <p className="text-white/50 mb-6">No clinical cases generated yet.</p>
                  <button onClick={() => setTab("generate")}
                    className="inline-flex items-center px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-full text-sm transition-colors">
                    Generate your first case →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {briefs.map((b, i) => (
                    <motion.div key={b._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="bg-rose-500/[0.03] border border-rose-500/[0.1] rounded-2xl p-5 flex flex-col hover:border-rose-500/30 transition-colors">
                      <h3 className="font-semibold text-white text-base leading-tight mb-2">{b.formInput.course}</h3>
                      <p className="text-white/45 text-sm leading-relaxed line-clamp-3 flex-grow mb-4">{b.brief?.problem?.substring(0, 120)}…</p>
                      <p className="text-white/20 text-xs">{new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
