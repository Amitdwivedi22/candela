import { buildPrompt } from "../../../lib/buildPrompt";
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
    let { course, week, pushback, difficulty } = body;
    const { projects, language } = body;

    const stripHtml = (str: string) => str.replace(/<[^>]*>?/gm, "");

    // Validate course
    if (typeof course !== "string" || course.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Course must be a non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    course = stripHtml(course);
    if (course.length > 200) {
      return new Response(
        JSON.stringify({ error: "Course must be max 200 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate week
    const parsedWeek = Number(week);
    if (isNaN(parsedWeek) || parsedWeek < 1 || parsedWeek > 20) {
      return new Response(
        JSON.stringify({ error: "Week must be a number between 1 and 20" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    week = parsedWeek;

    // Validate projects
    if (!Array.isArray(projects) || projects.length === 0) {
      return new Response(
        JSON.stringify({ error: "Projects must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    for (let i = 0; i < projects.length; i++) {
      if (typeof projects[i] !== "string") {
        return new Response(
          JSON.stringify({ error: `Project at index ${i} must be a string` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      projects[i] = stripHtml(projects[i]);
      if (projects[i].length > 300) {
        return new Response(
          JSON.stringify({ error: `Project at index ${i} must be max 300 characters` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Validate pushback
    if (pushback !== undefined && pushback !== null) {
      if (typeof pushback !== "string") {
        return new Response(
          JSON.stringify({ error: "Pushback must be a string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      pushback = stripHtml(pushback);
      if (pushback.length > 500) {
        return new Response(
          JSON.stringify({ error: "Pushback must be max 500 characters" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Validate difficulty
    const parsedDifficulty = difficulty !== undefined ? Number(difficulty) : 3;
    if (!Number.isInteger(parsedDifficulty) || parsedDifficulty < 1 || parsedDifficulty > 5) {
      return new Response(
        JSON.stringify({ error: "Difficulty must be an integer between 1 and 5" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    difficulty = parsedDifficulty;

    const fullPrompt = buildPrompt(
      { course, week, projects, language, difficulty },
      pushback || undefined
    );

    // Ollama model recommendations:
    // - Best quality: llama3.1:8b (ollama pull llama3.1:8b)
    // - Fastest: mistral:7b (ollama pull mistral:7b)
    // - Best code output: codellama:13b (ollama pull codellama:13b)
    const systemPrompt =
      "You are a senior software engineer writing project briefs for students. Be specific, technical, and concise. Never be vague.";

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

          if (wasClientAbort) {
            throw err;
          }

          if (isAbort && attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }

          if (isAbort) {
            throw new Error(
              `Generation timed out after ${GENERATION_TIMEOUT_MS / 1000} seconds. Please try again.`
            );
          }

          const is429 =
            err?.status === 429 ||
            err?.message?.includes("429") ||
            err?.message?.includes("Quota exceeded");

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
      return new Response(
        JSON.stringify({ error: "Generation timed out. Please try again." }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    let message = err instanceof Error ? err.message : "Internal Server Error";

    if (err?.status === 429 || message.includes("429") || message.includes("Quota exceeded")) {
      message = "Ollama rate limit exceeded. Please try again later.";
    }

    console.error("Error generating project brief:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: err?.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
