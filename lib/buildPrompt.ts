/**
 * buildPrompt.ts
 *
 * Constructs the user-facing prompt that is sent to Gemini's messages API.
 * This is the most important file in the codebase — every word here shapes
 * the quality and structure of the brief Gemini returns.
 *
 * PROMPT SECTIONS (in order):
 *
 * 1. STUDENT PROFILE
 *    Grounds Gemini in the student's actual context. Without this, Gemini
 *    gives generic advice. With it, Gemini calibrates difficulty, picks
 *    relevant concepts, and chooses a language the student already knows.
 *
 * 2. PUSHBACK (optional)
 *    Injected only when the student dislikes a previous brief. Placed after
 *    the profile so Gemini understands WHO is asking before reading the
 *    complaint. This preserves the profile-first mental model.
 *
 * 3. INSTRUCTION + SECTION HEADERS
 *    The hard constraint that forces exactly four sections. Using ## headers
 *    makes the output machine-parseable by parseBrief.ts without Gemini
 *    needing to know that. The bracketed descriptions tell Gemini what
 *    belongs in each section without over-constraining the content.
 *
 *    - ## Problem       → concrete real-world scenario (2–3 sentences)
 *    - ## Starter Scaffold → runnable code skeletons, not pseudocode
 *    - ## Checkpoint Questions → 3 numbered questions that verify understanding
 *    - ## Stretch Goal  → one harder extension using a concept 1–2 weeks ahead
 */

import { FormInput } from '../types';

export function buildPrompt(input: FormInput, pushback?: string): string {
  const { course, week, projects, language, difficulty = 3 } = input;

  // ── 1. STUDENT PROFILE ──────────────────────────────────────────────────────
  // Format prior projects as a numbered list so Gemini can infer skill level
  // from the progression, not just the count.
  const formattedProjects = projects
    .map((p, i) => `  ${i + 1}. ${p}`)
    .join('\n');

  const profileSection = `Student profile:
- Course: ${course}
- Current week: ${week}
- Prior projects they have built:
${formattedProjects}
- Preferred programming language: ${language}`;

  // ── 2. DIFFICULTY CONTEXT ────────────────────────────────────────────────────
  // Placed immediately after the profile so the model reads WHO this is for
  // before learning HOW to teach them. Level descriptions are intentionally
  // phrased as teaching philosophy, not ability labels.
  const difficultyInstructions: Record<number, string> = {
    1: "Explain every step. No assumed knowledge. This is their first real project.",
    2: "Guide them clearly. Minimal assumed knowledge.",
    3: "Some independence required. Skip obvious steps.",
    4: "Minimal hints. Expect them to look things up.",
    5: "Production-quality expectations. No hand-holding.",
  };
  const difficultySection = `Difficulty level: ${difficulty}/5 — ${difficultyInstructions[difficulty]}`;

  // ── 3. PUSHBACK (optional) ──────────────────────────────────────────────────
  // Surfaced only when the student is iterating on a previous brief.
  // The verb "Adjust" is intentional — it tells Gemini to keep the spirit
  // of the brief while satisfying the specific complaint.
  const pushbackSection = pushback
    ? `\nThe student wants changes: "${pushback.trim()}". Adjust the brief accordingly.\n`
    : '';

  // ── 3. INSTRUCTION + SECTION HEADERS ────────────────────────────────────────
  // "EXACTLY these four sections" is load-bearing: without it Gemini will
  // sometimes merge sections, add extras, or use different header levels.
  // The week-specific instruction in the first line prevents Gemini from
  // defaulting to generic CS-101 content when week > 4.
  const instructionSection = `Generate a project brief with EXACTLY these four sections.
Use concepts from week ${week} of ${course} specifically.

## Problem
[2-3 sentences. A concrete, real-world problem. What they will build and why it matters. Be specific — name the dataset, the API, or the domain.]

## Starter Scaffold
[Real, runnable starter code in ${language}. Requirements:
- Start with the filename as a comment (e.g. # matrix_viz.py or // server.js)
- Include the actual import/require statements with real library names (not placeholders)
- Define concrete function signatures with parameter names and type hints where applicable
- Leave TODO comments inside function bodies so the student knows what to fill in
- Do NOT write pseudocode — every line must be valid ${language} syntax
- Wrap the entire code in a single \`\`\`${language.toLowerCase()} ... \`\`\` block]

## Checkpoint Questions
1. [Conceptual: tests if they understood the core week-${week} concept being applied]
2. [Functional: tests if their implementation produces the correct output]
3. [Reflective: pushes them to consider an edge case, failure mode, or optimisation]

## Stretch Goal
[One specific, harder extension that uses a concept 1-2 weeks ahead of week ${week}. Name the exact technique or library they would need to learn.]`;

  // ── FINAL ASSEMBLY ───────────────────────────────────────────────────────────
  // Blank lines between sections give Gemini visual breathing room, which
  // measurably improves section separation in the output.
  return [profileSection, difficultySection, pushbackSection, instructionSection]
    .filter(Boolean)
    .join('\n');
}
