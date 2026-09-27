/**
 * POST /api/gaps
 * Identifies skill/experience gaps between a resume and JD via Groq.
 */

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";
import { GapAnalysisResultSchema } from "@/lib/schemas";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisUserPrompt,
} from "@/lib/prompts/gap-analysis";
import type { ResumeGap } from "@/types";

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

    const userPrompt = buildGapAnalysisUserPrompt(resume, jd);
    const result = await callGroq(
      GAP_ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      GapAnalysisResultSchema
    );

    // Sort by importance: high → medium → low
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sortedGaps = [...result.gaps].sort(
      (a: ResumeGap, b: ResumeGap) =>
        (order[a.importance] ?? 3) - (order[b.importance] ?? 3)
    );

    return NextResponse.json(sortedGaps);
  } catch (error) {
    console.error("[gaps] Error:", error);
    const message =
      error instanceof Error ? error.message : "Gap analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
