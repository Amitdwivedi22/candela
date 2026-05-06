const ollamaBaseUrl =
  process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") ?? "https://ollama.com/api";
const ollamaModel = process.env.OLLAMA_MODEL ?? "gpt-oss:120b";

export type OllamaChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type OllamaErrorPayload = {
  error?: string;
};

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
  error?: string;
};

function getOllamaHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  return headers;
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as OllamaErrorPayload;
    return payload.error || `Ollama request failed with status ${response.status}`;
  } catch {
    return `Ollama request failed with status ${response.status}`;
  }
}

export type OllamaGenerateOptions = {
  system?: string;
  temperature?: number;
  top_p?: number;
  repeat_penalty?: number;
  num_predict?: number;
};

export async function ollamaGenerate(prompt: string, signal: AbortSignal) {
  const response = await fetch(`${ollamaBaseUrl}/generate`, {
    method: "POST",
    headers: getOllamaHeaders(),
    signal,
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as OllamaGenerateResponse;
  if (!payload.response) {
    throw new Error(payload.error || "Ollama returned an empty response.");
  }

  return payload.response;
}

/**
 * Ollama /generate with explicit decoding settings and a separate system string.
 * Note: Ollama's local API uses these fields; if your Ollama version differs,
 * adjust accordingly.
 */
export async function ollamaGenerateWithOptions(
  params: { prompt: string } & OllamaGenerateOptions,
  signal: AbortSignal
) {
  const { prompt, system, temperature, top_p, repeat_penalty, num_predict } = params;

  const response = await fetch(`${ollamaBaseUrl}/generate`, {
    method: "POST",
    headers: getOllamaHeaders(),
    signal,
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
      ...(system ? { system } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
      ...(top_p !== undefined ? { top_p } : {}),
      ...(repeat_penalty !== undefined ? { repeat_penalty } : {}),
      ...(num_predict !== undefined ? { num_predict } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as OllamaGenerateResponse;
  if (!payload.response) {
    throw new Error(payload.error || "Ollama returned an empty response.");
  }

  return payload.response;
}

export async function ollamaChat(
  messages: OllamaChatMessage[],
  signal: AbortSignal
) {
  const response = await fetch(`${ollamaBaseUrl}/chat`, {
    method: "POST",
    headers: getOllamaHeaders(),
    signal,
    body: JSON.stringify({
      model: ollamaModel,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as OllamaChatResponse;
  if (!payload.message?.content) {
    throw new Error(payload.error || "Ollama returned an empty chat response.");
  }

  return payload.message.content;
}
