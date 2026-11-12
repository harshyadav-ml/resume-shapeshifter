/**
 * JD Extraction Prompt — extracts structured JobDescriptionProfile from raw JD text.
 * Server-side only (used in API routes).
 *
 * @version JD_EXTRACTION_PROMPT_VERSION
 */

/** Prompt version string — stored in DB run records for auditability. */
export const JD_EXTRACTION_PROMPT_VERSION = "v2.1";

/**
 * Maximum characters of JD text to pass to the model.
 * If the input is longer, it is truncated and a warning is logged.
 */
export const JD_EXTRACTION_CHAR_LIMIT = 8_000;

export const JD_EXTRACTION_SYSTEM_PROMPT = `You are an expert job description analyst. Extract structured requirements from a job description.

RULES (mandatory):
- Distinguish required vs preferred skills carefully — read the JD language closely.
- Infer seniority level from job title and qualifications: must be one of "intern", "junior", "mid", "senior", "lead", "principal".
- Extract ALL technologies, tools, and platforms explicitly mentioned.
- requiredSkills: skills the JD says are "required", "must have", or core to the role.
- preferredSkills: skills the JD says are "preferred", "nice to have", or "bonus".
- tools: specific software, platforms, or frameworks named.
- keywords: important terms that should appear in a matching resume.
- domainSignals: industry/domain context clues (e.g. "B2B SaaS", "healthcare", "fintech").
- softSkills: interpersonal/behavioral traits mentioned (e.g. "communication", "leadership").
- Output ONLY valid JSON matching the schema below. No commentary, no markdown.

OUTPUT JSON SCHEMA:
{
  "jobTitle": string,
  "company": string,
  "requiredSkills": string[],
  "preferredSkills": string[],
  "responsibilities": string[],
  "qualifications": string[],
  "tools": string[],
  "keywords": string[],
  "seniorityLevel": "intern" | "junior" | "mid" | "senior" | "lead" | "principal",
  "domainSignals": string[],
  "softSkills": string[]
}`;

/**
 * Builds the user prompt for the JD extraction step.
 *
 * If `jdText` exceeds `JD_EXTRACTION_CHAR_LIMIT`, it is truncated and a
 * warning is emitted so the truncation is visible in server logs.
 *
 * @param jdText Raw job description text.
 */
export function buildJDExtractionUserPrompt(jdText: string): string {
  let text = jdText;
  if (jdText.length > JD_EXTRACTION_CHAR_LIMIT) {
    const truncatedBy = jdText.length - JD_EXTRACTION_CHAR_LIMIT;
    console.warn(
      `[jd-extraction] JD text truncated: input was ${jdText.length} chars, ` +
        `limit is ${JD_EXTRACTION_CHAR_LIMIT}. Dropped ${truncatedBy} chars from the end.`
    );
    text = jdText.slice(0, JD_EXTRACTION_CHAR_LIMIT);
  }

  return `Extract structured requirements from the following job description.

JOB DESCRIPTION:
---
${text}
---

Return ONLY the JSON object. No markdown, no explanation.`;
}

