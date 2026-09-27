/**
 * Zod schemas for all data models.
 * These mirror the TypeScript interfaces in types/index.ts exactly
 * and are used to validate LLM JSON responses at runtime.
 */

import { z } from "zod";

// ── Resume ──────────────────────────────────────────────────────────────────

export const ContactInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
});

export const ExperienceEntrySchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()).default([]),
});

export const ProjectEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  bullets: z.array(z.string()).default([]),
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
  skills: z.array(z.string()).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  certifications: z.array(z.string()).default([]),
});

// ── Job Description ─────────────────────────────────────────────────────────

export const SeniorityLevelSchema = z.enum([
  "intern", "junior", "mid", "senior", "lead", "principal",
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
  original: z.string(),
  tailored: z.string(),
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

// ── Type exports (inferred from Zod) ────────────────────────────────────────

export type ZodResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type ZodJobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;
export type ZodMatchScore = z.infer<typeof MatchScoreSchema>;
export type ZodRewrittenBullet = z.infer<typeof RewrittenBulletSchema>;
export type ZodTailoredResume = z.infer<typeof TailoredResumeSchema>;
export type ZodResumeGap = z.infer<typeof ResumeGapSchema>;
export type ZodGapAnalysisResult = z.infer<typeof GapAnalysisResultSchema>;
export type ZodTailoringRun = z.infer<typeof TailoringRunSchema>;
