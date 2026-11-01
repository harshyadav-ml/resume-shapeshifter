/**
 * Zod schemas for all data models.
 * These mirror the TypeScript interfaces in types/index.ts exactly
 * and are used to validate LLM JSON responses at runtime.
 *
 * This file also exports:
 * - `ResumeIngestionSchema` — permissive schema for raw CSV/plain-text imports
 * - `StepInputSchemas` — per-step API route body validators
 */

import { z } from "zod";

// ── Resume ──────────────────────────────────────────────────────────────────

export const ContactInfoSchema = z.object({
  /** Name must be non-empty — an LLM returning "" for name fails validation. */
  name: z.string().min(1, "Name is required"),
  /**
   * Email must be a valid email address if present; allow empty string for
   * resumes that have no email listed.
   */
  email: z.string().email().or(z.literal("")),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
});

export const ExperienceEntrySchema = z.object({
  /** Company name must be non-empty. */
  company: z.string().min(1),
  /** Job title must be non-empty. */
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  /**
   * Each bullet must be non-empty and at most 500 chars.
   * Array capped at 15 bullets per entry to prevent runaway token consumption.
   */
  bullets: z.array(z.string().min(1).max(500)).max(15).default([]),
});

export const ProjectEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  bullets: z.array(z.string().min(1).max(500)).max(15).default([]),
  technologies: z.array(z.string()).default([]),
});

export const EducationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationDate: z.string(),
  gpa: z.string().optional().default(""),
});

export const ResumeProfileSchema = z.object({
  contact: ContactInfoSchema,
  summary: z.string().default(""),
  /**
   * Each skill must be non-empty and at most 80 chars.
   * Array capped at 50 skills to prevent runaway token consumption.
   */
  skills: z.array(z.string().min(1).max(80)).max(50).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  certifications: z.array(z.string()).default([]),
});

// ── ResumeIngestionSchema ────────────────────────────────────────────────────
/**
 * Intentionally permissive schema for raw CSV / plain-text resume imports.
 * - Strips surrounding whitespace from all string fields.
 * - Coerces comma-separated skills strings into arrays via .transform().
 * - Does NOT enforce min-lengths (raw data may have placeholder values).
 *
 * Use this at the ingestion boundary; use `ResumeProfileSchema` for LLM output validation.
 */
export const ResumeIngestionSchema = z.object({
  contact: z.object({
    name: z.string().transform((s) => s.trim()),
    email: z.string().transform((s) => s.trim()),
    phone: z.string().optional().default("").transform((s) => s.trim()),
    location: z.string().optional().default("").transform((s) => s.trim()),
    linkedin: z.string().optional().default("").transform((s) => s.trim()),
    github: z.string().optional().default("").transform((s) => s.trim()),
  }),
  summary: z.string().default("").transform((s) => s.trim()),
  /**
   * Skills may arrive as a comma-separated string or as an array.
   * We normalise both forms into a clean string[].
   */
  skills: z
    .union([
      z.array(z.string()),
      z.string().transform((s) =>
        s
          .split(",")
          .map((sk) => sk.trim())
          .filter(Boolean)
      ),
    ])
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string().transform((s) => s.trim()),
        title: z.string().transform((s) => s.trim()),
        startDate: z.string().transform((s) => s.trim()),
        endDate: z.string().transform((s) => s.trim()),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().transform((s) => s.trim()),
        description: z.string().transform((s) => s.trim()),
        bullets: z.array(z.string()).default([]),
        technologies: z.array(z.string()).default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().transform((s) => s.trim()),
        degree: z.string().transform((s) => s.trim()),
        field: z.string().transform((s) => s.trim()),
        graduationDate: z.string().transform((s) => s.trim()),
        gpa: z.string().optional().default(""),
      })
    )
    .default([]),
  certifications: z.array(z.string()).default([]),
});

// ── Job Description ─────────────────────────────────────────────────────────

export const SeniorityLevelSchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
]);

export const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  seniorityLevel: SeniorityLevelSchema.default("mid"),
  domainSignals: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
});

// ── Match Score ──────────────────────────────────────────────────────────────

export const MatchScoreSchema = z.object({
  matched_skills: z.number().int().min(0),
  total_required_skills: z.number().int().min(0),
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()).default([]),
  explanation: z.string(),
});

// ── Tailored Resume ─────────────────────────────────────────────────────────

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const RewrittenBulletSchema = z.object({
  /** Original bullet text — must be non-empty. */
  original: z.string().min(1),
  /**
   * Tailored bullet text — must be non-empty and at most 600 chars.
   * This guards against hallucinated 500-word bullets.
   */
  tailored: z.string().min(1).max(600),
  changeReason: z.string(),
  keywordsAddressed: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema,
  riskFlag: z.string().default(""),
});

export const TailoredExperienceEntrySchema = z.object({
  company: z.string(),
  title: z.string(),
  bullets: z.array(RewrittenBulletSchema).default([]),
});

export const TailoredResumeSchema = z.object({
  tailoredSummary: z.string(),
  tailoredSkills: z.array(z.string()).default([]),
  tailoredExperience: z.array(TailoredExperienceEntrySchema).default([]),
  /**
   * originalSkills is stored alongside the tailored resume for hallucination
   * cross-checking in prompts (verifying tailored skills ⊆ original skills ∪ JD skills).
   */
  originalSkills: z.array(z.string()).default([]),
});

// ── Gap Analysis ────────────────────────────────────────────────────────────

export const GapImportanceSchema = z.enum(["high", "medium", "low"]);

export const ResumeGapSchema = z.object({
  name: z.string(),
  importance: GapImportanceSchema,
  jdEvidence: z.string(),
  resumeEvidence: z.string().default(""),
  suggestedAction: z.string(),
  canSafelyAdd: z.boolean(),
});

export const GapAnalysisResultSchema = z.object({
  gaps: z.array(ResumeGapSchema).default([]),
});

// ── Tailoring Run ───────────────────────────────────────────────────────────

export const TailoringRunSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  resumeProfile: ResumeProfileSchema,
  jdProfile: JobDescriptionProfileSchema,
  originalScore: MatchScoreSchema,
  tailoredResume: TailoredResumeSchema,
  tailoredScore: MatchScoreSchema,
  gaps: z.array(ResumeGapSchema).default([]),
});

// ── Step Input Schemas ───────────────────────────────────────────────────────
/**
 * Per-step Zod schemas for validating API route request bodies BEFORE calling
 * the LLM. This decouples input validation from LLM output validation and
 * ensures type-safe access throughout the route handler.
 *
 * Keys match the ?step=N query parameter.
 */
export const StepInputSchemas = {
  /** Step 1: Parse resume — body: { resumeText: string } */
  "1": z.object({
    resumeText: z.string().min(1, "resumeText must be a non-empty string"),
  }),
  /** Step 2: Parse JD — body: { jdText: string } */
  "2": z.object({
    jdText: z.string().min(1, "jdText must be a non-empty string"),
  }),
  /** Step 3: Score original — body: { resumeProfile, jdProfile } */
  "3": z.object({
    resumeProfile: ResumeProfileSchema,
    jdProfile: JobDescriptionProfileSchema,
  }),
  /**
   * Step 4: Rewrite a single bullet or batch of bullets —
   * body: { bullet?: string, bullets?: string[], company: string, title: string, jdProfile }
   */
  "4": z
    .object({
      bullet: z.string().min(1, "bullet must be a non-empty string").optional(),
      bullets: z
        .array(z.string().min(1, "each bullet must be a non-empty string"))
        .optional(),
      company: z.string().min(1, "company must be a non-empty string"),
      title: z.string().min(1, "title must be a non-empty string"),
      jdProfile: JobDescriptionProfileSchema,
    })
    .refine(
      (data) =>
        data.bullet !== undefined ||
        (Array.isArray(data.bullets) && data.bullets.length > 0),
      {
        message: "Either 'bullet' or 'bullets' array must be provided",
      }
    ),
  /** Step 5: Gap analysis — body: { resumeProfile, jdProfile } */
  "5": z.object({
    resumeProfile: ResumeProfileSchema,
    jdProfile: JobDescriptionProfileSchema,
  }),
  /** Step 6: Score tailored — body: { resumeProfile, jdProfile } */
  "6": z.object({
    resumeProfile: ResumeProfileSchema,
    jdProfile: JobDescriptionProfileSchema,
  }),
} as const;

// ── Type exports (inferred from Zod) ────────────────────────────────────────

export type ZodResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type ZodJobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;
export type ZodMatchScore = z.infer<typeof MatchScoreSchema>;
export type ZodRewrittenBullet = z.infer<typeof RewrittenBulletSchema>;
export type ZodTailoredResume = z.infer<typeof TailoredResumeSchema>;
export type ZodResumeGap = z.infer<typeof ResumeGapSchema>;
export type ZodGapAnalysisResult = z.infer<typeof GapAnalysisResultSchema>;
export type ZodTailoringRun = z.infer<typeof TailoringRunSchema>;
export type ZodResumeIngestion = z.infer<typeof ResumeIngestionSchema>;
