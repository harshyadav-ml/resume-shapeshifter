/**
 * POST /api/tailor-run
 *
 * Full orchestrator — runs the complete tailoring pipeline:
 *   parse resume → parse JD → score (original) → tailor → gaps → score (tailored)
 *
 * Returns a complete TailoringRun object.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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
import type {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  TailoredExperienceEntry,
  RewrittenBullet,
  ResumeGap,
  TailoringRun,
} from "@/types";

const INTER_CALL_DELAY_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const errors: string[] = [];
  let status: "success" | "partial" | "error" = "success";

  try {
    const body = await request.json();
    const { resumeText, jdText } = body;

    if (
      !resumeText ||
      !jdText ||
      typeof resumeText !== "string" ||
      typeof jdText !== "string"
    ) {
      return NextResponse.json(
        { error: "Both resumeText and jdText are required" },
        { status: 422 }
      );
    }

    console.log("[tailor-run] Starting pipeline...");

    // ── Step 1: Parse resume ────────────────────────────────────────────
    console.log("[tailor-run] Step 1: Parsing resume...");
    const resumeProfile = await callGroq<ResumeProfile>(
      RESUME_PARSER_SYSTEM_PROMPT,
      buildResumeParserUserPrompt(resumeText),
      ResumeProfileSchema
    );

    // ── Step 2: Parse JD ────────────────────────────────────────────────
    console.log("[tailor-run] Step 2: Parsing JD...");
    const jdProfile = await callGroq<JobDescriptionProfile>(
      JD_EXTRACTION_SYSTEM_PROMPT,
      buildJDExtractionUserPrompt(jdText),
      JobDescriptionProfileSchema
    );

    // ── Step 3: Score (original) ────────────────────────────────────────
    console.log("[tailor-run] Step 3: Scoring original resume...");
    const originalScore = await callGroq<MatchScore>(
      MATCH_SCORING_SYSTEM_PROMPT,
      buildMatchScoringUserPrompt(
        resumeProfile as unknown as Record<string, unknown>,
        jdProfile as unknown as Record<string, unknown>
      ),
      MatchScoreSchema
    );

    // ── Step 4: Tailor bullets ──────────────────────────────────────────
    console.log("[tailor-run] Step 4: Tailoring bullets...");
    const tailoredExperience: TailoredExperienceEntry[] = [];

    for (const exp of resumeProfile.experience) {
      const rewrittenBullets: RewrittenBullet[] = [];

      for (const bullet of exp.bullets) {
        try {
          const rewritten = await callGroq<RewrittenBullet>(
            BULLET_REWRITER_SYSTEM_PROMPT,
            buildBulletRewriterUserPrompt(
              bullet,
              exp.company,
              exp.title,
              jdProfile as unknown as Record<string, unknown>
            ),
            RewrittenBulletSchema,
            { temperature: 0.3 }
          );
          rewrittenBullets.push(rewritten);
        } catch (err) {
          console.error(
            `[tailor-run] Bullet failed: "${bullet.slice(0, 40)}..."`,
            err
          );
          errors.push(`Failed to rewrite bullet: "${bullet.slice(0, 60)}..."`);
          rewrittenBullets.push({
            original: bullet,
            tailored: bullet,
            changeReason: "Rewrite failed — using original",
            keywordsAddressed: [],
            confidence: "low" as const,
            riskFlag: "Rewrite failed. Verify manually.",
          });
        }
        await sleep(INTER_CALL_DELAY_MS);
      }

      tailoredExperience.push({
        company: exp.company,
        title: exp.title,
        bullets: rewrittenBullets,
      });
    }

    const tailoredResume: TailoredResume = {
      tailoredSummary:
        resumeProfile.summary ||
        `Professional applying for ${jdProfile.jobTitle} at ${jdProfile.company}.`,
      tailoredSkills: mergeSkills(
        resumeProfile.skills,
        jdProfile.requiredSkills,
        jdProfile.preferredSkills
      ),
      tailoredExperience,
    };

    // ── Step 5: Gap analysis ────────────────────────────────────────────
    console.log("[tailor-run] Step 5: Analyzing gaps...");
    let gaps: ResumeGap[] = [];
    try {
      const gapResult = await callGroq(
        GAP_ANALYSIS_SYSTEM_PROMPT,
        buildGapAnalysisUserPrompt(
          resumeProfile as unknown as Record<string, unknown>,
          jdProfile as unknown as Record<string, unknown>
        ),
        GapAnalysisResultSchema
      );
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      gaps = [...gapResult.gaps].sort(
        (a, b) => (order[a.importance] ?? 3) - (order[b.importance] ?? 3)
      );
    } catch (err) {
      console.error("[tailor-run] Gap analysis failed:", err);
      errors.push("Gap analysis failed");
    }

    // ── Step 6: Score (tailored) ────────────────────────────────────────
    console.log("[tailor-run] Step 6: Scoring tailored resume...");
    // Build a "pseudo resume" with tailored bullets for scoring
    const tailoredForScoring = {
      ...resumeProfile,
      summary: tailoredResume.tailoredSummary,
      skills: tailoredResume.tailoredSkills,
      experience: resumeProfile.experience.map((exp, i) => ({
        ...exp,
        bullets:
          tailoredExperience[i]?.bullets.map((b) => b.tailored) ?? exp.bullets,
      })),
    };

    const tailoredScore = await callGroq<MatchScore>(
      MATCH_SCORING_SYSTEM_PROMPT,
      buildMatchScoringUserPrompt(
        tailoredForScoring as unknown as Record<string, unknown>,
        jdProfile as unknown as Record<string, unknown>
      ),
      MatchScoreSchema
    );

    // ── Assemble TailoringRun ───────────────────────────────────────────
    const runId = crypto.randomUUID();
    const run: TailoringRun = {
      id: runId,
      createdAt: new Date().toISOString(),
      resumeProfile,
      jdProfile,
      originalScore,
      tailoredResume,
      tailoredScore,
      gaps,
    };

    if (errors.length > 0) {
      status = "partial";
    }

    // ── Persist to SQLite ───────────────────────────────────────────────
    try {
      await db.tailoringRunRecord.create({
        data: {
          id: run.id,
          jobTitle: jdProfile.jobTitle,
          company: jdProfile.company,
          originalScore: originalScore.overallScore,
          tailoredScore: tailoredScore.overallScore,
          runJson: JSON.stringify(run),
        },
      });
      console.log(`[tailor-run] Saved run ${run.id} to DB`);
    } catch (dbErr) {
      console.error("[tailor-run] DB save failed (non-fatal):", dbErr);
    }

    console.log(
      `[tailor-run] Pipeline complete — status=${status}, original=${originalScore.overallScore}, tailored=${tailoredScore.overallScore}`
    );

    return NextResponse.json({ run, status, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error("[tailor-run] Fatal error:", error);
    const message =
      error instanceof Error ? error.message : "Pipeline failed";
    return NextResponse.json(
      { error: message, status: "error", errors: [...errors, message] },
      { status: 500 }
    );
  }
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
