/**
 * Match Scoring Prompt — scores a resume against a JD (0–100).
 * Server-side only (used in API routes).
 *
 * Sends a compact resume summary instead of the full resume JSON to prevent
 * token bloat for large resumes.
 *
 * @version MATCH_SCORING_PROMPT_VERSION
 */

/** Prompt version string — stored in DB run records for auditability. */
export const MATCH_SCORING_PROMPT_VERSION = "v2.1";

export const MATCH_SCORING_SYSTEM_PROMPT = `You are an expert technical recruiter and resume scorer.
Given a structured resume summary and a job description, score how well the resume matches the role across four dimensions.

SCORING DIMENSIONS:
1. skillCoverageScore (0–100): What % of required skills appear in the resume?
2. responsibilityAlignmentScore (0–100): How well do work experience bullets match JD responsibilities?
3. keywordScore (0–100): How many JD keywords appear naturally in the resume?
4. seniorityScore (0–100): Does the candidate's experience level match the required seniority?

overallScore = weighted average: skills 35% + responsibilities 30% + keywords 20% + seniority 15%.
Round all scores to the nearest integer.

RULES:
- Be honest and calibrated. A 50 means "moderate match", not "poor".
- criticalMissingRequirements: list ONLY required skills/qualifications that are clearly absent.
- explanation: 2–3 sentences summarizing the match and key gaps.
- Output ONLY valid JSON. No commentary, no markdown.

TRUTHFULNESS (non-negotiable):
- Base scores strictly on evidence in the resume text.
- Never inflate scores to be encouraging.

OUTPUT JSON SCHEMA:
{
  "overallScore": number,
  "skillCoverageScore": number,
  "responsibilityAlignmentScore": number,
  "keywordScore": number,
  "seniorityScore": number,
  "criticalMissingRequirements": string[],
  "explanation": string
}`;

/**
 * Shape of a single experience entry used in the compact summary.
 */
interface ExperienceSummaryEntry {
  company: string;
  title: string;
  bulletCount: number;
}

/**
 * Builds a compact resume summary object to avoid sending the full JSON.
 * Includes name, top 20 skills, experience shape (company/title/bulletCount),
 * and an estimated years-of-experience figure.
 *
 * @param resume Structured resume object from the LLM or validated schema.
 */
function buildCompactResumeSummary(resume: Record<string, unknown>): Record<string, unknown> {
  const contact = (resume.contact as Record<string, string> | undefined) ?? {};
  const skills = Array.isArray(resume.skills) ? (resume.skills as string[]) : [];
  const experience = Array.isArray(resume.experience)
    ? (resume.experience as Array<Record<string, unknown>>)
    : [];
  const education = Array.isArray(resume.education)
    ? (resume.education as Array<Record<string, unknown>>)
    : [];

  // Build compact experience summary
  const experienceSummary: ExperienceSummaryEntry[] = experience.map((e) => ({
    company: typeof e.company === "string" ? e.company : "",
    title: typeof e.title === "string" ? e.title : "",
    bulletCount: Array.isArray(e.bullets) ? e.bullets.length : 0,
  }));

  // Rough years-of-experience estimate based on number of roles
  // (sufficient for scoring; avoids date-parsing complexity)
  const yearsOfExperience =
    experience.length > 0 ? `~${experience.length * 1.5}+ years (estimated)` : "Unknown";

  return {
    name: contact.name ?? "",
    skills: skills.slice(0, 20),
    experienceSummary,
    yearsOfExperience,
    educationLevel: education.length > 0
      ? (education[0] as Record<string, string>)?.degree ?? ""
      : "",
    summary: typeof resume.summary === "string" ? resume.summary.slice(0, 300) : "",
  };
}

/**
 * Builds the user prompt for the match scoring step.
 *
 * Instead of sending the full resume JSON (which can be huge for experienced
 * candidates), this builds a compact summary to prevent token bloat.
 *
 * @param resume Structured resume object.
 * @param jd     Structured job description object.
 */
export function buildMatchScoringUserPrompt(
  resume: Record<string, unknown>,
  jd: Record<string, unknown>
): string {
  const compactResume = buildCompactResumeSummary(resume);

  return `Score the following resume against the job description.

RESUME (compact summary):
${JSON.stringify(compactResume, null, 2)}

JOB DESCRIPTION (structured):
${JSON.stringify(jd, null, 2)}

Return ONLY the JSON object. No markdown, no explanation.`;
}
