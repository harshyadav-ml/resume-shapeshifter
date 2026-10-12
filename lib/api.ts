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
}

export interface PipelineProgressEvent {
  step: string;
  message: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deep-clone via JSON round-trip so that any undefined fields (e.g. optional
 * Zod-defaulted values) are stripped BEFORE we hand the object to callStep.
 */
function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const MAX_RETRIES = 3;
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000; // 60 s — Groq's TPM bucket reset window

async function callStep<T>(
  step: string,
  body: Record<string, unknown>
): Promise<T> {
  const serialisedBody = JSON.stringify(body);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[api] → Step ${step} attempt ${attempt}/${MAX_RETRIES}`);

    const response = await fetch(`/api/tailor-run?step=${step}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialisedBody,
    });

    // ── 429 Rate-limited — back off and retry ─────────────────────────────
    if (response.status === 429) {
      if (attempt === MAX_RETRIES) {
        console.error(`[api] ✗ Step ${step} rate-limited after ${MAX_RETRIES} attempts — giving up`);
        throw new ApiError(
          `Groq rate limit hit on step ${step}. Please wait a minute and try again.`,
          429
        );
      }

      // Read retry-after from the header (Groq returns it in seconds)
      const retryAfterHeader = response.headers.get("retry-after");
      const waitSeconds = retryAfterHeader
        ? Math.max(parseFloat(retryAfterHeader), 1) + 1  // header value + 1s buffer
        : DEFAULT_RATE_LIMIT_WAIT_MS / 1000;             // fallback: 60 s

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

function mergeSkills(
  resumeSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): string[] {
  const resumeLower = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const jdMatched: string[] = [];
  for (const skill of [...requiredSkills, ...preferredSkills]) {
    if (resumeLower.has(skill.toLowerCase()) && !jdMatched.includes(skill)) {
      jdMatched.push(skill);
    }
  }
  const remaining = resumeSkills.filter((s) => !jdMatched.includes(s));
  return [...jdMatched, ...remaining];
}

// ── Bullet-level 429 retry wrapper ──────────────────────────────────────────
// callStep already retries 429s using the Retry-After header (up to 3×).
// This wrapper is the outermost safety net: if a 429 still escapes, we wait
// BULLET_RATE_LIMIT_RETRY_MS and make exactly one more attempt before giving up.
async function rewriteBullet(
  bullet: string,
  company: string,
  title: string,
  jdProfile: Record<string, unknown>
): Promise<RewrittenBullet> {
  try {
    const { rewrittenBullet } = await callStep<{ rewrittenBullet: RewrittenBullet }>("4", {
      bullet,
      company,
      title,
      jdProfile,
    });
    return rewrittenBullet;
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      console.warn(
        `[api] Bullet 429 escaped callStep retries — waiting ${BULLET_RATE_LIMIT_RETRY_MS / 1000}s then retrying once more…`
      );
      await sleep(BULLET_RATE_LIMIT_RETRY_MS);
      // Final attempt — let any error propagate naturally to the outer catch.
      const { rewrittenBullet } = await callStep<{ rewrittenBullet: RewrittenBullet }>("4", {
        bullet,
        company,
        title,
        jdProfile,
      });
      return rewrittenBullet;
    }
    throw err; // non-429 errors propagate immediately
  }
}

// ── Full pipeline orchestrator ───────────────────────────────────────────────

export async function runTailoringPipeline(
  resumeText: string,
  jdText: string,
  onProgress?: (event: PipelineProgressEvent) => void
): Promise<TailoringRunResult> {
  const errors: string[] = [];

  try {
    // ── Step 1: Parse resume ──────────────────────────────────────────────
    console.log("[api] Pipeline start — Step 1");
    onProgress?.({ step: "1/6", message: "Parsing resume…" });
    const { resumeProfile } = await callStep<{ resumeProfile: ResumeProfile }>(
      "1",
      { resumeText }
    );
    const safeResumeProfile = jsonClone(resumeProfile);
    await sleep(STEP_DELAY_MS);

    // ── Step 2: Parse JD ──────────────────────────────────────────────────
    console.log("[api] Step 2");
    onProgress?.({ step: "2/6", message: "Parsing job description…" });
    const { jdProfile } = await callStep<{ jdProfile: JobDescriptionProfile }>(
      "2",
      { jdText }
    );
    const safeJdProfile = jsonClone(jdProfile);
    await sleep(STEP_DELAY_MS);

    // ── Step 3: Score original ────────────────────────────────────────────
    console.log("[api] Step 3");
    onProgress?.({ step: "3/6", message: "Scoring original resume…" });
    const { originalScore } = await callStep<{ originalScore: MatchScore }>(
      "3",
      { resumeProfile: safeResumeProfile, jdProfile: safeJdProfile }
    );
    await sleep(STEP_DELAY_MS);

    // ── Step 4: Rewrite bullets ───────────────────────────────────────────
    console.log("[api] Step 4 — bullet rewrites");
    onProgress?.({ step: "4/6", message: "Tailoring bullets…" });

    const tailoredExperience: TailoredExperienceEntry[] = safeResumeProfile.experience.map(
      (exp) => ({
        company: exp.company,
        title: exp.title,
        bullets: exp.bullets.map((b) => ({
          original: b,
          tailored: b,
          changeReason: "Rewrite failed — using original",
          keywordsAddressed: [] as string[],
          confidence: "low" as const,
          riskFlag: "Rewrite failed. Verify manually.",
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
            throw new Error(`Bullet at [${ei}][${bi}] is not a string: ${JSON.stringify(bullet)}`);
          }

          const rewrittenBullet = await rewriteBullet(
            bullet,
            exp.company,
            exp.title,
            safeJdProfile as unknown as Record<string, unknown>
          );
          tailoredExperience[ei].bullets[bi] = rewrittenBullet;
          console.log(`[api] Bullet ${bulletCount}/${totalBullets} ✓`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[api] Bullet ${bulletCount}/${totalBullets} FAILED:`, errMsg);
          errors.push(`Failed to rewrite bullet ${bulletCount} ("${bullet.slice(0, 50)}..."): ${errMsg}`);
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
      tailoredSummary: safeResumeProfile.summary || `Professional applying for ${safeJdProfile.jobTitle} at ${safeJdProfile.company}.`,
      tailoredSkills: mergeSkills(safeResumeProfile.skills, safeJdProfile.requiredSkills, safeJdProfile.preferredSkills),
      tailoredExperience,
    };

    // ── Step 5: Gap analysis ──────────────────────────────────────────────
    console.log("[api] Step 5 — gap analysis");
    onProgress?.({ step: "5/6", message: "Analyzing gaps…" });
    let gaps: ResumeGap[] = [];
    try {
      const result = await callStep<{ gaps: ResumeGap[] }>("5", {
        resumeProfile: safeResumeProfile,
        jdProfile: safeJdProfile,
      });
      gaps = result.gaps ?? [];
      console.log(`[api] Step 5 ✓ — ${gaps.length} gaps found`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[api] Step 5 gap analysis FAILED:", errMsg);
      errors.push(`Gap analysis failed: ${errMsg}`);
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
    try {
      const result = await callStep<{ tailoredScore: MatchScore }>("6", {
        resumeProfile: tailoredForScoring,
        jdProfile: safeJdProfile,
      });
      tailoredScore = result.tailoredScore;
      console.log(`[api] Step 6 ✓ — tailored score: ${tailoredScore.overallScore}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[api] Step 6 FAILED:", errMsg);
      errors.push(`Tailored scoring failed: ${errMsg}`);
      tailoredScore = {
        overallScore: originalScore.overallScore,
        skillCoverageScore: originalScore.skillCoverageScore,
        responsibilityAlignmentScore: originalScore.responsibilityAlignmentScore,
        keywordScore: originalScore.keywordScore,
        seniorityScore: originalScore.seniorityScore,
        criticalMissingRequirements: originalScore.criticalMissingRequirements,
        explanation: "Tailored score unavailable — using original score as fallback.",
      };
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

    const status: "success" | "partial" = errors.length > 0 ? "partial" : "success";

    try {
      const saveRes = await fetch("/api/history/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run }),
      });
      if (!saveRes.ok) {
        console.warn("[api] DB save non-fatal error:", saveRes.status);
      }
    } catch (err) {
      console.warn("[api] DB save request failed (non-fatal):", err);
    }

    return { run, status, errors: errors.length > 0 ? errors : undefined };

  } catch (err) {
    const message = err instanceof ApiError ? err.message : err instanceof Error ? `Pipeline error: ${err.message}` : "An unexpected error occurred in the tailoring pipeline.";
    console.error("[api] ✗ FATAL pipeline error:", err);
    throw new ApiError(message, err instanceof ApiError ? err.status : 500);
  }
}
