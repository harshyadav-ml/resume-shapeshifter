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
} from "@/lib/schemas";
import {
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserUserPrompt,
} from "@/lib/prompts/resume-parser";
import {
  JD_EXTRACTION_SYSTEM_PROMPT,
  buildJDExtractionUserPrompt,
} from "@/lib/prompts/jd-extraction";
import {
  MATCH_SCORING_SYSTEM_PROMPT,
  buildMatchScoringUserPrompt,
} from "@/lib/prompts/match-scoring";
import {
  BULLET_REWRITER_SYSTEM_PROMPT,
  buildBulletRewriterUserPrompt,
} from "@/lib/prompts/bullet-rewriter";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisUserPrompt,
} from "@/lib/prompts/gap-analysis";

// ── Helpers ──────────────────────────────────────────────────────────────────

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function ok(data: Record<string, unknown>) {
  return NextResponse.json(data, { status: 200 });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  try {
    switch (step) {
      // ── Step 1: Parse resume ──────────────────────────────────────────────
      case "1": {
        const { resumeText } = body;
        if (!resumeText || typeof resumeText !== "string") {
          return badRequest("resumeText (string) is required");
        }
        console.log("[tailor-run] Step 1: Parsing resume...");
        const resumeProfile = await callGroq(
          RESUME_PARSER_SYSTEM_PROMPT,
          buildResumeParserUserPrompt(resumeText),
          ResumeProfileSchema
        );
        console.log("[tailor-run] Step 1 complete");
        return ok({ resumeProfile });
      }

      // ── Step 2: Parse JD ──────────────────────────────────────────────────
      case "2": {
        const { jdText } = body;
        if (!jdText || typeof jdText !== "string") {
          return badRequest("jdText (string) is required");
        }
        console.log("[tailor-run] Step 2: Parsing JD...");
        const jdProfile = await callGroq(
          JD_EXTRACTION_SYSTEM_PROMPT,
          buildJDExtractionUserPrompt(jdText),
          JobDescriptionProfileSchema
        );
        console.log("[tailor-run] Step 2 complete");
        return ok({ jdProfile });
      }

      // ── Step 3: Score original ────────────────────────────────────────────
      case "3": {
        const { resumeProfile, jdProfile } = body;
        if (!resumeProfile || !jdProfile) {
          return badRequest("resumeProfile and jdProfile are required");
        }
        console.log("[tailor-run] Step 3: Scoring original resume...");
        const originalScore = await callGroq(
          MATCH_SCORING_SYSTEM_PROMPT,
          buildMatchScoringUserPrompt(
            resumeProfile as Record<string, unknown>,
            jdProfile as Record<string, unknown>
          ),
          MatchScoreSchema
        );
        console.log("[tailor-run] Step 3 complete");
        return ok({ originalScore });
      }

      // ── Step 4: Rewrite a single bullet ──────────────────────────────────
      // The client calls this once per bullet, waiting 2.5s between each call.
      case "4": {
        const { bullet, company, title, jdProfile } = body;
        if (
          !bullet || typeof bullet !== "string" ||
          !company || typeof company !== "string" ||
          !title || typeof title !== "string" ||
          !jdProfile
        ) {
          return badRequest(
            "bullet (string), company (string), title (string), and jdProfile are required"
          );
        }
        console.log(
          `[tailor-run] Step 4: Rewriting bullet for ${company} — "${(bullet as string).slice(0, 40)}..."`
        );
        const rewrittenBullet = await callGroq(
          BULLET_REWRITER_SYSTEM_PROMPT,
          buildBulletRewriterUserPrompt(
            bullet,
            company,
            title,
            jdProfile as Record<string, unknown>
          ),
          RewrittenBulletSchema
        );
        console.log("[tailor-run] Step 4 bullet complete");
        return ok({ rewrittenBullet });
      }

      // ── Step 5: Gap analysis ──────────────────────────────────────────────
      case "5": {
        const { resumeProfile, jdProfile } = body;
        if (!resumeProfile || !jdProfile) {
          return badRequest("resumeProfile and jdProfile are required");
        }
        console.log("[tailor-run] Step 5: Gap analysis...");
        const gapResult = await callGroq(
          GAP_ANALYSIS_SYSTEM_PROMPT,
          buildGapAnalysisUserPrompt(
            resumeProfile as Record<string, unknown>,
            jdProfile as Record<string, unknown>
          ),
          GapAnalysisResultSchema
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
        const { resumeProfile, jdProfile } = body;
        if (!resumeProfile || !jdProfile) {
          return badRequest(
            "resumeProfile (tailored version) and jdProfile are required"
          );
        }
        console.log("[tailor-run] Step 6: Scoring tailored resume...");
        const tailoredScore = await callGroq(
          MATCH_SCORING_SYSTEM_PROMPT,
          buildMatchScoringUserPrompt(
            resumeProfile as Record<string, unknown>,
            jdProfile as Record<string, unknown>
          ),
          MatchScoreSchema
        );
        console.log("[tailor-run] Step 6 complete");
        return ok({ tailoredScore });
      }

      default:
        return NextResponse.json(
          { error: `Unknown step "${step}". Must be 1–6.` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[tailor-run] Step ${step} failed:`, error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
