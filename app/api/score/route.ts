/**
 * POST /api/score
 * Scores a resume against a JD. Returns MatchScore (0–100).
 */

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";
import { MatchScoreSchema } from "@/lib/schemas";
import {
  MATCH_SCORING_SYSTEM_PROMPT,
  buildMatchScoringUserPrompt,
} from "@/lib/prompts/match-scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jd } = body;

    if (!resume || !jd) {
      return NextResponse.json(
        { error: "Both resume and jd are required" },
        { status: 422 }
      );
    }

    const userPrompt = buildMatchScoringUserPrompt(resume, jd);
    const result = await callGroq(
      MATCH_SCORING_SYSTEM_PROMPT,
      userPrompt,
      MatchScoreSchema
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[score] Error:", error);
    const message =
      error instanceof Error ? error.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
