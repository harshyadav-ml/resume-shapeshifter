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
 * Body: { run: TailoringRun }
 * Response: { ok: true, id: string } | { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 10;

import { db } from "@/lib/db";
import type { TailoringRun } from "@/types";

export async function POST(request: NextRequest) {
  let body: { run?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const run = body.run as TailoringRun | undefined;
  if (!run || typeof run !== "object" || !run.id) {
    return NextResponse.json(
      { error: "A valid run object is required" },
      { status: 422 }
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
        runJson: JSON.stringify(run),
      },
    });
    console.log(`[history/save] Saved run ${run.id} to DB`);
    return NextResponse.json({ ok: true, id: run.id }, { status: 200 });
  } catch (err) {
    // Non-fatal: the user still has their results in client state.
    console.error("[history/save] DB save failed:", err);
    const message =
      err instanceof Error ? err.message : "Database save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
