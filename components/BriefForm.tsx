"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload } from "lucide-react";
import { COURSE_SUGGESTIONS } from "../lib/courseSuggestions";

export interface BriefFormData {
  courseName: string;
  week: number;
  difficulty: number;
  projects: string[];
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
  const [syllabus, setSyllabus] = useState("");
  const [errors, setErrors] = useState<{ courseName?: string; projects?: string; syllabus?: string }>({});
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
    
    const newErrors: { courseName?: string; projects?: string; syllabus?: string } = {};
    if (!courseName.trim()) newErrors.courseName = "Course Name is required.";
    
    const validProjects = projects.filter(p => p.trim() !== "");
    if (practiceCount !== "" && practiceCount > 0) {
      validProjects.push(`Completed ${practiceCount} practice problems/exercises.`);
    }
    
    if (validProjects.length === 0) newErrors.projects = "At least one project or practice count must be provided.";
    
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
      syllabus: syllabus.trim() ? syllabus.trim() : undefined,
    };

    onSubmit(formData);
  };

  return (
    <form suppressHydrationWarning onSubmit={handleSubmit} className="studio-card w-full rounded-[1.75rem] p-5 shadow-2xl flex flex-col gap-6 sm:p-8 sm:gap-8">
      
      {/* Course Name */}
      <div className="flex flex-col gap-3 relative z-50">
        <label htmlFor="courseName" className="font-medium text-[var(--text-main)]">
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
            }}
            className={`w-full rounded-xl border ${errors.courseName ? 'border-red-500' : 'border-[var(--night-line)]'} bg-[rgba(6,12,18,0.45)] px-4 py-3.5 text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--night-glow)] focus:ring-1 focus:ring-[var(--night-glow)] transition-shadow`}
          />
          <AnimatePresence>
            {isCourseFocused && courseSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-[var(--night-line)] bg-[var(--night-panel)] shadow-xl"
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
                    }}
                    className="w-full border-b border-white/5 px-4 py-3 text-left text-[var(--text-dim)] transition-colors hover:bg-[rgba(255,122,61,0.12)] hover:text-[var(--text-main)] last:border-0"
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
          <label htmlFor="syllabus" className="font-medium text-[var(--text-main)]">
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
                  ? "bg-white/5 border-[var(--night-line)] text-[var(--text-dim)] cursor-not-allowed"
                  : "bg-white/[0.04] border-[var(--night-line)] text-[var(--text-dim)] hover:bg-white/[0.08] hover:text-[var(--text-main)]"
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
          className="w-full resize-none rounded-xl border border-[var(--night-line)] bg-[rgba(6,12,18,0.45)] px-4 py-3.5 text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--night-glow)] focus:ring-1 focus:ring-[var(--night-glow)] transition-shadow"
        />
        {errors.syllabus && <span className="text-red-500 text-sm mt-1">{errors.syllabus}</span>}
        <span className="text-xs text-[var(--text-dim)]">This helps match the brief to your actual curriculum instead of guessing from the course title.</span>
      </div>

      {/* Course Week */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-[var(--text-dim)]">Course Week</label>
          <span className="text-lg font-bold text-[var(--night-glow)]">
            Week {week} <span className="text-sm font-normal text-[var(--text-dim)]">of 52</span>
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={52}
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--night-glow) ${(week - 1) / 51 * 100}%, rgba(255,255,255,0.12) ${(week - 1) / 51 * 100}%)`
          }}
        />
        <div className="flex justify-between text-xs text-[var(--text-dim)]">
          <span>Week 1</span>
          <span>Week 52</span>
        </div>
      </div>

      {/* Difficulty Dial */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="font-medium text-[var(--text-main)]">Difficulty</label>
          <span className="text-sm font-bold text-[var(--night-warm)]">
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
                  ? "border-[rgba(255,184,108,0.28)] bg-[rgba(255,184,108,0.16)] text-[var(--text-main)] shadow-[0_0_16px_rgba(255,184,108,0.18)]"
                  : "bg-transparent border-[var(--night-line)] text-[var(--text-dim)] hover:border-[rgba(255,184,108,0.28)] hover:text-[var(--text-main)]"
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
          <label className="font-medium text-[var(--text-main)]">Prior Experience (Projects & Practice)</label>
          {projects.length < 4 && (
            <button
              type="button"
              onClick={handleAddProject}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--night-glow)] transition-colors hover:opacity-80"
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
                  className={`w-full rounded-xl border ${errors.projects ? 'border-red-500' : 'border-[var(--night-line)]'} bg-[rgba(6,12,18,0.45)] px-4 py-3.5 pr-12 text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--night-glow)] focus:ring-1 focus:ring-[var(--night-glow)] transition-shadow`}
                />
                {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(index)}
                    className="absolute right-4 text-[var(--text-dim)] transition-colors hover:text-[var(--text-main)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="mt-1 flex flex-col justify-between gap-3 rounded-xl border border-[var(--night-line)] bg-[rgba(255,255,255,0.03)] p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Practice Problems</label>
              <span className="text-xs text-[var(--text-dim)]">Approximate number of exercises completed</span>
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
              className="w-full rounded-lg border border-[var(--night-line)] bg-[rgba(6,12,18,0.45)] px-3 py-2.5 text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--night-glow)] focus:ring-1 focus:ring-[var(--night-glow)] transition-shadow sm:w-24 sm:py-2 sm:text-center"
            />
          </div>
          {errors.projects && <span className="text-red-500 text-sm">{errors.projects}</span>}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-live="polite"
        className="w-full rounded-xl bg-[var(--night-glow)] py-4 font-semibold text-[#0d1720] transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
