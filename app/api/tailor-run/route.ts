/**
 * POST /api/tailor-run?step=N
 *
 * Stateless, single-step API. Each call runs exactly ONE Groq prompt and
 * immediately returns standard JSON. All orchestration, throttling, and
 * state management is handled by the frontend in lib/api.ts.
 *
 * Steps:
 *   ?step=1  parse-resume    { resumeText }               → { resumeProfile }
 *   ?step=2  parse-jd        { jdText }                   → { jdProfile }
 *   ?step=3  score-original  { resumeProfile, jdProfile } → { originalScore }
 *   ?step=4  rewrite-bullet  { bullet, company, title, jdProfile } → { rewrittenBullet }
 *   ?step=5  gap-analysis    { resumeProfile, jdProfile } → { gaps }
 *   ?step=6  score-tailored  { resumeProfile, jdProfile } → { tailoredScore }
 *
 * NO streaming. NO runtime = 'edge'. NO sleep(). Each request completes
 * in under 15 seconds, safely within Vercel Hobby's 60-second limit.
 *
 * Input validation: every request body is validated through `StepInputSchemas`
 * before the LLM is called. Invalid input returns HTTP 422 with Zod issue details.
 */

import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;

import { callGroq } from "@/lib/groq";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  MatchScoreSchema,
  GapAnalysisResultSchema,
  RewrittenBulletSchema,
  StepInputSchemas,
} from "@/lib/schemas";
import {
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserUserPrompt,
  RESUME_PARSER_PROMPT_VERSION,
} from "@/lib/prompts/resume-parser";
import {
  JD_EXTRACTION_SYSTEM_PROMPT,
  buildJDExtractionUserPrompt,
  JD_EXTRACTION_PROMPT_VERSION,
} from "@/lib/prompts/jd-extraction";
import {
  MATCH_SCORING_SYSTEM_PROMPT,
  buildMatchScoringUserPrompt,
  MATCH_SCORING_PROMPT_VERSION,
} from "@/lib/prompts/match-scoring";
import {
  BULLET_REWRITER_SYSTEM_PROMPT,
  buildBulletRewriterUserPrompt,
  BULLET_REWRITER_PROMPT_VERSION,
} from "@/lib/prompts/bullet-rewriter";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisUserPrompt,
  GAP_ANALYSIS_PROMPT_VERSION,
} from "@/lib/prompts/gap-analysis";
import { ZodError } from "zod";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns HTTP 422 with a structured Zod error payload. */
function unprocessableEntity(message: string, issues: ZodError["issues"]) {
  return NextResponse.json(
    { error: message, code: "INVALID_INPUT", details: issues },
    { status: 422 }
  );
}

/** Returns HTTP 400 for entirely malformed requests (bad JSON, unknown step). */
function badRequest(message: string) {
  return NextResponse.json(
    { error: message, code: "BAD_REQUEST" },
    { status: 400 }
  );
}

/** Returns HTTP 200 with a typed data payload. */
function ok(data: Record<string, unknown>) {
  return NextResponse.json(data, { status: 200 });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step");

  // Parse request body as unknown — we will validate via Zod below
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  try {
    switch (step) {
      // ── Step 1: Parse resume ──────────────────────────────────────────────
      case "1": {
        const parsed = StepInputSchemas["1"].safeParse(rawBody);
        if (!parsed.success) {
          return unprocessableEntity("Invalid request body for step 1", parsed.error.issues);
        }
        const { resumeText } = parsed.data;
        console.log("[tailor-run] Step 1: Parsing resume...", {
          promptVersion: RESUME_PARSER_PROMPT_VERSION,
        });
        const resumeProfile = await callGroq(
          RESUME_PARSER_SYSTEM_PROMPT,
          buildResumeParserUserPrompt(resumeText),
          ResumeProfileSchema,
          { maxTokens: 2048 }
        );
        console.log("[tailor-run] Step 1 complete");
        return ok({ resumeProfile });
      }

      // ── Step 2: Parse JD ──────────────────────────────────────────────────
      case "2": {
        const parsed = StepInputSchemas["2"].safeParse(rawBody);
        if (!parsed.success) {
          return unprocessableEntity("Invalid request body for step 2", parsed.error.issues);
        }
        const { jdText } = parsed.data;
        console.log("[tailor-run] Step 2: Parsing JD...", {
          promptVersion: JD_EXTRACTION_PROMPT_VERSION,
        });
        const jdProfile = await callGroq(
          JD_EXTRACTION_SYSTEM_PROMPT,
          buildJDExtractionUserPrompt(jdText),
          JobDescriptionProfileSchema,
          { maxTokens: 2048 }
        );
        console.log("[tailor-run] Step 2 complete");
        return ok({ jdProfile });
      }

      // ── Step 3: Score original ────────────────────────────────────────────
      case "3": {
        const parsed = StepInputSchemas["3"].safeParse(rawBody);
        if (!parsed.success) {
          return unprocessableEntity("Invalid request body for step 3", parsed.error.issues);
        }
        // parsed.data.resumeProfile and jdProfile are fully validated by Zod
        const { resumeProfile, jdProfile } = parsed.data;
        console.log("[tailor-run] Step 3: Scoring original resume...", {
          promptVersion: MATCH_SCORING_PROMPT_VERSION,
        });
        const originalScore = await callGroq(
          MATCH_SCORING_SYSTEM_PROMPT,
          buildMatchScoringUserPrompt(
            resumeProfile as unknown as Record<string, unknown>,
            jdProfile as unknown as Record<string, unknown>
          ),
          MatchScoreSchema,
          { maxTokens: 1024 }
        );
        console.log("[tailor-run] Step 3 complete");
        return ok({ originalScore });
      }

      // ── Step 4: Rewrite a single bullet ──────────────────────────────────
      // The client calls this once per bullet, waiting 2.5s between each call.
      case "4": {
        const parsed = StepInputSchemas["4"].safeParse(rawBody);
        if (!parsed.success) {
          return unprocessableEntity("Invalid request body for step 4", parsed.error.issues);
        }
        const { bullet, company, title, jdProfile } = parsed.data;
        console.log(
          `[tailor-run] Step 4: Rewriting bullet for ${company} — "${bullet.slice(0, 40)}..."`,
          { promptVersion: BULLET_REWRITER_PROMPT_VERSION }
        );

        // Graceful fallback: if the LLM fails this bullet (even after all
        // withRetry attempts), return HTTP 200 with the original text so the
        // client pipeline can continue rather than surfacing a 500.
        let rewrittenBullet: {
          original: string;
          tailored: string;
          changeReason: string;
          keywordsAddressed: string[];
          confidence: "high" | "medium" | "low";
          riskFlag: string;
        };
        try {
          rewrittenBullet = await callGroq(
            BULLET_REWRITER_SYSTEM_PROMPT,
            buildBulletRewriterUserPrompt(
              bullet,
              company,
              title,
              jdProfile as unknown as Record<string, unknown>
            ),
            RewrittenBulletSchema,
            { maxTokens: 2048 }
          );
          console.log("[tailor-run] Step 4 bullet complete");
        } catch (bulletErr) {
          const errMsg =
            bulletErr instanceof Error ? bulletErr.message : String(bulletErr);
          console.warn(
            `[tailor-run] Step 4 bullet rewrite failed — using fallback. Error: ${errMsg}`
          );
          rewrittenBullet = {
            original: bullet,
            tailored: bullet,
            changeReason: "LLM rewrite failed — original preserved",
            keywordsAddressed: [],
            confidence: "low",
            riskFlag: "LLM rewrite failed. Verify manually before submitting.",
          };
        }
        return ok({ rewrittenBullet });
      }

      // ── Step 5: Gap analysis ──────────────────────────────────────────────
      case "5": {
        const parsed = StepInputSchemas["5"].safeParse(rawBody);
        if (!parsed.success) {
          return unprocessableEntity("Invalid request body for step 5", parsed.error.issues);
        }
        const { resumeProfile, jdProfile } = parsed.data;
        console.log("[tailor-run] Step 5: Gap analysis...", {
          promptVersion: GAP_ANALYSIS_PROMPT_VERSION,
        });
        const gapResult = await callGroq(
          GAP_ANALYSIS_SYSTEM_PROMPT,
          buildGapAnalysisUserPrompt(
            resumeProfile as unknown as Record<string, unknown>,
            jdProfile as unknown as Record<string, unknown>
          ),
          GapAnalysisResultSchema,
          { maxTokens: 2048 }
        );
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const gaps = [...gapResult.gaps].sort(
          (a, b) => (order[a.importance] ?? 3) - (order[b.importance] ?? 3)
        );
        console.log("[tailor-run] Step 5 complete");
        return ok({ gaps });
      }

      // ── Step 6: Score tailored resume ─────────────────────────────────────
      // The client assembles tailoredForScoring from resumeProfile + tailored
      // bullets collected during the Step 4 bullet loop, then sends it here.
      case "6": {
        const parsed = StepInputSchemas["6"].safeParse(rawBody);
        if (!parsed.success) {
          return unprocessableEntity("Invalid request body for step 6", parsed.error.issues);
        }
        const { resumeProfile, jdProfile } = parsed.data;
        console.log("[tailor-run] Step 6: Scoring tailored resume...", {
          promptVersion: MATCH_SCORING_PROMPT_VERSION,
        });
        const tailoredScore = await callGroq(
          MATCH_SCORING_SYSTEM_PROMPT,
          buildMatchScoringUserPrompt(
            resumeProfile as unknown as Record<string, unknown>,
            jdProfile as unknown as Record<string, unknown>
          ),
          MatchScoreSchema,
          { maxTokens: 1024 }
        );
        console.log("[tailor-run] Step 6 complete");
        return ok({ tailoredScore });
      }

      default:
        return badRequest(`Unknown step "${step}". Must be 1–6.`);
    }
  } catch (error) {
    console.error(`[tailor-run] Step ${step} failed:`, error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
