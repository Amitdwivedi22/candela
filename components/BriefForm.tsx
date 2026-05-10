"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, FileText } from "lucide-react";
import { detectLanguage } from "../lib/detectLanguage";
import { COURSE_SUGGESTIONS } from "../lib/courseSuggestions";

export interface BriefFormData {
  courseName: string;
  week: number;
  difficulty: number;
  projects: string[];
  language: string;
  syllabus?: string;
}

const DIFFICULTY_LEVELS: { label: string; value: number }[] = [
  { label: "Beginner", value: 1 },
  { label: "Easy",     value: 2 },
  { label: "Standard", value: 3 },
  { label: "Advanced", value: 4 },
  { label: "Expert",   value: 5 },
];

export default function BriefForm({
  onSubmit,
  isSubmitting = false,
}: {
  onSubmit: (data: BriefFormData) => void;
  isSubmitting?: boolean;
}) {
  const [courseName, setCourseName] = useState("");
  const [week, setWeek] = useState(1);
  const [difficulty, setDifficulty] = useState(3);
  const [projects, setProjects] = useState<string[]>([""]);
  const [language, setLanguage] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [errors, setErrors] = useState<{ courseName?: string; projects?: string; language?: string; syllabus?: string }>({});
  const [suggestedLanguage, setSuggestedLanguage] = useState<string | null>(null);
  const [practiceCount, setPracticeCount] = useState<number | "">("");
  const [courseSuggestions, setCourseSuggestions] = useState<string[]>([]);
  const [isCourseFocused, setIsCourseFocused] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setErrors(prev => ({ ...prev, syllabus: undefined }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to parse file");
      }

      const data = await response.json();
      if (data.text) {
        setSyllabus(prev => prev ? prev + "\n\n" + data.text : data.text);
      }
    } catch (error) {
      console.error(error);
      setErrors(prev => ({ ...prev, syllabus: "Failed to read file. Please paste text instead." }));
    } finally {
      setIsParsingFile(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleAddProject = () => {
    if (projects.length < 4) {
      setProjects([...projects, ""]);
    }
  };

  const handleRemoveProject = (index: number) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects.length ? newProjects : [""]);
  };

  const handleProjectChange = (index: number, value: string) => {
    const newProjects = [...projects];
    newProjects[index] = value;
    setProjects(newProjects);
    if (errors.projects && newProjects.some(p => p.trim() !== "")) {
      setErrors(prev => ({ ...prev, projects: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { courseName?: string; projects?: string; language?: string; syllabus?: string } = {};
    if (!courseName.trim()) newErrors.courseName = "Course Name is required.";
    
    const validProjects = projects.filter(p => p.trim() !== "");
    if (practiceCount !== "" && practiceCount > 0) {
      validProjects.push(`Completed ${practiceCount} practice problems/exercises.`);
    }
    
    if (validProjects.length === 0) newErrors.projects = "At least one project or practice count must be provided.";
    
    if (!language) newErrors.language = "Please select a preferred language or tool.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const formData = {
      courseName,
      week,
      difficulty,
      projects: validProjects,
      language,
      syllabus: syllabus.trim() ? syllabus.trim() : undefined,
    };

    onSubmit(formData);
  };

  return (
    <form suppressHydrationWarning onSubmit={handleSubmit} className="w-full bg-[#13131A] border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl flex flex-col gap-6 sm:gap-8">
      
      {/* Course Name */}
      <div className="flex flex-col gap-3 relative z-50">
        <label htmlFor="courseName" className="text-white font-medium">
          Course Name
        </label>
        <div className="relative">
          <input
            suppressHydrationWarning
            id="courseName"
            type="text"
            placeholder="e.g. Linear Algebra, Python Basics, Web Dev"
            value={courseName}
            onFocus={() => setIsCourseFocused(true)}
            onBlur={() => setTimeout(() => setIsCourseFocused(false), 200)}
            onChange={(e) => {
              const value = e.target.value;
              setCourseName(value);
              if (errors.courseName) setErrors(prev => ({ ...prev, courseName: undefined }));
              
              if (value.trim()) {
                const matches = COURSE_SUGGESTIONS.filter(c => c.toLowerCase().includes(value.toLowerCase()));
                setCourseSuggestions(matches.slice(0, 5));
              } else {
                setCourseSuggestions([]);
              }
              
              const detected = detectLanguage(value);
              if (detected && detected !== language) {
                // Show suggestion only when it differs from the already-selected language
                setSuggestedLanguage(detected);
              } else {
                // Nothing detected, or user already has this language selected
                setSuggestedLanguage(null);
              }
            }}
            className={`w-full bg-[#13131A] border ${errors.courseName ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow`}
          />
          <AnimatePresence>
            {isCourseFocused && courseSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A24] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
              >
                {courseSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setCourseName(suggestion);
                      setCourseSuggestions([]);
                      setIsCourseFocused(false);
                      if (errors.courseName) setErrors(prev => ({ ...prev, courseName: undefined }));
                      
                      const detected = detectLanguage(suggestion);
                      if (detected && detected !== language) {
                        setSuggestedLanguage(detected);
                      } else {
                        setSuggestedLanguage(null);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-white/80 hover:bg-violet-600/20 hover:text-white transition-colors border-b border-white/5 last:border-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.courseName && <span className="text-red-500 text-sm">{errors.courseName}</span>}
      </div>

      {/* Course Syllabus */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end mb-1">
          <label htmlFor="syllabus" className="text-white font-medium">
            Course Syllabus (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              id="syllabus-file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isParsingFile}
            />
            <label
              htmlFor="syllabus-file"
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isParsingFile
                  ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                  : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {isParsingFile ? (
                <svg className="animate-spin w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/>
                </svg>
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {isParsingFile ? "Extracting..." : "Upload File (PDF/TXT)"}
            </label>
          </div>
        </div>
        <textarea
          id="syllabus"
          placeholder="Paste course syllabus or relevant topics here for more accurate brief generation..."
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          rows={4}
          className="w-full bg-[#13131A] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow resize-none"
        />
        {errors.syllabus && <span className="text-red-500 text-sm mt-1">{errors.syllabus}</span>}
        <span className="text-white/40 text-xs">This helps generate a brief closely matched to your actual curriculum. Paste text or upload a document.</span>
      </div>

      {/* Course Week */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-white/70 text-sm font-medium">Course Week</label>
          <span className="text-violet-400 font-bold text-lg">
            Week {week} <span className="text-white/40 text-sm font-normal">of 20</span>
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #7c3aed ${(week - 1) / 19 * 100}%, #ffffff20 ${(week - 1) / 19 * 100}%)`
          }}
        />
        <div className="flex justify-between text-white/30 text-xs">
          <span>Week 1</span>
          <span>Week 20</span>
        </div>
      </div>

      {/* Difficulty Dial */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-white font-medium">Difficulty</label>
          <span className="text-violet-400 font-bold text-sm">
            {DIFFICULTY_LEVELS[difficulty - 1].label}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {DIFFICULTY_LEVELS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDifficulty(value)}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                difficulty === value
                  ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                  : "bg-transparent border-white/10 text-white/50 hover:border-violet-500/50 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Prior Experience */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Prior Experience (Projects & Practice)</label>
          {projects.length < 4 && (
            <button
              type="button"
              onClick={handleAddProject}
              className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add project
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center"
              >
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="e.g. Built a calculator in Python"
                  value={project}
                  onChange={(e) => handleProjectChange(index, e.target.value)}
                  className={`w-full bg-[#13131A] border ${errors.projects ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow pr-12`}
                />
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(index)}
                    className="absolute right-4 text-white/30 hover:text-white/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1A1A24] p-4 rounded-xl border border-white/5 mt-1">
            <div className="flex-1">
              <label className="text-sm text-white/90 font-medium block mb-1">Practice Problems</label>
              <span className="text-xs text-white/50">Approximate number of exercises completed</span>
            </div>
            <input
              type="number"
              min="0"
              value={practiceCount}
              onChange={(e) => {
                setPracticeCount(e.target.value ? parseInt(e.target.value) : "");
                if (errors.projects) setErrors(prev => ({ ...prev, projects: undefined }));
              }}
              placeholder="e.g. 20"
              className="w-full sm:w-24 bg-[#13131A] border border-white/10 rounded-lg px-3 py-2.5 sm:py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow sm:text-center"
            />
          </div>
          {errors.projects && <span className="text-red-500 text-sm">{errors.projects}</span>}
        </div>
      </div>

      {/* Preferred Language / Tool */}
      <div className="flex flex-col gap-3">
        <label className="text-white font-medium">Preferred Language / Tool</label>
        <div className="relative">
          <select
            suppressHydrationWarning
            value={language}
            onChange={(e) => {
              const value = e.target.value;
              setLanguage(value);
              if (errors.language) setErrors(prev => ({ ...prev, language: undefined }));
              if (suggestedLanguage === value) {
                setSuggestedLanguage(null);
              }
            }}
            className={`w-full bg-[#13131A] border ${errors.language ? 'border-red-500' : 'border-white/10'} text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select a language or tool</option>
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="Go">Go</option>
            <option value="Rust">Rust</option>
            <option disabled>──────────</option>
            <option value="MATLAB">MATLAB</option>
            <option value="Excel/Spreadsheets">Excel / Spreadsheets</option>
            <option value="None (Theory/Math)">None (Theory/Math)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <AnimatePresence>
          {suggestedLanguage && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-lg px-4 py-3"
            >
              <span className="text-sm text-violet-200">
                We suggest <strong>{suggestedLanguage}</strong> for this course — use it?
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(suggestedLanguage);
                    setSuggestedLanguage(null);
                    if (errors.language) setErrors(prev => ({ ...prev, language: undefined }));
                  }}
                  className="text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestedLanguage(null)}
                  className="text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-md transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {errors.language && <span className="text-red-500 text-sm">{errors.language}</span>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-live="polite"
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/>
            </svg>
            Generating...
          </span>
        ) : (
          "Generate My Brief →"
        )}
      </button>
    </form>
  );
}
