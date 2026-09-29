/**
 * app/history/page.tsx — History of past tailoring runs (SSR from SQLite)
 */

import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Clock, TrendingUp, Building2, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailoring History — Resume Shapeshifter",
  description:
    "View your past resume tailoring sessions. Revisit any run and re-download your PDFs.",
};

// Force dynamic so we always read fresh from SQLite
export const dynamic = "force-dynamic";

interface RunRecord {
  id: string;
  createdAt: Date;
  jobTitle: string;
  company: string;
  originalScore: number;
  tailoredScore: number;
  runJson: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function ImprovementBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5">
        <TrendingUp className="h-3 w-3" />
        +{delta} pts
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/25 rounded-full px-2 py-0.5">
        {delta} pts
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground font-medium">No change</span>
  );
}

export default async function HistoryPage() {
  const records = await db.tailoringRunRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
          <Clock className="h-4 w-4" />
          Tailoring History
        </div>
        <h1 className="text-3xl font-bold">Past Runs</h1>
        <p className="text-muted-foreground mt-1">
          {records.length > 0
            ? `${records.length} tailoring session${records.length !== 1 ? "s" : ""} saved.`
            : "No tailoring runs yet. Complete a run to see it here."}
        </p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">No runs yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a tailoring session to see your history here.
            </p>
          </div>
          <Link
            href="/input"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record: RunRecord) => {
            const delta = record.tailoredScore - record.originalScore;
            return (
              <div
                key={record.id}
                className="rounded-2xl border bg-card p-5 hover:border-primary/40 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">
                        {record.company}
                      </span>
                    </div>
                    <h2 className="font-semibold text-lg leading-snug truncate">
                      {record.jobTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatDate(record.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <ImprovementBadge delta={delta} />
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {record.originalScore} → {record.tailoredScore}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                    {record.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/api/run/${record.id}`}
                      target="_blank"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      View JSON
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <Link
          href="/input"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Start a new tailoring run
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
