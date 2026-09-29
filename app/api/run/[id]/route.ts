/**
 * GET /api/run/[id]
 * Retrieves a saved TailoringRun from SQLite by ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing run ID" }, { status: 400 });
  }

  try {
    const record = await db.tailoringRunRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const run = JSON.parse(record.runJson);
    return NextResponse.json({ run });
  } catch (error) {
    console.error("[api/run/[id]] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
