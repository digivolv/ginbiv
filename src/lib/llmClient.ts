import OpenAI from "openai";
import { z } from "zod";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "no-key",
      baseURL: process.env.LLM_BASE_URL ?? undefined,
    });
  }
  return _client;
}

const model = () => process.env.LLM_MODEL ?? "gpt-4o-mini";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Call the LLM and return the raw text response
export async function callLLM(
  messages: LLMMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: model(),
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000,
  });
  return response.choices[0]?.message?.content ?? "";
}

// Extract JSON from an LLM response that may include markdown code fences
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try to find bare JSON object
  const bare = text.match(/\{[\s\S]*\}/);
  if (bare) return bare[0];
  return text.trim();
}

// Call LLM expecting a JSON response; validates with the provided Zod schema.
// Retries once on malformed JSON before throwing a clean error.
export async function callLLMForJson<T>(
  messages: LLMMessage[],
  schema: z.ZodType<T>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<T> {
  async function attempt(): Promise<T> {
    const raw = await callLLM(messages, options);
    const jsonStr = extractJson(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`LLM returned non-JSON: ${raw.slice(0, 200)}`);
    }
    return schema.parse(parsed);
  }

  try {
    return await attempt();
  } catch (firstError) {
    // Single retry with explicit JSON instruction appended
    try {
      const retryMessages: LLMMessage[] = [
        ...messages,
        {
          role: "user",
          content:
            "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object, no markdown, no explanation.",
        },
      ];
      const raw = await callLLM(retryMessages, options);
      const jsonStr = extractJson(raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        throw new Error(`LLM returned non-JSON after retry: ${raw.slice(0, 200)}`);
      }
      return schema.parse(parsed);
    } catch (retryError) {
      // Surface the original error + retry error
      throw new Error(
        `LLM JSON parse failed after retry. Original: ${firstError instanceof Error ? firstError.message : String(firstError)}. Retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`
      );
    }
  }
}

export function isLLMAvailable(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.length > 0 && key !== "no-key");
}
