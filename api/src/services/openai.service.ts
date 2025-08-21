import type { Documentation } from "../utils/schema.util";
import { DocumentationSchema, validateSchema } from "../utils/schema.util";

/**
 * Minimal OpenAI Chat Completions client using native fetch (Node 18+).
 * No SDK required.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL?.replace(/\/+$/, "") || "https://api.openai.com";

if (!OPENAI_API_KEY) {
  // Don't throw on import so the server can still boot without a key.
  // Actual calls will fail with a helpful error.
  // eslint-disable-next-line no-console
  console.warn("[openai.service] Missing OPENAI_API_KEY");
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function postChat(messages: ChatMessage[], opts?: { jsonMode?: boolean }) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to server/.env or your environment."
    );
  }

  const res = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2,
      response_format: opts?.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (res.status === 429) {
    throw new Error("OpenAI rate limit hit (HTTP 429). Try again shortly.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}

/**
 * Generate raw Markdown documentation from a prompt.
 */
export async function generateDocMarkdown(prompt: string): Promise<string> {
  const system: ChatMessage = {
    role: "system",
    content:
      "You are a senior technical writer. Output clean, concise Markdown only. Prefer headings (##), bullet lists, and short paragraphs.",
  };
  const user: ChatMessage = { role: "user", content: prompt };

  return await postChat([system, user], { jsonMode: false });
}

/**
 * Generate structured documentation JSON and validate with Zod.
 * Returns a typed object you can later render to Markdown.
 */
export async function generateDocStructured(
  prompt: string
): Promise<Documentation> {
  const system: ChatMessage = {
    role: "system",
    content:
      "You are a structured documentation generator. Return a strict JSON object matching the required schema. Do NOT include Markdown code fences.",
  };
  const user: ChatMessage = { role: "user", content: prompt };

  const jsonStr = await postChat([system, user], { jsonMode: true });

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  return validateSchema(DocumentationSchema, parsed);
}
