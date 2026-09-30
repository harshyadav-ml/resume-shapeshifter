/**
 * POST /api/parse-resume
 * Parses raw resume text into a structured ResumeProfile via Groq.
 */

import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;
import { callGroq } from "@/lib/groq";
import { ResumeProfileSchema } from "@/lib/schemas";
import {
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserUserPrompt,
} from "@/lib/prompts/resume-parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 422 }
      );
    }

    const userPrompt = buildResumeParserUserPrompt(text);
    const result = await callGroq(
      RESUME_PARSER_SYSTEM_PROMPT,
      userPrompt,
      ResumeProfileSchema
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[parse-resume] Error:", error);
    const message =
      error instanceof Error ? error.message : "Resume parsing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
