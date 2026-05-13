# Nextstep

> Nextstep generates project briefs for students from course inputs and saves those briefs for later refinement and review.

---

## What it does

A student signs in, enters a course name, course week, difficulty level, prior projects, and optional syllabus text or file content. The app turns that input into a constrained prompt, sends it to Groq, parses the model response into four sections, and shows the result in the dashboard. The student can then refine the brief with pushback, save it, change its status, export it as a PDF, or ask follow-up questions in the built-in chat panel.

---

## Live Demo

Live demo URL is not documented in this repository.

Try this input on the live site:
- Course: Linear Algebra
- Week: 6
- Prior projects: Built a calculator and a number guessing game
- Difficulty: 3/5

Expected output: a project brief with a problem statement, runnable Python scaffold using numpy, 3 checkpoint questions with exact terminal output values, and a stretch goal naming a specific `np.linalg.*` function.

---

## Features

- **Course week input** — lets the student choose a week from 1 to 52.
- **Prior projects input** — accepts up to four prior project entries and can also append a practice-count summary as prior experience.
- **Calibrated brief generation** — changes allowed numpy topics, forbidden topics, domain examples, scaffold strictness, and difficulty guidance based on week, prior projects, and difficulty.
- **Problem statement** — asks the model for a specific project problem tied to the selected course and week.
- **Starter scaffold** — requires a runnable Python scaffold with `import numpy as np`, real function bodies, hardcoded sample data, and a `__main__` block.
- **3 checkpoint questions** — requires exactly three checkpoints in a fixed “Call function(args) - your terminal should print value” format for tech briefs.
- **Stretch goal** — requires a single-sentence extension that names a specific `np.linalg.*` function.
- **Brief refinement** ⭐ bonus — when a student submits pushback, the app sends a four-message Groq conversation: system prompt, original user prompt, previous brief as the assistant message, and a final user message asking for a rewritten brief that fixes the complaint while keeping the same four-section format.
- **Additional feature: authentication** — supports credentials login and optional Google sign-in through NextAuth, with a Firebase-backed credentials flow also present.
- **Additional feature: saved briefs** — stores generated briefs in MongoDB per signed-in user.
- **Additional feature: brief status tracking** — supports `saved`, `in_progress`, `completed`, and `abandoned` states for saved briefs.
- **Additional feature: brief history** — fetches saved briefs by domain and lists them in dashboard history views.
- **Additional feature: in-place refinement history** — appends each refinement to the brief record in MongoDB.
- **Additional feature: delete saved brief** — removes a stored brief by id for the current user.
- **Additional feature: syllabus file parsing** — accepts PDF, TXT, and Markdown uploads and extracts text before generation.
- **Additional feature: PDF export** — exports a brief as a styled A4 PDF.
- **Additional feature: brief chat** — provides a chat endpoint that answers follow-up questions using the current brief and form input as context.
- **Additional feature: multi-domain dashboards** — includes separate generation flows for tech, commerce, and engineering.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.35 |
| Language | TypeScript |
| LLM | Groq API — `llama-3.3-70b-versatile` by default, or `GROQ_MODEL` if set |
| Styling | Tailwind CSS, global CSS, and Framer Motion |
| Database | MongoDB with Mongoose |
| Authentication | NextAuth v5 beta, Firebase client SDK, bcryptjs |
| File parsing | `pdf-parse` |
| PDF export | `jspdf` |
| Deployment | Not documented in this repository |

---

## How it works

The tech brief flow starts with the student’s course name, week number, difficulty, and prior projects from the form. `lib/buildPrompt.ts` converts that input into a single prompt that includes the student profile, allowed numpy topics, forbidden topics, scaffold guidance, and checkpoint rules. The week number gates the prompt into three topic bands: weeks 1 to 3 allow only basic 1D array operations, weeks 4 to 6 allow 2D arrays and selected matrix operations, and later weeks allow `np.linalg.solve()`, `np.linalg.eig()`, `np.linalg.svd()`, projections, and least squares. `lib/groq.ts` sends that prompt to Groq as a non-streaming chat completion with a system message and user message for first-pass generation, or a four-message conversation for refinement. `lib/parseBrief.ts` then extracts the model output into four sections: problem, scaffold, checkpoints, and stretch goal, while also accepting a few legacy header aliases. When pushback is submitted, the app sends the original prompt, the previous brief as the assistant turn, and a final user instruction asking the model to rewrite the brief to address the complaint without changing the required four-section structure.

---

## Getting started

### Prerequisites
- Node.js 18+
- A Groq API key (free at console.groq.com — no credit card required)

### Installation

```bash
git clone https://github.com/Amitdwivedi22/candela.git
cd candela
npm install
```

### Environment variables

Create a `.env.local` file:

```env
MONGODB_URI=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
AUTH_SECRET=
NEXTAUTH_SECRET=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
