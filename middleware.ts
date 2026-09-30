/**
 * middleware.ts — Edge middleware for rate limiting /api/tailor-run
 *
 * Limits clients to 5 requests per minute on the orchestrator route.
 * This helps stay within Groq's free-tier limit (30 RPM) and prevents abuse.
 *
 * NOTE: The in-memory Map resets on each cold-start and is not shared
 * across Vercel serverless instances. For production-grade rate limiting,
 * replace with Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export function middleware(request: NextRequest) {
  // Only rate-limit the heavy orchestrator endpoint
  if (request.nextUrl.pathname === "/api/tailor-run") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const now = Date.now();
    const entry = rateLimit.get(ip);

    if (entry && now < entry.resetTime) {
      if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
        return NextResponse.json(
          {
            error: "Too many requests. Please wait before trying again.",
            retryAfterSeconds: retryAfterSec,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfterSec),
              "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(entry.resetTime / 1000)),
            },
          }
        );
      }
      entry.count++;
    } else {
      rateLimit.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware only on API routes — skips static files and pages
  matcher: "/api/:path*",
};
