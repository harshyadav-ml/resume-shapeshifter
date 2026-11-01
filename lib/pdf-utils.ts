/**
 * lib/pdf-utils.ts — Shared utilities for @react-pdf/renderer components.
 *
 * Provides:
 * - `safeText`          — coerces any value to a safe, trimmed string for PDF rendering
 * - `sanitizeFilename`  — produces a clean filename with no consecutive hyphens
 */

/**
 * Coerces an unknown value to a printable string suitable for use inside
 * @react-pdf/renderer `<Text>` nodes.
 *
 * - `null` and `undefined` → `fallback` (default `""`)
 * - Numbers and booleans → coerced via `String()`
 * - Objects → `JSON.stringify()` (should not happen in practice, but safe)
 * - Strings → trimmed
 *
 * @param val      The value to coerce.
 * @param fallback Returned when `val` is null or undefined. Defaults to `""`.
 */
export function safeText(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return fallback;
  }
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
