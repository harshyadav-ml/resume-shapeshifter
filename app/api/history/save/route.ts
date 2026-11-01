/**
 * POST /api/history/save
 *
 * Dedicated Node.js route for persisting a completed TailoringRun to the
 * SQLite database via Prisma. Called by the frontend orchestrator AFTER all
 * 6 AI steps have successfully completed on the client side.
 *
 * This is a separate route so that:
 *   1. The long-running AI pipeline (tailor-run) never touches Prisma/SQLite,
 *      keeping those requests lightweight and fast.
 *   2. DB failures are non-fatal — the user still sees their results even if
 *      persistence fails (e.g. on Vercel where SQLite is read-only).
 *
 * Body: { run: TailoringRun, promptVersions?: Record<string, string> }
 * Response: { ok: true, id: string } | { error: string, code: string }
 */

import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 10;

import { db } from "@/lib/db";
import { TailoringRunSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  // Validate the run object through TailoringRunSchema — no unsafe casts
  const body = rawBody as { run?: unknown; promptVersions?: unknown };
  const runParseResult = TailoringRunSchema.safeParse(body.run);
  if (!runParseResult.success) {
    return NextResponse.json(
      {
        error: "A valid run object is required",
        code: "INVALID_INPUT",
        details: runParseResult.error.issues,
      },
      { status: 422 }
    );
  }

  const run = runParseResult.data;

  // Extract promptVersions if provided — a JSON object mapping step name → version string
  const promptVersions: Record<string, string> =
    body.promptVersions &&
    typeof body.promptVersions === "object" &&
    !Array.isArray(body.promptVersions)
      ? (body.promptVersions as Record<string, string>)
      : {};

  // Serialise the run (with embedded promptVersions) inside a try/catch.
  // A circular reference or non-serialisable value would otherwise throw and
  // corrupt partial writes.
  let runJson: string;
  try {
    // Embed promptVersions inside the JSON blob for auditability — no extra DB column needed.
    const runWithMeta = { ...run, _promptVersions: promptVersions };
    runJson = JSON.stringify(runWithMeta);
  } catch (serErr) {
    const message = serErr instanceof Error ? serErr.message : String(serErr);
    console.error("[history/save] JSON.stringify(run) failed:", message);
    return NextResponse.json(
      {
        error: `Failed to serialise run: ${message}`,
        code: "SERIALIZATION_ERROR",
      },
      { status: 500 }
    );
  }

  try {
    await db.tailoringRunRecord.create({
      data: {
        id: run.id,
        jobTitle: run.jdProfile?.jobTitle ?? "Unknown",
        company: run.jdProfile?.company ?? "Unknown",
        originalScore: run.originalScore?.overallScore ?? 0,
        tailoredScore: run.tailoredScore?.overallScore ?? 0,
        runJson,
      },
    });
    console.log(`[history/save] Saved run ${run.id} to DB`, { promptVersions });
    return NextResponse.json({ ok: true, id: run.id }, { status: 200 });
  } catch (err) {
    // Non-fatal — on Vercel the filesystem is read-only (SQLITE_CANTOPEN).
    // Return 200 so the frontend never sees a failure; log the cause for
    // diagnostics. History will simply be unavailable in this environment.
    const message = err instanceof Error ? err.message : "Database save failed";
    const isSqliteUnavailable =
      message.includes("SQLITE_CANTOPEN") ||
      message.includes("SQLITE_READONLY") ||
      message.includes("no such file") ||
      process.env.VERCEL === "1";

    if (isSqliteUnavailable) {
      console.warn(
        "[history/save] SQLite unavailable (read-only FS) — skipping persistence:",
        message
      );
      return NextResponse.json(
        { ok: true, skipped: true, reason: "sqlite_unavailable" },
        { status: 200 }
      );
    }

    // Unexpected DB error — still non-fatal but log loudly.
    console.error("[history/save] DB save failed:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
