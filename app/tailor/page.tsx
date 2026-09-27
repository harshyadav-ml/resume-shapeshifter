"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import SideBySideDiff from "@/components/SideBySideDiff";
import { ArrowRight, ArrowLeft, Pencil, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TailorPage() {
  const { state } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

  if (!state.tailoringRun || !state.tailoredResume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No data found.{" "}
          <Link href="/input" className="text-primary underline">
            Start over.
          </Link>
        </p>
      </div>
    );
  }

  const { tailoringRun, tailoredResume } = state;

  // Risk summary
  const allBullets = tailoredResume.tailoredExperience.flatMap((e) => e.bullets);
  const riskBullets = allBullets.filter((b) => !!b.riskFlag);
  const highConfidence = allBullets.filter((b) => b.confidence === "high").length;
  const medConfidence = allBullets.filter((b) => b.confidence === "medium").length;
  const lowConfidence = allBullets.filter((b) => b.confidence === "low").length;

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
          <Pencil className="h-4 w-4" />
          Step 3 of 4 — Tailored Resume
        </div>
        <h1 className="text-3xl font-bold">Side-by-Side Editor</h1>
        <p className="text-muted-foreground mt-1">
          Review every changed bullet. Accept or revert individual changes before
          exporting.
        </p>
      </div>

      {/* Score comparison */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Score Improvement</h2>
        <ScoreCard
          originalScore={tailoringRun.originalScore}
          tailoredScore={tailoringRun.tailoredScore}
          showBoth
        />
      </section>

      {/* Risk summary banner */}
      {riskBullets.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3.5 mb-6"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {riskBullets.length} bullet{riskBullets.length > 1 ? "s" : ""} have risk
              flags — please review before exporting.
            </p>
            <div className="flex items-center gap-3 mt-1">
              {highConfidence > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {highConfidence} high confidence
                </span>
              )}
              {medConfidence > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {medConfidence} medium
                </span>
              )}
              {lowConfidence > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {lowConfidence} low
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tailored skills */}
      <section className="mb-6 rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Tailored Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {tailoredResume.tailoredSkills.map((skill) => (
            <span
              key={skill}
              className="chip text-xs bg-primary/10 text-primary border border-primary/20"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Tailored summary */}
      <section className="mb-6 rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Tailored Summary
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {tailoredResume.tailoredSummary}
        </p>
      </section>

      {/* Bullet diff */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Bullet Changes</h2>
        <SideBySideDiff experience={tailoredResume.tailoredExperience} />
      </section>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border/50">
        <Link
          href="/analyze"
          id="back-to-analyze"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analysis
        </Link>

        <Link
          href="/export"
          id="proceed-to-export-btn"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          Proceed to Export
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
