# Nextstep

> Turn what you learned today into one concrete project brief you can start tonight.

Nextstep is a full-stack AI brief-generation studio for students. A student picks their learning domain, fills in what they studied this week, and the app builds a focused, constrained project brief — with a problem statement, starter scaffold, checkpoint questions, and a stretch goal. Briefs can be refined, saved, tracked, exported, and discussed in a built-in AI chat.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Feature List](#feature-list)
3. [Domain Dashboards](#domain-dashboards)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Data Models](#data-models)
7. [API Reference](#api-reference)
8. [Lib Utilities](#lib-utilities)
9. [Authentication](#authentication)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [Firebase Setup](#firebase-setup)
13. [Deployment Notes](#deployment-notes)
14. [Known Gotchas](#known-gotchas)

---

## What It Does

A student signs in, selects a domain (Tech, Commerce, or Engineering), and enters:
- The course or subject they are studying
- The current week number (1–52)
- Prior projects they have completed
- Difficulty level (1 = Beginner → 5 = Expert)
- Optional syllabus text or an uploaded file (PDF, TXT, Markdown)

The app builds a prompt tailored to those inputs, sends it to Groq, and parses the LLM response into four structured sections. The student can then push back to request changes, save the brief, track its status, export it as a PDF, or ask follow-up questions in the built-in chat panel.

---

## Feature List

| Feature | Description |
|---|---|
| **Multi-domain selection** | Three independent dashboards: Tech & Software, Commerce & Finance, Engineering |
| **Domain persistence** | Chosen domain saved per user in MongoDB; re-selected on every login via `PATCH /api/user/domain` |
| **Calibrated brief generation** | Prompt adapts to week, prior projects, difficulty, domain, and optional syllabus |
| **Brief validation + auto-retry** | Tech briefs are validated on the server (scaffold structure, checkpoint format, stretch goal); invalid responses trigger one automatic retry with targeted fix instructions |
| **Brief refinement (pushback)** | Student submits feedback; app sends a four-message Groq conversation (system → user → assistant → user) and returns a rewritten brief |
| **Saved briefs** | Generated briefs are stored in MongoDB per user, per domain |
| **Brief status tracking** | Four states: `saved`, `in_progress`, `completed`, `abandoned` |
| **Refinement history** | Each pushback round is appended to the brief's `refinements` array in MongoDB |
| **Brief delete** | `DELETE /api/briefs/:id` removes a saved brief for the current user |
| **Syllabus file upload** | Accepts PDF, TXT, and Markdown. Text extracted server-side before generation |
| **PDF export** | Styled A4 PDF via jsPDF with header bar, section badges, code block, and footer |
| **Brief chat** | Context-aware AI chat panel scoped to the current brief and student profile |
| **Autocomplete suggestions** | `GET /api/search` queries a `Suggestion` collection for course/project name typeahead |
| **Credentials auth** | Email + bcrypt password login via NextAuth Credentials provider |
| **Google auth (Firebase)** | Firebase `signInWithPopup` → ID token → NextAuth custom `firebase` provider |
| **Google auth (OAuth)** | Standard NextAuth Google OAuth provider (optional, enabled when env vars present) |
| **Session via JWT** | NextAuth JWT strategy; user ID from MongoDB embedded into the token |
| **Rate limit handling** | 429 from Groq triggers a 10-second client-side wait and one automatic retry |
| **Navigation progress bar** | Thin animated bar on route transitions via `NavigationProgress` component |

---

## Domain Dashboards

### Tech & Software (`/dashboard`)

- **Form inputs:** course name, week (1–52), prior projects (up to 4), difficulty (1–5), optional syllabus
- **Prompt strategy:** `lib/buildPrompt.ts` gates allowed NumPy topics by week band:
  - Weeks 1–3: 1D array operations only (`np.array`, `np.dot`, scalar math)
  - Weeks 4–6: 2D arrays, matrix multiply, `np.linalg.norm`
  - Weeks 7+: Full `np.linalg` — `solve`, `eig`, `svd`, projections, least squares
- **LLM output format (4 sections):**
  - `## The Problem` — specific scenario naming real data
  - `## Starter Scaffold` — runnable Python with `import numpy as np`, ≥2 `def` functions, `__main__` block, 25–40 lines
  - `## Checkpoint Questions` — exactly 3, format: `Q[n]: Call function(args) - your terminal should print value`
  - `## Stretch Goal` — one sentence naming a specific `np.linalg.*` function
- **Server-side validation:** `validateTechBrief()` checks all 5 rules. Fails trigger one retry with targeted repair instructions
- **System prompt:** Strict role-play as a project brief generator; 7 absolute rules enforced

### Commerce & Finance (`/dashboard/commerce`)

- **Form inputs:** subject, week, assignment type (case study, pitch deck, financial model, etc.), difficulty, prior work, optional syllabus
- **Prompt strategy:** `lib/prompts/commercePrompt.ts` — role-plays a senior business consultant
- **LLM output format (4 sections):**
  - `## Case Study Problem` — real company/sector, specific numbers
  - `## Data Scaffold` — markdown table with real column headers and 3–5 sample rows
  - `## Analysis Checkpoints` — 3 numbered questions: quantitative, strategic, critical evaluation
  - `## Advanced Challenge` — harder deliverable (pitch deck, financial model, policy memo)
- **Rules enforced in prompt:** no fictional companies, real market data, realistic numbers, all difficulty levels from guided (1) to consulting-grade (5)

### Engineering (`/dashboard/engineering`)

- **Form inputs:** engineering branch (Civil / Mechanical / Electrical), subject, week, difficulty, prior work, optional syllabus
- **Prompt strategy:** `lib/prompts/engineeringPrompt.ts` — role-plays a licensed professional engineer
- **LLM output format (4 sections):**
  - `## Design Problem` — constrained scenario with specific dimensions, loads, materials
  - `## Calculation Scaffold` — runnable code with TODOs or step-by-step formula template
  - `## Checkpoint Questions` — 3 questions: load analysis, material selection, failure mode
  - `## Stretch Goal` — FEA, dynamic analysis, or code optimisation naming exact method/standard
- **Rules enforced in prompt:** consistent units, real engineering standards (IS 456, ASTM A36, IEC 60364), no open-ended prompts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.35 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| LLM | Groq API — `llama-3.3-70b-versatile` (default) or `GROQ_MODEL` env var |
| Database | MongoDB Atlas via Mongoose 9 |
| Authentication | NextAuth v5 beta (JWT strategy), Firebase client SDK, bcryptjs |
| File parsing | `pdf-parse` (server-side) |
| PDF export | `jsPDF` (client-side) |
| UI primitives | Radix UI (Select, Slider, Toast), shadcn/ui |
| Icons | Lucide React |
| Animation | Framer Motion |
| Deployment | Vercel (recommended) |

---

## Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Sign-in page (credentials + Google/Firebase)
│   │   └── signup/page.tsx         # Sign-up page
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth route handler
│   │   ├── briefs/
│   │   │   ├── route.ts            # GET (list by domain), POST (create)
│   │   │   └── [id]/route.ts       # PATCH (status/brief/refinement), DELETE
│   │   ├── chat/route.ts           # AI chat scoped to current brief
│   │   ├── generate-brief/route.ts # Main brief generation (all 3 domains)
│   │   ├── parse-pdf/route.ts      # Syllabus file extraction (PDF/TXT/MD)
│   │   ├── search/route.ts         # Typeahead suggestions from MongoDB
│   │   └── user/domain/route.ts    # PATCH (set domain), GET (get domain)
│   ├── dashboard/
│   │   ├── page.tsx                # Tech dashboard (force-dynamic)
│   │   ├── DashboardClient.tsx     # Tech dashboard client
│   │   ├── commerce/               # Commerce dashboard
│   │   ├── engineering/            # Engineering dashboard
│   │   ├── medical/                # Medical dashboard (placeholder)
│   │   └── select-domain/page.tsx  # Domain picker
│   ├── globals.css                 # Global styles + CSS variables
│   ├── layout.tsx                  # Root layout with AuthProvider
│   └── page.tsx                    # Landing page
├── components/
│   ├── BriefDisplay.tsx            # Renders the 4-section brief output
│   ├── BriefForm.tsx               # Tech dashboard input form
│   ├── ChatPanel.tsx               # In-brief AI chat UI
│   ├── PushbackInput.tsx           # Refinement feedback input
│   ├── SearchInput.tsx             # Autocomplete input with debounce
│   ├── AuthProvider.tsx            # NextAuth SessionProvider wrapper
│   ├── NavigationProgress.tsx      # Top-of-page loading bar
│   ├── Spinner.tsx                 # Loading spinners
│   ├── Toaster.tsx                 # Toast notification wrapper
│   ├── UserNav.tsx                 # User avatar dropdown (prop-based, no extra session call)
│   ├── commerce/                   # Commerce domain form components
│   └── engineering/                # Engineering domain form components
├── lib/
│   ├── auth.ts                     # NextAuth config (Credentials, Firebase, Google providers)
│   ├── buildPrompt.ts              # Tech domain prompt builder (week-gated topics)
│   ├── courseSuggestions.ts        # Static course name suggestions
│   ├── exportPDF.ts                # jsPDF brief export (A4, dark theme, 4 sections)
│   ├── firebase.ts                 # Firebase app initialisation
│   ├── firebaseAuthClient.ts       # Firebase auth helpers (localhost redirect, error messages)
│   ├── groq.ts                     # Groq SDK client (generateBrief, refineBrief, groqChat)
│   ├── mongodb.ts                  # Mongoose connection (singleton pattern)
│   ├── parseBrief.ts               # LLM response → BriefSection (with legacy header aliases)
│   ├── useAuthGuard.ts             # Firebase auth state hook
│   └── prompts/
│       ├── commercePrompt.ts       # Commerce domain prompt builder
│       └── engineeringPrompt.ts    # Engineering domain prompt builder
├── models/
│   ├── Brief.ts                    # Mongoose Brief schema (with refinements subdocument)
│   ├── Suggestion.ts               # Mongoose Suggestion schema (typeahead)
│   └── User.ts                     # Mongoose User schema (with domain field)
├── types/
│   └── index.ts                    # Shared TypeScript interfaces (FormInput, BriefSection)
└── docs/
    └── product-redesign.md         # Internal product notes
```

---

## Data Models

### User

```ts
{
  name:      string;           // required
  email:     string;           // required, unique, lowercase
  password?: string;           // bcrypt hash; absent for OAuth users
  provider:  string;           // "credentials" | "google"
  image?:    string;
  domain?:   "tech" | "commerce" | "engineering";  // defaults to "tech"
  createdAt: Date;
}
```

### Brief

```ts
{
  userId:     ObjectId;        // ref: User
  domain:     "tech" | "commerce" | "engineering";
  formInput: {
    course:    string;
    week:      string;
    projects:  string[];
    language?: string;
    syllabus?: string;
    domain?:   string;
  };
  brief: {
    problem:     string;
    scaffold:    string;
    checkpoints: string[];
    stretch:     string;
  };
  refinements: Array<{         // appended on each pushback
    pushbackText: string;
    result:       BriefSection;
    createdAt:    Date;
  }>;
  status:    "saved" | "in_progress" | "completed" | "abandoned";
  createdAt: Date;
}
```

### Suggestion

Used for typeahead autocomplete in forms. Contains `type` (e.g. `"course"`) and `text` fields.

---

## API Reference

### `POST /api/generate-brief`

Generates a project brief. Dispatches to domain-specific handlers based on `domain` field.

**Request body (Tech):**
```json
{
  "domain": "tech",
  "course": "Linear Algebra",
  "week": 6,
  "difficulty": 3,
  "projects": ["Built a calculator", "Built a number guessing game"],
  "syllabus": "optional extracted syllabus text",
  "pushback": "optional refinement feedback",
  "previousBrief": "optional previous brief markdown for refinement"
}
```

**Request body (Commerce):**
```json
{
  "domain": "commerce",
  "subject": "Financial Management",
  "week": 4,
  "assignmentType": "Case Study",
  "difficulty": 3,
  "priorWork": ["DCF analysis", "Porter's Five Forces"],
  "syllabus": "optional"
}
```

**Request body (Engineering):**
```json
{
  "domain": "engineering",
  "branch": "Civil",
  "subject": "Structural Analysis",
  "week": 5,
  "difficulty": 3,
  "priorWork": ["Beam bending calculations"],
  "syllabus": "optional"
}
```

**Response:**
```json
{
  "brief": {
    "problem": "...",
    "scaffold": "...",
    "checkpoints": ["...", "...", "..."],
    "stretch": "..."
  }
}
```

**Tech-specific behaviour:**
- Validates all 5 brief rules server-side after generation
- If validation fails, retries once with a targeted repair prompt
- Handles Groq 429 with an 8-second sleep and one retry
- Times out after 30 seconds (`AbortSignal.timeout`)
- `maxDuration = 90` set for Vercel serverless runtime

---

### `GET /api/briefs?domain=tech`

Returns all saved briefs for the authenticated user in the specified domain, sorted newest first.

### `POST /api/briefs`

Creates a new brief record. Requires `formInput`, `brief`, and optionally `domain`.

### `PATCH /api/briefs/:id`

Updates a brief. Accepts any combination of:
- `status` — updates the status field
- `brief` — replaces the brief content (used after refinement)
- `refinement` — pushes a new refinement entry to the `refinements` array

### `DELETE /api/briefs/:id`

Deletes a brief. Scoped to the authenticated user (cannot delete another user's brief).

---

### `POST /api/chat`

Context-aware AI chat for a specific brief.

**Request body:**
```json
{
  "messages": [{ "role": "user", "content": "How do I implement the norm function?" }],
  "briefContext": { "problem": "...", "scaffold": "...", "checkpoints": [...], "stretch": "..." },
  "formInput": { "course": "Linear Algebra", "week": 6, "difficulty": 3, "projects": [...] }
}
```

**Response:** `text/plain` stream with the assistant reply. Validated to reject messages >1000 characters. Times out at 30 seconds.

---

### `POST /api/parse-pdf`

Accepts `multipart/form-data` with a `file` field. Supports `.pdf`, `.txt`, `.md`.

**Response:**
```json
{ "text": "extracted plain text content" }
```

---

### `GET /api/search?q=Linear&type=course`

Returns up to 5 matching suggestions from the `Suggestion` collection. Response is CDN-cached for 1 hour (`s-maxage=3600`). Input sanitised to 50 characters; regex-escaped for safety.

---

### `PATCH /api/user/domain`

Updates the authenticated user's domain selection in MongoDB.

**Request body:** `{ "domain": "tech" | "commerce" | "engineering" }`

### `GET /api/user/domain`

Returns the authenticated user's current domain. Defaults to `"tech"` if not set.

---

## Lib Utilities

### `lib/groq.ts`

Singleton Groq SDK client. Exposes three functions:

| Function | Purpose |
|---|---|
| `generateBrief(systemPrompt, userPrompt, opts)` | Two-message completion (system + user). `temperature: 0.2`, `max_tokens: 1200`, `top_p: 0.85` |
| `refineBrief(system, user, previousBrief, pushback, opts)` | Four-message completion for pushback refinement. `temperature: 0.3` |
| `groqChat(messages, signal)` | General chat completion. `temperature: 0.35`, `max_tokens: 900` |

Default model: `llama-3.3-70b-versatile` (overridable with `GROQ_MODEL`). Client timeout: 20 seconds, 0 retries (retries handled by callers).

---

### `lib/buildPrompt.ts`

Builds the user prompt for Tech briefs. Key logic:

- **Week band 1–3:** Allowed: `np.array()`, `np.dot()`, 1D ops. Forbidden: matrices, 2D arrays, linalg.
- **Week band 4–6:** Allowed: 2D arrays, `@` operator, `np.reshape()`, `np.linalg.norm()`. Forbidden: `eig`, `svd`, `solve`.
- **Week band 7+:** All `np.linalg` allowed including `solve`, `eig`, `svd`, projections, least squares.
- Scaffold guidance scales with number of prior projects (0 = fully hardcoded, ≤2 = light stubs, 3+ = structure-only stubs).
- Difficulty note changes model behaviour from "as simple as possible" to "push upper edge".

---

### `lib/parseBrief.ts`

Parses LLM markdown into `BriefSection`. Handles both current and legacy header names:

| Section | Primary header | Legacy aliases |
|---|---|---|
| problem | `The Problem` | `Problem`, `Design Problem`, `Case Study Problem` |
| scaffold | `Starter Scaffold` | `Data Scaffold`, `Calculation Scaffold` |
| checkpoints | `Checkpoint Questions` | `Three Checkpoint Questions`, `Analysis Checkpoints` |
| stretch | `Stretch Goal` | `Advanced Challenge` |

Checkpoint items are extracted from numbered lists (`1.`, `2.`, `Q1:`, `Q2:` formats). Code fences are stripped from the scaffold section. Missing sections return empty strings / empty arrays — never throws.

---

### `lib/exportPDF.ts`

Exports a brief as a styled A4 PDF using jsPDF. Layout:

- **Header bar:** violet background (`#534AB7`), `Nextstep` wordmark, course and week sub-line
- **Section 01 – The Problem:** violet badge
- **Section 02 – Starter Scaffold:** teal badge, `Courier` font, dark code block with pagination
- **Section 03 – Checkpoint Questions:** amber badge, numbered circles
- **Section 04 – Stretch Goal:** rose badge, "CHALLENGE" label
- **Footer:** generation date and course name on every page

File is saved as `candela-brief-{course-slug}-week{n}.pdf`.

---

### `lib/prompts/commercePrompt.ts` and `lib/prompts/engineeringPrompt.ts`

Domain-specific prompt builders. Both follow the same pattern:
1. Role instruction at the top
2. Output format constraint (4 exact sections with headers and content rules) — repeated at bottom as a reminder
3. Student profile block
4. Optional syllabus block (with alignment instruction)
5. Domain-specific rules (e.g. "use real companies", "use consistent units")
6. Difficulty instruction (1–5 scale with explicit wording)
7. Optional pushback instruction

---

## Authentication

The app supports three authentication paths:

### 1. Email + Password (Credentials)
- Signup: hashes password with `bcryptjs`, stores user in MongoDB
- Login: `User.findOne({ email })` → `bcrypt.compare` → NextAuth session
- Redirect after login: always goes to `/dashboard/select-domain` first

### 2. Google via Firebase
- Client uses `signInWithPopup(auth, googleProvider)`
- ID token sent to a custom NextAuth `firebase` Credentials provider
- Provider calls Firebase Identity Toolkit to verify the token and extract the user's email
- User is created in MongoDB if not already present
- Redirect flow same as credentials login

### 3. Google via NextAuth OAuth (optional)
- Enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Standard OAuth redirect flow

### Session
- Strategy: JWT
- User's MongoDB `_id` is embedded into the JWT as `token.id` and exposed on the session as `session.user.id`
- All API routes call `auth()` to validate the session

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (Atlas free tier is sufficient)
- A Groq API key — free at [console.groq.com](https://console.groq.com) (no credit card required)

### Installation

```bash
git clone https://github.com/Amitdwivedi22/candela.git
cd candela
npm install
```

### Run locally

```bash
npm run dev
```

The app runs on `http://localhost:3000`. Use exactly this URL for Firebase Google auth — not `http://127.0.0.1:3000`.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# Groq (required)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile   # optional, this is the default

# NextAuth (required — set both for compatibility)
AUTH_SECRET=your-random-secret-string
NEXTAUTH_SECRET=your-random-secret-string

# Firebase — required for Google login via Firebase popup
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Google OAuth via NextAuth — optional; both must be set to enable
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** as a sign-in provider under **Authentication → Sign-in method**
3. Go to **Authentication → Settings → Authorized domains** and ensure these are listed:
   - `localhost` — for local development
   - Your production domain (e.g. `your-app.vercel.app`) — before deploying
4. Copy all `NEXT_PUBLIC_FIREBASE_*` values from **Project Settings → Your apps → SDK setup**
5. Always use `http://localhost:3000` for local dev — `127.0.0.1:3000` triggers `auth/unauthorized-domain`

---

## Deployment Notes

### Vercel

The project deploys cleanly on Vercel. Important settings:

- **All environment variables** from `.env.local` must be added in Vercel's dashboard under **Settings → Environment Variables**
- The `/dashboard` route has `export const dynamic = "force-dynamic"` to prevent Vercel from caching a stale page and redirecting users back to the domain selector after they pick Tech & Software
- `maxDuration = 90` is set on the generate-brief route to allow up to 90 seconds for LLM generation on Vercel serverless

### MongoDB

- Use a connection string with `?retryWrites=true&w=majority` for Atlas
- The app uses a singleton Mongoose connection (`lib/mongodb.ts`) that reuses the connection across serverless invocations via a global cached promise

---

## Known Gotchas

| Issue | Cause | Fix |
|---|---|---|
| Tech/Software dashboard not loading after domain selection | Next.js router cache serving a stale `/dashboard` page on Vercel before DB update is reflected | Fixed: domain selection now uses `window.location.href` (full page nav) + `/dashboard` has `force-dynamic` |
| `auth/unauthorized-domain` on Google sign-in | Using `127.0.0.1` instead of `localhost` | Always open `http://localhost:3000` |
| Groq 429 rate limit | Free tier quota | App retries once automatically after 8–10 seconds |
| Brief generation times out | Slow Groq response on a long prompt | `maxDuration = 90` on Vercel; client aborts and shows error after 30 seconds |
| Checkpoint format invalid | LLM not following the `Q[n]: Call fn(args) - your terminal should print val` format | Server validates and retries once with targeted fix instructions |
