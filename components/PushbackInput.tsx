"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface PushbackInputProps {
  onPushback: (text: string) => void;
  isRefining: boolean;
}

const PLACEHOLDERS = [
  "Make it harder...",
  "Use NumPy instead of vanilla Python...",
  "I'm more of a beginner than I said...",
  "Focus more on the linear algebra concepts from week 6...",
];

const SUGGESTIONS = [
  "Make it harder",
  "Make it simpler",
  "Different topic",
  "Add more detail",
];

export function PushbackInput({ onPushback, isRefining }: PushbackInputProps) {
  const [text, setText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevRefiningRef = useRef(false);

  const MAX_CHARS = 500;

  useEffect(() => {
    if (isFocused) {
      intervalRef.current = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Optional: reset to first placeholder when focus is lost
      setPlaceholderIndex(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFocused]);

  // Auto-clear textarea when refinement completes (isRefining: true → false)
  useEffect(() => {
    if (prevRefiningRef.current && !isRefining) {
      setText("");
    }
    prevRefiningRef.current = isRefining;
  }, [isRefining]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isRefining) return;
    onPushback(text);
  };

  return (
    <div className="w-full rounded-2xl border border-white/8 bg-[rgba(12,12,12,0.78)] p-4 sm:p-6">
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">
          Not quite right?
        </p>
        <h3 className="text-lg font-semibold text-white">Push back and refine</h3>
        <p className="mt-1 text-sm text-white/50">
          Tell us what to change and we&apos;ll regenerate.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={3}
            maxLength={MAX_CHARS}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            disabled={isRefining}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0F] p-4 text-white placeholder:text-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-[rgba(255,122,61,0.35)] disabled:opacity-50"
          />
          {/* Character counter */}
          <div className="flex justify-end mt-1">
            <span
              className={`text-xs tabular-nums transition-colors ${
                text.length >= MAX_CHARS
                  ? "text-red-400 font-semibold"
                  : text.length >= MAX_CHARS * 0.8
                  ? "text-amber-400"
                  : "text-white/30"
              }`}
            >
              {text.length}/{MAX_CHARS}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setText(suggestion);
                  // Optional: Automatically focus textarea after clicking a suggestion
                  // document.querySelector('textarea')?.focus();
                }}
                disabled={isRefining}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 transition-colors hover:border-[rgba(255,122,61,0.35)] hover:bg-[rgba(255,122,61,0.14)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-stretch pt-2 sm:justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isRefining}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--night-glow)] px-6 py-2.5 font-medium text-[#120d09] transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Refining...
              </>
            ) : (
              "Refine Brief →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
