/**
 * Client-side API wrappers — typed fetch calls for all API routes.
 * Each function calls the corresponding Next.js API route and returns typed data.
 */

import type {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  ResumeGap,
  TailoringRun,
} from "@/types";

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

async function fetchJson<T>(url: string, body: unknown): Promise<T> {
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

  return data as T;
}

// ── Individual API calls ────────────────────────────────────────────────────

export async function parseResume(text: string): Promise<ResumeProfile> {
  return fetchJson<ResumeProfile>("/api/parse-resume", { text });
}

export async function parseJD(text: string): Promise<JobDescriptionProfile> {
  return fetchJson<JobDescriptionProfile>("/api/parse-jd", { text });
}

export async function scoreMatch(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<MatchScore> {
  return fetchJson<MatchScore>("/api/score", { resume, jd });
}

export async function tailorResume(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<TailoredResume> {
  return fetchJson<TailoredResume>("/api/tailor", { resume, jd });
}

export async function analyzeGaps(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<ResumeGap[]> {
  return fetchJson<ResumeGap[]>("/api/gaps", { resume, jd });
}

// ── Full pipeline ───────────────────────────────────────────────────────────

export interface TailoringRunResult {
  run: TailoringRun;
  status: "success" | "partial" | "error";
  errors?: string[];
}

export async function runTailoringPipeline(
  resumeText: string,
  jdText: string
): Promise<TailoringRunResult> {
  return fetchJson<TailoringRunResult>("/api/tailor-run", {
    resumeText,
    jdText,
  });
}
