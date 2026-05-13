/**
 * engineeringPrompt.ts
 *
 * Builds the AI prompt for the Engineering dashboard (Civil / Mechanical / Electrical).
 * Output sections (EXACTLY 4):
 *   1. ## Design Problem
 *   2. ## Calculation Scaffold
 *   3. ## Checkpoint Questions
 *   4. ## Stretch Goal
 */

export interface EngineeringFormInput {
  branch: string;
  subject: string;
  week: number;
  difficulty: number;
  priorWork: string[];
  syllabus?: string;
}

export function buildEngineeringPrompt(input: EngineeringFormInput, pushback?: string): string {
  const {
    branch,
    subject,
    week,
    difficulty = 3,
    priorWork,
    syllabus,
  } = input;

  const difficultyInstructions: Record<number, string> = {
    1: "Explain every step. Assume minimal prior knowledge. Provide all formulas.",
    2: "Guide clearly. Provide key formulas. Assume basic statics/dynamics knowledge.",
    3: "Moderate independence. Reference standard codes (IS, ASTM, BS). Skip derivations.",
    4: "Minimal guidance. Expect student to look up codes, material properties, and safety factors.",
    5: "Professional engineer expectations. Ambiguous constraints. Design for real failure modes.",
  };

  const formattedPriorWork = priorWork.length > 0
    ? priorWork.map((p, i) => `${i + 1}. ${p}`).join("\n")
    : "- (none provided)";

  const sectionFormatConstraint = [
    "OUTPUT FORMAT CONSTRAINT (MUST FOLLOW EXACTLY):",
    "Return EXACTLY these four sections with these exact headers:",
    "",
    "## Design Problem",
    "[2-3 sentences. Real structural/mechanical/electrical design scenario. Specify exact dimensions, loads, materials, and constraints. Be specific — this must be solvable, not hypothetical.]",
    "",
    "## Calculation Scaffold",
    "[Provide either real runnable code or a step-by-step calculation template, whichever best fits the problem. For code-based problems: write real runnable code with TODO comments. For manual problems: write the solution framework with blank formula spaces. Use a fenced code block when code is appropriate.]",
    "",
    "## Checkpoint Questions",
    "[3 numbered questions: (1) a fundamental analysis question (loads, forces, or circuit values), (2) a material/component selection or safety factor question, (3) an optimization or failure mode analysis question.]",
    "",
    "## Stretch Goal",
    "[One harder extension: FEA simulation, dynamic analysis, or code optimization that uses a concept from a later week. Name the exact method or standard required.]",
  ].join("\n");

  const studentProfile = [
    "Student profile:",
    `- Branch: ${branch}`,
    `- Subject: ${subject}`,
    `- Week: ${week}`,
    `- Prior work completed:`,
    formattedPriorWork,
  ].join("\n");

  const syllabusSection = syllabus
    ? [
        "Course Syllabus / Topics provided by the student:",
        `"${syllabus.trim()}"`,
        "",
        "CRITICAL: Align the design problem and calculations EXACTLY with this syllabus. Use only concepts covered so far.",
      ].join("\n")
    : "";

  const instructions = [
    `Generate an engineering project brief for a ${branch} student.`,
    "",
    "Follow these rules:",
    `1. Use concepts from Week ${week} of ${subject} specifically.`,
    "2. Make all dimensions, loads, and material properties specific and realistic.",
    "3. Use a consistent unit system throughout the entire brief.",
    "4. Reference real engineering standards (IS 456, ASTM A36, IEC 60364, etc.) where applicable.",
    "5. The calculation scaffold must be immediately usable with no extra interpretation.",
    "6. Design problems must be constrained — no open-ended 'design a bridge' prompts.",
    "",
    `Difficulty level: ${difficulty}/5 — ${difficultyInstructions[difficulty]}`,
  ].join("\n");

  const pushbackSection = pushback
    ? [`Student wants changes: "${pushback.trim()}"`, "", "Adjust the brief while preserving the exact four-section structure."].join("\n")
    : "";

  return [
    `SYSTEM ROLE: "You are a licensed professional engineer writing design briefs for ${branch} engineering students. Use specific dimensions, real material properties, and industry standards. Never be vague."`,
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
