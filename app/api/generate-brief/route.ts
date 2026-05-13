import { buildPrompt } from "@/lib/buildPrompt";
import { generateBrief, refineBrief } from "@/lib/groq";
import { parseBrief } from "@/lib/parseBrief";
import {
  buildCommercePrompt,
  CommerceFormInput,
} from "@/lib/prompts/commercePrompt";
import {
  buildEngineeringPrompt,
  EngineeringFormInput,
} from "@/lib/prompts/engineeringPrompt";

const GENERATION_TIMEOUT_MS = 30_000;

const techSystemPrompt = `You are a project brief generator for students learning
to code. You output exactly one project brief per request in exactly 4 sections.

ABSOLUTE RULES - breaking any of these makes your output useless:
1. Start immediately with ## The Problem. No greeting. No preamble. No
   "Here is your brief". Nothing before the first ##.
2. Output exactly these 4 sections in this order, with these exact headers:
   ## The Problem
   ## Starter Scaffold
   ## Checkpoint Questions
   ## Stretch Goal
3. The Starter Scaffold must be a Python code block that:
   - Starts with import numpy as np as the very first line
   - Has at least 2 functions with def, real bodies, not pass or TODO
   - Uses hardcoded sample data so it runs with zero user input
   - Ends with if __name__ == "__main__": that calls each function and prints output
   - Is 25-40 lines total
4. Checkpoint Questions must be exactly 3 lines, each formatted as:
   Q[n]: Call [specific function name]([specific args]) -
   your terminal should print [exact expected value].
   Never write "understand", "explain", "can you", "do you know".
5. Stretch Goal is exactly 1 sentence. Must name a specific np.linalg.*
   function and say what it will change in the output.
6. Never use: explore, leverage, utilize, dive into, build upon, implement,
   enhance, feel free, don't hesitate, good luck, happy coding, I hope this.
7. Nothing after the Stretch Goal. No summary. No closing remarks.`;

const domainSystemPromptMap: Record<string, string> = {
  tech: techSystemPrompt,
  commerce:
    "You are a senior business consultant writing case study briefs for commerce students. Use real companies and market data. Be specific.",
  engineering:
    "You are a licensed professional engineer writing design briefs for engineering students. Use real dimensions, material properties, and standards. Be precise.",
};

const stripHtml = (str: string) => str.replace(/<[^>]*>?/gm, "");

function buildRequestSignal(req: Request) {
  const timeoutSignal = AbortSignal.timeout(GENERATION_TIMEOUT_MS);
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([req.signal, timeoutSignal]);
  }
  return timeoutSignal;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateTechBrief(raw: string) {
  const parsed = parseBrief(raw);
  const issues: string[] = [];

  if (!parsed.problem || parsed.problem.length < 80) {
    issues.push("problem statement too short or missing");
  }

  if (!parsed.scaffold.includes("import numpy as np")) {
    issues.push("scaffold missing import numpy as np");
  }

  const functionMatches = parsed.scaffold.match(/\bdef\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/g) ?? [];
  if (functionMatches.length < 2) {
    issues.push("scaffold must define at least 2 functions");
  }

  if (!parsed.scaffold.includes('__name__ == "__main__"')) {
    issues.push("scaffold missing main block");
  }

  if (parsed.checkpoints.length !== 3) {
    issues.push(`need exactly 3 checkpoints, got ${parsed.checkpoints.length}`);
  }

  const invalidCheckpoint = parsed.checkpoints.find(
    (checkpoint) =>
      !/^Call\s+[A-Za-z_][A-Za-z0-9_]*\([^)]*\)\s+-\s+your terminal should print\s+.+\.?$/i.test(
        checkpoint
      )
  );
  if (invalidCheckpoint) {
    issues.push("checkpoint format is invalid");
  }

  if (!parsed.stretch || parsed.stretch.length < 40) {
    issues.push("stretch goal too vague or missing");
  }

  if (!/np\.linalg\.[A-Za-z_][A-Za-z0-9_]*/.test(parsed.stretch)) {
    issues.push("stretch goal must name a specific np.linalg.* function");
  }

  return { parsed, issues };
}

async function generateTechBrief(body: Record<string, unknown>, req: Request) {
  let { course, week, difficulty, pushback, previousBrief } = body;
  const rawProjects = body.projects;

  if (typeof course !== "string" || course.trim().length === 0) {
    return jsonError("Course must be a non-empty string", 400);
  }
  course = stripHtml(course).slice(0, 200);

  const parsedWeek = Number(week);
  if (Number.isNaN(parsedWeek) || parsedWeek < 1 || parsedWeek > 52) {
    return jsonError("Week must be a number between 1 and 52", 400);
  }

  const parsedDifficulty = difficulty !== undefined ? Number(difficulty) : 3;
  if (!Number.isInteger(parsedDifficulty) || parsedDifficulty < 1 || parsedDifficulty > 5) {
    return jsonError("Difficulty must be an integer between 1 and 5", 400);
  }

  if (!Array.isArray(rawProjects)) {
    return jsonError("Projects must be an array", 400);
  }

  for (let index = 0; index < rawProjects.length; index += 1) {
    if (typeof rawProjects[index] !== "string") {
      return jsonError(`Project at index ${index} must be a string`, 400);
    }
  }

  const projects = rawProjects.map((project) => stripHtml(project).slice(0, 300));

  if (pushback !== undefined && pushback !== null) {
    if (typeof pushback !== "string") {
      return jsonError("Pushback must be a string", 400);
    }
    pushback = stripHtml(pushback).slice(0, 500);
  }

  if (previousBrief !== undefined && previousBrief !== null) {
    if (typeof previousBrief !== "string") {
      return jsonError("previousBrief must be a string", 400);
    }
    previousBrief = stripHtml(previousBrief).slice(0, 12_000);
  }

  const sanitizedCourse = course as string;
  const sanitizedPushback =
    typeof pushback === "string" && pushback.length > 0 ? pushback : undefined;
  const sanitizedPreviousBrief =
    typeof previousBrief === "string" && previousBrief.length > 0
      ? previousBrief
      : undefined;

  const userPrompt = buildPrompt({
    week: parsedWeek,
    projects,
    difficulty: parsedDifficulty,
    course: sanitizedCourse,
    pushback: sanitizedPushback,
    previousBrief: sanitizedPreviousBrief,
  });

  const signal = buildRequestSignal(req);

  async function callWithRetry(
    attempt = 1,
    promptOverride = userPrompt
  ): Promise<string> {
    try {
      const raw =
        sanitizedPushback && sanitizedPreviousBrief
          ? await refineBrief(
              techSystemPrompt,
              promptOverride,
              sanitizedPreviousBrief,
              sanitizedPushback,
              { signal }
            )
          : await generateBrief(techSystemPrompt, promptOverride, { signal });

      const { issues } = validateTechBrief(raw);

      if (issues.length > 0 && attempt < 2) {
        console.warn(`Attempt ${attempt} failed: ${issues.join(", ")} - retrying`);
        const repairPrompt = `${userPrompt}

RETRY FIXES:
- ${issues.join("\n- ")}

Return the full brief again.
Follow the 4 required sections exactly.
Use only single-line scalar checkpoint outputs.
Name a specific np.linalg.* function in the stretch goal.
For each checkpoint, write exactly:
Q1: Call function_name(args) - your terminal should print exact_value.
Q2: Call function_name(args) - your terminal should print exact_value.
Q3: Call function_name(args) - your terminal should print exact_value.`;
        return callWithRetry(attempt + 1, repairPrompt);
      }

      if (issues.length > 0) {
        console.error(`Brief still invalid after 2 attempts: ${issues.join(", ")}`);
      }

      return raw;
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      if (err?.status === 429 && attempt < 2) {
        await sleep(8000);
        return callWithRetry(attempt + 1);
      }
      throw err;
    }
  }

  const raw = await callWithRetry();
  const parsed = parseBrief(raw);

  return Response.json({ brief: parsed });
}

async function generateDomainBrief(body: Record<string, unknown>, req: Request) {
  const domain = typeof body.domain === "string" ? body.domain : "tech";
  const pushback =
    typeof body.pushback === "string" ? stripHtml(body.pushback).slice(0, 500) : undefined;

  let userPrompt = "";

  if (domain === "commerce") {
    const input: CommerceFormInput = {
      subject: stripHtml(String(body.subject || "")).slice(0, 200),
      week: Math.min(Math.max(Number(body.week) || 1, 1), 52),
      assignmentType: stripHtml(String(body.assignmentType || "Case Study")).slice(0, 100),
      difficulty: Math.min(Math.max(Number(body.difficulty) || 3, 1), 5),
      priorWork: Array.isArray(body.priorWork)
        ? body.priorWork.map((project) => stripHtml(String(project)).slice(0, 300))
        : [],
      syllabus:
        typeof body.syllabus === "string"
          ? stripHtml(body.syllabus).slice(0, 5000)
          : undefined,
    };
    userPrompt = buildCommercePrompt(input, pushback);
  } else if (domain === "engineering") {
    const input: EngineeringFormInput = {
      branch: stripHtml(String(body.branch || "Civil")).slice(0, 100),
      subject: stripHtml(String(body.subject || "")).slice(0, 200),
      week: Math.min(Math.max(Number(body.week) || 1, 1), 52),
      difficulty: Math.min(Math.max(Number(body.difficulty) || 3, 1), 5),
      priorWork: Array.isArray(body.priorWork)
        ? body.priorWork.map((project) => stripHtml(String(project)).slice(0, 300))
        : [],
      syllabus:
        typeof body.syllabus === "string"
          ? stripHtml(body.syllabus).slice(0, 5000)
          : undefined,
    };
    userPrompt = buildEngineeringPrompt(input, pushback);
  } else {
    return jsonError("Invalid domain", 400);
  }

  const raw = await generateBrief(domainSystemPromptMap[domain], userPrompt, {
    signal: buildRequestSignal(req),
  });

  return Response.json({ brief: parseBrief(raw) });
}

export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const domain = typeof body.domain === "string" ? body.domain : "tech";
    const validDomains = ["tech", "commerce", "engineering"];

    if (!validDomains.includes(domain)) {
      return jsonError("Invalid domain", 400);
    }

    if (domain === "tech") {
      return await generateTechBrief(body, req);
    }

    return await generateDomainBrief(body, req);
  } catch (error: unknown) {
    const err = error as Error & { status?: number };

    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return jsonError("Generation timed out. Please try again.", 504);
    }

    let message = err.message || "Internal Server Error";
    if (err?.status === 429 || message.toLowerCase().includes("rate limit")) {
      message = "Groq rate limit exceeded. Please try again later.";
    }

    console.error("Error generating brief:", error);
    return jsonError(message, err?.status || 500);
  }
}
