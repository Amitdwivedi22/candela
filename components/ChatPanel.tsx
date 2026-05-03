"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, Send, Loader2 } from "lucide-react";
import type { BriefSection, FormInput } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** True only while this assistant message is being streamed */
  streaming?: boolean;
}

interface ChatPanelProps {
  brief: BriefSection;
  formInput: FormInput;
}

// ── Quick-start chip prompts ──────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What library should I use?",
  "Explain the scaffold",
  "What should I build first?",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readStream(
  response: Response,
  onChunk: (accumulated: string) => void
): Promise<string> {
  if (!response.body) throw new Error("Response has no body");
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   full    = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      onChunk(full);
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") throw err;
  }
  return full;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-violet-600 text-white text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white/8 border border-white/10 text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
        {content || <span className="opacity-40">…</span>}
        {streaming && (
          <span className="inline-block w-[2px] h-[13px] bg-violet-400 ml-0.5 align-middle animate-blink" />
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatPanel({ brief, formInput }: ChatPanelProps) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [isSending, setIsSending] = useState(false);

  const threadRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // ── Core send function ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || isSending) return;

    // Append user message and a blank streaming assistant bubble
    const newUserMsg:  ChatMessage = { role: "user",      content: userText };
    const placeholderMsg: ChatMessage = { role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, newUserMsg, placeholderMsg]);
    setInput("");
    setIsSending(true);

    // Build history: all messages including the new user one (exclude placeholder)
    const history = [
      ...messages,
      newUserMsg,
    ];

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          messages:     history,
          briefContext: brief,
          formInput,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }

      // Stream into the last (placeholder) message
      await readStream(response, (accumulated) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated, streaming: true };
          return updated;
        });
      });

      // Mark streaming done
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Sorry, something went wrong: ${(err as Error).message}`,
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [messages, brief, formInput, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full mt-4">
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .animate-blink { animation: blink 0.55s step-end infinite; }
        .bg-white\\/8  { background-color: rgba(255,255,255,0.08); }
      `}</style>

      {/* ── Toggle button ── */}
      <button
        id="chat-panel-toggle"
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2.5 w-full px-5 py-3.5 rounded-2xl border border-white/10 bg-[#13131A] hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-200 group"
      >
        <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
          <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors flex-1 text-left">
          Chat with your brief
        </span>
        {messages.length > 0 && (
          <span className="text-xs text-violet-400 font-medium bg-violet-500/15 px-2 py-0.5 rounded-full">
            {messages.filter(m => m.role === "user").length} msgs
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
        </motion.div>
      </button>

      {/* ── Expandable panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-2xl border border-white/10 bg-[#13131A] overflow-hidden flex flex-col">

              {/* ── Message thread ── */}
              <div
                ref={threadRef}
                className="flex flex-col gap-3 p-4 overflow-y-auto"
                style={{ maxHeight: "320px" }}
              >
                {/* Empty state */}
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-6 text-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-violet-400" />
                    </div>
                    <p className="text-white/50 text-sm max-w-[260px]">
                      Ask anything about your brief — libraries, approach, where to start.
                    </p>
                  </motion.div>
                )}

                {/* Conversation bubbles */}
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {msg.role === "user" ? (
                        <UserBubble content={msg.content} />
                      ) : (
                        <AssistantBubble content={msg.content} streaming={msg.streaming} />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* ── Quick-start chips ── (only when no messages yet) */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={isSending}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-violet-500/30 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Divider ── */}
              <div className="border-t border-white/8 mx-4" />

              {/* ── Input row ── */}
              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  placeholder="Ask about your brief… (Enter to send)"
                  className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-all disabled:opacity-50 leading-relaxed"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                />
                <button
                  id="chat-send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={isSending || !input.trim()}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  {isSending
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
