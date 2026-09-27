# Resume Shapeshifter — Edge Cases Reference

> **Purpose:** Developer reference for edge cases per implementation phase. Consult this before writing any service, prompt, parser, or UI component. Each section maps directly to a phase in `architecture.md § 14`.

---

## Table of Contents

1. [Phase 1 — Static Prototype](#phase-1--static-prototype-week-1)
2. [Phase 2 — LLM Integration](#phase-2--llm-integration-week-2)
3. [Phase 3 — PDF Export](#phase-3--pdf-export-week-3)
4. [Phase 4 — Guardrails & Validation](#phase-4--guardrails--validation-week-4)
5. [Phase 5 — Polish & Demo Readiness](#phase-5--polish--demo-readiness-week-5)
6. [Cross-Phase Edge Cases](#cross-phase-edge-cases)

---

## Phase 1 — Static Prototype (Week 1)

> Covers: input page, mock data rendering, side-by-side comparison in browser, basic design system.

### 1.1 Resume Input

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Empty textarea submitted | API called with empty string | Disable "Analyze" button until both fields have `length > 50` |
| Whitespace-only input | Passes length check but has no content | Trim + strip before validation; reject if stripped length is 0 |
| Resume pasted with Windows line endings (`\r\n`) | Parsing splits incorrectly | Normalize all line endings to `\n` in a `text_utils` step before processing |
| Extremely long resume (>10 000 words) | UI freeze, token limit breach later | Warn user if character count > 8 000; soft-cap paste field |
| JD pasted with HTML tags (copied from web) | Raw `<p>`, `<ul>` tags sent as content | Strip HTML tags client-side before storing in state |
| Both fields identical (user pastes resume in both) | LLM produces nonsensical score | Detect similarity > 95% and show warning: "JD and resume look the same" |
| Right-to-left (RTL) text in input | Layout breaks in textarea | Set `dir="auto"` on all text inputs |
| Emoji or Unicode in resume text | Breaks regex tokenizers | Ensure all text utilities handle Unicode; test with `\u2019`, `\u2014`, emoji |

### 1.2 Mock Data Rendering

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Mock `bullets` array is empty for an experience entry | Section renders nothing; looks broken | Always render a placeholder bullet: "No bullets extracted" in mock data |
| Mock score is exactly `0` or `100` | Ring chart renders 0% or 100% ambiguously | Handle boundary values explicitly in score ring component |
| Mock `gaps` array is empty | Gap section disappears; UX confusion | Show "No gaps detected" empty state with explanatory copy |
| `tailored` bullet same as `original` | Changed badge incorrectly shown | Only highlight a bullet as "CHANGED" if `original !== tailored` (string equality) |
| `changeReason` field is an empty string | Tooltip/popover shows blank | Fall back to "No reason provided" if `changeReason.length === 0` |
| `confidence` value outside `"high" \| "medium" \| "low"` | Badge component crashes | Default to `"low"` for any unexpected enum value |

### 1.3 Side-by-Side UI Rendering

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Original bullet is 300+ characters | Column overflows on narrow screens | CSS: `word-break: break-word; overflow-wrap: anywhere` on bullet cards |
| Number of original bullets ≠ number of tailored bullets | Rows misalign in two-column view | Render by index; pad the shorter list with empty placeholder rows |
| Experience entry has no `company` name | Card header is blank | Render "(Unknown Company)" as fallback |
| `skills` array has 50+ items | Tag list wraps uncontrollably | Cap display at 20 tags; show "+N more" overflow button |
| JD summary has no `requiredSkills` | Required skills section shows nothing | Show "No required skills detected" placeholder |

---

## Phase 2 — LLM Integration (Week 2)

> Covers: FastAPI prompt routes, all 5 prompts, Zod validation.

### 2.1 Resume Parser (`/parse/resume`)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Resume has no experience section | `experience: []` returned | Accept empty array; do not error; surface warning on frontend |
| Section headers are non-standard (`"Career History"`, `"Where I've Worked"`) | LLM misclassifies or omits sections | Prompt explicitly lists aliases; use few-shot examples in system prompt |
| Date formats are inconsistent (`Jan 2020`, `01/2020`, `2020-01`) | `startDate`/`endDate` parsing varies | Normalize all dates to `YYYY-MM` in `text_utils`; allow `"Present"` literal |
| Candidate lists skills inline in bullets, not in a skills section | Skills array is empty | Prompt instructs to also extract skills from bullet text |
| Resume has only one job entry | Works but produces very limited tailoring | Allow; do not error |
| Resume contains personal pronouns (`"I led..."`) | Inconsistent bullet style | Prompt instructs to strip first-person pronouns from extracted bullets |
| Contact section has no email | `contact.email` is empty string | Allow; do not require email for parsing to succeed |
| Multi-page resume text is very long (>6 000 tokens) | Exceeds context window of some models | Chunk resume into sections; parse each section independently |
| Resume is in a language other than English | LLM may hallucinate translations | Detect non-English via `langdetect`; surface warning; process anyway |
| No summary/objective section present | `summary: ""` | Allow empty string; do not use summary as a required field |

### 2.2 JD Parser (`/parse/jd`)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| JD has fewer than 5 extracted required skills | Very sparse output | Surface a "Low JD quality" warning in UI; proceed anyway |
| JD is a generic boilerplate ("excellent communication skills, team player") | Keywords are all soft skills | Mark `domainSignals: []`; UI notes no technical signals detected |
| JD contains salary/benefits info but no responsibilities | Responsibilities array is empty | Allow; do not error; UI shows "No responsibilities extracted" |
| JD has duplicate keywords | Repeated items in `keywords[]` | Deduplicate in a post-processing step before returning |
| `seniorityLevel` cannot be determined | LLM guesses wrong level | Default to `"mid"` if signal is ambiguous; log it |
| JD is for an entirely different role than the resume suggests | Score will be very low | Not an error; score handles this; UI shows "Low match" |
| JD text is copy-pasted with bullet characters (`•`, `–`, `▪`) | Tokenization artifacts | Strip non-ASCII bullet glyphs; normalize to plain hyphens |

### 2.3 Match Scoring (`/score`)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| `overallScore` returned > 100 or < 0 | Validation fails | Clamp to `[0, 100]` in Zod schema with `.min(0).max(100)` |
| Score returns `null` or `undefined` for a sub-score | Component crashes | Default missing sub-scores to `0` |
| `criticalMissingRequirements` is an empty array when score is low | Misleadingly implies perfect fit | If `overallScore < 60` and array is empty, prompt re-run or add generic note |
| `explanation` field is empty string | Summary card shows nothing | Fall back to: "Score computed based on skill, keyword, and seniority alignment." |
| LLM returns score 98 for an obvious mismatch | Overconfident model | UI shows score as a range `±10` to reduce false precision |

### 2.4 Bullet Rewriter (`/tailor`)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Original bullet is a single word or fragment | LLM generates a fabricated full sentence | Return original unchanged; set `confidence: "low"`, `riskFlag: "original-too-short"` |
| LLM rewrite adds a metric not in the original (e.g., "increased revenue by 30%") | Truthfulness violation | `riskFlag` must fire; UI must surface warning badge; validate with heuristic check |
| Tailored bullet is longer than 2 lines (>180 characters) | Not resume-appropriate | Post-process: if `tailored.length > 180`, truncate at word boundary and append `"..."` |
| `keywordsAddressed` is empty array | Rewrite added no JD keywords | Allow; still display the bullet; do not treat as error |
| Bullet contains a confidential project name | Model may expose it as-is | Cannot detect automatically; add disclaimer in UI: "Review for confidential information" |
| Resume has 30+ bullets | Full tailoring run takes very long | Batch bullets in parallel (max 5 concurrent); show per-bullet streaming progress |
| LLM returns the tailored bullet identical to original | No change was made | Set `changeReason: "No changes needed"` and suppress "CHANGED" badge |
| Bullet references a technology the JD does not mention | May be irrelevant to the role | Keep it; do not remove; original content is preserved |
| Bullet rewriter prompt returns invalid JSON | Crash in validation layer | Retry once with explicit JSON repair instruction; if second attempt fails, return original bullet with `riskFlag: "parse-error"` |

### 2.5 Gap Analysis (`/gaps`)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| No gaps detected | Empty `gaps[]` array | Valid output; UI shows "Your resume closely matches this JD" |
| 20+ gaps returned | UI becomes overwhelming | Cap display at 10 gaps; sort by `importance: "high"` first |
| Duplicate gap entries (same skill, different wording) | Confusing to user | Deduplicate by lowercased `name` before returning |
| `canSafelyAdd: true` for a skill not in resume | Truthfulness violation | Re-validate: if `resumeEvidence` is empty, force `canSafelyAdd: false` |
| `suggestedAction` is generic ("Add this skill to your resume") | Low value to user | Prompt requires actionable, specific suggestions; validate length > 20 chars |
| Gap analysis returns a required hard skill that is present in resume | False positive | Cross-check gap `name` against `ResumeProfile.skills` before returning; remove if found |

### 2.6 Zod Validation (All Routes)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| LLM returns extra fields not in schema | Zod strict mode rejects payload | Use `.passthrough()` for non-critical schemas; `.strict()` only for risk-sensitive ones |
| LLM returns a stringified number (`"72"` instead of `72`) | Type mismatch in schema | Use Zod `.coerce.number()` for all numeric fields |
| LLM returns `null` for a required string field | Validation crash | Use `.nullable()` + fallback logic in the service layer |
| Second Zod retry also fails | Complete service failure | Return `status: "partial"` with the successfully parsed parts; log full error |
| Enum field returns unexpected value (e.g., `confidence: "MEDIUM"`) | Case mismatch | Normalize to lowercase before Zod validation |

---

## Phase 3 — PDF Export (Week 3)

> Covers: Tailored resume PDF (`@react-pdf/renderer`), Comparison PDF (Playwright), download buttons.

### 3.1 Tailored Resume PDF (`@react-pdf/renderer`)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Resume has no experience entries | Experience section is blank | Omit the section entirely from the PDF layout; do not render an empty block |
| Bullet text contains special characters (`&`, `<`, `>`, `"`) | XML-like renderer may escape or crash | Sanitize all text fields before passing to React PDF |
| Candidate name is very long (>40 chars) | Header overflows page width | Reduce font size for name field dynamically; cap at `fontSize: 18` |
| Skills array has 50+ entries | Skills section overflows a single page | Wrap to multiple lines; limit to 30 skills in the PDF with a note |
| A bullet exceeds 300 characters | Text overflows PDF column | Hard-wrap at 280 characters in the PDF renderer |
| PDF renders blank page | Renderer fails silently | Catch render error; fall back to a plain text `.txt` download |
| `@react-pdf/renderer` font not loaded | Font fallback produces garbled text | Bundle fonts (Inter or Roboto) locally; do not rely on CDN fonts |
| `tailoredSummary` is empty string | Summary section renders blank white space | Omit summary section from PDF if `tailoredSummary.length === 0` |
| Date fields are empty strings | Work dates column is blank | Render `"—"` for missing dates |

### 3.2 Comparison PDF (Playwright)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Very long resume produces 10+ page PDF | Playwright times out | Set `page.pdf()` timeout to 30 seconds; add page break hints in HTML template |
| HTML template contains unescaped user content | XSS in the rendered HTML | Escape all user-provided text before injecting into HTML template string |
| Playwright headless Chromium not installed | Service crashes on first call | Add `playwright install chromium` to Docker/setup script; surface 503 with setup instructions |
| Left column has more bullets than right column | Table rows misalign visually | Use CSS `display: grid` with fixed row heights; pad shorter column |
| Score delta is negative (tailored score < original) | Visually misleading "improvement" | Show negative delta in red with a note: "Tailoring did not improve match score" |
| Gap section is empty | Footer section is blank | Hide gap section in the PDF if `gaps.length === 0` |
| A bullet `changeReason` contains a newline character | Layout breaks in the PDF cell | Strip all `\n` from `changeReason` before injecting into HTML |
| PDF binary exceeds 10 MB | Browser download hangs | Compress PDF; if still > 10 MB, warn user and offer text fallback |
| Playwright crashes mid-generation | No PDF returned | Catch exception; return `500` with a `"pdf-generation-failed"` error code |
| Company or job title contains `/` or `\` | Filename generation breaks | Sanitize the filename: replace `/`, `\`, `:` with `-` |

### 3.3 Download Buttons

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| User clicks download twice rapidly | Two identical downloads fire | Disable button while generation is in-flight; re-enable on completion or error |
| API returns `Content-Type` other than `application/pdf` | Browser opens it as text | Validate response `Content-Type` header before triggering download |
| Download is triggered but file is 0 bytes | Silent empty file saved | Check `blob.size > 0` before triggering anchor click; show error toast if empty |
| Browser blocks programmatic download (popup blocker) | User sees nothing happen | Detect blocked download; show manual link as fallback |

---

## Phase 4 — Guardrails & Validation (Week 4)

> Covers: risk flag display, confidence badge, user confirmation flow, JSON schema validation, unsupported-claim detection.

### 4.1 Risk Flag Display

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| `riskFlag` is a non-empty but unintelligible string from LLM | Warning badge shows cryptic text | Sanitize: only display `riskFlag` if it matches a known set of codes; otherwise show generic "Verify this change" |
| All bullets are flagged as risk | User is overwhelmed; may ignore all flags | Show aggregate count: "X of Y bullets need review"; collapse individual flags |
| `riskFlag` is present but `confidence` is `"high"` | Contradictory signals | Treat any non-empty `riskFlag` as at least `confidence: "medium"` regardless |
| Risk flag is set but bullet is unchanged (`tailored === original`) | Flag is misleading | Suppress warning badge if `tailored === original`; no change = no risk |

### 4.2 Confidence Badge

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| `confidence` is missing from the LLM response | Badge renders blank or crashes | Default to `"low"` when field is absent |
| All bullets return `confidence: "high"` | No useful signal to user | If `riskFlag` is non-empty, override displayed confidence to at most `"medium"` |
| Badge color is the only indicator (accessibility) | Color-blind users miss the signal | Always pair color with a text label: "High", "Medium", "Low", "Risk" |

### 4.3 User Confirmation Flow (Before Export)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| User tries to export without reviewing any bullets | Bypasses review intent | Track `reviewedCount`; show warning if < 50% of bullets have been seen (scrolled past) |
| User confirms export but then navigates back and edits | Stale export is downloaded | Invalidate cached PDF on any state change after confirmation; re-generate on export |
| User rejects all tailored bullets | `TailoredResume` reverts to all originals | This is valid; export the original resume if no accepted changes remain |
| Confirmation modal closes without choice (Esc or click-outside) | Export silently proceeds or silently cancels | Default to cancel on dismiss; require explicit confirmation click |
| User accepts a bullet manually edited in the UI | Edited text is not what LLM returned | Store user-edited version in state; use it for both PDF and score recalculation |

### 4.4 JSON Schema Validation & Error Fallback

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| LLM returns a JSON array instead of the expected object | Zod schema rejects | Wrap unexpected arrays in `{ items: [...] }` if schema permits; else retry |
| LLM returns markdown-wrapped JSON (backtick fences) | `JSON.parse` fails | Strip markdown fences before parsing in `json_validator.py` |
| LLM returns truncated JSON (context window overflow) | Partial parse possible | Detect unclosed brackets; trigger retry with a shorter input |
| Retry budget exhausted (2 retries) | Service must fail gracefully | Return `status: "partial"`; include successfully parsed sub-results |
| Validation error message leaked to frontend | Exposes internal schema | Map all Zod/Pydantic errors to user-friendly strings before sending in API response |

### 4.5 Unsupported-Claim Detection Heuristics

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Tailored bullet adds a percentage not in the original | Fabricated metric | Regex: detect `\d+%` in `tailored` not present in `original`; auto-set `riskFlag: "fabricated-metric"` |
| Tailored bullet adds a dollar amount not in the original | Fabricated metric | Regex: detect `\$[\d,]+` in `tailored` not in `original`; same flag |
| Tailored bullet adds a new technology not in `ResumeProfile.skills` | Adds unsupported skill claim | Cross-reference all nouns in `tailored` against `skills` list; flag if new technical term appears |
| Tailored bullet changes the company name subtly | Fabricated employer | Diff `tailored` against `original` for proper nouns; flag any new proper noun |
| Heuristic produces false positives on common words | Flags every bullet | Use a domain-specific stoplist; only flag terms that match tech/metric/org patterns |

---

## Phase 5 — Polish & Demo Readiness (Week 5)

> Covers: sample data, loading states, error handling, SQLite persistence, responsive UI, disclaimer, PDF polish.

### 5.1 Sample Resume & JD (Demo Mode)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Demo data produces a score of 0 or 100 | Looks like a bug | Curate demo data to produce a score between 55–80 (realistic mid-match) |
| User modifies demo data and re-analyzes | May break demo flow | Allow; this is intentional; demo mode is just a starting state |
| Demo files not found (deleted from `public/`) | App crashes or shows empty inputs | Add a fallback check: if file fetch fails, silently skip pre-loading |
| Demo run triggers real LLM API call | Costs tokens on every demo page load | Gate demo behind a "Load Sample" button; never auto-run |

### 5.2 Loading States & Skeleton UI

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| LLM call takes > 30 seconds | User thinks app is broken | Show step-level progress: "Parsing resume... Scoring... Tailoring..." with elapsed time |
| One step succeeds but next fails | Partial progress shown, then error | Show partial results; clearly indicate which step failed; offer retry for that step only |
| User navigates away mid-analysis | State is lost | Warn with browser `beforeunload` event: "Analysis in progress. Leave?" |
| Skeleton UI flickers if response is instant | Poor UX | Only show skeleton after 300 ms delay; suppress for fast responses |
| Network timeout (>60 s) | `fetch` hangs indefinitely | Set explicit `AbortController` timeout of 60 seconds on all API calls |

### 5.3 Error Handling & Retry Logic

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| OpenAI API key is missing or invalid | All LLM calls fail | Return 401-like error with user-facing message: "API key not configured. Check `.env.local`." |
| OpenAI rate limit hit (429) | All calls fail during peak usage | Exponential backoff: 1s, 2s, 4s, max 3 retries; surface "Rate limit reached, retrying…" |
| OpenAI returns a 500 server error | Transient model failure | Retry once after 2 seconds; if still failing, return partial results with error note |
| Python FastAPI service is unreachable | All routes fail with `ECONNREFUSED` | Show banner: "Backend service unavailable. Is the Python server running?" |
| One bullet in a batch fails, others succeed | Entire tailoring run is aborted | Isolate failures per bullet; return successful bullets with `riskFlag: "processing-failed"` on failed ones |
| Network error (user goes offline mid-request) | Fetch rejects with `TypeError` | Detect `navigator.onLine`; show "No internet connection" toast; auto-retry when back online |

### 5.4 SQLite Persistence (Runs)

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| DB file is missing or corrupted | Prisma throws on startup | Run `prisma migrate deploy` on startup; catch migration errors and surface them |
| Run ID from URL does not exist in DB | `GET /api/run/:id` returns 404 | Show "Run not found" page; offer to start a new run |
| Concurrent writes to SQLite from multiple requests | DB lock contention | Enable WAL mode in SQLite; use Prisma connection pool size of 1 for SQLite |
| `resumeRaw` or `jdRaw` is very large (>50 KB) | SQLite TEXT column handles it but slowly | Compress with `zlib` before storage; decompress on read |
| User deletes a run while the PDF is being generated | Export fails mid-flight | Check run existence before starting PDF generation; return 404 if deleted |
| `Json` columns in Prisma receive invalid data | Prisma throws `P2023` | Always validate the JSON shape with Zod before writing to DB |

### 5.5 Responsive UI

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| Side-by-side diff on a 375 px wide mobile screen | Two columns do not fit | Stack columns vertically on `< 768px`; use tabs (Original / Tailored) instead |
| Score ring SVG does not scale on small screens | Overflow or clipping | Use `viewBox` with percentage-based sizing; no fixed `width`/`height` on SVG |
| Long skill tags overflow their container | Tags clip or wrap unpredictably | Use `flex-wrap: wrap` with `gap` |
| Keyboard navigation does not reach all interactive elements | Accessibility failure | Ensure all buttons, cards, and modals are reachable via Tab; add `focus-visible` styles |
| Tooltip on `ConfidenceBadge` renders off-screen on mobile | Tooltip hidden or clipped | Use a tooltip library that auto-repositions; or replace with a bottom sheet on mobile |

### 5.6 Truthfulness Disclaimer Banner

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| User dismisses the banner and it never reappears | User forgets the limitations | Persist dismiss state in `localStorage`; but re-show on every new tailoring run |
| Banner is rendered below the fold | User never sees it | Pin the banner to the top of the page on `/tailor` and `/export` routes |
| Disclaimer text is too long for small screens | Banner takes half the viewport | Collapse to a single icon + short text on mobile; expand on tap |

### 5.7 Final PDF Polish

| Edge Case | Symptom / Risk | Handling Strategy |
|---|---|---|
| PDF contains a page break mid-bullet | Bullet split across pages looks broken | Use `break-inside: avoid` CSS in Playwright HTML template; React PDF `wrap={false}` on bullet elements |
| Comparison PDF has no color (printer in B&W mode) | Highlighting is invisible | Ensure all change indicators also use bold or underline, not color alone |
| PDF filename contains spaces | Some browsers/OS handle it poorly | Replace spaces with `-` in generated filename: `tailored-resume-[company].pdf` |
| ATS scan of the tailored PDF fails | ATS rejects the application | Ensure React PDF output uses selectable text (no image-based rendering); test with ATS simulators |
| PDF header/footer repeats on each page | Comparison PDF becomes repetitive | In Playwright, use `@page` CSS rules to set header/footer only on the first page |

---

## Cross-Phase Edge Cases

These cases apply across multiple phases and should be handled globally.

| Edge Case | Affects | Handling Strategy |
|---|---|---|
| `AppState` is reset by browser refresh | Phases 1–4 | Persist `AppState` to `sessionStorage`; rehydrate on mount |
| API response `status: "partial"` is silently ignored | All phases | Surface a non-blocking warning in the UI for partial results |
| User has a browser extension that blocks fetch to localhost | Phase 2+ | Document in README; cannot detect programmatically |
| OpenAI model is deprecated mid-development | Phase 2+ | Abstract model name into an env var `OPENAI_MODEL`; default `gpt-4o` |
| Resume or JD contains PII in logs | Phase 2+ | Never log raw `resumeRaw` or `jdRaw`; log only metadata (char count, format) |
| LLM output contains backtick-wrapped code blocks as content | Phase 2+ | Strip code fences in `json_validator.py` before every `JSON.parse` attempt |
| `TailoringRun.id` UUID collision | Phase 5 | Use `crypto.randomUUID()` (browser) or `uuid4()` (Python); handle DB unique constraint error |

---

*This file is a living document. Update each section as new edge cases are discovered during implementation.*
