# Resume Shapeshifter — Deployment Plan

> **Version:** 1.0 | **Date:** September 2026 | **Author:** Auto-generated  
> **Status:** Draft — Pending Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [Deployment Strategies](#3-deployment-strategies)
   - [Option A: Vercel (Recommended)](#option-a-vercel-recommended)
   - [Option B: Railway](#option-b-railway)
   - [Option C: Docker + VPS](#option-c-docker--vps)
4. [Database Migration: SQLite → PostgreSQL](#4-database-migration-sqlite--postgresql)
5. [Environment Configuration](#5-environment-configuration)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Domain & DNS](#7-domain--dns)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Security Hardening](#9-security-hardening)
10. [Performance Optimization](#10-performance-optimization)
11. [Rollback Strategy](#11-rollback-strategy)
12. [Cost Analysis](#12-cost-analysis)
13. [Post-Deployment Validation](#13-post-deployment-validation)
14. [Deployment Timeline](#14-deployment-timeline)

---

## 1. Executive Summary

Resume Shapeshifter is a Next.js 14 application using the App Router, Groq Cloud for LLM inference, SQLite (via Prisma 7) for persistence, and `@react-pdf/renderer` for client-side PDF generation. This plan outlines how to move the app from local development to production.

### Key Constraints

| Constraint | Detail |
|---|---|
| **Database** | Currently SQLite (file-based) — must migrate to PostgreSQL for production |
| **LLM** | Groq Cloud API — external dependency, rate-limited (30 RPM free tier) |
| **PDF Generation** | Client-side only (`@react-pdf/renderer`) — no server-side headless browser needed |
| **Serverless Timeout** | `/api/tailor-run` orchestrates 5–7 sequential LLM calls — can exceed default 10s limits |
| **Secrets** | `GROQ_API_KEY` and `DATABASE_URL` must be configured per environment |

---

## 2. Pre-Deployment Checklist

Complete these items before any deployment:

### 2.1 Code Readiness

- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] Lint passes cleanly (`npm run lint`)
- [ ] Production build succeeds locally (`npm run build`)
- [ ] No hardcoded `localhost` URLs in source code
- [ ] No `.env.local` values committed to git
- [ ] `dev.db` excluded from git (confirmed in `.gitignore`)

### 2.2 Database Readiness

- [ ] Prisma schema updated for PostgreSQL provider (see [Section 4](#4-database-migration-sqlite--postgresql))
- [ ] Migration files generated and tested
- [ ] Seed script created (if needed for demo data)

### 2.3 Environment Variables

- [ ] `GROQ_API_KEY` — production Groq API key obtained
- [ ] `DATABASE_URL` — production PostgreSQL connection string ready
- [ ] `NEXT_PUBLIC_APP_URL` — set to production domain

### 2.4 API Route Audit

- [ ] `/api/tailor-run` — verify timeout configuration for hosting provider
- [ ] All API routes return proper error responses (no stack traces leaked)
- [ ] Rate limiting considered for public-facing API routes

---

## 3. Deployment Strategies

### Option A: Vercel (Recommended)

> **Best for:** Fastest time-to-deploy, native Next.js support, zero-config CI/CD.

#### Why Vercel?

- **Native Next.js support** — built by the same team, zero-config deployment
- **Automatic CI/CD** — pushes to `main` trigger production deploys
- **Edge network** — global CDN for static assets and pages
- **Serverless functions** — API routes run as isolated serverless functions
- **Preview deployments** — every PR gets a unique URL

#### Architecture on Vercel

```
┌─────────────────────────────────────────────────────┐
│                  Vercel Platform                     │
│                                                     │
│  ┌─────────────────┐   ┌────────────────────────┐   │
│  │  Static Assets  │   │  Serverless Functions   │   │
│  │  (CDN Edge)     │   │  /api/tailor-run        │   │
│  │                 │   │  /api/parse-resume       │   │
│  │  /_next/static  │   │  /api/parse-jd           │   │
│  │  /public/*      │   │  /api/score              │   │
│  └─────────────────┘   │  /api/gaps               │   │
│                        │  /api/tailor              │   │
│                        │  /api/run/[id]            │   │
│                        └────────────┬───────────────┘ │
└─────────────────────────────────────┼─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
              ┌─────▼─────┐    ┌─────▼──────┐          │
              │ Groq Cloud │    │ PostgreSQL  │          │
              │   (LLM)    │    │ (Supabase / │          │
              │            │    │  Neon / RDS) │          │
              └────────────┘    └─────────────┘          │
                                                         │
```

#### Step-by-Step Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project (from project root)
vercel link

# 4. Set environment variables
vercel env add GROQ_API_KEY          # paste your production key
vercel env add DATABASE_URL          # paste your PostgreSQL connection string
vercel env add NEXT_PUBLIC_APP_URL   # e.g., https://resume-shapeshifter.vercel.app

# 5. Deploy to preview
vercel

# 6. Deploy to production
vercel --prod
```

#### Vercel Configuration

Create `vercel.json` in the project root:

```json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "functions": {
    "app/api/tailor-run/route.ts": {
      "maxDuration": 60
    },
    "app/api/parse-resume/route.ts": {
      "maxDuration": 30
    },
    "app/api/parse-jd/route.ts": {
      "maxDuration": 30
    },
    "app/api/score/route.ts": {
      "maxDuration": 30
    },
    "app/api/tailor/route.ts": {
      "maxDuration": 30
    },
    "app/api/gaps/route.ts": {
      "maxDuration": 30
    }
  }
}
```

> [!WARNING]
> The `/api/tailor-run` orchestrator makes 5–7 sequential LLM calls. On the Vercel Hobby plan, serverless functions have a **10-second timeout**. You **must** upgrade to the Pro plan ($20/mo) for 60-second timeouts, or refactor the orchestrator to use streaming/chunked responses.

#### Vercel Plan Requirements

| Feature | Hobby (Free) | Pro ($20/mo) |
|---|---|---|
| Serverless timeout | 10s ❌ | 60s ✅ |
| Bandwidth | 100 GB | 1 TB |
| Builds | 6000 min/mo | 24000 min/mo |
| Preview deploys | ✅ | ✅ |
| Custom domains | ✅ | ✅ |

---

### Option B: Railway

> **Best for:** Full-stack hosting with integrated PostgreSQL, simple pricing.

#### Why Railway?

- **Integrated PostgreSQL** — spin up a managed database in one click
- **Docker-based** — full Node.js runtime (no serverless timeout issues)
- **Simple pricing** — pay-as-you-go, no cold starts

#### Deployment Steps

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add --plugin postgresql

# 5. Set environment variables
railway variables set GROQ_API_KEY=gsk_...
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}

# 6. Deploy
railway up
```

#### Railway Configuration

Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate && npx prisma migrate deploy && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

### Option C: Docker + VPS

> **Best for:** Full control, self-hosted, predictable costs at scale.

#### Dockerfile

```dockerfile
# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib/generated ./lib/generated

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose (with PostgreSQL)

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/resume_shapeshifter
      - GROQ_API_KEY=${GROQ_API_KEY}
      - NEXT_PUBLIC_APP_URL=https://yourdomain.com
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: resume_shapeshifter
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

> [!NOTE]
> For the Docker path, update `next.config.mjs` to enable standalone output:
> ```js
> const nextConfig = { output: "standalone" };
> ```

---

## 4. Database Migration: SQLite → PostgreSQL

The current app uses SQLite via `better-sqlite3` with a Prisma driver adapter. For production, migrate to PostgreSQL.

### 4.1 Schema Changes

Update `prisma/schema.prisma`:

```diff
 generator client {
-  provider = "prisma-client"
-  output   = "../lib/generated/prisma"
+  provider        = "prisma-client-js"
+  previewFeatures = ["driverAdapters"]
 }

 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
 }
```

### 4.2 Remove SQLite Adapter

Update `lib/db.ts` to use native PostgreSQL:

```diff
- const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
- import path from "path";

  function createClient(): DbClient {
-   const dbPath = path.join(process.cwd(), "prisma", "dev.db");
-   const adapter = new PrismaBetterSqlite3({ url: dbPath });
-   return new PrismaClient({ adapter });
+   return new PrismaClient();
  }
```

### 4.3 Remove SQLite Dependencies

```bash
npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3 @types/better-sqlite3
```

### 4.4 Generate Fresh Migration

```bash
# Create initial PostgreSQL migration
npx prisma migrate dev --name init_postgresql

# Verify
npx prisma migrate status
```

### 4.5 PostgreSQL Hosting Options

| Provider | Free Tier | Pros | Cons |
|---|---|---|---|
| **Supabase** | 500 MB, 2 projects | Dashboard, auth, realtime built-in | May be overkill for just DB |
| **Neon** | 512 MB, branching | Serverless, scales to zero, DB branching | Newer, less ecosystem |
| **Railway** | Included with deploy | Integrated if using Railway hosting | Tied to Railway platform |
| **PlanetScale** | 5 GB (MySQL only) | Great DX | MySQL, not PostgreSQL |
| **AWS RDS** | 12-month free tier | Full control | Complex setup |

> [!TIP]
> **Recommended:** Use **Neon** for Vercel deployments (native integration, serverless-friendly, free tier is generous). Use **Railway's built-in PostgreSQL** if deploying on Railway.

---

## 5. Environment Configuration

### 5.1 Environment Variables by Stage

| Variable | Development | Staging | Production |
|---|---|---|---|
| `GROQ_API_KEY` | Dev key | Dev key | Production key |
| `DATABASE_URL` | `file:./prisma/dev.db` | PostgreSQL staging URL | PostgreSQL production URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Preview URL | `https://yourdomain.com` |
| `NODE_ENV` | `development` | `production` | `production` |

### 5.2 Secrets Management

```bash
# Never commit secrets. Verify:
cat .gitignore | grep -E "\.env"
# Should show: .env*.local

# For Vercel, secrets are stored encrypted in the dashboard.
# For Docker, use Docker secrets or a .env file excluded from the image.
```

> [!CAUTION]
> The `.env` file in the repo root contains `DATABASE_URL`. Ensure no API keys are committed there. All sensitive values belong in `.env.local` (git-ignored) or your hosting provider's secret store.

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  # ── Quality Gate ──────────────────────────
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

  # ── Build Verification ───────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Build Next.js
        run: npm run build
        env:
          DATABASE_URL: "postgresql://placeholder:placeholder@localhost:5432/placeholder"
          GROQ_API_KEY: "placeholder_for_build"

  # ── Deploy (Vercel) ──────────────────────
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### 6.2 Required GitHub Secrets

| Secret | Source |
|---|---|
| `VERCEL_TOKEN` | [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` (after `vercel link`) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` (after `vercel link`) |

---

## 7. Domain & DNS

### 7.1 Custom Domain Setup (Vercel)

```bash
# Add custom domain
vercel domains add yourdomain.com

# Vercel will provide DNS records to configure:
# Type: A     → 76.76.21.21
# Type: AAAA  → 2606:4700:...
# Type: CNAME → cname.vercel-dns.com (for www)
```

### 7.2 SSL/TLS

- **Vercel:** Automatic Let's Encrypt SSL — zero configuration needed.
- **Railway:** Automatic SSL on `*.up.railway.app` and custom domains.
- **Docker/VPS:** Use Caddy or nginx with Let's Encrypt (`certbot`).

---

## 8. Monitoring & Observability

### 8.1 Application Monitoring

| Layer | Tool | Purpose |
|---|---|---|
| **Error Tracking** | Sentry | Catch runtime errors, unhandled rejections |
| **Analytics** | Vercel Analytics / Plausible | Page views, Web Vitals |
| **API Monitoring** | Vercel Logs / Better Stack | API route latency, error rates |
| **Uptime** | Better Uptime / UptimeRobot | Alerting on downtime |

### 8.2 Key Metrics to Track

| Metric | Target | Alert Threshold |
|---|---|---|
| `/api/tailor-run` p95 latency | < 45s | > 55s |
| Error rate (5xx) | < 1% | > 5% |
| Groq API success rate | > 99% | < 95% |
| Build time | < 120s | > 180s |
| Database query p95 | < 100ms | > 500ms |

### 8.3 Sentry Integration

```bash
# Install
npm install @sentry/nextjs

# Initialize (run setup wizard)
npx @sentry/wizard@latest -i nextjs
```

---

## 9. Security Hardening

### 9.1 Checklist

- [ ] **API Key Protection** — `GROQ_API_KEY` is server-side only (no `NEXT_PUBLIC_` prefix)
- [ ] **Input Sanitization** — Resume and JD text inputs sanitized before LLM calls
- [ ] **Rate Limiting** — Add middleware to throttle `/api/tailor-run` (e.g., 5 req/min per IP)
- [ ] **CORS** — Restrict API access to your domain only
- [ ] **Headers** — Set security headers via `next.config.mjs`
- [ ] **Dependencies** — Run `npm audit` and fix vulnerabilities

### 9.2 Security Headers

Add to `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default nextConfig;
```

### 9.3 Rate Limiting (Middleware)

Create `middleware.ts` in the project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/tailor-run")) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const maxRequests = 5;

    const entry = rateLimit.get(ip);
    if (entry && now < entry.resetTime) {
      if (entry.count >= maxRequests) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again shortly." },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
```

> [!NOTE]
> This in-memory rate limiter resets on redeploy and doesn't work across serverless instances. For production, use Vercel's built-in WAF, Upstash Redis rate limiting, or a similar distributed solution.

---

## 10. Performance Optimization

### 10.1 Build Optimizations

| Optimization | Implementation |
|---|---|
| **Bundle analysis** | `npm install @next/bundle-analyzer` — identify large dependencies |
| **Image optimization** | Use `next/image` for any future image assets |
| **Font optimization** | Use `next/font` for Google Fonts (already likely in layout) |
| **Dynamic imports** | Lazy-load `@react-pdf/renderer` components (large bundle) |

### 10.2 Lazy-Load PDF Components

```typescript
// components/pdf/TailoredResumePDF.tsx — dynamically imported
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <p>Preparing PDF...</p> }
);
```

### 10.3 API Route Optimization

- **Parallel LLM calls** — Parse resume and JD simultaneously (they're independent)
- **Response caching** — Cache parsed JD profiles for identical JD text (hash-based)
- **Streaming** — Consider streaming the orchestrator response for real-time progress

---

## 11. Rollback Strategy

### 11.1 Vercel Rollback

```bash
# List recent deployments
vercel ls

# Instantly promote a previous deployment to production
vercel promote <deployment-url>
```

Vercel keeps **every deployment** immutable. Rollback is instant — just promote the previous build.

### 11.2 Database Rollback

```bash
# Check migration status
npx prisma migrate status

# Rollback is manual — create a "down" migration
npx prisma migrate dev --name rollback_<change_name>
```

> [!IMPORTANT]
> Prisma doesn't auto-generate down migrations. Always test migrations on staging before production. Back up the database before running `migrate deploy` in production.

### 11.3 Rollback Decision Matrix

| Scenario | Action |
|---|---|
| UI bug, no data changes | Promote previous Vercel deployment |
| API regression, no DB migration | Promote previous Vercel deployment |
| Bad DB migration (no data loss) | Deploy fix-forward migration |
| Bad DB migration (data loss risk) | Restore database backup, then rollback code |
| Groq API outage | Nothing to rollback — wait for Groq, show error UI |

---

## 12. Cost Analysis

### 12.1 Monthly Cost Estimates

| Component | Free Tier | Low Usage (~100 runs/mo) | Medium Usage (~1000 runs/mo) |
|---|---|---|---|
| **Vercel Pro** | $0 (Hobby) | $20/mo | $20/mo |
| **PostgreSQL (Neon)** | $0 (512 MB) | $0 | $19/mo |
| **Groq API** | $0 (free tier) | $0 | ~$5–10/mo |
| **Sentry** | $0 (5K events) | $0 | $26/mo |
| **Domain** | — | $12/yr | $12/yr |
| **Total** | **$0/mo** | **~$21/mo** | **~$66/mo** |

### 12.2 Groq API Cost Breakdown

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Llama 3.3 70B Versatile | $0.59 | $0.79 |

A single tailoring run uses ~3,000–5,000 input tokens and ~2,000–3,000 output tokens across all LLM calls. At ~1000 runs/month, expect ~$5–10 in Groq costs.

---

## 13. Post-Deployment Validation

### 13.1 Smoke Test Checklist

Run these immediately after each production deployment:

- [ ] **Landing page** loads (`/`)
- [ ] **Input page** loads (`/input`)
- [ ] **Demo mode** works (`/input?demo=true`)
- [ ] **Full pipeline** — paste sample resume + JD → Analyze → Review → Export
- [ ] **PDF download** — both tailored and comparison PDFs generate correctly
- [ ] **History page** — `/history` shows the run just created
- [ ] **Error handling** — submit empty inputs, verify error UI appears
- [ ] **API direct** — `POST /api/tailor-run` with test payload returns valid response

### 13.2 Automated Smoke Test Script

Create `scripts/smoke-test.sh`:

```bash
#!/bin/bash
set -e

BASE_URL="${1:-https://your-production-url.vercel.app}"

echo "🔍 Running smoke tests against: $BASE_URL"

# Test 1: Landing page
echo -n "  Landing page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
[ "$STATUS" = "200" ] && echo "✅ ($STATUS)" || echo "❌ ($STATUS)"

# Test 2: Input page
echo -n "  Input page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/input")
[ "$STATUS" = "200" ] && echo "✅ ($STATUS)" || echo "❌ ($STATUS)"

# Test 3: History page
echo -n "  History page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/history")
[ "$STATUS" = "200" ] && echo "✅ ($STATUS)" || echo "❌ ($STATUS)"

# Test 4: API health (tailor-run should reject GET)
echo -n "  API route guard... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/tailor-run")
[ "$STATUS" = "405" ] || [ "$STATUS" = "400" ] && echo "✅ ($STATUS)" || echo "⚠️  ($STATUS)"

echo ""
echo "🏁 Smoke tests complete."
```

---

## 14. Deployment Timeline

### Phase 1: Staging Deployment (Day 1–2)

| Task | Owner | Est. Time |
|---|---|---|
| Migrate Prisma schema to PostgreSQL | Dev | 2 hrs |
| Set up Neon/Supabase PostgreSQL instance | Dev | 30 min |
| Update `lib/db.ts` (remove SQLite adapter) | Dev | 30 min |
| Deploy to Vercel (preview) | Dev | 30 min |
| Configure environment variables on Vercel | Dev | 15 min |
| Run Prisma migrations on staging DB | Dev | 15 min |
| Smoke test staging | Dev | 1 hr |

### Phase 2: Production Deployment (Day 3)

| Task | Owner | Est. Time |
|---|---|---|
| Set up production PostgreSQL instance | Dev | 30 min |
| Configure production env vars on Vercel | Dev | 15 min |
| Deploy to production (`vercel --prod`) | Dev | 15 min |
| Run smoke tests | Dev | 30 min |
| Configure custom domain (optional) | Dev | 30 min |

### Phase 3: Hardening (Day 4–5)

| Task | Owner | Est. Time |
|---|---|---|
| Set up Sentry error tracking | Dev | 1 hr |
| Add security headers | Dev | 30 min |
| Add rate limiting | Dev | 1 hr |
| Set up uptime monitoring | Dev | 30 min |
| Configure CI/CD GitHub Actions | Dev | 1 hr |
| Load test with 10 concurrent runs | Dev | 1 hr |
| Document runbook for incident response | Dev | 1 hr |

### Phase 4: Ongoing

| Task | Frequency |
|---|---|
| Review Sentry errors | Daily |
| Check Groq API usage / rate limits | Weekly |
| Update dependencies (`npm audit fix`) | Bi-weekly |
| Database backups verification | Weekly |
| Review and rotate API keys | Quarterly |

---

> [!TIP]
> **Quick Start:** If you want to deploy right now with minimal changes, run:
> ```bash
> # 1. Create a Neon database at https://neon.tech
> # 2. Update prisma/schema.prisma (provider = "postgresql", add url)
> # 3. Remove SQLite deps
> npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3 @types/better-sqlite3
> # 4. Generate and migrate
> npx prisma generate && npx prisma migrate dev --name init_pg
> # 5. Deploy
> npx vercel --prod
> ```

---

*This document should be reviewed and updated before each deployment milestone.*
