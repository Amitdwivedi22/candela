"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload } from "lucide-react";

export interface MedicalBriefFormData {
  subject: string;
  year: number;
  caseType: string;
  examMode: string;
  difficulty: number;
  priorCases: string[];
  syllabus?: string;
}

const DIFFICULTY_LEVELS = [
  { label: "Classic", value: 1 },
  { label: "Typical", value: 2 },
  { label: "Mixed", value: 3 },
  { label: "Atypical", value: 4 },
  { label: "Rare", value: 5 },
];

const MEDICAL_SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology",
  "General Medicine", "General Surgery", "Pediatrics",
  "Obstetrics & Gynecology", "Orthopedics", "Psychiatry",
  "Dermatology", "Ophthalmology", "ENT", "Community Medicine"
];

const CASE_TYPES = [
  { value: "Clinical Case", label: "Clinical Case Study" },
  { value: "Drug Profile", label: "Pharmacology Drug Profile" },
  { value: "OSCE Station", label: "OSCE Station Setup" },
  { value: "Diagnostic Workup", label: "Diagnostic Workup Focus" },
];

const EXAM_MODES = [
  { value: "NEET-PG", label: "NEET-PG Style" },
  { value: "USMLE Step 1", label: "USMLE Step 1" },
  { value: "USMLE Step 2 CK", label: "USMLE Step 2 CK" },
  { value: "PLAB", label: "PLAB Style" },
  { value: "University Theory", label: "University Theory Exam" },
];

export default function MedicalBriefForm({
  onSubmit,
  isSubmitting = false,
}: {
  onSubmit: (data: MedicalBriefFormData) => void;
  isSubmitting?: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState(1);
  const [caseType, setCaseType] = useState("");
  const [examMode, setExamMode] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [priorCases, setPriorCases] = useState<string[]>([""]);
  const [syllabus, setSyllabus] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; caseType?: string; examMode?: string; priorCases?: string; syllabus?: string }>({});
  
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
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
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!caseType) newErrors.caseType = "Please select case type.";
    if (!examMode) newErrors.examMode = "Please select exam mode.";
    
    const validCases = priorCases.filter(p => p.trim());
    if (validCases.length === 0) newErrors.priorCases = "Add at least one prior case or mark as first.";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    
    onSubmit({ subject, year, caseType, examMode, difficulty, priorCases: validCases, syllabus: syllabus.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-[#1A0F14] border border-rose-500/10 rounded-2xl p-5 sm:p-8 shadow-2xl flex flex-col gap-6">

      {/* Subject */}
      <div className="flex flex-col gap-3 relative z-50">
        <label className="text-white font-medium">Subject / System</label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. General Medicine, CVS, Pathology"
            value={subject}
            onFocus={() => setIsSubjectFocused(true)}
            onBlur={() => setTimeout(() => setIsSubjectFocused(false), 200)}
            onChange={e => {
              const v = e.target.value;
              setSubject(v);
              if (errors.subject) setErrors(prev => ({ ...prev, subject: undefined }));
              setSubjectSuggestions(v.trim() ? MEDICAL_SUBJECTS.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 5) : []);
            }}
            className={`w-full bg-[#1A0F14] border ${errors.subject ? "border-red-500" : "border-rose-500/20"} rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 transition-shadow`}
          />
          <AnimatePresence>
            {isSubjectFocused && subjectSuggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1A0F14] border border-rose-500/20 rounded-xl shadow-xl overflow-hidden z-50">
                {subjectSuggestions.map(s => (
                  <button key={s} type="button" onClick={() => { setSubject(s); setSubjectSuggestions([]); if (errors.subject) setErrors(prev => ({ ...prev, subject: undefined })); }}
                    className="w-full text-left px-4 py-3 text-white/80 hover:bg-rose-600/10 hover:text-white transition-colors border-b border-white/5 last:border-0 text-sm">
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.subject && <span className="text-red-500 text-sm">{errors.subject}</span>}
      </div>

      {/* Year */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-white/70 text-sm font-medium">Academic Year / Phase</label>
          <span className="text-rose-400 font-bold">Year {year}</span>
        </div>
        <input type="range" min={1} max={5} value={year} onChange={e => setYear(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #f43f5e ${(year - 1) / 4 * 100}%, #ffffff20 ${(year - 1) / 4 * 100}%)` }}
        />
        <div className="flex justify-between text-white/30 text-xs"><span>1st Year (Pre-clinical)</span><span>Internship</span></div>
      </div>

      {/* Case Type & Exam Mode Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Case Type */}
        <div className="flex flex-col gap-3">
          <label className="text-white font-medium">Case Type</label>
          <div className="relative">
            <select value={caseType} onChange={e => { setCaseType(e.target.value); if (errors.caseType) setErrors(prev => ({ ...prev, caseType: undefined })); }}
              className={`w-full bg-[#1A0F14] border ${errors.caseType ? "border-red-500" : "border-rose-500/20"} text-white rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer`}>
              <option value="" disabled>Select case type</option>
              {CASE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          {errors.caseType && <span className="text-red-500 text-sm">{errors.caseType}</span>}
        </div>

        {/* Exam Mode */}
        <div className="flex flex-col gap-3">
          <label className="text-white font-medium">Exam Format Focus</label>
          <div className="relative">
            <select value={examMode} onChange={e => { setExamMode(e.target.value); if (errors.examMode) setErrors(prev => ({ ...prev, examMode: undefined })); }}
              className={`w-full bg-[#1A0F14] border ${errors.examMode ? "border-red-500" : "border-rose-500/20"} text-white rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer`}>
              <option value="" disabled>Select exam format</option>
              {EXAM_MODES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          {errors.examMode && <span className="text-red-500 text-sm">{errors.examMode}</span>}
        </div>
      </div>

      {/* Difficulty */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-white font-medium">Presentation Difficulty</label>
          <span className="text-rose-400 font-bold text-sm">{DIFFICULTY_LEVELS[difficulty - 1].label}</span>
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {DIFFICULTY_LEVELS.map(({ label, value }) => (
            <button key={value} type="button" onClick={() => setDifficulty(value)}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                difficulty === value
                  ? "bg-rose-600 border-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.3)]"
                  : "bg-transparent border-white/10 text-white/50 hover:border-rose-500/50 hover:text-white/80"
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Prior Cases */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Recent Cases Studied</label>
          {priorCases.length < 4 && (
            <button type="button" onClick={() => setPriorCases([...priorCases, ""])}
              className="flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-300 transition-colors font-medium">
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>
        <AnimatePresence>
          {priorCases.map((work, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="relative flex items-center">
              <input type="text" placeholder="e.g. Acute Myocardial Infarction, Peptic Ulcer Disease"
                value={work} onChange={e => { const n = [...priorCases]; n[index] = e.target.value; setPriorCases(n); if (errors.priorCases) setErrors(prev => ({ ...prev, priorCases: undefined })); }}
                className={`w-full bg-[#1A0F14] border ${errors.priorCases ? "border-red-500" : "border-rose-500/20"} rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 transition-shadow pr-12`}
              />
              {priorCases.length > 1 && (
                <button type="button" onClick={() => setPriorCases(priorCases.filter((_, i) => i !== index))}
                  className="absolute right-4 text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {errors.priorCases && <span className="text-red-500 text-sm">{errors.priorCases}</span>}
      </div>

      {/* Syllabus */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <label className="text-white font-medium">Syllabus / Block Topics (Optional)</label>
          <div className="relative">
            <input ref={fileInputRef} type="file" id="medical-syllabus-file" accept=".pdf,.txt,.md" className="hidden" onChange={handleFileUpload} disabled={isParsingFile} />
            <label htmlFor="medical-syllabus-file"
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${isParsingFile ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed" : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300"}`}>
              {isParsingFile ? (<><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/></svg>Extracting...</>) : (<><Upload className="w-3.5 h-3.5" />Upload PDF/TXT</>)}
            </label>
          </div>
        </div>
        <textarea placeholder="Paste diseases or topics you need to focus on..." value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={3}
          className="w-full bg-[#1A0F14] border border-rose-500/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 transition-shadow resize-none" />
        {errors.syllabus && <span className="text-red-500 text-sm">{errors.syllabus}</span>}
        <span className="text-white/40 text-xs">Ensures the clinical case covers your current curriculum block.</span>
      </div>

      {/* Submit */}
      <button type="submit" disabled={isSubmitting} aria-live="polite"
        className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-[0_0_24px_rgba(244,63,94,0.2)] hover:shadow-[0_0_32px_rgba(244,63,94,0.35)]">
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"/></svg>
            Generating clinical case...
          </span>
        ) : "Generate Medical Case →"}
      </button>
    </form>
  );
}
