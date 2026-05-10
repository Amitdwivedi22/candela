import { buildPrompt } from "../../../lib/buildPrompt";
import { buildCommercePrompt, CommerceFormInput } from "../../../lib/prompts/commercePrompt";
import { buildEngineeringPrompt, EngineeringFormInput } from "../../../lib/prompts/engineeringPrompt";
import { buildMedicalPrompt, MedicalFormInput } from "../../../lib/prompts/medicalPrompt";
import { ollamaGenerateWithOptions } from "@/lib/ollama";

const GENERATION_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

function isAbortLikeError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.name === "TimeoutError" ||
      error.message.toLowerCase().includes("aborted"))
  );
}

function buildRequestSignal(req: Request) {
  const timeoutSignal = AbortSignal.timeout(GENERATION_TIMEOUT_MS);
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([req.signal, timeoutSignal]);
  }
  return timeoutSignal;
}

function streamText(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stripHtml = (str: string) => str.replace(/<[^>]*>?/gm, "");

    // ── Domain-aware dispatch ─────────────────────────────────────────────────
    const domain: string = body.domain || "tech";

    let fullPrompt = "";

    if (domain === "commerce") {
      // Commerce — basic validation then prompt build
      const input: CommerceFormInput = {
        subject: stripHtml(String(body.subject || "")).slice(0, 200),
        unit: Math.min(Math.max(Number(body.unit) || 1, 1), 20),
        semester: Math.min(Math.max(Number(body.semester) || 1, 1), 8),
        tool: stripHtml(String(body.tool || "Excel")).slice(0, 100),
        assignmentType: stripHtml(String(body.assignmentType || "Case Study")).slice(0, 100),
        difficulty: Math.min(Math.max(Number(body.difficulty) || 3, 1), 5),
        priorWork: Array.isArray(body.priorWork)
          ? body.priorWork.map((p: string) => stripHtml(String(p)).slice(0, 300))
          : [],
        syllabus: body.syllabus ? stripHtml(String(body.syllabus)).slice(0, 5000) : undefined,
      };
      fullPrompt = buildCommercePrompt(input, body.pushback ? stripHtml(String(body.pushback)).slice(0, 500) : undefined);

    } else if (domain === "engineering") {
      const input: EngineeringFormInput = {
        branch: stripHtml(String(body.branch || "Civil")).slice(0, 100),
        subject: stripHtml(String(body.subject || "")).slice(0, 200),
        semester: Math.min(Math.max(Number(body.semester) || 1, 1), 8),
        software: stripHtml(String(body.software || "MATLAB")).slice(0, 100),
        problemType: stripHtml(String(body.problemType || "Analysis")).slice(0, 100),
        difficulty: Math.min(Math.max(Number(body.difficulty) || 3, 1), 5),
        priorWork: Array.isArray(body.priorWork)
          ? body.priorWork.map((p: string) => stripHtml(String(p)).slice(0, 300))
          : [],
        unitSystem: body.unitSystem === "Imperial" ? "Imperial" : "SI",
        syllabus: body.syllabus ? stripHtml(String(body.syllabus)).slice(0, 5000) : undefined,
      };
      fullPrompt = buildEngineeringPrompt(input, body.pushback ? stripHtml(String(body.pushback)).slice(0, 500) : undefined);

    } else if (domain === "medical") {
      const input: MedicalFormInput = {
        subject: stripHtml(String(body.subject || "")).slice(0, 200),
        year: Math.min(Math.max(Number(body.year) || 1, 1), 5),
        caseType: stripHtml(String(body.caseType || "Clinical Case")).slice(0, 100),
        examMode: stripHtml(String(body.examMode || "NEET-PG")).slice(0, 100),
        difficulty: Math.min(Math.max(Number(body.difficulty) || 3, 1), 5),
        priorCases: Array.isArray(body.priorCases)
          ? body.priorCases.map((c: string) => stripHtml(String(c)).slice(0, 300))
          : [],
        syllabus: body.syllabus ? stripHtml(String(body.syllabus)).slice(0, 5000) : undefined,
      };
      fullPrompt = buildMedicalPrompt(input, body.pushback ? stripHtml(String(body.pushback)).slice(0, 500) : undefined);

    } else {
      // ── Tech / default path — original validation ─────────────────────────
      let { course, week, pushback, difficulty } = body;
      const { projects, language, syllabus } = body;

      if (typeof course !== "string" || course.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Course must be a non-empty string" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      course = stripHtml(course);
      if (course.length > 200) {
        return new Response(JSON.stringify({ error: "Course must be max 200 characters" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const parsedWeek = Number(week);
      if (isNaN(parsedWeek) || parsedWeek < 1 || parsedWeek > 20) {
        return new Response(JSON.stringify({ error: "Week must be a number between 1 and 20" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      week = parsedWeek;

      if (!Array.isArray(projects) || projects.length === 0) {
        return new Response(JSON.stringify({ error: "Projects must be a non-empty array" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      for (let i = 0; i < projects.length; i++) {
        if (typeof projects[i] !== "string") {
          return new Response(JSON.stringify({ error: `Project at index ${i} must be a string` }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        projects[i] = stripHtml(projects[i]);
        if (projects[i].length > 300) {
          return new Response(JSON.stringify({ error: `Project at index ${i} must be max 300 characters` }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      }

      if (pushback !== undefined && pushback !== null) {
        if (typeof pushback !== "string") {
          return new Response(JSON.stringify({ error: "Pushback must be a string" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        pushback = stripHtml(pushback);
        if (pushback.length > 500) {
          return new Response(JSON.stringify({ error: "Pushback must be max 500 characters" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      }

      let sanitizedSyllabus = syllabus;
      if (sanitizedSyllabus !== undefined && sanitizedSyllabus !== null) {
        if (typeof sanitizedSyllabus !== "string") {
          return new Response(JSON.stringify({ error: "Syllabus must be a string" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        sanitizedSyllabus = stripHtml(sanitizedSyllabus);
        if (sanitizedSyllabus.length > 5000) {
          return new Response(JSON.stringify({ error: "Syllabus must be max 5000 characters" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      }

      const parsedDifficulty = difficulty !== undefined ? Number(difficulty) : 3;
      if (!Number.isInteger(parsedDifficulty) || parsedDifficulty < 1 || parsedDifficulty > 5) {
        return new Response(JSON.stringify({ error: "Difficulty must be an integer between 1 and 5" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      difficulty = parsedDifficulty;

      fullPrompt = buildPrompt(
        { course, week, projects, language, difficulty, syllabus: sanitizedSyllabus },
        pushback || undefined
      );
    }

    // ── Shared system prompt & LLM call ──────────────────────────────────────
    const systemPromptMap: Record<string, string> = {
      tech: "You are a senior software engineer writing project briefs for students. Be specific, technical, and concise. Never be vague.",
      commerce: "You are a senior business consultant writing case study briefs for commerce students. Use real companies and market data. Be specific.",
      engineering: "You are a licensed professional engineer writing design briefs for engineering students. Use real dimensions, material properties, and standards. Be precise.",
      medical: "You are a senior clinician writing clinical case study briefs for medical students. Use correct medical terminology and realistic patient data. Never name the diagnosis upfront.",
    };

    const systemPrompt = systemPromptMap[domain] || systemPromptMap.tech;

    const fetchWithRetry = async () => {
      let delay = 1000;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await ollamaGenerateWithOptions(
            {
              prompt: fullPrompt,
              system: systemPrompt,
              temperature: 0.4,
              top_p: 0.9,
              repeat_penalty: 1.1,
              num_predict: 1200,
            },
            buildRequestSignal(req)
          );
        } catch (error: unknown) {
          const err = error as Error & { status?: number };
          const wasClientAbort = req.signal.aborted;
          const isAbort = isAbortLikeError(err);

          if (wasClientAbort) throw err;
          if (isAbort && attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          if (isAbort) {
            throw new Error(`Generation timed out after ${GENERATION_TIMEOUT_MS / 1000} seconds. Please try again.`);
          }

          const is429 = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("Quota exceeded");
          if (!is429 || attempt === MAX_RETRIES) throw err;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
      throw new Error("Failed after retries");
    };

    const text = await fetchWithRetry();

    return new Response(streamText(text), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    if (req.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    if (isAbortLikeError(err) || err.message.includes("timed out")) {
      return new Response(JSON.stringify({ error: "Generation timed out. Please try again." }), { status: 504, headers: { "Content-Type": "application/json" } });
    }

    let message = err instanceof Error ? err.message : "Internal Server Error";
    if (err?.status === 429 || message.includes("429") || message.includes("Quota exceeded")) {
      message = "Rate limit exceeded. Please try again later.";
    }

    console.error("Error generating brief:", error);
    return new Response(JSON.stringify({ error: message }), { status: err?.status || 500, headers: { "Content-Type": "application/json" } });
  }
}
