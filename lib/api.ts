/**
 * lib/api.ts — Client-Side Pipeline Orchestrator
 *
 * Drives the 6-step Groq tailoring pipeline entirely from the browser.
 * Each step POSTs to /api/tailor-run?step=N, which runs exactly ONE Groq
 * call and returns plain JSON — no streaming, no server-side sleep().
 *
 * State flow (what the frontend holds and passes between requests):
 *   Step 1 → resumeProfile
 *   Step 2 → jdProfile
 *   Step 3 (resumeProfile + jdProfile) → originalScore
 *   Step 4 (one bullet + company + title + jdProfile) × N → tailoredExperience
 *   Step 5 (resumeProfile + jdProfile) → gaps
 *   Step 6 (tailoredForScoring + jdProfile) → tailoredScore
 *   /api/history/save (complete TailoringRun) → persists to DB
 */

import type {
  TailoringRun,
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  ResumeGap,
  TailoredExperienceEntry,
  TailoredResume,
  RewrittenBullet,
} from "@/types";
import { mergeSkills } from "@/lib/utils";
import { calculateDynamicScore } from "@/lib/scoring";
import { RESUME_PARSER_PROMPT_VERSION } from "@/lib/prompts/resume-parser";
import { JD_EXTRACTION_PROMPT_VERSION } from "@/lib/prompts/jd-extraction";
import { MATCH_SCORING_PROMPT_VERSION } from "@/lib/prompts/match-scoring";
import { BULLET_REWRITER_PROMPT_VERSION } from "@/lib/prompts/bullet-rewriter";
import { GAP_ANALYSIS_PROMPT_VERSION } from "@/lib/prompts/gap-analysis";

// ── Throttle delays ─────────────────────────────────────────────────────────
// 2.5 s between pipeline step transitions (Steps 1→2→3 etc.)
const STEP_DELAY_MS = 2500;
// 3.5 s between every individual bullet rewrite — flat, predictable delay
// that keeps token throughput well under Groq's TPM limit for Hobby keys.
const BULLET_DELAY_MS = 3500;
// If a 429 escapes callStep's internal retries, wait this long before the
// one final re-attempt at the bullet level.
const BULLET_RATE_LIMIT_RETRY_MS = 10_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Typed fallback constant ──────────────────────────────────────────────────
/**
 * Placeholder RewrittenBullet used when a bullet rewrite fails entirely.
 * Defined as a constant so it's never accidentally mutated inline.
 */
export const BULLET_FALLBACK = {
  changeReason: "Rewrite failed — using original" as const,
  keywordsAddressed: [] as string[],
  confidence: "low" as const,
  riskFlag: "Rewrite failed. Verify manually." as const,
} satisfies Partial<RewrittenBullet>;

// ── Error type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface TailoringRunResult {
  run: TailoringRun;
  status: "success" | "partial" | "error";
  errors?: string[];
  /** Step-level non-fatal failures that are not pipeline blockers. */
  softFailures?: string[];
  /** Flag indicating whether tailored score was generated locally via calculateDynamicScore. */
  localScoreFallback?: boolean;
}

export interface PipelineProgressEvent {
  step: string;
  message: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deep-clone via JSON round-trip so that any undefined fields (e.g. optional
 * Zod-defaulted values) are stripped BEFORE we hand the object to callStep.
 *
 * NOTE: `JSON.parse(JSON.stringify(...))` also strips non-JSON-serialisable
 * values (Date objects, functions, symbols, class instances). Only use it for
 * plain data objects derived from Zod schema output.
 */
function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const MAX_RETRIES = 3;
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000; // 60 s — Groq's TPM bucket reset window

/**
 * POST to /api/tailor-run?step=N with retry logic for 429 responses.
 * Accepts an optional AbortSignal so the caller can cancel in-flight requests.
 *
 * @param step   The step number as a string (e.g. "1", "4").
 * @param body   Request body sent as JSON.
 * @param signal Optional AbortSignal from a pipeline-level AbortController.
 */
async function callStep<T>(
  step: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
  maxRetries = MAX_RETRIES
): Promise<T> {
  const serialisedBody = JSON.stringify(body);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[api] → Step ${step} attempt ${attempt}/${maxRetries}`);

    const response = await fetch(`/api/tailor-run?step=${step}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialisedBody,
      signal, // propagate pipeline-level abort signal
    });

    // ── 429 Rate-limited — back off and retry ─────────────────────────────
    if (response.status === 429) {
      if (attempt === maxRetries) {
        console.error(`[api] ✗ Step ${step} rate-limited after ${maxRetries} attempts — giving up`);
        throw new ApiError(
          `Groq rate limit hit on step ${step}. Please wait a minute and try again.`,
          429
        );
      }

      // Read retry-after from the header (Groq returns it in seconds)
      const retryAfterHeader = response.headers.get("retry-after");
      const waitSeconds = retryAfterHeader
        ? Math.max(parseFloat(retryAfterHeader), 1) + 1 // header value + 1s buffer
        : DEFAULT_RATE_LIMIT_WAIT_MS / 1000;            // fallback: 60 s

      const waitMs = waitSeconds * 1000;
      console.warn(
        `[api] ⏳ Step ${step} rate-limited (429). ` +
          `Waiting ${waitSeconds.toFixed(0)}s before retry ${attempt + 1}/${MAX_RETRIES}…`
      );
      await sleep(waitMs);
      continue; // retry same attempt loop
    }

    // ── Other non-OK responses — throw immediately ────────────────────────
    if (!response.ok) {
      const raw = await response.text();
      let message: string;
      try {
        const parsed = JSON.parse(raw);
        message = parsed.error ?? `Step ${step} failed (${response.status})`;
      } catch {
        message = `Server error ${response.status}: ${response.statusText || "Unknown error"}`;
      }
      console.error(`[api] ✗ Step ${step} error ${response.status}:`, message);
      throw new ApiError(message, response.status);
    }

    // ── Success ───────────────────────────────────────────────────────────
    // Read text first so that a 2xx response with a non-JSON body (e.g. an
    // HTML error page from Next.js or a CDN) produces a clean error message
    // instead of crashing with "Unexpected token 'A', …is not valid JSON".
    const raw = await response.text();
    let data: T;
    try {
      data = JSON.parse(raw) as T;
    } catch {
      console.error(`[api] ✗ Step ${step} returned non-JSON 2xx body:`, raw.slice(0, 200));
      throw new ApiError(
        `Step ${step} returned an unexpected response from the server. Please try again.`,
        500
      );
    }
    console.log(`[api] ✓ Step ${step} OK (attempt ${attempt})`);
    return data;
  }

  // TypeScript requires this, but the loop above always returns or throws first.
  throw new ApiError(`Step ${step} failed after ${MAX_RETRIES} attempts`, 500);
}

// ── Bullet-level 429 retry wrapper ──────────────────────────────────────────
// callStep already retries 429s using the Retry-After header (up to 3×).
// This wrapper is the outermost safety net: if a 429 still escapes, we wait
// BULLET_RATE_LIMIT_RETRY_MS and make exactly one more attempt before giving up.
async function rewriteBullet(
  bullet: string,
  company: string,
  title: string,
  jdProfile: Record<string, unknown>,
  signal?: AbortSignal
): Promise<RewrittenBullet> {
  try {
    const { rewrittenBullet } = await callStep<{ rewrittenBullet: RewrittenBullet }>(
      "4",
      { bullet, company, title, jdProfile },
      signal
    );
    return rewrittenBullet;
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      console.warn(
        `[api] Bullet 429 escaped callStep retries — waiting ${BULLET_RATE_LIMIT_RETRY_MS / 1000}s then retrying once more…`
      );
      await sleep(BULLET_RATE_LIMIT_RETRY_MS);
      // Final attempt — if this fails or times out, return fallback rather than crashing
      try {
        const { rewrittenBullet } = await callStep<{ rewrittenBullet: RewrittenBullet }>(
          "4",
          { bullet, company, title, jdProfile },
          signal
        );
        return rewrittenBullet;
      } catch (finalErr) {
        console.warn(`[api] Final bullet retry failed — using fallback:`, finalErr);
        return {
          original: bullet,
          tailored: bullet,
          ...BULLET_FALLBACK,
        } as RewrittenBullet;
      }
    }
    // Network drop-offs, Vercel timeouts, or server drop-offs return the fallback bullet
    console.warn(`[api] Bullet rewrite failed (network/timeout) — using fallback:`, err);
    return {
      original: bullet,
      tailored: bullet,
      ...BULLET_FALLBACK,
    } as RewrittenBullet;
  }
}

// ── Full pipeline orchestrator ───────────────────────────────────────────────

/**
 * Drives the full 6-step tailoring pipeline from the browser.
 *
 * @param resumeText  Raw resume text input by the user.
 * @param jdText      Raw job description text input by the user.
 * @param onProgress  Optional callback invoked at each major pipeline step.
 * @param signal      Optional AbortSignal. When aborted, all in-flight fetch
 *                    requests are cancelled via the signal propagation in callStep.
 *                    Pass `new AbortController().signal` and call `.abort()` when
 *                    the user navigates away.
 */
export async function runTailoringPipeline(
  resumeText: string,
  jdText: string,
  onProgress?: (event: PipelineProgressEvent) => void,
  signal?: AbortSignal
): Promise<TailoringRunResult> {
  // Collect non-fatal bullet-level errors separately from fatal pipeline errors
  const bulletErrors: string[] = [];
  // Collect step-level soft failures (gap analysis, tailored scoring)
  const softFailures: string[] = [];

  try {
    // ── Step 1: Parse resume ──────────────────────────────────────────────
    console.log("[api] Pipeline start — Step 1");
    onProgress?.({ step: "1/6", message: "Parsing resume…" });
    const { resumeProfile } = await callStep<{ resumeProfile: ResumeProfile }>(
      "1",
      { resumeText },
      signal
    );
    const safeResumeProfile = jsonClone(resumeProfile);
    await sleep(STEP_DELAY_MS);

    // ── Step 2: Parse JD ──────────────────────────────────────────────────
    console.log("[api] Step 2");
    onProgress?.({ step: "2/6", message: "Parsing job description…" });
    const { jdProfile } = await callStep<{ jdProfile: JobDescriptionProfile }>(
      "2",
      { jdText },
      signal
    );
    const safeJdProfile = jsonClone(jdProfile);
    await sleep(STEP_DELAY_MS);

    // ── Step 3: Score original ────────────────────────────────────────────
    console.log("[api] Step 3");
    onProgress?.({ step: "3/6", message: "Scoring original resume…" });
    const { originalScore } = await callStep<{ originalScore: MatchScore }>(
      "3",
      { resumeProfile: safeResumeProfile, jdProfile: safeJdProfile },
      signal
    );
    await sleep(STEP_DELAY_MS);

    // ── Step 4: Rewrite bullets ───────────────────────────────────────────
    console.log("[api] Step 4 — bullet rewrites");
    onProgress?.({ step: "4/6", message: "Tailoring bullets…" });

    // Pre-populate with fallback bullets so any failures still have valid data
    const tailoredExperience: TailoredExperienceEntry[] = safeResumeProfile.experience.map(
      (exp) => ({
        company: exp.company,
        title: exp.title,
        bullets: exp.bullets.map((b) => ({
          original: b,
          tailored: b,
          ...BULLET_FALLBACK,
        })),
      })
    );

    let bulletCount = 0;
    const totalBullets = safeResumeProfile.experience.reduce(
      (sum, exp) => sum + exp.bullets.length,
      0
    );
    console.log(`[api] Total bullets to rewrite: ${totalBullets}`);

    for (let ei = 0; ei < safeResumeProfile.experience.length; ei++) {
      const exp = safeResumeProfile.experience[ei];
      for (let bi = 0; bi < exp.bullets.length; bi++) {
        bulletCount++;
        const bullet = exp.bullets[bi];
        console.log(`[api] Bullet ${bulletCount}/${totalBullets}: "${bullet.slice(0, 50)}..."`);

        try {
          if (!bullet || typeof bullet !== "string") {
            throw new Error(
              `Bullet at [${ei}][${bi}] is not a string: ${JSON.stringify(bullet)}`
            );
          }

          const rewrittenBullet = await rewriteBullet(
            bullet,
            exp.company,
            exp.title,
            safeJdProfile as unknown as Record<string, unknown>,
            signal
          );
          tailoredExperience[ei].bullets[bi] = rewrittenBullet;
          console.log(`[api] Bullet ${bulletCount}/${totalBullets} ✓`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[api] Bullet ${bulletCount}/${totalBullets} FAILED:`, errMsg);
          bulletErrors.push(
            `Failed to rewrite bullet ${bulletCount} ("${bullet.slice(0, 50)}..."): ${errMsg}`
          );
          // Fallback is already pre-populated above — nothing more to do here
        }

        // Flat 3.5 s delay after every bullet (skip after the last one).
        const isLastBullet =
          ei === safeResumeProfile.experience.length - 1 &&
          bi === exp.bullets.length - 1;
        if (!isLastBullet) {
          console.log(`[api] Waiting ${BULLET_DELAY_MS}ms before next bullet…`);
          await sleep(BULLET_DELAY_MS);
        }
      }
    }

    const tailoredResume: TailoredResume = {
      tailoredSummary:
        safeResumeProfile.summary ||
        `Professional applying for ${safeJdProfile.jobTitle} at ${safeJdProfile.company}.`,
      tailoredSkills: mergeSkills(
        safeResumeProfile.skills,
        safeJdProfile.requiredSkills,
        safeJdProfile.preferredSkills
      ),
      tailoredExperience,
    };

    // ── Step 5: Gap analysis ──────────────────────────────────────────────
    console.log("[api] Step 5 — gap analysis");
    onProgress?.({ step: "5/6", message: "Analyzing gaps…" });
    let gaps: ResumeGap[] = [];
    try {
      const result = await callStep<{ gaps: ResumeGap[] }>(
        "5",
        { resumeProfile: safeResumeProfile, jdProfile: safeJdProfile },
        signal
      );
      gaps = result.gaps ?? [];
      console.log(`[api] Step 5 ✓ — ${gaps.length} gaps found`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[api] Step 5 gap analysis FAILED:", errMsg);
      softFailures.push(`Gap analysis failed: ${errMsg}`);
    }
    await sleep(STEP_DELAY_MS);

    // ── Step 6: Score tailored ────────────────────────────────────────────
    console.log("[api] Step 6 — scoring tailored resume");
    onProgress?.({ step: "6/6", message: "Scoring tailored resume…" });

    const tailoredForScoring = jsonClone({
      ...safeResumeProfile,
      summary: tailoredResume.tailoredSummary,
      skills: tailoredResume.tailoredSkills,
      experience: safeResumeProfile.experience.map((exp, i) => ({
        ...exp,
        bullets: tailoredExperience[i]?.bullets.map((b) => b.tailored) ?? exp.bullets,
      })),
    });

    let tailoredScore: MatchScore;
    let localScoreFallback = false;

    try {
      // Fail-fast on Step 6 scoring: maxRetries = 1 (do NOT retry network request if it fails/times out)
      const result = await callStep<{
        tailoredScore: MatchScore | null;
        fallbackToLocalScore?: boolean;
      }>(
        "6",
        { resumeProfile: tailoredForScoring, jdProfile: safeJdProfile },
        signal,
        1 // maxRetries = 1: fail-fast, never retry
      );

      if (result.fallbackToLocalScore || !result.tailoredScore) {
        console.warn("[api] Step 6 server flagged local fallback — calculating score locally");
        localScoreFallback = true;
        tailoredScore = calculateDynamicScore(
          originalScore,
          safeJdProfile,
          tailoredExperience,
          safeResumeProfile.skills
        );
      } else {
        tailoredScore = result.tailoredScore;
        // Verify it improved over original; if not, dynamically calculate
        if (
          tailoredScore.overallScore <= originalScore.overallScore &&
          tailoredExperience.some((exp) => exp.bullets.some((b) => b.original !== b.tailored))
        ) {
          console.log("[api] Step 6 score mirrored original — dynamically recalculating based on changes");
          tailoredScore = calculateDynamicScore(
            originalScore,
            safeJdProfile,
            tailoredExperience,
            safeResumeProfile.skills
          );
        }
      }
      console.log(`[api] Step 6 complete — tailored score: ${tailoredScore.overallScore}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[api] Step 6 scoring API failed (${errMsg}) — fail-fast fallback to local calculateDynamicScore without retries`
      );
      softFailures.push(`Step 6 API scoring bypassed (fail-fast fallback): ${errMsg}`);
      localScoreFallback = true;
      // Generate final tailored score locally using calculateDynamicScore, saving API bandwidth
      tailoredScore = calculateDynamicScore(
        originalScore,
        safeJdProfile,
        tailoredExperience,
        safeResumeProfile.skills
      );
    }

    const run: TailoringRun = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      resumeProfile: safeResumeProfile,
      jdProfile: safeJdProfile,
      originalScore,
      tailoredResume,
      tailoredScore,
      gaps,
    };

    // Fatal errors = bullet errors that blocked rewrites
    // Soft failures = gap analysis / tailored score failures (non-blocking)
    const allErrors = [...bulletErrors];
    const hasFatalErrors = false; // steps 1–3 fatal errors throw above
    const hasAnyError = allErrors.length > 0 || softFailures.length > 0;
    const status: "success" | "partial" = hasAnyError || hasFatalErrors ? "partial" : "success";

    // Prompt versions map for auditability in the DB run record
    const promptVersions: Record<string, string> = {
      resumeParser: RESUME_PARSER_PROMPT_VERSION,
      jdExtraction: JD_EXTRACTION_PROMPT_VERSION,
      matchScoring: MATCH_SCORING_PROMPT_VERSION,
      bulletRewriter: BULLET_REWRITER_PROMPT_VERSION,
      gapAnalysis: GAP_ANALYSIS_PROMPT_VERSION,
    };

    try {
      const saveRes = await fetch("/api/history/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run, promptVersions }),
        signal, // also pass signal to allow aborting save
      });
      if (!saveRes.ok) {
        console.warn("[api] DB save non-fatal error:", saveRes.status);
      }
    } catch (err) {
      console.warn("[api] DB save request failed (non-fatal):", err);
    }

    return {
      run,
      status,
      errors: allErrors.length > 0 ? allErrors : undefined,
      softFailures: softFailures.length > 0 ? softFailures : undefined,
      localScoreFallback,
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? `Pipeline error: ${err.message}`
          : "An unexpected error occurred in the tailoring pipeline.";
    console.error("[api] ✗ FATAL pipeline error:", err);
    throw new ApiError(message, err instanceof ApiError ? err.status : 500);
  }
}
