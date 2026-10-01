# API & Runtime Optimization (2026-10-01)

- Analyzed `app/api/tailor-run/route.ts` against Vercel Hobby serverless constraints (10s threshold).
- Updated configuration guidelines in `vercel.json` to avoid 60s Pro-tier dependency.
- Verified parallelization flow across Groq calls using `Promise.all` for experience bullet tailoring.
