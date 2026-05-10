/**
 * medicalPrompt.ts
 *
 * Builds the AI prompt for the Medical & Healthcare dashboard.
 * Output sections (EXACTLY 4):
 *   1. ## Clinical Case Presentation
 *   2. ## Investigation Scaffold
 *   3. ## Differential Diagnosis Checkpoints
 *   4. ## Management Plan Challenge
 */

export interface MedicalFormInput {
  subject: string;
  year: number;
  caseType: string;
  examMode: string;
  difficulty: number;
  priorCases: string[];
  syllabus?: string;
}

export function buildMedicalPrompt(input: MedicalFormInput, pushback?: string): string {
  const {
    subject,
    year,
    caseType,
    examMode,
    difficulty = 3,
    priorCases,
    syllabus,
  } = input;

  const difficultyInstructions: Record<number, string> = {
    1: "Present a classic, textbook presentation. One clear diagnosis. All vitals and history are straightforward.",
    2: "Mostly classic presentation with one atypical feature. Two plausible diagnoses.",
    3: "Mixed presentation. 2-3 differential diagnoses with overlapping features.",
    4: "Atypical or complex presentation. Rare conditions included. Requires knowledge of investigations and their limitations.",
    5: "Rare condition or multi-system disorder. Mimics common diseases. Expects self-directed clinical reasoning.",
  };

  const formattedPriorCases = priorCases.length > 0
    ? priorCases.map((c, i) => `${i + 1}. ${c}`).join("\n")
    : "- (none provided)";

  const sectionFormatConstraint = [
    "OUTPUT FORMAT CONSTRAINT (MUST FOLLOW EXACTLY):",
    "Return EXACTLY these four sections with these exact headers:",
    "",
    "## Clinical Case Presentation",
    "[Present a realistic patient case. Include: Age, sex, chief complaint, history of present illness, relevant past medical/surgical/family/social history, vital signs (HR, BP, RR, SpO2, Temperature), and key physical examination findings. Format as a structured clinical presentation.]",
    "",
    "## Investigation Scaffold",
    "[List the investigations the student should order, in the correct sequence: (1) Bedside/immediate tests, (2) Basic labs, (3) Imaging, (4) Special/confirmatory tests. For each category, leave blank fields for the student to write expected findings and interpretation. Use a structured table format.]",
    "",
    "## Differential Diagnosis Checkpoints",
    "[3 clinical reasoning questions: (1) What are the top 3 differentials and what features support or refute each? (2) What is the single most important investigation to distinguish them and why? (3) What red flags or complications must be ruled out immediately?]",
    "",
    "## Management Plan Challenge",
    `[One harder task: write the full management protocol (immediate, short-term, long-term) OR a pharmacology drug card for the primary treatment. Format for ${examMode} exam style. Name the exact guidelines/protocols the student should reference (e.g., WHO, NICE, AIIMS protocol).]`,
  ].join("\n");

  const studentProfile = [
    "Student profile:",
    `- Subject: ${subject}`,
    `- Year/Posting: Year ${year}`,
    `- Case type: ${caseType}`,
    `- Exam mode: ${examMode}`,
    `- Prior cases studied:`,
    formattedPriorCases,
  ].join("\n");

  const syllabusSection = syllabus
    ? [
        "Course Syllabus / Topics provided by the student:",
        `"${syllabus.trim()}"`,
        "",
        "CRITICAL: The clinical case must involve a condition directly covered in the provided syllabus for this year.",
      ].join("\n")
    : "";

  const instructions = [
    `Generate a medical case study brief for a Year ${year} ${subject} student.`,
    "",
    "Follow these rules:",
    `1. The case must involve a condition taught in Year ${year} ${subject}.`,
    "2. Vital signs and lab values must be physiologically plausible (not random numbers).",
    "3. Do NOT name the diagnosis in the case presentation — let the student arrive at it.",
    "4. Use correct medical terminology throughout.",
    `5. Format investigations and management in the style expected for ${examMode} exams.`,
    "6. Reference actual clinical guidelines where relevant (WHO, AIIMS, NICE, Harrison's).",
    "",
    `Difficulty level: ${difficulty}/5 — ${difficultyInstructions[difficulty]}`,
  ].join("\n");

  const pushbackSection = pushback
    ? [`Student wants changes: "${pushback.trim()}"`, "", "Adjust the brief while preserving the exact four-section structure."].join("\n")
    : "";

  return [
    'SYSTEM ROLE: "You are a senior clinician and medical educator writing clinical case study briefs for medical students. Use realistic patient data, correct medical terminology, and reference actual clinical guidelines. Never name the diagnosis in the case presentation."',
    "",
    sectionFormatConstraint,
    "",
    studentProfile,
    "",
    syllabusSection,
    "",
    instructions,
    "",
    pushbackSection,
    "",
    sectionFormatConstraint,
  ]
    .filter(Boolean)
    .join("\n");
}
