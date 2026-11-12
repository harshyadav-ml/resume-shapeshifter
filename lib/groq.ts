/**
 * Groq LLM Client — server-side only.
 *
 * Wraps the groq-sdk with:
 * - JSON mode (response_format: { type: "json_object" })
 * - Production-grade exponential backoff with full jitter via `withRetry`
 * - Per-call AbortController timeout (30 s) with a typed GROQTimeoutError
 * - Transient error detection: 429, 500, 502, 503, 504, ECONNRESET, ETIMEDOUT
 * - Auth errors (401, 403) and Zod validation errors on final attempt throw immediately
 * - Zod validation with error-injection retry loop
 * - Structured logger: log.info / log.warn / log.error prefixed with [groq]
 * - Per-call maxTokens override (defaults to 2500)
 * - Model overridable via GROQ_MODEL env var
 */

import Groq from "groq-sdk";
import { ZodSchema, ZodError } from "zod";

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const JITTER_MS = 500;
const CALL_TIMEOUT_MS = 30_000;

// ── Structured Logger ────────────────────────────────────────────────────────

/** Minimal structured logger — thin wrapper that prefixes [groq] and stringifies meta. */
const log = {
  info(msg: string, meta?: unknown): void {
    console.log(`[groq] ${msg}`, meta !== undefined ? JSON.stringify(meta) : "");
  },
  warn(msg: string, meta?: unknown): void {
    console.warn(`[groq] ${msg}`, meta !== undefined ? JSON.stringify(meta) : "");
  },
  error(msg: string, meta?: unknown): void {
    console.error(`[groq] ${msg}`, meta !== undefined ? JSON.stringify(meta) : "");
  },
};

// ── Custom Errors ────────────────────────────────────────────────────────────

/** Thrown when a Groq call exceeds the per-call timeout of CALL_TIMEOUT_MS. */
export class GROQTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Groq call timed out after ${timeoutMs}ms`);
    this.name = "GROQTimeoutError";
  }
}

/** Thrown when Groq returns an auth error (401 or 403). */
export class GROQAuthError extends Error {
  status: number;
  constructor(status: number) {
    super(`Groq authentication failed (HTTP ${status}). Check GROQ_API_KEY.`);
    this.name = "GROQAuthError";
    this.status = status;
  }
}

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

export interface CallGroqOptions {
  /** Model to use. Falls back to GROQ_MODEL env var, then "openai/gpt-oss-120b". */
  model?: string;
  /** Sampling temperature. Default 0 (deterministic). */
  temperature?: number;
  /** Maximum retry attempts. Default 3. */
  maxRetries?: number;
  /**
   * Maximum tokens for this call. Default 2048.
   */
  maxTokens?: number;
}

// ── Backoff Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compute full exponential backoff with jitter.
 * `wait = min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2^attempt) + random(0, JITTER_MS)`
 */
function computeBackoff(attempt: number): number {
  const expo = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempt));
  const jitter = Math.random() * JITTER_MS;
  return expo + jitter;
}

// ── Transient Error Detection ─────────────────────────────────────────────────

/** HTTP status codes that indicate a transient failure and should be retried. */
const TRANSIENT_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);

/** Network error codes that indicate a transient failure and should be retried. */
const TRANSIENT_NETWORK_CODES = new Set(["ECONNRESET", "ETIMEDOUT"]);

/**
 * Returns true if the error is transient and should be retried.
 * Includes 429/5xx HTTP codes and ECONNRESET/ETIMEDOUT network errors.
 */
function isTransientError(err: unknown): boolean {
  if (err && typeof err === "object") {
    // HTTP status errors from groq-sdk
    if ("status" in err) {
      const status = (err as { status: number }).status;
      return TRANSIENT_HTTP_STATUSES.has(status);
    }
    // Network-level errors (Node.js errno codes)
    if ("code" in err) {
      const code = (err as { code: string }).code;
      return TRANSIENT_NETWORK_CODES.has(code);
    }
  }
  return false;
}

/**
 * Returns true if the error is an auth failure (401 or 403).
 * Auth errors should NOT be retried.
 */
function isAuthError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    return status === 401 || status === 403;
  }
  return false;
}

/**
 * Extracts Retry-After seconds from a 429 response header, if present.
 * Falls back to 5 s.
 */
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
  return 5;
}

// ── withRetry HOF ────────────────────────────────────────────────────────────

/**
 * Higher-order function that wraps an async operation with production-grade
 * exponential backoff + full jitter retry logic.
 *
 * - Transient errors (429, 5xx, ECONNRESET, ETIMEDOUT) are retried up to `maxRetries`.
 * - Auth errors (401, 403) throw immediately as GROQAuthError.
 * - On 429, respects the Retry-After header if present.
 * - The `onRetry` callback is invoked before each retry with the attempt number
 *   and the error that triggered the retry, allowing callers to mutate state
 *   (e.g. inject Zod error feedback into the prompt).
 *
 * @param fn        Async operation to wrap.
 * @param maxRetries Maximum total attempts (default 3).
 * @param onRetry   Optional callback invoked before each retry. Return value is ignored.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  onRetry?: (attempt: number, err: unknown) => void
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Auth errors are never retried
      if (isAuthError(err)) {
        const status = (err as { status: number }).status;
        log.error(`Auth error (${status}) — aborting immediately.`);
        throw new GROQAuthError(status);
      }

      const isLast = attempt === maxRetries - 1;

      // ZodErrors on the final attempt bubble up immediately
      if (err instanceof ZodError && isLast) {
        log.error("Zod validation failed on final attempt — aborting.", {
          issues: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        });
        throw err;
      }

      // Notify caller so it can mutate the prompt for Zod / parse retries
      if (onRetry) {
        try {
          onRetry(attempt + 1, err);
        } catch {
          // onRetry errors are silent
        }
      }

      if (isLast) break;

      // Determine wait time
      let waitMs: number;
      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        (err as { status: number }).status === 429
      ) {
        // Respect Retry-After header for rate limits
        waitMs = extractRetryAfter(err) * 1000;
        log.warn(`Rate limited (429). Waiting ${waitMs / 1000}s before retry ${attempt + 2}.`, {
          attempt: attempt + 1,
        });
      } else if (isTransientError(err)) {
        waitMs = computeBackoff(attempt);
        log.warn(`Transient error on attempt ${attempt + 1}. Retrying in ${Math.round(waitMs)}ms.`, {
          error: err instanceof Error ? err.message : String(err),
        });
      } else {
        // Non-transient, non-auth error: still retry with backoff but log louder
        waitMs = computeBackoff(attempt);
        log.error(`Unexpected error on attempt ${attempt + 1}. Retrying in ${Math.round(waitMs)}ms.`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await sleep(waitMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`withRetry failed after ${maxRetries} attempts: ${String(lastError)}`);
}

// ── Main Function ────────────────────────────────────────────────────────────

/**
 * Call Groq with JSON mode + Zod validation.
 *
 * - Applies a 30 s AbortController timeout per call; throws GROQTimeoutError on expiry.
 * - Retries up to `maxRetries` times (default 3) with exponential backoff + jitter.
 * - On Zod/JSON parse failures, injects the error summary into the next retry prompt.
 * - Auth errors (401, 403) throw GROQAuthError immediately without retry.
 *
 * @param systemPrompt System prompt sent to the model.
 * @param userPrompt   User prompt sent to the model.
 * @param schema       Zod schema used to validate the parsed JSON response.
 * @param opts         Per-call options (model, temperature, maxRetries, maxTokens).
 */
export async function callGroq<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  opts: CallGroqOptions = {}
): Promise<T> {
  const {
    // Model: env-var override → explicit option → hardcoded fallback
    model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
    temperature = 0,
    maxRetries = 3,
    maxTokens = 2500,
  } = opts;

  const client = getClient();

  // Track the "current" user prompt — may be mutated on Zod/parse retries
  let currentUserPrompt = userPrompt;

  return withRetry<T>(
    async () => {
      // Per-call AbortController for the 30 s timeout
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => {
        controller.abort();
      }, CALL_TIMEOUT_MS);

      let rawContent: string;
      try {
        log.info(`Calling model=${model} temp=${temperature} maxTokens=${maxTokens ?? "default"}`);
        const response = await client.chat.completions.create(
          {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: currentUserPrompt },
            ],
            response_format: { type: "json_object" },
            temperature,
            ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
          },
          // groq-sdk accepts fetch-compatible options as second arg
          { signal: controller.signal }
        );
        rawContent = response.choices[0]?.message?.content ?? "";
      } catch (err) {
        clearTimeout(timeoutHandle);
        // Translate AbortError → GROQTimeoutError
        if (
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("aborted"))
        ) {
          throw new GROQTimeoutError(CALL_TIMEOUT_MS);
        }
        throw err;
      } finally {
        clearTimeout(timeoutHandle);
      }

      log.info(`Response received (${rawContent.length} chars)`);

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawContent);
      } catch (syntaxErr) {
        // Wrap as a recognizable error so onRetry can inject feedback
        const msg = syntaxErr instanceof Error ? syntaxErr.message : String(syntaxErr);
        throw new SyntaxError(`JSON parse failed: ${msg}`);
      }

      // Validate with Zod — throws ZodError on failure
      const validated = schema.parse(parsed);
      log.info("Validation passed.");
      return validated;
    },
    maxRetries,
    (attempt, err) => {
      // Inject error context into the prompt for the next retry
      if (err instanceof ZodError) {
        const errorSummary = err.issues
          .map((e) => `Field "${e.path.join(".")}": ${e.message}`)
          .join("; ");
        log.warn(`Zod validation failed (attempt ${attempt}): ${errorSummary}`);
        currentUserPrompt =
          userPrompt +
          `\n\n[CORRECTION NEEDED — attempt ${attempt} produced invalid output: ${errorSummary}. Fix the output to match the required schema exactly.]`;
      } else if (err instanceof SyntaxError) {
        log.warn(`JSON parse failed (attempt ${attempt}): ${err.message}`);
        currentUserPrompt =
          userPrompt +
          `\n\n[CORRECTION NEEDED — attempt ${attempt} produced invalid JSON (parse error: ${err.message}). Output ONLY valid JSON with no commentary.]`;
      }
      // For transient HTTP / network errors, keep currentUserPrompt unchanged
    }
  );
}

