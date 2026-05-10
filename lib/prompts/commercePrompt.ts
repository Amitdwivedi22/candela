/**
 * commercePrompt.ts
 *
 * Builds the AI prompt for the Commerce & Finance dashboard.
 * Output sections (EXACTLY 4):
 *   1. ## Case Study Problem
 *   2. ## Data Scaffold
 *   3. ## Analysis Checkpoints
 *   4. ## Advanced Challenge
 */

export interface CommerceFormInput {
  subject: string;
  unit: number;
  semester: number;
  tool: string;
  assignmentType: string;
  difficulty: number;
  priorWork: string[];
  syllabus?: string;
}

export function buildCommercePrompt(input: CommerceFormInput, pushback?: string): string {
  const {
    subject,
    unit,
    semester,
    tool,
    assignmentType,
    difficulty = 3,
    priorWork,
    syllabus,
  } = input;

  const difficultyInstructions: Record<number, string> = {
    1: "Explain all steps. Assume no prior knowledge. Use simple, real-world scenarios.",
    2: "Guide clearly. Minimal assumed knowledge. Step-by-step with examples.",
    3: "Some independence required. Skip obvious steps. Use real market data references.",
    4: "Minimal hints. Use complex multi-variable scenarios. Expect self-research.",
    5: "Consulting-grade expectations. Ambiguous problems. No hand-holding. Industry language.",
  };

  const formattedPriorWork = priorWork.length > 0
    ? priorWork.map((p, i) => `${i + 1}. ${p}`).join("\n")
    : "- (none provided)";

  const sectionFormatConstraint = [
    "OUTPUT FORMAT CONSTRAINT (MUST FOLLOW EXACTLY):",
    "Return EXACTLY these four sections with these exact headers:",
    "",
    "## Case Study Problem",
    "[2-3 sentences. Real-world business/finance scenario. Name the actual company, sector, or market. Be specific: include numbers, percentages, or market conditions.]",
    "",
    "## Data Scaffold",
    `[Provide a structured data table or ${tool} template the student can start working with immediately. Use markdown tables for data. For Excel/Tally: show column headers and 3-5 sample rows. For Python/R: provide a code snippet with sample DataFrame. Include actual numbers - not placeholder values.]`,
    "",
    "## Analysis Checkpoints",
    "[3 numbered questions: (1) a quantitative analysis question, (2) a strategic/conceptual question, (3) a critical evaluation or recommendation question.]",
    "",
    "## Advanced Challenge",
    `[One harder task: a presentation, pitch deck outline, financial model, or policy memo that pushes ${assignmentType} skills 2 levels ahead. Name the exact deliverable format.]`,
  ].join("\n");

  const studentProfile = [
    "Student profile:",
    `- Subject: ${subject}`,
    `- Semester: ${semester}`,
    `- Unit/Chapter: ${unit}`,
    `- Preferred tool: ${tool}`,
    `- Assignment type: ${assignmentType}`,
    `- Prior work completed:`,
    formattedPriorWork,
  ].join("\n");

  const syllabusSection = syllabus
    ? [
        "Course Syllabus / Topics provided by the student:",
        `"${syllabus.trim()}"`,
        "",
        "CRITICAL: Align the case study problem and analysis EXACTLY with the syllabus context for this unit.",
      ].join("\n")
    : "";

  const instructions = [
    "Generate a commerce/finance project brief for a student.",
    "",
    "Follow these rules:",
    `1. Use concepts from Unit ${unit} of ${subject} (Semester ${semester}) specifically.`,
    "2. Ground the case study in real companies, real market events, or real financial data.",
    "3. Make numbers specific: use realistic revenue figures, ratios, or percentages.",
    "4. Do NOT use fictional company names like 'ABC Corp'. Use real companies or sectors.",
    `5. The data scaffold must be usable immediately in ${tool}.`,
    "6. Analysis checkpoints must require genuine reasoning, not lookup answers.",
    "",
    `Difficulty level: ${difficulty}/5 — ${difficultyInstructions[difficulty]}`,
  ].join("\n");

  const pushbackSection = pushback
    ? [`Student wants changes: "${pushback.trim()}"`, "", "Adjust the brief while preserving the exact four-section structure."].join("\n")
    : "";

  return [
    'SYSTEM ROLE: "You are a senior business consultant writing case study briefs for commerce and finance students. Use real-world market data, specific companies, and industry language. Never be vague."',
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
