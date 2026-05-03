import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "../../../lib/buildPrompt";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // Use gemini-2.5-flash which has a stable API and high free tier quota
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fetchWithRetry = async () => {
      let delay = 1000;
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          return await model.generateContentStream(fullPrompt, {
            signal: AbortSignal.timeout(30000),
          });
        } catch (error: unknown) {
          const err = error as Error & { status?: number };
          if (err.name === "AbortError" || err.name === "TimeoutError") {
            throw err;
          }
          const is429 =
            err?.status === 429 ||
            err?.message?.includes("429") ||
            err?.message?.includes("Quota exceeded");
          
          if (!is429 || attempt === 2) throw err;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
      throw new Error("Failed after retries");
    };

    const result = await fetchWithRetry();

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return new Response(
        JSON.stringify({ error: "Generation timed out. Please try again." }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    let message = err instanceof Error ? err.message : "Internal Server Error";

    // Handle specific Google API 429 Quota errors
    if (err?.status === 429 || message.includes("429") || message.includes("Quota exceeded")) {
      message = "You have exceeded your Gemini API free tier quota or the model is unavailable. Please check your Google AI Studio billing details or try again later.";
    }

    console.error("Error generating project brief:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: err?.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
