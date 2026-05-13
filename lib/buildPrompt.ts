export interface PromptInput {
  week: number;
  projects: string[];
  difficulty: number;
  course?: string;
  pushback?: string;
  previousBrief?: string;
}

export function buildPrompt({
  week,
  projects,
  difficulty,
  course,
  pushback,
  previousBrief,
}: PromptInput): string {
  const topicsByWeek =
    week <= 3
      ? {
          allowed:
            "np.array(), np.dot(), vector addition, scalar multiplication, 1D arrays only",
          domain:
            "grade average calculator, playlist volume normaliser, sports score ranker",
          forbidden: "matrices, 2D arrays, matrix multiply, linalg, reshape",
        }
      : week <= 6
        ? {
            allowed:
              "2D np.array(), matrix multiply with @, np.reshape(), np.linalg.norm(), np.dot() on matrices",
            domain:
              "movie similarity finder, NBA shot chart analyser, image brightness matrix, student grade matrix",
            forbidden:
              "eigenvalues, SVD, np.linalg.eig, np.linalg.solve",
          }
        : {
            allowed:
              "np.linalg.solve(), np.linalg.eig(), np.linalg.svd(), projections, least squares",
            domain:
              "PCA on a small dataset, least-squares line fitter, simple recommender using cosine similarity",
            forbidden: "nothing - all topics allowed",
          };

  const scaffoldGuidance =
    projects.length === 0
      ? "Student has NO prior projects. Every function must have a complete working body with hardcoded values. No empty stubs."
      : projects.length <= 2
        ? `Student built: ${projects.join(" and ")}. Comfortable with functions and loops. Scaffold can have light stubs but must be runnable.`
        : `Student built: ${projects.join(", ")}. Experienced. Scaffold shows structure - stubs are acceptable if the main block runs.`;

  const difficultyNote =
    difficulty <= 2
      ? "Make the problem and scaffold as simple as possible within the allowed topics."
      : difficulty >= 4
        ? "Push the complexity to the upper edge of allowed topics. The scaffold should challenge them."
        : "Balance accessibility and challenge - approachable but not trivial.";

  const basePrompt = `Generate a project brief for this student.

STUDENT PROFILE:
- Course: ${course ?? "Linear Algebra"}
- Week: ${week}
- Allowed numpy topics: ${topicsByWeek.allowed}
- Forbidden topics this week: ${topicsByWeek.forbidden}
- Prior projects: ${projects.length === 0 ? "none" : projects.join(", ")}
- ${scaffoldGuidance}
- Difficulty: ${difficulty}/5 - ${difficultyNote}

DOMAIN CONSTRAINT:
Pick exactly ONE domain from this list: ${topicsByWeek.domain}
Do not pick a domain outside this list.
Name specific real data in The Problem
(e.g. "NBA shot coordinates" not just "sports data").

SCAFFOLD CONSTRAINT:
Only use these numpy functions: ${topicsByWeek.allowed}
Do not use: ${topicsByWeek.forbidden}
The code must run with python script.py and print output with zero changes.

CHECKPOINT CONSTRAINT:
Each checkpoint must reference a function defined in your scaffold.
Each must end with the exact number the student will see in their terminal.
Expected checkpoint outputs must be single-line scalar values, not arrays, matrices, or multi-line prints.
Compute the expected output yourself before writing the checkpoint.`;

  if (pushback && previousBrief) {
    return basePrompt;
  }

  return basePrompt;
}
