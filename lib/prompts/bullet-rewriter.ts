/**
 * Bullet Rewriter Prompt — rewrites a single resume bullet to align with a JD.
 * Uses chain-of-thought: analyze → align → rewrite → flag risk.
 * Server-side only (used in API routes).
 *
 * @version BULLET_REWRITER_PROMPT_VERSION
 */

/** Prompt version string — stored in DB run records for auditability. */
export const BULLET_REWRITER_PROMPT_VERSION = "v2.1";

export const BULLET_REWRITER_SYSTEM_PROMPT = `You are a senior technical resume writer who specialises in making bullets land hard with hiring managers and ATS systems.
You will rewrite ONE resume bullet to maximally align with the target role — not just swap a word, but restructure for impact.

REWRITE STRATEGY (apply all three layers):
1. POWER VERB — Open with a domain-specific, seniority-matched action verb from the JD's language (e.g. "Architected", "Spearheaded", "Drove", "Scaled"). Never use weak verbs: Built, Made, Helped, Worked on, Assisted.
2. COMBINE IMPACT — If the bullet contains multiple related actions or skills, merge them into a single high-signal clause. Surface the business or technical outcome explicitly (e.g. "reducing p99 latency by X%" or "enabling Y team to ship Z% faster").
3. JD KEYWORD INJECTION — Naturally embed 1–3 required keywords or phrases from the JD that the bullet can truthfully support. Place them where they read fluently, not as a keyword dump.

CHAIN-OF-THOUGHT PROCESS (follow in order):
Step 1: Identify ALL factual claims in the original bullet (numbers, metrics, tech names, scope).
Step 2: Map which JD requirements this bullet can TRUTHFULLY address after rewriting.
Step 3: Apply the three-layer strategy above.
Step 4: Verify the rewrite does NOT add any fact not in the original bullet.
Step 5: Assign confidence and riskFlag based on how much was inferred vs. stated.

CONFIDENCE LEVELS:
- "high": rewrite only restructures/strengthens existing content — no new claims
- "medium": adds JD-relevant framing that reads as implied by the original
- "low": adds claims that genuinely need the user's verification before use

RISKFLAG RULES:
- Empty string "" = safe to use as-is (high confidence)
- Non-empty = describe exactly what the user should verify (medium/low)

HARD RULES (non-negotiable):
- NEVER fabricate employers, job titles, dates, or certifications.
- NEVER add technologies NOT listed in the FACTUAL CLAIMS IN ORIGINAL section provided in the user prompt.
- NEVER invent or inflate metrics (percentages, dollar amounts, team sizes).
- NEVER change the fundamental meaning of the bullet.
- Keep the bullet to 1–2 lines max — tight and scannable.
- changeReason must name the specific structural change made (not just "improved wording").
- Output ONLY a raw JSON object. No markdown, no code fences, no explanation.
- Your response must start with { and end with }.

OUTPUT JSON SCHEMA:
{
  "original": string,
  "tailored": string,
  "changeReason": string,
  "keywordsAddressed": string[],
  "confidence": "high" | "medium" | "low",
  "riskFlag": string
}`;

/**
 * Extracts factual claims from a bullet string for the ground-truth list.
 *
 * Extracts:
 * - Capitalized words of ≥ 2 chars (proper nouns, tech names)
 * - Numbers with %, $, or x suffix (metrics)
 * - CamelCase tech identifiers (e.g. "TypeScript", "GraphQL", "PostgreSQL")
 *
 * @param bullet The original bullet text to extract claims from.
 * @returns Deduplicated array of factual claim strings.
 */
export function extractFactualClaims(bullet: string): string[] {
  const claims = new Set<string>();

  // CamelCase identifiers (e.g. TypeScript, GraphQL, PostgreSQL, HBase)
  const camelCasePattern = /\b[A-Z][a-z]*[A-Z]\w*/g;
  Array.from(bullet.matchAll(camelCasePattern)).forEach((match) => {
    claims.add(match[0]);
  });

  // Numbers with %, $, or x (e.g. "40%", "$2M", "3x")
  const metricsPattern = /\b\d+(?:\.\d+)?[%$x]\b|\$\d+(?:\.\d+)?[KMBkmb]?\b/g;
  Array.from(bullet.matchAll(metricsPattern)).forEach((match) => {
    claims.add(match[0]);
  });

  // Capitalized words ≥ 2 chars that aren't common English starters
  const capitalizedPattern = /\b[A-Z][a-zA-Z]{1,}\b/g;
  const commonWords = new Set([
    "The", "A", "An", "In", "On", "At", "For", "To", "By", "Of", "And", "Or",
    "With", "As", "Is", "Was", "Are", "Were", "Has", "Have", "Had", "Be",
    "Led", "Key", "New", "Own", "Set", "Got", "Put", "Use", "Via", "Per",
  ]);
  Array.from(bullet.matchAll(capitalizedPattern)).forEach((match) => {
    if (!commonWords.has(match[0])) {
      claims.add(match[0]);
    }
  });

  return Array.from(claims);
}

/**
 * Builds the user prompt for the bullet rewriter step.
 *
 * Includes a FACTUAL CLAIMS IN ORIGINAL section that gives the LLM a
 * ground-truth list of technologies, numbers, and proper nouns extracted
 * from the bullet text, preventing hallucinations in the rewrite.
 *
 * @param bullet  Original bullet text to rewrite.
 * @param company Company name for context.
 * @param title   Job title for context.
 * @param jd      Structured JD object from the extraction step.
 */
export function buildBulletRewriterUserPrompt(
  bullet: string,
  company: string,
  title: string,
  jd: Record<string, unknown>
): string {
  // Safe access pattern for all JD array fields
  const required = (Array.isArray(jd.requiredSkills) ? (jd.requiredSkills as string[]) : [])
    .slice(0, 8)
    .join(", ");
  const keywords = (Array.isArray(jd.keywords) ? (jd.keywords as string[]) : [])
    .slice(0, 10)
    .join(", ");
  const responsibilities = (
    Array.isArray(jd.responsibilities) ? (jd.responsibilities as string[]) : []
  )
    .slice(0, 5)
    .map((r: string) => `- ${r}`)
    .join("\n");

  // Extract factual claims from the original bullet for the ground-truth list
  const factualClaims = extractFactualClaims(bullet);
  const claimsSection =
    factualClaims.length > 0
      ? factualClaims.join(", ")
      : "(no specific technologies, metrics, or proper nouns detected)";

  return `Rewrite the following resume bullet to better match the job description.

ORIGINAL BULLET (from ${company} — ${title}):
"${bullet}"

FACTUAL CLAIMS IN ORIGINAL (ground truth — DO NOT add anything not in this list):
${claimsSection}

JOB CONTEXT:
- Role: ${jd.jobTitle} at ${jd.company}
- Seniority: ${jd.seniorityLevel}
- Required Skills: ${required}
- Key Keywords: ${keywords}
- Key Responsibilities:
${responsibilities}

Return ONLY the JSON object. No markdown, no explanation.`;
}
