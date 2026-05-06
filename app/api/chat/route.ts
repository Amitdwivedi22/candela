import type { BriefSection, FormInput } from "../../../types";
import { ollamaChat } from "@/lib/ollama";

function streamText(text: string) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  briefContext: BriefSection;
  formInput: FormInput;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const stripHtml = (str: string) => str.replace(/<[^>]*>?/gm, "");

function buildSystemPrompt(brief: BriefSection, input: FormInput): string {
  const checkpointList = (brief.checkpoints ?? [])
    .map((q, i) => `  ${i + 1}. ${q}`)
    .join("\n");

  return `You are a concise, friendly coding mentor helping a student work through their project brief.
You have full context of the student's project and should answer questions about it directly and specifically.
Never be vague. Never repeat the brief back verbatim — summarise or quote only the relevant part.
Keep answers short: 2–5 sentences unless code is needed. Use markdown code blocks for code.

── STUDENT PROFILE ──────────────────────────────────────────
Course:   ${input.course}
Week:     ${input.week}
Language: ${input.language}
Difficulty level: ${input.difficulty ?? 3}/5

── PROJECT BRIEF ────────────────────────────────────────────
## The Problem
${brief.problem}

## Starter Scaffold
${brief.scaffold}

## Checkpoint Questions
${checkpointList}

## Stretch Goal
${brief.stretch}
─────────────────────────────────────────────────────────────

Answer the student's questions about THIS specific brief. If they ask something unrelated to coding or the project, politely redirect them.`;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, briefContext, formInput } = body;

    // ── Validate ────────────────────────────────────────────────────────────
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!briefContext || !formInput) {
      return new Response(
        JSON.stringify({ error: "briefContext and formInput are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sanitise the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return new Response(
        JSON.stringify({ error: "Last message must be from the user" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (typeof lastMessage.content !== "string" || lastMessage.content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "User message must be a non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (stripHtml(lastMessage.content).length > 1000) {
      return new Response(
        JSON.stringify({ error: "Message must be under 1000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(briefContext, formInput);

    const historyTurns = messages.map((msg) => ({
      role: msg.role,
      content: stripHtml(msg.content),
    }));

    const text = await ollamaChat(
      [
        { role: "user", content: systemPrompt },
        {
          role: "assistant",
          content: "Understood. I'm ready to help the student with their project brief.",
        },
        ...historyTurns,
      ],
      AbortSignal.timeout(30_000)
    );

    // ── Stream back ──────────────────────────────────────────────────────────
    return new Response(streamText(text), {
      headers: {
        "Content-Type":         "text/plain; charset=utf-8",
        "Cache-Control":        "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return new Response(
        JSON.stringify({ error: "Chat timed out. Please try again." }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    let message = err instanceof Error ? err.message : "Internal Server Error";
    if (err?.status === 429 || message.includes("429") || message.includes("Quota exceeded")) {
      message = "Ollama rate limit exceeded. Please try again later.";
    }

    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: err?.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
