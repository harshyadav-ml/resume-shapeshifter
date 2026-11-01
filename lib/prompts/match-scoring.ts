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
export const MATCH_SCORING_PROMPT_VERSION = "v2.2";

export const MATCH_SCORING_SYSTEM_PROMPT = `You are a deterministic, objective resume match evaluator.
You MUST calculate match scores using strict arithmetic to eliminate subjective scoring and ensure consistent outputs across runs.

ARITHMETIC SCORING PROCEDURE:
1. COUNT REQUIRED SKILLS:
   - Identify every required skill explicitly listed in the Job Description (requiredSkills).
   - Set total_required_skills = count of requiredSkills (integer >= 1). If the list is empty, count skills from qualifications or keywords.

2. COUNT MATCHED SKILLS:
   - Count the exact number of required skills that have direct, explicit evidence in the resume (skills list, work experience bullets, or projects).
   - Do NOT assume, infer, or award credit for unmentioned technologies.
   - Set matched_skills = exact count of substantiated required skills (integer >= 0, <= total_required_skills).

3. COMPUTE STRICT ARITHMETIC SCORES:
   - skillCoverageScore = Math.round((matched_skills / total_required_skills) * 100)
   - responsibilityAlignmentScore (0–100): Percentage of JD core responsibilities evidenced in the candidate's experience bullets.
   - keywordScore (0–100): Percentage of top JD keywords appearing naturally in the resume text.
   - seniorityScore (0–100): 100 if candidate experience matches/exceeds JD seniority; 75 if 1 level below; 50 if 2 levels below; 25 if junior.
   - overallScore = Math.round((skillCoverageScore * 0.40) + (responsibilityAlignmentScore * 0.30) + (keywordScore * 0.15) + (seniorityScore * 0.15))

RULES:
- Both matched_skills and total_required_skills MUST be exact integers.
- criticalMissingRequirements: list ONLY required skills from the JD that are absent in the resume.
- explanation: State the exact mathematical breakdown (e.g. "Candidate matched X of Y required skills (Z%)...") followed by a concise 2-sentence summary of strengths and gaps.
- Output raw JSON ONLY. No markdown backticks (\`\`\`json), no preamble, no postscript.

OUTPUT JSON SCHEMA (must start with { and end with }):
{
  "matched_skills": 0,
  "total_required_skills": 0,
  "overallScore": 0,
  "skillCoverageScore": 0,
  "responsibilityAlignmentScore": 0,
  "keywordScore": 0,
  "seniorityScore": 0,
  "criticalMissingRequirements": ["string"],
  "explanation": "string"
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
 * Includes name, all skills (up to 50), experience shape (company/title/bulletCount),
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
  const yearsOfExperience =
    experience.length > 0 ? `~${experience.length * 1.5}+ years (estimated)` : "Unknown";

  return {
    name: contact.name ?? "",
    skills: skills.slice(0, 50),
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
 * @param resume Structured resume object.
 * @param jd     Structured job description object.
 */
export function buildMatchScoringUserPrompt(
  resume: Record<string, unknown>,
  jd: Record<string, unknown>
): string {
  const compactResume = buildCompactResumeSummary(resume);

  return `Score the following resume against the job description using strict arithmetic.
Calculate matched_skills and total_required_skills, then compute skillCoverageScore = Math.round((matched_skills / total_required_skills) * 100).

RESUME (compact summary):
${JSON.stringify(compactResume, null, 2)}

JOB DESCRIPTION (structured):
${JSON.stringify(jd, null, 2)}

Return ONLY the raw JSON object matching the required schema. No markdown, no explanation.`;
}
