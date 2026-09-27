// ============================================================
// Resume Shapeshifter — TypeScript Type Definitions
// ============================================================

// ----------------------------------------------------------
// Core Resume Types
// ----------------------------------------------------------

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string; // "Present" if current
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  bullets: string[];
  technologies: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface ResumeProfile {
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: string[];
}

// ----------------------------------------------------------
// Job Description Types
// ----------------------------------------------------------

export type SeniorityLevel = "intern" | "junior" | "mid" | "senior" | "lead" | "principal";

export interface JobDescriptionProfile {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  tools: string[];
  keywords: string[];
  seniorityLevel: SeniorityLevel;
  domainSignals: string[];
  softSkills: string[];
}

// ----------------------------------------------------------
// Match Scoring Types
// ----------------------------------------------------------

export interface MatchScore {
  overallScore: number; // 0–100
  skillCoverageScore: number;
  responsibilityAlignmentScore: number;
  keywordScore: number;
  seniorityScore: number;
  criticalMissingRequirements: string[];
  explanation: string; // Human-readable summary
}

// ----------------------------------------------------------
// Tailored Resume Types
// ----------------------------------------------------------

export type ConfidenceLevel = "high" | "medium" | "low";

export interface RewrittenBullet {
  original: string;
  tailored: string;
  changeReason: string;
  keywordsAddressed: string[];
  confidence: ConfidenceLevel;
  riskFlag: string; // Empty string if no risk
  confirmed?: boolean; // Client-side only: user accepted/reverted
}

export interface TailoredExperienceEntry {
  company: string;
  title: string;
  bullets: RewrittenBullet[];
}

export interface TailoredResume {
  tailoredSummary: string;
  tailoredSkills: string[];
  tailoredExperience: TailoredExperienceEntry[];
}

// ----------------------------------------------------------
// Gap Analysis Types
// ----------------------------------------------------------

export type GapImportance = "high" | "medium" | "low";

export interface ResumeGap {
  name: string;
  importance: GapImportance;
  jdEvidence: string;
  resumeEvidence: string; // Empty if not present
  suggestedAction: string;
  canSafelyAdd: boolean;
}

// ----------------------------------------------------------
// Run / Session Types
// ----------------------------------------------------------

export type ExportDocType = "tailored-pdf" | "comparison-pdf" | "markdown" | "docx";

export interface ExportedDocument {
  type: ExportDocType;
  url: string;
  generatedAt: string;
}

export interface TailoringRun {
  id: string; // UUID
  createdAt: string; // ISO timestamp
  resumeProfile: ResumeProfile;
  jdProfile: JobDescriptionProfile;
  originalScore: MatchScore;
  tailoredResume: TailoredResume;
  tailoredScore: MatchScore;
  gaps: ResumeGap[];
  exportedDocuments?: ExportedDocument[];
}

// ----------------------------------------------------------
// App State Types
// ----------------------------------------------------------

export type AppStatus =
  | "idle"
  | "parsing"
  | "scoring"
  | "tailoring"
  | "done"
  | "error"
  | "partial";

export interface AppState {
  resume: ResumeProfile | null;
  jd: JobDescriptionProfile | null;
  matchScore: MatchScore | null;
  tailoredResume: TailoredResume | null;
  gaps: ResumeGap[];
  tailoringRun: TailoringRun | null;
  status: AppStatus;
  errors: string[];
  // Raw input kept for reference
  resumeRaw: string;
  jdRaw: string;
}

// ----------------------------------------------------------
// App Action Types (useReducer)
// ----------------------------------------------------------

export type AppAction =
  | { type: "SET_RESUME_RAW"; payload: string }
  | { type: "SET_JD_RAW"; payload: string }
  | { type: "SET_STATUS"; payload: AppStatus }
  | { type: "SET_RUN"; payload: TailoringRun }
  | { type: "SET_ERRORS"; payload: string[] }
  | { type: "RESET" }
  | { type: "CONFIRM_BULLET"; payload: { experienceIndex: number; bulletIndex: number; confirmed: boolean } }
  | { type: "REVERT_BULLET"; payload: { experienceIndex: number; bulletIndex: number } };
