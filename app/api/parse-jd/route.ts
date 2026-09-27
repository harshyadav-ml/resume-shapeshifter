/**
 * POST /api/parse-jd
 * Parses raw job description text into a structured JobDescriptionProfile via Groq.
 */

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";
import { JobDescriptionProfileSchema } from "@/lib/schemas";
import {
  JD_EXTRACTION_SYSTEM_PROMPT,
  buildJDExtractionUserPrompt,
} from "@/lib/prompts/jd-extraction";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Job description text is required" },
        { status: 422 }
      );
    }

    const userPrompt = buildJDExtractionUserPrompt(text);
    const result = await callGroq(
      JD_EXTRACTION_SYSTEM_PROMPT,
      userPrompt,
      JobDescriptionProfileSchema
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[parse-jd] Error:", error);
    const message =
      error instanceof Error ? error.message : "JD parsing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
