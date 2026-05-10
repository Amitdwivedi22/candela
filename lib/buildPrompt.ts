/**
 * buildPrompt.ts
 *
 * Constructs the prompt sent to the local Ollama backend (not Gemini).
 * Local models (e.g. llama3/mistral) often follow numbered constraints
 * more reliably and can drift on output format unless the constraint is
 * repeated at the top AND bottom.
 *
 * PROMPT SECTIONS (in order) — EXACTLY these four sections:
 *   1. ## Problem
 *   2. ## Starter Scaffold
 *   3. ## Checkpoint Questions
 *   4. ## Stretch Goal
 */

import { FormInput } from "../types";

export function buildPrompt(input: FormInput, pushback?: string): string {
  const { course, week, projects, language, difficulty = 3, syllabus } = input;

  const formattedProjects = projects
    .map((p, i) => `${i + 1}. ${p}`)
    .join("\n");

  const difficultyInstructions: Record<number, string> = {
    1: "Explain every step. No assumed knowledge. First real project.",
    2: "Guide them clearly. Minimal assumed knowledge.",
    3: "Some independence required. Skip obvious steps.",
    4: "Minimal hints. Expect them to look things up.",
    5: "Production-quality expectations. No hand-holding.",
  };

  const sectionFormatConstraint = [
    "OUTPUT FORMAT CONSTRAINT (MUST FOLLOW EXACTLY):",
    "Return EXACTLY these four sections (no extras, no missing sections).",
    "",
    "## Problem",
    "[2-3 sentences. Concrete, real-world problem. Be specific: name the dataset/API/domain.]",
    "",
    "## Starter Scaffold",
    "[Write real, runnable code in " +
      `${language}` +
      ". No pseudocode. Include import/require statements. Use a single fenced code block like \`\`\`${language.toLowerCase()} ... \`\`\`.]",
    "",
    "## Checkpoint Questions",
    "[3 numbered questions: conceptual, functional, and reflective edge case/failure mode/optimization.]",
    "",
    "## Stretch Goal",
    "[One harder extension using a concept 1-2 weeks ahead. Name the exact technique/library they need.]",
  ].join("\n");

  const studentProfileSection = [
    "Student profile:",
    `- Course: ${course}`,
    `- Current week: ${week}`,
    `- Prior projects they have built:`,
    formattedProjects.length > 0
      ? formattedProjects
      : "- (none provided by user)",
    `- Preferred programming language: ${language}`,
  ].join("\n");

  const syllabusSection = syllabus
    ? [
        "Course Syllabus / Topics provided by the student:",
        `"${syllabus.trim()}"`,
        "",
        "CRITICAL: Align the problem, scaffold, and difficulty EXACTLY with the provided syllabus context for the current week.",
      ].join("\n")
    : "";

  const pushbackSection = pushback
    ? [
        "Student wants changes:",
        `"${pushback.trim()}"`,
        "",
        "Adjust the brief to satisfy the complaint while preserving the same four-section structure.",
      ].join("\n")
    : "";

  // Keep the instruction as a numbered list (local models follow it better).
  const instructionNumberedList = [
    "Generate a project brief for a student.",
    "",
    "Follow these numbered rules:",
    "1. Use concepts from week " + week + " of " + course + " specifically.",
    "2. Be specific and technical; avoid vague guidance.",
    "3. Do not add any sections beyond the required four sections.",
    "4. Use the required header names exactly as written.",
    "5. Use the required code scaffold rules in ## Starter Scaffold.",
    "6. Write only what the student needs to start implementing immediately.",
    "",
    "Quality bar example (read carefully):",
    'BAD: "Build something with Python that processes data"',
    'GOOD: "Build a CLI tool in Python that reads a CSV of student grades, calculates the mean and standard deviation per subject using NumPy, and prints a formatted summary table"',
    "",
    "Difficulty level: " +
      difficulty +
      "/5 — " +
      difficultyInstructions[difficulty],
  ].join("\n");

  const scaffoldExplicitCodeRules = [
    "Scaffold section hard rules (MUST follow):",
    `- Write actual ${language} code, not pseudocode.`,
    "- Include import statements with real library/module names.",
    "- Define concrete function signatures (with parameter names and type hints where applicable).",
    "- Leave TODO comments inside function bodies (where the student will fill in logic).",
    "- Every line inside the code block must be valid syntax.",
    "- Wrap the entire scaffold in a single fenced code block using " +
      `${language.toLowerCase()}` +
      " as the language tag.",
  ].join("\n");

  const weekSpecificInstruction = [
    `Week focus: Use week ${week} of ${course} as the main driver of the problem + scaffolding choices.`,
    "Do not default to generic CS-101 content.",
  ].join("\n");

  const promptTop = [
    'SYSTEM ROLE (tight): "You are a senior software engineer writing project briefs for students. Be specific, technical, and concise. Never be vague."',
    "",
    sectionFormatConstraint,
    "",
    studentProfileSection,
    "",
    syllabusSection,
    "",
    instructionNumberedList,
    "",
    scaffoldExplicitCodeRules,
    "",
    weekSpecificInstruction,
    "",
    pushbackSection,
  ]
    .filter(Boolean)
    .join("\n");

  // Repeat the constraint at the bottom to reduce section drift.
  const promptBottom = ["", sectionFormatConstraint].join("\n");

  return promptTop + promptBottom;
}
