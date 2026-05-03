import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BriefSection, FormInput } from "../../../types";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // ── Build Gemini chat history ────────────────────────────────────────────
    // Gemini's chat API expects { role: "user"|"model", parts: [{text}] }.
    // We prepend the system prompt as the first user turn so it's always in context.
    const systemPrompt = buildSystemPrompt(briefContext, formInput);

    // Convert our chat history to Gemini format (all except the latest user msg)
    const historyTurns = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: stripHtml(msg.content) }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Start a chat session with the system prompt prepended into history
    const chat = model.startChat({
      history: [
        // System prompt injected as an initial user→model exchange
        { role: "user",  parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I'm ready to help the student with their project brief." }] },
        ...historyTurns,
      ],
    });

    const result = await chat.sendMessageStream(
      stripHtml(lastMessage.content.trim()),
      { signal: AbortSignal.timeout(30_000) }
    );

    // ── Stream back ──────────────────────────────────────────────────────────
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type":         "text/plain; charset=utf-8",
        "Cache-Control":        "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return new Response(
        JSON.stringify({ error: "Chat timed out. Please try again." }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    let message = error instanceof Error ? error.message : "Internal Server Error";
    if (error?.status === 429 || message.includes("429") || message.includes("Quota exceeded")) {
      message = "Gemini API quota exceeded. Please try again later.";
    }

    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: error?.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
