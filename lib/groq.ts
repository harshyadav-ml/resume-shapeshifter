/**
 * Groq LLM Client — server-side only.
 *
 * Wraps the groq-sdk with:
 * - JSON mode (response_format: { type: "json_object" })
 * - Retry logic (3 attempts, exponential backoff, 429 handling)
 * - Zod validation with error feedback injection on retry
 */

import Groq from "groq-sdk";
import { ZodSchema, ZodError } from "zod";

// ── Singleton ────────────────────────────────────────────────────────────────

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local (get one from https://console.groq.com)."
      );
    }
    _client = new Groq({ apiKey });
  }
  return _client;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CallGroqOptions {
  model?: string;
  temperature?: number;
  maxRetries?: number;
  maxTokens?: number;
}

// ── Main Function ────────────────────────────────────────────────────────────

/**
 * Call Groq with JSON mode + Zod validation.
 * Retries on parse/validation failures, injecting the error message.
 */
export async function callGroq<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  opts: CallGroqOptions = {}
): Promise<T> {
  const {
    model = "qwen/qwen3.8-27b",
    temperature = 0, // 0 = fully deterministic; same input always yields same output
    maxRetries = 3,
    maxTokens = 4096,
  } = opts;

  const client = getClient();
  let lastError: Error | null = null;
  let currentUserPrompt = userPrompt;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Groq] Attempt ${attempt}/${maxRetries} — model=${model} temp=${temperature}`
      );

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: currentUserPrompt },
        ],
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxTokens,
      });

      const rawContent = response.choices[0]?.message?.content ?? "";
      console.log(
        `[Groq] Response received (${rawContent.length} chars, attempt ${attempt})`
      );

      // Parse JSON
      const parsed = JSON.parse(rawContent);

      // Validate with Zod
      const validated = schema.parse(parsed);
      console.log(`[Groq] Validation passed on attempt ${attempt}`);
      return validated;
    } catch (err) {
      lastError = err as Error;

      if (err instanceof ZodError) {
        // Inject validation error into next retry prompt
        const errorSummary = err.issues
          .map((e) => `Field "${e.path.join(".")}": ${e.message}`)
          .join("; ");
        console.warn(
          `[Groq] Zod validation failed (attempt ${attempt}): ${errorSummary}`
        );
        currentUserPrompt =
          userPrompt +
          `\n\n[CORRECTION NEEDED — attempt ${attempt} produced invalid JSON: ${errorSummary}. Fix the output to match the required schema exactly.]`;
      } else if (err instanceof SyntaxError) {
        console.warn(
          `[Groq] JSON parse failed (attempt ${attempt}): ${err.message}`
        );
        currentUserPrompt =
          userPrompt +
          `\n\n[CORRECTION NEEDED — attempt ${attempt} produced invalid JSON (parse error). Output ONLY valid JSON with no commentary.]`;
      } else if (isRateLimitError(err)) {
        const retryAfter = extractRetryAfter(err);
        console.warn(
          `[Groq] Rate limited (429). Waiting ${retryAfter}s before retry.`
        );
        await sleep(retryAfter * 1000);
        continue; // Don't modify the prompt for rate limits
      } else {
        console.error(
          `[Groq] Unexpected error (attempt ${attempt}):`,
          (err as Error).message
        );
      }

      // Exponential backoff (skip for rate limits, already handled above)
      if (attempt < maxRetries) {
        const wait = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.log(`[Groq] Retrying in ${wait / 1000}s...`);
        await sleep(wait);
      }
    }
  }

  throw new Error(
    `[Groq] Failed after ${maxRetries} attempts: ${lastError?.message ?? "unknown error"}`
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    return (err as { status: number }).status === 429;
  }
  return false;
}

function extractRetryAfter(err: unknown): number {
  if (
    err &&
    typeof err === "object" &&
    "headers" in err &&
    (err as Record<string, unknown>).headers
  ) {
    const headers = (err as { headers: Record<string, string> }).headers;
    const retryAfter = headers["retry-after"];
    if (retryAfter) return Math.max(parseFloat(retryAfter), 2);
  }
  return 5; // Default 5s wait for rate limits
}
