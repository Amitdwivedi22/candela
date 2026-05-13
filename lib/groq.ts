import Groq from "groq-sdk";

const DEFAULT_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export class GroqClientError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GroqClientError";
    this.status = status;
  }
}

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqRequestOptions = {
  signal?: AbortSignal;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
};

function getApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new GroqClientError("GROQ_API_KEY is not configured.", 500);
  }

  return apiKey;
}

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: getApiKey(),
      maxRetries: 0,
      timeout: 20_000,
    });
  }

  return groqClient;
}

function normalizeGroqError(error: unknown): never {
  if (error instanceof Groq.APIError) {
    throw new GroqClientError(error.message, error.status);
  }

  if (error instanceof Error) {
    throw new GroqClientError(error.message);
  }

  throw new GroqClientError("Groq request failed.");
}

async function createChatCompletion(
  messages: GroqChatMessage[],
  options: GroqRequestOptions = {}
) {
  try {
    const completion = await getGroqClient().chat.completions.create(
      {
        model: DEFAULT_MODEL,
        messages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        top_p: options.top_p,
        stop: options.stop,
        stream: false,
      },
      {
        signal: options.signal,
      }
    );

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new GroqClientError("Groq returned empty response.");
    }

    return content;
  } catch (error) {
    normalizeGroqError(error);
  }
}

export async function generateBrief(
  systemPrompt: string,
  userPrompt: string,
  options: Pick<GroqRequestOptions, "signal"> = {}
): Promise<string> {
  return createChatCompletion(
    [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    {
      signal: options.signal,
      temperature: 0.2,
      max_tokens: 1200,
      top_p: 0.85,
      stop: [
        "Human:",
        "User:",
        "Good luck",
        "Feel free",
      ],
    }
  );
}

export async function refineBrief(
  systemPrompt: string,
  userPrompt: string,
  previousBrief: string,
  pushbackText: string,
  options: Pick<GroqRequestOptions, "signal"> = {}
): Promise<string> {
  return createChatCompletion(
    [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
      {
        role: "assistant",
        content: previousBrief,
      },
      {
        role: "user",
        content: `I reviewed this brief. Here is my feedback: ${pushbackText}

Rewrite the brief fixing exactly what I complained about.
Keep what worked. Change what did not.
The revised brief must be substantively different in the area I flagged —
not a rewording. Follow the same 4-section format exactly.`,
      },
    ],
    {
      signal: options.signal,
      temperature: 0.3,
      max_tokens: 1200,
      top_p: 0.85,
    }
  );
}

export async function groqChat(
  messages: GroqChatMessage[],
  signal?: AbortSignal
) {
  return createChatCompletion(messages, {
    signal,
    temperature: 0.35,
    max_tokens: 900,
    top_p: 0.9,
  });
}
