# Resume Shapeshifter

> AI-powered resume tailoring with full explainability — truthful by design.

Resume Shapeshifter takes your resume and a job description, rewrites every bullet point to align with the JD, gives you a before/after match score (0–100), flags every risky suggestion, and exports two PDFs: a clean tailored resume and a full side-by-side comparison proof artifact.

---

## Features

- 🔍 **Match Scoring** — 0–100 match score with subscores (skill coverage, responsibility alignment, keyword density, seniority)
- ✍️ **Bullet Rewriting** — Every resume bullet tailored to the JD with confidence levels (High / Medium / Low) and risk flags
- ⚠️ **Guardrails** — All risk-flagged bullets require your explicit review before export; accept or revert individually
- 📊 **Gap Analysis** — Structured list of missing qualifications with `canSafelyAdd` safety check
- 📄 **PDF Export** — Tailored resume PDF + side-by-side comparison PDF, generated client-side
- 💾 **Persistence** — All runs saved to SQLite; view history at `/history`
- 🎭 **Demo Mode** — One-click sample data (`?demo=true`) or `Load Sample Data` button

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
│   ├── page.tsx              # Landing page
│   ├── input/page.tsx        # Resume + JD input (Step 1)
│   ├── analyze/page.tsx      # Analysis results (Step 2)
│   ├── tailor/page.tsx       # Side-by-side editor (Step 3)
│   ├── export/page.tsx       # PDF export (Step 4)
│   ├── history/page.tsx      # Run history
│   └── api/
│       ├── tailor-run/       # Full pipeline orchestrator
│       ├── parse-resume/     # Resume parser
│       ├── parse-jd/         # JD extractor
│       ├── score/            # Match scorer
│       ├── tailor/           # Bullet rewriter
│       ├── gaps/             # Gap analyzer
│       └── run/[id]/         # Retrieve saved run
├── components/
│   ├── PipelineProgress.tsx  # Animated pipeline status
│   ├── ScoreCard.tsx         # Before/after score ring
│   ├── BulletCard.tsx        # Original vs tailored diff
│   ├── SideBySideDiff.tsx    # Full experience diff
│   ├── GapAnalysis.tsx       # Gap list with safety flags
│   ├── ReviewGate.tsx        # Blocks export until reviewed
│   ├── ConfidenceBadge.tsx   # High/Medium/Low badge
│   ├── ErrorBanner.tsx       # Error + retry UI
│   └── pdf/
│       ├── TailoredResumePDF.tsx
│       └── ComparisonPDF.tsx
├── lib/
│   ├── groq.ts               # Groq client + Zod retry
│   ├── schemas.ts            # Zod schemas
│   ├── api.ts                # Client-side API wrappers
│   ├── context.tsx           # AppContext (useReducer)
│   ├── mock-data.ts          # Demo TailoringRun
│   ├── db.ts                 # Prisma singleton
│   └── prompts/              # LLM prompt templates
├── prisma/
│   ├── schema.prisma
│   └── dev.db                # SQLite database (auto-created)
├── public/
│   ├── sample-resume.txt     # Demo resume
│   └── sample-jd.txt         # Demo job description
└── types/
    └── index.ts              # TypeScript interfaces
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
