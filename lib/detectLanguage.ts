export function detectLanguage(courseName: string): string | null {
  if (!courseName) return null;
  const lower = courseName.toLowerCase().trim();

  // ── Priority-ordered rules ──────────────────────────────────────────────────
  // Rules are checked top-to-bottom; first match wins.
  // Each rule uses substring matching — so partial typing works ("pytho" matches
  // "python"), multi-word phrases work, and abbreviations are handled.
  const rules: { phrases: string[]; language: string }[] = [
    // Specific language / framework names — highest priority
    {
      phrases: ["python", "django", "flask", "pandas", "fastapi", "numpy", "scipy", "pytorch", "tensorflow", "scikit"],
      language: "Python",
    },
    {
      phrases: ["typescript"],
      language: "TypeScript",
    },
    {
      phrases: ["javascript", "react", "node", "vue", "next.js", "nuxt", "mern", "express", "svelte", "angular"],
      language: "JavaScript",
    },
    {
      phrases: ["java ", "spring boot", "spring framework", "android development"],
      language: "Java",
    },
    {
      phrases: ["c++", "cpp", "systems programming", "embedded systems", "competitive programming"],
      language: "C++",
    },
    {
      phrases: ["golang", "go lang", "go programming"],
      language: "Go",
    },
    {
      phrases: ["rust lang", "rust programming"],
      language: "Rust",
    },
    {
      phrases: ["matlab", "simulink"],
      language: "MATLAB",
    },

    // Common CS course names that strongly imply Python
    {
      phrases: [
        "machine learning",
        "deep learning",
        "neural network",
        "natural language processing",
        "computer vision",
        "data science",
        "data analysis",
        "artificial intelligence",
        "reinforcement learning",
      ],
      language: "Python",
    },
    {
      phrases: ["data structures", "algorithms", "dsa", "leetcode", "competitive coding"],
      language: "Python",
    },
    {
      phrases: [
        "linear algebra",
        "numerical methods",
        "numerical analysis",
        "scientific computing",
        "computational",
      ],
      language: "Python",
    },

    // Excel / spreadsheet-heavy subjects
    {
      phrases: ["excel", "spreadsheet", "accounting", "financial modelling", "financial modeling", "business analytics"],
      language: "Excel/Spreadsheets",
    },

    // Pure theory / math subjects with no expected coding component
    {
      phrases: [
        "algebra",
        "calculus",
        "statistics",
        "probability",
        "physics",
        "mechanics",
        "thermodynamics",
        "quantum",
        "chemistry",
        "biology",
        "economics",
        "discrete math",
        "number theory",
        "topology",
        "real analysis",
        "abstract algebra",
        "finance",
      ],
      language: "None (Theory/Math)",
    },
  ];

  for (const rule of rules) {
    if (rule.phrases.some((phrase) => lower.includes(phrase))) {
      return rule.language;
    }
  }

  return null;
}
