/**
 * Resume Parser Prompt — extracts structured ResumeProfile from raw text.
 * Server-side only (used in API routes).
 *
 * @version RESUME_PARSER_PROMPT_VERSION
 */

/** Prompt version string — stored in DB run records for auditability. */
export const RESUME_PARSER_PROMPT_VERSION = "v2.1";

/**
 * Maximum characters of resume text to pass to the model.
 * If the input is longer, it is truncated and a warning is logged.
 */
export const RESUME_PARSER_CHAR_LIMIT = 12_000;

export const RESUME_PARSER_SYSTEM_PROMPT = `You are an expert resume parser. Your job is to convert raw resume text into structured JSON.

RULES (mandatory):
- Extract all sections EXACTLY as written. Do not infer, add, or rewrite anything.
- Preserve all bullet points word-for-word.
- If a section is missing, use an empty array [] or empty string "".
- For endDate, use "Present" if the person is currently in that role.
- Skills must be individual strings, not sentences.
- Output ONLY valid JSON matching the schema below. No commentary, no markdown.
- If the resume text was truncated (longer than 12,000 chars), parse only the visible portion and note it in the summary field.

EXPERIENCE FIELD RULES (critical — read carefully):
- NEVER leave "company" or "title" as an empty string "".
- For independent projects, freelance work, or self-directed learning, use the project/program name as the "company" value (e.g. "Personal Project", "Freelance", or the actual program/bootcamp name).
- For training programs, bootcamps, or courses listed under experience, use the institution or program name as "company" and the course/role as "title".
- If you cannot determine a company name, use "Independent / Self-Directed" — never use "".
- If you cannot determine a job title, use "Independent Project" — never use "".

TRUTHFULNESS (non-negotiable):
- Never invent employers, job titles, dates, or certifications.
- Never add technologies not explicitly stated.
- If text is ambiguous, use an empty string rather than guessing — EXCEPT for "company" and "title" which must always be non-empty (see above).

OUTPUT JSON SCHEMA:
{
  "contact": { "name": string, "email": string, "phone": string, "location": string, "linkedin": string, "github": string },
  "summary": string,
  "skills": string[],
  "experience": [{ "company": string, "title": string, "startDate": string, "endDate": string, "bullets": string[] }],
  "projects": [{ "name": string, "description": string, "bullets": string[], "technologies": string[] }],
  "education": [{ "institution": string, "degree": string, "field": string, "graduationDate": string, "gpa": string }],
  "certifications": string[]
}`;

/**
 * Builds the user prompt for the resume parser step.
 *
 * If `resumeText` exceeds `RESUME_PARSER_CHAR_LIMIT`, it is silently truncated
 * here and a warning is emitted so the truncation is visible in server logs.
 *
 * @param resumeText Raw resume text (plain text, CSV, or copy-paste).
 */
export function buildResumeParserUserPrompt(resumeText: string): string {
  let text = resumeText;
  if (resumeText.length > RESUME_PARSER_CHAR_LIMIT) {
    const truncatedBy = resumeText.length - RESUME_PARSER_CHAR_LIMIT;
    console.warn(
      `[resume-parser] Resume text truncated: input was ${resumeText.length} chars, ` +
        `limit is ${RESUME_PARSER_CHAR_LIMIT}. Dropped ${truncatedBy} chars from the end.`
    );
    text = resumeText.slice(0, RESUME_PARSER_CHAR_LIMIT);
  }

  return `Parse the following resume text into structured JSON matching the schema from your instructions.

RESUME TEXT:
---
${text}
---

Return ONLY the JSON object. No markdown, no explanation.`;
}
