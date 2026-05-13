"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload } from "lucide-react";

export interface EngineeringBriefFormData {
  branch: string;
  subject: string;
  week: number;
  difficulty: number;
  priorWork: string[];
  syllabus?: string;
}

const DIFFICULTY_LEVELS = [
  { label: "Beginner", value: 1 },
  { label: "Easy", value: 2 },
  { label: "Standard", value: 3 },
  { label: "Advanced", value: 4 },
  { label: "Expert", value: 5 },
];

const ENGINEERING_BRANCHES = [
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Electronics & Communication",
];

const ENGINEERING_SUBJECTS = [
  "Structural Analysis", "Fluid Mechanics", "Thermodynamics",
  "Strength of Materials", "Machine Design", "Control Systems",
  "Heat Transfer", "Geotechnical Engineering", "Circuit Theory",
  "Electromagnetics", "Digital Signal Processing", "Material Science",
];

export default function EngineeringBriefForm({
  onSubmit,
  isSubmitting = false,
}: {
  onSubmit: (data: EngineeringBriefFormData) => void;
  isSubmitting?: boolean;
}) {
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [week, setWeek] = useState(1);
  const [difficulty, setDifficulty] = useState(3);
  const [priorWork, setPriorWork] = useState<string[]>([""]);
  const [syllabus, setSyllabus] = useState("");
  const [errors, setErrors] = useState<{ branch?: string; subject?: string; priorWork?: string; syllabus?: string }>({});
  
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [branchSuggestions, setBranchSuggestions] = useState<string[]>([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [isBranchFocused, setIsBranchFocused] = useState(false);
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to parse");
      const data = await res.json();
      if (data.text) setSyllabus(prev => prev ? prev + "\n\n" + data.text : data.text);
    } catch {
      setErrors(prev => ({ ...prev, syllabus: "Failed to read file. Please paste text instead." }));
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!branch.trim()) newErrors.branch = "Branch is required.";
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    
    const validWork = priorWork.filter(p => p.trim());
    if (validWork.length === 0) newErrors.priorWork = "Add at least one prior project or mark as first.";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    
    onSubmit({ branch, subject, week, difficulty, priorWork: validWork, syllabus: syllabus.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-[var(--night-line)] bg-[rgba(10,10,10,0.78)] p-5 shadow-2xl flex flex-col gap-6 sm:p-8">

      {/* Branch & Subject Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch */}
        <div className="flex flex-col gap-3 relative z-50">
          <label className="text-white font-medium">Engineering Branch</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Civil Engineering"
              value={branch}
              onFocus={() => setIsBranchFocused(true)}
              onBlur={() => setTimeout(() => setIsBranchFocused(false), 200)}
              onChange={e => {
                const v = e.target.value;
                setBranch(v);
                if (errors.branch) setErrors(prev => ({ ...prev, branch: undefined }));
                setBranchSuggestions(v.trim() ? ENGINEERING_BRANCHES.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 5) : []);
              }}
              className={`w-full rounded-xl border ${errors.branch ? "border-red-500" : "border-[var(--night-line)]"} bg-[rgba(255,255,255,0.03)] px-4 py-3.5 text-white placeholder:text-white/30 transition-shadow focus:border-[var(--night-glow)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,122,61,0.25)]`}
            />
            <AnimatePresence>
              {isBranchFocused && branchSuggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-xl border border-[var(--night-line)] bg-[var(--night-panel)] shadow-xl z-50">
                  {branchSuggestions.map(s => (
                    <button key={s} type="button" onClick={() => { setBranch(s); setBranchSuggestions([]); if (errors.branch) setErrors(prev => ({ ...prev, branch: undefined })); }}
                      className="w-full border-b border-white/5 px-4 py-3 text-left text-white/80 transition-colors hover:bg-[rgba(255,122,61,0.12)] hover:text-white last:border-0 text-sm">
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {errors.branch && <span className="text-red-500 text-sm">{errors.branch}</span>}
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-3 relative z-40">
          <label className="text-white font-medium">Subject</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Fluid Mechanics"
              value={subject}
              onFocus={() => setIsSubjectFocused(true)}
              onBlur={() => setTimeout(() => setIsSubjectFocused(false), 200)}
              onChange={e => {
                const v = e.target.value;
                setSubject(v);
                if (errors.subject) setErrors(prev => ({ ...prev, subject: undefined }));
                setSubjectSuggestions(v.trim() ? ENGINEERING_SUBJECTS.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 5) : []);
              }}
              className={`w-full rounded-xl border ${errors.subject ? "border-red-500" : "border-[var(--night-line)]"} bg-[rgba(255,255,255,0.03)] px-4 py-3.5 text-white placeholder:text-white/30 transition-shadow focus:border-[var(--night-glow)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,122,61,0.25)]`}
            />
            <AnimatePresence>
              {isSubjectFocused && subjectSuggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-xl border border-[var(--night-line)] bg-[var(--night-panel)] shadow-xl z-50">
                  {subjectSuggestions.map(s => (
                    <button key={s} type="button" onClick={() => { setSubject(s); setSubjectSuggestions([]); if (errors.subject) setErrors(prev => ({ ...prev, subject: undefined })); }}
                      className="w-full border-b border-white/5 px-4 py-3 text-left text-white/80 transition-colors hover:bg-[rgba(255,122,61,0.12)] hover:text-white last:border-0 text-sm">
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {errors.subject && <span className="text-red-500 text-sm">{errors.subject}</span>}
        </div>
      </div>

      {/* Week */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-white/70 text-sm font-medium">Week</label>
          <span className="font-bold text-[var(--night-glow)]">Week {week}</span>
        </div>
        <input type="range" min={1} max={52} value={week} onChange={e => setWeek(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, var(--night-glow) ${(week - 1) / 51 * 100}%, #ffffff20 ${(week - 1) / 51 * 100}%)` }}
        />
        <div className="flex justify-between text-white/30 text-xs"><span>Week 1</span><span>Week 52</span></div>
      </div>

      {/* Difficulty */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-white font-medium">Difficulty</label>
          <span className="font-bold text-sm text-[var(--night-glow)]">{DIFFICULTY_LEVELS[difficulty - 1].label}</span>
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {DIFFICULTY_LEVELS.map(({ label, value }) => (
            <button key={value} type="button" onClick={() => setDifficulty(value)}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                difficulty === value
                  ? "border-[rgba(255,122,61,0.32)] bg-[rgba(255,122,61,0.16)] text-white shadow-[0_0_16px_rgba(255,122,61,0.22)]"
                  : "bg-transparent border-white/10 text-white/50 hover:border-[rgba(255,122,61,0.4)] hover:text-white/80"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Prior Work */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Prior Projects</label>
          {priorWork.length < 4 && (
            <button type="button" onClick={() => setPriorWork([...priorWork, ""])}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--night-glow)] transition-colors hover:text-[var(--night-warm)]">
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>
        <AnimatePresence>
          {priorWork.map((work, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="relative flex items-center">
              <input type="text" placeholder="e.g. Designed a simply supported beam in AutoCAD"
                value={work} onChange={e => { const n = [...priorWork]; n[index] = e.target.value; setPriorWork(n); if (errors.priorWork) setErrors(prev => ({ ...prev, priorWork: undefined })); }}
                className={`w-full rounded-xl border ${errors.priorWork ? "border-red-500" : "border-[var(--night-line)]"} bg-[rgba(255,255,255,0.03)] px-4 py-3.5 pr-12 text-white placeholder:text-white/30 transition-shadow focus:border-[var(--night-glow)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,122,61,0.25)]`}
              />
              {priorWork.length > 1 && (
                <button type="button" onClick={() => setPriorWork(priorWork.filter((_, i) => i !== index))}
                  className="absolute right-4 text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {errors.priorWork && <span className="text-red-500 text-sm">{errors.priorWork}</span>}
      </div>

      {/* Syllabus */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <label className="text-white font-medium">Course Syllabus (Optional)</label>
          <div className="relative">
            <input ref={fileInputRef} type="file" id="engineering-syllabus-file" accept=".pdf,.txt,.md" className="hidden" onChange={handleFileUpload} disabled={isParsingFile} />
            <label htmlFor="engineering-syllabus-file"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${isParsingFile ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40" : "border-white/10 bg-white/[0.04] text-white/70 hover:border-[rgba(255,122,61,0.3)] hover:bg-[rgba(255,122,61,0.1)] hover:text-[var(--night-warm)]"}`}>
              {isParsingFile ? (<><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/></svg>Extracting...</>) : (<><Upload className="w-3.5 h-3.5" />Upload PDF/TXT</>)}
            </label>
          </div>
        </div>
        <textarea placeholder="Paste your syllabus topics here..." value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={3}
          className="w-full resize-none rounded-xl border border-[var(--night-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3.5 text-white placeholder:text-white/30 transition-shadow focus:border-[var(--night-glow)] focus:outline-none focus:ring-1 focus:ring-[rgba(255,122,61,0.25)]" />
        {errors.syllabus && <span className="text-red-500 text-sm">{errors.syllabus}</span>}
        <span className="text-white/40 text-xs">Helps align the design problem to your exact curriculum.</span>
      </div>

      {/* Submit */}
      <button type="submit" disabled={isSubmitting} aria-live="polite"
        className="w-full rounded-xl bg-[var(--night-glow)] py-4 font-semibold text-[#120d09] transition-all duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_24px_rgba(255,122,61,0.2)] hover:shadow-[0_0_32px_rgba(255,122,61,0.35)]">
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/></svg>
            Generating brief...
          </span>
        ) : "Generate Engineering Brief →"}
      </button>
    </form>
  );
}
