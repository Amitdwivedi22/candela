/**
 * parseBrief.ts
 *
 * Parses Gemini's raw markdown response into a typed BriefSection object.
 *
 * Gemini is instructed (via buildPrompt.ts) to emit exactly four ## headers:
 *   ## Problem
 *   ## Starter Scaffold
 *   ## Checkpoint Questions
 *   ## Stretch Goal
 *
 * This parser extracts the text between each pair of adjacent headers.
 * It is intentionally defensive:
 *   - Missing sections → empty string / empty array (never throws)
 *   - Extra whitespace → trimmed
 *   - Code blocks inside Scaffold → preserved verbatim (no inner trimming)
 *   - Numbered list items in Checkpoints → extracted as string[]
 */

import { BriefSection } from '../types';

// ── HELPERS ────────────────────────────────────────────────────────────────────

/**
 * Extracts the raw text between a given ## header and the next ## header (or
 * end-of-string). Returns an empty string when the header is not present.
 *
 * We use a case-insensitive, multiline regex so minor Gemini formatting
 * quirks (e.g. trailing spaces on the header line) don't break parsing.
 */
function extractSection(raw: string, header: string): string {
  // Match the header line, then capture everything up to the next ## or EOF.
  // [\s\S]*? is non-greedy so it stops at the first following ##.
  const pattern = new RegExp(
    `##\\s*${header}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`,
    'i'
  );
  const match = raw.match(pattern);
  if (!match) return '';

  // Trim leading/trailing blank lines but preserve internal whitespace
  // (important for code blocks that rely on indentation).
  return match[1].trim();
}

/**
 * Parses a numbered list out of a section string.
 * Matches lines like "1. text", "2. text", etc.
 * Returns each item as a trimmed string, stripping the leading number+dot.
 *
 * Returns an empty array when no numbered items are found.
 */
function extractNumberedList(sectionText: string): string[] {
  if (!sectionText) return [];

  const lines = sectionText.split('\n');
  const items: string[] = [];

  for (const line of lines) {
    // Match "1. ", "2. ", "10. " etc. at the start of a line
    const match = line.match(/^\s*\d+\.\s+(.+)/);
    if (match) {
      items.push(match[1].trim());
    }
  }

  return items;
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────────

/**
 * Parses Gemini's raw markdown text into a structured BriefSection.
 *
 * @param rawText - The complete markdown string returned by Gemini.
 * @returns       - A BriefSection with problem, scaffold, checkpoints, stretch.
 *
 * Edge cases handled:
 *  - Section not found          → empty string / empty array for that field
 *  - Extra whitespace           → trimmed at section boundaries
 *  - Code blocks inside scaffold → preserved as-is (no inner transformation)
 *  - Malformed numbered list    → checkpoints returns []
 */
/**
 * Strips leading/trailing triple-backtick code fences from a string.
 * Handles optional language tags (e.g. ```python, ```ts) and preserves
 * internal indentation.
 */
function stripCodeFences(text: string): string {
  // Remove opening fence: ```[optional lang]\n
  const withoutOpen = text.replace(/^```[\w]*\s*\n?/, '');
  // Remove closing fence: \n``` or just ```
  const withoutClose = withoutOpen.replace(/\n?```\s*$/, '');
  return withoutClose.trim();
}

export function parseBrief(rawText: string): BriefSection {
  const problem = extractSection(rawText, 'Problem');
  const rawScaffold = extractSection(rawText, 'Starter Scaffold');
  const checkpointRaw = extractSection(rawText, 'Checkpoint Questions');
  const stretch = extractSection(rawText, 'Stretch Goal');

  // Strip outer code fence if the entire scaffold is wrapped in one.
  // Gemini commonly wraps the whole scaffold in ```python ... ```.
  const scaffold = rawScaffold.startsWith('```') ? stripCodeFences(rawScaffold) : rawScaffold;

  return {
    problem,
    scaffold,
    checkpoints: extractNumberedList(checkpointRaw),
    stretch,
  };
}

// ── EXAMPLE / TEST (commented out) ────────────────────────────────────────────
/*
const exampleRaw = `
## Problem
You will build a simple in-memory key-value cache in Python. Caching is used
in nearly every production system to avoid repeating expensive computations.

## Starter Scaffold
\`\`\`python
# cache.py

class LRUCache:
    def __init__(self, capacity: int) -> None:
        pass  # TODO

    def get(self, key: str) -> int | None:
        pass  # TODO

    def put(self, key: str, value: int) -> None:
        pass  # TODO
\`\`\`

## Checkpoint Questions
1. What data structure did you use to track insertion order, and why?
2. What happens when you call get() on a key that doesn't exist — what does your code return?
3. How would your implementation behave if two threads called put() simultaneously?

## Stretch Goal
Extend the cache with a time-to-live (TTL) parameter so entries automatically
expire after N seconds. You'll need to explore Python's \`time\` module and
think about how expiry interacts with the LRU eviction policy.
`;

const expected: BriefSection = {
  problem:
    "You will build a simple in-memory key-value cache in Python. Caching is used\nin nearly every production system to avoid repeating expensive computations.",
  scaffold:
    "```python\n# cache.py\n\nclass LRUCache:\n    def __init__(self, capacity: int) -> None:\n        pass  # TODO\n\n    def get(self, key: str) -> int | None:\n        pass  # TODO\n\n    def put(self, key: str, value: int) -> None:\n        pass  # TODO\n```",
  checkpoints: [
    "What data structure did you use to track insertion order, and why?",
    "What happens when you call get() on a key that doesn't exist — what does your code return?",
    "How would your implementation behave if two threads called put() simultaneously?",
  ],
  stretch:
    "Extend the cache with a time-to-live (TTL) parameter so entries automatically\nexpire after N seconds. You'll need to explore Python's `time` module and\nthink about how expiry interacts with the LRU eviction policy.",
};

console.log(JSON.stringify(parseBrief(exampleRaw), null, 2));
// Should match `expected` exactly.
*/
