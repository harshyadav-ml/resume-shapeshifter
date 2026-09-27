import {
  TailoringRun,
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  ResumeGap,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
} from "@/types";

// ============================================================
// Realistic mock resume — 3 years experience, React/Node/Python
// ============================================================
const mockResume: ResumeProfile = {
  contact: {
    name: "Alex Chen",
    email: "alex.chen@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexchen",
    github: "github.com/alexchen",
  },
  summary:
    "Full-stack software engineer with 3 years of experience building scalable web applications using React, Node.js, and Python. Passionate about clean code, CI/CD pipelines, and developer productivity. Experience working in agile environments at early-stage startups.",
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "REST APIs",
    "GraphQL",
    "Git",
    "AWS EC2",
    "S3",
    "Jest",
    "Agile/Scrum",
  ],
  experience: [
    {
      company: "DataSync Inc.",
      title: "Software Engineer",
      startDate: "Jan 2023",
      endDate: "Present",
      bullets: [
        "Built a real-time data pipeline dashboard using React and WebSockets, reducing latency monitoring time by 40%",
        "Developed RESTful APIs in Node.js/Express serving 50k+ daily requests with 99.9% uptime",
        "Containerized 5 microservices with Docker, reducing deployment friction across staging and production environments",
        "Implemented automated test coverage (Jest + Cypress) from 30% to 78%, catching 15+ critical regressions",
      ],
    },
    {
      company: "TechFlow Startup",
      title: "Junior Software Developer",
      startDate: "Jun 2021",
      endDate: "Dec 2022",
      bullets: [
        "Contributed to a React-based SaaS dashboard with 200+ enterprise customers",
        "Built Python scripts to automate data ingestion from 3rd-party APIs, saving 8 hours/week of manual work",
        "Migrated legacy monolith endpoints to Express microservices as part of company-wide refactor",
        "Participated in weekly code reviews and sprint retrospectives; improved PR review cycle time by 20%",
      ],
    },
  ] as ExperienceEntry[],
  projects: [
    {
      name: "OpenResume Analyzer",
      description:
        "Open-source tool for parsing and scoring resumes against job descriptions using NLP.",
      bullets: [
        "Built NLP pipeline using Python/spaCy to extract entities from resumes",
        "Created React frontend with side-by-side resume comparison view",
        "Deployed to AWS EC2 with Nginx reverse proxy; serves 500+ monthly users",
      ],
      technologies: ["Python", "spaCy", "React", "AWS EC2", "Nginx"],
    },
    {
      name: "DevTrack CLI",
      description: "Command-line productivity tracker for software developers.",
      bullets: [
        "Built Node.js CLI tool with Ink (React for terminals) for project time tracking",
        "Persisted data with SQLite and generated weekly summary reports",
      ],
      technologies: ["Node.js", "Ink", "SQLite", "TypeScript"],
    },
  ] as ProjectEntry[],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      graduationDate: "May 2021",
      gpa: "3.7",
    },
  ] as EducationEntry[],
  certifications: ["AWS Certified Developer – Associate (2023)", "MongoDB Professional Developer (2022)"],
};

// ============================================================
// Realistic mock JD — Senior Frontend Engineer
// ============================================================
const mockJD: JobDescriptionProfile = {
  jobTitle: "Senior Frontend Engineer",
  company: "Nebula Systems",
  requiredSkills: ["React", "TypeScript", "GraphQL", "CI/CD", "Unit Testing"],
  preferredSkills: ["Next.js", "AWS", "Design Systems", "Storybook", "WebSockets"],
  responsibilities: [
    "Lead frontend architecture for core product dashboard",
    "Collaborate with design team to build and maintain design system",
    "Write and maintain comprehensive unit and integration tests",
    "Mentor junior engineers and lead bi-weekly frontend guild meetings",
    "Integrate with backend GraphQL APIs and define shared contracts",
    "Drive CI/CD pipeline improvements to reduce deployment lead time",
  ],
  qualifications: [
    "4+ years of experience with React",
    "Strong TypeScript proficiency",
    "Experience with GraphQL clients (Apollo or urql)",
    "Track record of improving test coverage and code quality",
    "Experience mentoring or leading small engineering teams",
  ],
  tools: ["React", "TypeScript", "GraphQL", "Apollo Client", "Jest", "GitHub Actions", "AWS", "Docker"],
  keywords: [
    "frontend",
    "React",
    "TypeScript",
    "GraphQL",
    "CI/CD",
    "design system",
    "testing",
    "mentoring",
    "senior",
  ],
  seniorityLevel: "senior",
  domainSignals: ["SaaS", "B2B", "data dashboard", "enterprise"],
  softSkills: ["leadership", "communication", "mentorship", "collaboration"],
};

// ============================================================
// Mock scores
// ============================================================
const mockOriginalScore: MatchScore = {
  overallScore: 58,
  skillCoverageScore: 65,
  responsibilityAlignmentScore: 52,
  keywordScore: 60,
  seniorityScore: 45,
  criticalMissingRequirements: ["GraphQL experience", "Mentoring experience", "4+ years React"],
  explanation:
    "Alex has a solid React and TypeScript background and relevant testing experience. However, the role requires senior-level leadership (mentoring, architecture), GraphQL with Apollo, and design system experience that are not clearly demonstrated in the current resume.",
};

const mockTailoredScore: MatchScore = {
  overallScore: 84,
  skillCoverageScore: 88,
  responsibilityAlignmentScore: 82,
  keywordScore: 90,
  seniorityScore: 74,
  criticalMissingRequirements: ["Explicit design system ownership"],
  explanation:
    "After tailoring, Alex's resume now clearly highlights GraphQL integration work, test coverage leadership, CI/CD improvements, and mentorship during code reviews. The match score improved significantly from 58 to 84.",
};

// ============================================================
// Mock tailored resume
// ============================================================
const mockTailoredResume: TailoredResume = {
  tailoredSummary:
    "Senior full-stack engineer with 3+ years building enterprise-grade React/TypeScript applications. Proven track record of improving test coverage, leading CI/CD pipeline improvements, integrating GraphQL APIs, and mentoring junior engineers. Looking to bring architecture leadership skills to Nebula Systems' core product dashboard.",
  tailoredSkills: [
    "React",
    "TypeScript",
    "GraphQL",
    "Node.js",
    "Python",
    "Docker",
    "AWS",
    "Jest",
    "Cypress",
    "CI/CD",
    "PostgreSQL",
    "REST APIs",
    "Agile",
    "Mentoring",
  ],
  tailoredExperience: [
    {
      company: "DataSync Inc.",
      title: "Software Engineer",
      bullets: [
        {
          original:
            "Built a real-time data pipeline dashboard using React and WebSockets, reducing latency monitoring time by 40%",
          tailored:
            "Architected and led development of a real-time enterprise dashboard in React/TypeScript with WebSockets, reducing operational latency monitoring time by 40% for 200+ enterprise users",
          changeReason:
            "Added 'architected and led' to signal senior ownership; added TypeScript; emphasized enterprise scale to align with JD's B2B/enterprise signals",
          keywordsAddressed: ["React", "TypeScript", "senior", "enterprise", "dashboard"],
          confidence: "high",
          riskFlag: "",
        },
        {
          original:
            "Developed RESTful APIs in Node.js/Express serving 50k+ daily requests with 99.9% uptime",
          tailored:
            "Designed and integrated GraphQL APIs alongside REST endpoints in Node.js/Express, serving 50k+ daily requests with 99.9% uptime; defined shared frontend/backend data contracts",
          changeReason:
            "Added GraphQL mention to address a critical missing requirement. Note: verify Alex actually worked with GraphQL — if not, revert to original",
          keywordsAddressed: ["GraphQL", "frontend", "backend contracts"],
          confidence: "medium",
          riskFlag:
            "Added 'GraphQL APIs' — confirm this is accurate. If Alex only used REST, revert to original bullet.",
        },
        {
          original:
            "Containerized 5 microservices with Docker, reducing deployment friction across staging and production environments",
          tailored:
            "Containerized 5 microservices with Docker and implemented GitHub Actions CI/CD pipeline, reducing deployment lead time by 35% across staging and production environments",
          changeReason:
            "Added CI/CD pipeline detail to directly address the JD requirement of driving CI/CD improvements and reducing deployment lead time",
          keywordsAddressed: ["CI/CD", "GitHub Actions", "deployment"],
          confidence: "medium",
          riskFlag: "Confirm GitHub Actions was the specific tool used and the 35% metric is accurate.",
        },
        {
          original:
            "Implemented automated test coverage (Jest + Cypress) from 30% to 78%, catching 15+ critical regressions",
          tailored:
            "Led initiative to grow automated test coverage from 30% to 78% using Jest and Cypress, establishing testing standards and catching 15+ critical regressions before production",
          changeReason:
            "Added 'Led initiative' and 'establishing testing standards' to demonstrate senior ownership of quality; aligns with JD requirement for test coverage track record",
          keywordsAddressed: ["testing", "Jest", "senior", "leadership", "CI/CD"],
          confidence: "high",
          riskFlag: "",
        },
      ],
    },
    {
      company: "TechFlow Startup",
      title: "Junior Software Developer",
      bullets: [
        {
          original: "Contributed to a React-based SaaS dashboard with 200+ enterprise customers",
          tailored:
            "Contributed features to a React/TypeScript SaaS dashboard serving 200+ enterprise customers, collaborating with design team on component library improvements",
          changeReason:
            "Added TypeScript and design system/component library collaboration to align with JD requirements for TypeScript proficiency and design system experience",
          keywordsAddressed: ["TypeScript", "React", "design system", "SaaS", "enterprise"],
          confidence: "medium",
          riskFlag: "Confirm TypeScript was used at TechFlow and component library work was part of role.",
        },
        {
          original:
            "Built Python scripts to automate data ingestion from 3rd-party APIs, saving 8 hours/week of manual work",
          tailored:
            "Built Python automation scripts for 3rd-party API data ingestion, saving 8 hours/week of manual work and enabling data-driven product decisions",
          changeReason: "Minor enhancement to highlight business impact; preserved all factual claims",
          keywordsAddressed: ["automation", "APIs"],
          confidence: "high",
          riskFlag: "",
        },
        {
          original:
            "Migrated legacy monolith endpoints to Express microservices as part of company-wide refactor",
          tailored:
            "Migrated legacy monolith endpoints to Express microservices as part of company-wide architectural refactor, improving system maintainability and enabling independent deployments",
          changeReason: "Added outcome to show architectural thinking; no facts changed",
          keywordsAddressed: ["architecture", "microservices"],
          confidence: "high",
          riskFlag: "",
        },
        {
          original:
            "Participated in weekly code reviews and sprint retrospectives; improved PR review cycle time by 20%",
          tailored:
            "Actively participated in code reviews and facilitated sprint retrospectives; reduced PR review cycle time by 20% and began mentoring 2 new interns on React best practices",
          changeReason:
            "Added mentoring detail to address the JD's mentorship requirement; preserved original metric",
          keywordsAddressed: ["mentoring", "code reviews", "collaboration"],
          confidence: "medium",
          riskFlag: "Confirm Alex mentored interns — if not, remove mentoring clause.",
        },
      ],
    },
  ],
};

// ============================================================
// Mock gaps
// ============================================================
const mockGaps: ResumeGap[] = [
  {
    name: "GraphQL / Apollo Client",
    importance: "high",
    jdEvidence: "Experience with GraphQL clients (Apollo or urql) — required qualification",
    resumeEvidence: "",
    suggestedAction:
      "Add any GraphQL work in the OpenResume Analyzer project or DataSync APIs. If none exists, mention willingness to learn or any REST-to-GraphQL migration work.",
    canSafelyAdd: false,
  },
  {
    name: "Mentoring / Team Leadership",
    importance: "high",
    jdEvidence:
      "Mentor junior engineers and lead bi-weekly frontend guild meetings — key responsibility",
    resumeEvidence: "Participated in weekly code reviews and sprint retrospectives",
    suggestedAction:
      "Expand on code review participation to highlight any informal mentoring. If you've onboarded interns or newer engineers, include that.",
    canSafelyAdd: true,
  },
  {
    name: "Design System Ownership",
    importance: "medium",
    jdEvidence:
      "Collaborate with design team to build and maintain design system — listed responsibility",
    resumeEvidence: "",
    suggestedAction:
      "If you built reusable component libraries or worked with Storybook/Figma tokens, add that to the TechFlow role.",
    canSafelyAdd: false,
  },
  {
    name: "4+ Years React Experience",
    importance: "medium",
    jdEvidence: "4+ years of experience with React — required qualification",
    resumeEvidence: "3 years total professional experience; React used throughout",
    suggestedAction:
      "Include any personal project React work before professional experience to demonstrate longer React use. Be truthful about total years.",
    canSafelyAdd: false,
  },
  {
    name: "Storybook",
    importance: "low",
    jdEvidence: "Storybook — listed as preferred skill",
    resumeEvidence: "",
    suggestedAction:
      "If you've used Storybook for component documentation, add it to skills. Otherwise safe to omit.",
    canSafelyAdd: false,
  },
];

// ============================================================
// The full mock TailoringRun
// ============================================================
export const mockTailoringRun: TailoringRun = {
  id: "mock-run-001",
  createdAt: new Date().toISOString(),
  resumeProfile: mockResume,
  jdProfile: mockJD,
  originalScore: mockOriginalScore,
  tailoredResume: mockTailoredResume,
  tailoredScore: mockTailoredScore,
  gaps: mockGaps,
};

export { mockResume, mockJD, mockOriginalScore, mockTailoredScore, mockGaps };
