# Product Redesign: Tonight's Project

## Product Overview

This product should not be "AI that generates impressive briefs."

It should be:

> a practical study tool that helps a student turn one freshly learned topic into one realistic project they can actually start tonight.

The old concept was too broad and too performative. It optimized for sounding valuable instead of helping a student make the next decision.

This version is narrower and better:

- one user
- one moment
- one outcome

### Exact User

- Age: 16-19
- Situation: just finished class, watched a tutorial, or completed a chapter
- Problem: "I understand the concept a bit, but I don't know what to build with it."
- Constraint: low time, uneven confidence, limited setup patience

### Core Promise

If a student types what they learned and how much time they have, the app gives them a project they can begin tonight without guessing scope.

## User Flow

### 1. Start From A Topic

The student opens the dashboard and sees one clear prompt:

`What did you just learn?`

Examples:

- `Linear Algebra - vectors and dot product`
- `Python loops and dictionaries`
- `Week 6: SQL joins`
- `Newton's laws and friction`

They also choose:

- skill level: `new to this`, `some practice`, `comfortable`
- time tonight: `45 min`, `90 min`, `2 hours`, `3 hours+`
- output style: `code project`, `simulation`, `data project`, `visual demo`

Optional fields:

- class notes or syllabus text
- "avoid this" note like `no frontend` or `I don't want to install heavy tools`

### 2. App Chooses One Best-Fit Build

The system should not dump five vague ideas.

It should return one main project idea with a short reason:

- why this project matches the topic
- why it fits the student's current level
- why it fits tonight's time limit

This removes decision fatigue.

### 3. Student Reads The Plan

The output should answer the questions a student actually has:

- What am I building?
- Why is this a good project for what I learned?
- What concepts will I practice?
- What tools do I need?
- What are the steps?
- What can I finish tonight?

### 4. Student Starts Building

The brief includes a small checklist they can follow in order:

1. setup
2. first working version
3. test/example input
4. polish if time remains

### 5. Student Saves Progress

They can mark the brief:

- `not started`
- `building`
- `finished`

This makes the app feel like a work tool, not a generator.

## Feature List

## Core Features

### 1. Topic-to-Project Input

Inputs:

- topic learned
- skill level
- time available
- preferred project type
- optional notes
- optional constraints

Why it matters:

The current repo asks for too much domain-specific structure. A student usually knows the topic, not the perfect prompt format.

### 2. Single Best Project Idea

Output:

- one recommended project title
- one-sentence summary
- why this is the right fit

Why it matters:

Too many ideas feels smart but creates friction. One strong recommendation is more useful.

### 3. Step-by-Step Build Plan

Output:

- setup steps
- build order
- milestone checkpoints
- what "done" looks like

Why it matters:

Students get blocked less by difficulty than by not knowing the next move.

### 4. Required Concepts

Output:

- concepts from the lesson they will actually use
- prerequisite concepts they may need
- warning if the topic is too advanced for the chosen level

Why it matters:

This keeps the product educational instead of just generative.

### 5. Tools / Tech Stack

Output:

- simplest tool choice for this project
- install/setup note
- fallback tool if setup is heavy

Example:

- `Python + matplotlib`
- fallback: `Google Sheets` if the student wants zero setup

### 6. Build Tonight Mode

Output:

- a reduced 2-3 hour version
- exact features to skip
- exact minimum finished outcome

Why it matters:

This is the strongest differentiator because it solves the real problem: scope.

## Differentiation

### 1. Build Tonight Mode

Not "MVP" language. Not startup language.

Just:

`If you only have tonight, build this version first.`

### 2. Explain Like I'm 17

Each brief includes a plain-language explanation:

- what the project is
- what the hard part is
- what to do first

This helps students who are motivated but intimidated.

### 3. Scope Check

Before showing the final brief, the system silently checks:

- is this too big for the selected time?
- does this require tools that are too heavy?
- is this mismatched to the student's confidence?

If yes, it rewrites the plan smaller.

This is more original than adding more flashy UI.

## UI Structure

The product should be a dashboard, not a landing page.

### Main Dashboard

```text
+---------------------------------------------------------+
| Tonight's Project                                       |
| Turn what you learned today into something you can make |
+---------------------------------------------------------+
| New Brief | Saved Builds                                |
+---------------------------------------------------------+

NEW BRIEF

+---------------------------------------------------------+
| What did you just learn?                                |
| [ Linear Algebra - vectors and dot product           ]  |
|                                                         |
| Your level                                              |
| ( ) New to this   ( ) Some practice   ( ) Comfortable   |
|                                                         |
| Time tonight                                            |
| [ 2 hours v ]                                           |
|                                                         |
| Project style                                           |
| [ Visual demo v ]                                       |
|                                                         |
| Notes or class outline (optional)                       |
| [ paste notes here                                  ]   |
|                                                         |
| Avoid (optional)                                        |
| [ no heavy setup / no frontend                      ]   |
|                                                         |
| [ Generate Project Plan ]                               |
+---------------------------------------------------------+
```

### Output Screen

```text
+---------------------------------------------------------+
| Project: Vector Similarity Explorer                     |
| Good fit for: vectors, dot product, angle intuition     |
+---------------------------------------------------------+

+---------------------------------------------------------+
| Why this works                                          |
| You just learned how vectors compare direction and      |
| magnitude. This project makes that visible with real    |
| examples instead of more worksheet problems.            |
+---------------------------------------------------------+

+---------------------------------------------------------+
| Build Tonight Version                                   |
| In 2 hours, make a small tool that takes two vectors,   |
| shows their dot product, and tells whether they point   |
| in a similar direction. Skip animations for now.        |
+---------------------------------------------------------+

+---------------------------------------------------------+
| Steps                                                   |
| 1. Create a script or small web page                    |
| 2. Add two vector inputs                                |
| 3. Compute dot product                                  |
| 4. Show interpretation                                  |
| 5. Test with 3 sample pairs                             |
+---------------------------------------------------------+

+---------------------------------------------------------+
| Concepts You'll Use                                     |
| - vector magnitude                                      |
| - dot product                                           |
| - cosine intuition                                      |
+---------------------------------------------------------+

+---------------------------------------------------------+
| Tools                                                   |
| Python + Streamlit                                      |
| If you want zero setup: Google Sheets version           |
+---------------------------------------------------------+
```

### Saved Builds Screen

```text
+---------------------------------------------------------+
| Saved Builds                                            |
+---------------------------------------------------------+
| Vector Similarity Explorer      Building                |
| SQL Habit Tracker Dashboard     Finished                |
| Force Simulator                 Not started             |
+---------------------------------------------------------+
```

## Tech Stack + Architecture

## Recommended V1 Stack

- Frontend: Next.js 14 App Router
- UI: React + Tailwind
- API layer: Next.js route handlers
- Database: MongoDB
- Auth: NextAuth or no auth for single-user MVP
- LLM: hosted API model

Recommended hosted-model path:

- OpenAI Responses API or Chat Completions API
- small/fast model for first draft
- optional second pass for scope-check rewrite

### Why This Is The Right Stack

- works cleanly on Vercel
- no fake local-model claim
- fast enough for short student prompts
- simple enough for one engineer to maintain

## Request -> Response Flow

### If Deploying On Vercel

1. Student submits topic, level, time, style, and notes.
2. Frontend posts to `/api/generate-brief`.
3. Route handler validates input and builds a strict prompt.
4. Server calls a hosted LLM API.
5. Model returns structured JSON.
6. Server normalizes and stores the result in MongoDB.
7. Frontend renders:
   - project idea
   - why it fits
   - concepts
   - tools
   - steps
   - build tonight version

### Suggested Response Shape

```json
{
  "ideaTitle": "Vector Similarity Explorer",
  "summary": "A small tool that compares two vectors and explains what their dot product means.",
  "whyFit": "It directly uses the topic you just learned and stays small enough for one evening.",
  "requiredConcepts": [
    "vector magnitude",
    "dot product",
    "angle intuition"
  ],
  "tools": [
    "Python",
    "Streamlit"
  ],
  "steps": [
    "Create a small app with two vector inputs",
    "Compute the dot product",
    "Show whether the vectors point in a similar direction",
    "Test with three sample pairs"
  ],
  "buildTonight": {
    "timeBox": "2 hours",
    "goal": "Make the calculator work with sample inputs and a simple explanation box.",
    "skipForNow": [
      "animations",
      "user accounts",
      "saving history inside the app"
    ]
  },
  "explainLikeIm17": "This is basically a tool that helps you see whether two arrows point in a similar direction."
}
```

## If You Want To Keep Ollama

Then the deployment story changes.

Use:

- Next.js app on Vercel
- separate backend or VM for Ollama
- private API from app to model host

Example realistic setup:

- Vercel for web app
- EC2 instance running Ollama
- reverse proxy with auth
- model host handles generation
- Next.js route calls that service

That is believable. "Ollama on Vercel" is not.

## What Should Be Removed From The Current Product

These things weaken the product:

- multi-domain positioning
- hire-me / portfolio messaging
- long aspirational landing page
- prompts optimized for sounding advanced
- outputs that feel like assignment text instead of build plans

## Product Judgment Notes

If something sounds like this, cut it:

- `industry-ready`
- `market-standard`
- `premium`
- `AI-powered portfolio acceleration`

Students do not need that language.

Better language:

- `What did you learn today?`
- `How much time do you have tonight?`
- `Here is the smallest version worth building first.`
- `Skip these parts for now.`

## Example Output

### Input

- Topic: `Linear Algebra - Week 6: dot product and vector similarity`
- Level: `Some practice`
- Time tonight: `2 hours`
- Project style: `visual demo`
- Avoid: `no heavy frontend setup`

### Output

**Project idea**

Vector Similarity Explorer

**Why this is a good fit**

You just learned dot product, which is easier to understand when you can test examples and see what the numbers mean. This project keeps the math central and avoids a lot of setup.

**Required concepts**

- vector components
- dot product
- magnitude
- how angle affects similarity

**Tools**

- Python
- Streamlit
- `numpy` if you want cleaner vector math

**Step-by-step plan**

1. Start a small Streamlit app with two vector input fields.
2. Parse each input into a list of numbers.
3. Compute the dot product.
4. Show a short explanation:
   - positive means similar direction
   - zero means perpendicular
   - negative means opposite direction
5. Add three preset examples so the app is useful immediately.
6. If time remains, show vector magnitudes too.

**Build Tonight version**

In 2 hours, only build:

- two hardcoded example vectors
- one input form
- dot product calculation
- one plain-English explanation of the result

Skip tonight:

- graphs
- custom styling
- saving past comparisons

**Explain Like I'm 17**

Imagine each vector is an arrow. This project tells you whether two arrows are pointing mostly together, sideways, or against each other.

## Recommended Next Refactor In This Repo

1. Replace the current homepage with an authenticated dashboard-first entry point.
2. Remove commerce, engineering, and medical branches.
3. Replace the current brief schema with a student-project schema.
4. Change generation prompts to require structured JSON.
5. Add a scope-check pass that shrinks overly ambitious ideas.
6. Rewrite all UI copy in plain student language.
