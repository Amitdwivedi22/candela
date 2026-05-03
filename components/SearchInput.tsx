"use client";

import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SuggestionType = "tools" | "languages" | "projects" | "practice";

interface SearchInputProps {
  type: SuggestionType;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function SearchInput({ type, placeholder = "Search...", value, onChange, className = "" }: SearchInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  
  const cache = useRef<Record<string, string[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    const cacheKey = `${type}-${value.toLowerCase()}`;
    if (cache.current[cacheKey]) {
      setSuggestions(cache.current[cacheKey]);
      setHasSearched(true);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&type=${type}`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        const results = data.suggestions || [];
        cache.current[cacheKey] = results;
        setSuggestions(results);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, type]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsFocused(false);
    setSelectedIndex(-1);
  };

  // Highlight matching text (case-insensitive)
  const renderHighlight = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-violet-400 font-bold bg-violet-500/10 rounded px-0.5">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-[#13131A] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="animate-spin w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z" />
            </svg>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFocused && value.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              <ul className="py-2">
                {suggestions.map((suggestion, idx) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => handleSelect(suggestion)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2
                        ${
                          selectedIndex === idx
                            ? "bg-violet-600/20 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="truncate">
                        {renderHighlight(suggestion, value)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : hasSearched && !isLoading ? (
              <div className="px-4 py-3 text-sm text-white/50 text-center">
                No suggestions found
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
