/**
 * lib/utils.ts — Shared pure utilities.
 *
 * Exports:
 * - `cn`              — class-name merging (re-exported from "cn")
 * - `mergeSkills`     — surfaces JD-matched skills first in the skills list
 * - `sanitizeFilename` — produces a clean, hyphen-safe filename string
 */

export { cn } from "cn";

/**
 * Merges a resume's skill list with JD required/preferred skills.
 *
 * Skills that appear in both the resume AND the JD (required or preferred)
 * are floated to the top in JD priority order. Remaining resume skills
 * follow in their original order.
 *
 * @param resumeSkills   Skills extracted from the candidate's resume.
 * @param requiredSkills Required skills from the job description.
 * @param preferredSkills Preferred skills from the job description.
 * @returns Merged, deduplicated skill list with JD-matched skills first.
 */
export function mergeSkills(
  resumeSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): string[] {
  const resumeLower = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const jdMatched: string[] = [];
  for (const skill of [...requiredSkills, ...preferredSkills]) {
    if (resumeLower.has(skill.toLowerCase()) && !jdMatched.includes(skill)) {
      jdMatched.push(skill);
    }
  }
  const remaining = resumeSkills.filter((s) => !jdMatched.includes(s));
  return [...jdMatched, ...remaining];
}

/**
 * Sanitizes a string for use as a PDF download filename.
 *
 * - Replaces any character that is not alphanumeric, dot, or hyphen with `-`.
 * - Collapses consecutive hyphens into a single hyphen.
 * - Trims leading and trailing hyphens.
 *
 * @example
 * sanitizeFilename("Acme Corp. (NYC)") // → "Acme-Corp.-NYC"
 * sanitizeFilename("--bad--name--")    // → "bad-name"
 *
 * @param name Raw name string (e.g. a company name from the JD profile).
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.\-]/g, "-") // replace non-safe chars
    .replace(/-{2,}/g, "-")            // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "");          // trim leading/trailing hyphens
}

