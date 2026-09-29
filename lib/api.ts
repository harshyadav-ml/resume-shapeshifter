/**
 * Client-side API wrappers — typed fetch calls for all API routes.
 * Each function calls the corresponding Next.js API route and returns typed data.
 *
 * Phase 4: Added Zod safeParse validation on every response.
 */

import { z } from "zod";
import type {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  ResumeGap,
  TailoringRun,
} from "@/types";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  MatchScoreSchema,
  TailoredResumeSchema,
  ResumeGapSchema,
  TailoringRunSchema,
} from "@/lib/schemas";

// ── Error type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJson<T>(
  url: string,
  body: unknown,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || `API call failed (${response.status})`,
      response.status
    );
  }

  // Validate with Zod if schema provided
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      console.warn(`[api] Response validation warning: ${issues}`);
      // Return raw data — don't crash, but log the issue
    }
  }

  return data as T;
}

// ── Individual API calls ────────────────────────────────────────────────────

export async function parseResume(text: string): Promise<ResumeProfile> {
  return fetchJson<ResumeProfile>(
    "/api/parse-resume",
    { text },
    ResumeProfileSchema
  );
}

export async function parseJD(text: string): Promise<JobDescriptionProfile> {
  return fetchJson<JobDescriptionProfile>(
    "/api/parse-jd",
    { text },
    JobDescriptionProfileSchema
  );
}

export async function scoreMatch(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<MatchScore> {
  return fetchJson<MatchScore>(
    "/api/score",
    { resume, jd },
    MatchScoreSchema
  );
}

export async function tailorResume(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<TailoredResume> {
  return fetchJson<TailoredResume>(
    "/api/tailor",
    { resume, jd },
    TailoredResumeSchema
  );
}

export async function analyzeGaps(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<ResumeGap[]> {
  return fetchJson<ResumeGap[]>(
    "/api/gaps",
    { resume, jd },
    z.array(ResumeGapSchema)
  );
}

// ── Full pipeline ───────────────────────────────────────────────────────────

export interface TailoringRunResult {
  run: TailoringRun;
  status: "success" | "partial" | "error";
  errors?: string[];
}

const TailoringRunResultSchema = z.object({
  run: TailoringRunSchema,
  status: z.enum(["success", "partial", "error"]),
  errors: z.array(z.string()).optional(),
});

export async function runTailoringPipeline(
  resumeText: string,
  jdText: string
): Promise<TailoringRunResult> {
  return fetchJson<TailoringRunResult>(
    "/api/tailor-run",
    { resumeText, jdText },
    TailoringRunResultSchema
  );
}
