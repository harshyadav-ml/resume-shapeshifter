# Resume Shapeshifter

> AI-powered resume tailoring with full explainability — truthful by design.

Resume Shapeshifter aligns an existing resume to a target job description, rewrites bullet points to reflect relevant requirements, provides a granular before/after match score (0–100), flags potentially unverifiable modifications, and exports two distinct artifacts: a clean tailored resume PDF and a side-by-side comparative verification PDF.

---

## Features

- **Match Scoring** — 0–100 overall compatibility score with category breakdowns: skill coverage, responsibility alignment, keyword density, and seniority fit.
- **Bullet Rewriting** — Resume bullets tailored to target criteria with explicit confidence classifications (High / Medium / Low) and risk flags.
- **Verification Guardrails** — All risk-flagged revisions require manual confirmation before export; modifications can be accepted or reverted individually.
- **Gap Analysis** — Structured audit of missing qualifications with safety flags indicating whether they can be added without inflating credentials.
- **Dual PDF Export** — Client-side generation of both an ATS-ready tailored resume and a complete before-and-after audit trail.
- **Local Persistence** — Local run logging via SQLite, reviewable at `/history`.
- **Demonstration Mode** — Deterministic test workflows accessible via `?demo=true` or the interface load trigger.

---

## Tech Stack & Dependencies

### Runtime & Framework
- **Next.js 14** (`next`, App Router architecture)
- **React 18** (`react`, `react-dom`)
- **TypeScript** (`typescript`, `@types/node`, `@types/react`, `@types/react-dom`)

### UI, Styling & Design System
- **Tailwind CSS** (`tailwindcss`, `postcss`, `autoprefixer`)
- **Shadcn UI Primitives** (`@radix-ui/react-slot`, `@radix-ui/react-progress`, `@radix-ui/react-separator`, `@radix-ui/react-toast`)
- **Styling Utilities** (`clsx`, `tailwind-merge`, `class-variance-authority`)
- **Icons** (`lucide-react`)

### AI & Data Validation
- **Groq SDK** (`groq-sdk`) — Model: `llama-3.3-70b-versatile`
- **Zod** (`zod`) — Strict schema extraction and validation

### Document Compilation
- **React-PDF** (`@react-pdf/renderer`) — Client-side ATS and comparison PDF export

### Database & Persistence
- **Prisma ORM** (`prisma`, `@prisma/client`)
- **SQLite Engine** (`better-sqlite3`, `@types/better-sqlite3`)

---

## Setup (9 steps)

### 1. Clone the repository

```bash
git clone [https://github.com/harshyadav-ml/resume-shapeshifter.git](https://github.com/harshyadav-ml/resume-shapeshifter.git)
cd resume-shapeshifter

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| LLM | Groq (llama-3.3-70b-versatile) |
| Validation | Zod |
| PDF | @react-pdf/renderer |
| Database | SQLite via Prisma 7 + better-sqlite3 |

---

## Setup (9 steps)

### 1. Clone the repository

```bash
git clone <repo-url>
cd resume-shapeshifter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com).

### 4. Set up the SQLite database

The `.env` file already contains `DATABASE_URL="file:./prisma/dev.db"`. Run:

```bash
npx prisma migrate dev --name init
```

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Try the demo

Visit [http://localhost:3000/input?demo=true](http://localhost:3000/input?demo=true) — or click **Load Sample Data** on the input page — for an instant demo without typing.

### 8. Verify the full pipeline

1. Paste a resume + job description (or load sample data)
2. Click **Analyze** — takes 15–30 seconds
3. Review analysis → generate tailored resume → accept/revert bullets
4. Export tailored PDF and/or comparison PDF

### 9. View run history

Visit [http://localhost:3000/history](http://localhost:3000/history) to see all saved runs.

---

## Project Structure

```
resume-shapeshifter/
├── app/
│   ├── page.tsx               # Landing overview
│   ├── input/page.tsx         # Document ingestion interface
│   ├── analyze/page.tsx       # Gap analysis and score breakdown
│   ├── tailor/page.tsx        # Comparative bullet review workbench
│   ├── export/page.tsx        # PDF compilation and download
│   ├── history/page.tsx       # Session audit history
│   └── api/
│       ├── tailor-run/        # Pipeline orchestration
│       ├── parse-resume/      # Resume entity extraction
│       ├── parse-jd/          # Job description parsing
│       ├── score/             # Compatibility scoring
│       ├── tailor/            # Targeted bullet refinement
│       ├── gaps/              # Requirement gap analyzer
│       └── run/[id]/          # Session persistence retrieval
├── components/
│   ├── PipelineProgress.tsx   # Real-time state visualization
│   ├── ScoreCard.tsx          # Comparative score display
│   ├── BulletCard.tsx         # Granular edit-level diff cards
│   ├── SideBySideDiff.tsx     # Full-document comparative layout
│   ├── GapAnalysis.tsx        # Discrepancy reporting interface
│   ├── ReviewGate.tsx         # Safety check blocking unverified exports
│   ├── ConfidenceBadge.tsx    # Model confidence status indicators
│   ├── ErrorBanner.tsx        # Pipeline fault handling interface
│   └── pdf/
│       ├── TailoredResumePDF.tsx
│       └── ComparisonPDF.tsx
├── lib/
│   ├── groq.ts                # Inference client & validation retry loop
│   ├── schemas.ts             # Strict input/output Zod schemas
│   ├── api.ts                 # Client-side API integration layer
│   ├── context.tsx            # Global application state machine
│   ├── mock-data.ts           # Demo payloads
│   ├── db.ts                  # Database client singleton
│   └── prompts/               # Structured prompt templates
├── prisma/
│   ├── schema.prisma          # Data schema definition
│   └── dev.db                 # Local SQLite database (git-ignored)
├── public/
│   ├── sample-resume.txt      # Reference input profile
│   └── sample-jd.txt          # Reference job specification
└── types/
    └── index.ts               # Core domain TypeScript types
```

---

## Truthfulness Guarantee

Resume Shapeshifter is designed around a strict truthfulness constraint:

- **Risk flags** are shown on any bullet where the AI introduced something that may not be verifiable
- **Accept/Revert** — every changed bullet can be individually reverted to original
- **Export blocked** until all risk flags are reviewed
- **No hallucinations by design** — prompts instruct the model to preserve all factual claims

---

## Disclaimer

All AI-generated suggestions must be verified for accuracy before submitting to an employer. Never include experience, certifications, or metrics that don't reflect your actual background. Resume Shapeshifter is a drafting tool, not a source of truth.
