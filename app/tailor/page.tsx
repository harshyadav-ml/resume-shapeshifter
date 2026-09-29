"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import SideBySideDiff from "@/components/SideBySideDiff";
import ErrorBanner from "@/components/ErrorBanner";
import { ArrowRight, ArrowLeft, Pencil, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TailorPage() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

  // Show skeleton while pipeline runs
  if (state.status === "parsing") {
    return (
      <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 page-enter">
        <div className="mb-6">
          <div className="h-4 w-48 bg-muted rounded-full mb-3 animate-pulse" />
          <div className="h-9 w-72 bg-muted rounded-xl mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-muted/60 rounded-full animate-pulse" />
        </div>
        <div className="h-40 rounded-2xl bg-muted animate-pulse mb-6" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </main>
    );
  }



  // Error state
  if (state.status === "error" && state.errors.length > 0) {
    return (
      <main className="min-h-screen max-w-5xl mx-auto px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
            <Pencil className="h-4 w-4" />
            Step 3 of 4 — Tailored Resume
          </div>
          <h1 className="text-3xl font-bold">Side-by-Side Editor</h1>
        </div>
        <ErrorBanner
          title="Tailoring Pipeline Error"
          errors={state.errors}
          onRetry={() => {
            dispatch({ type: "SET_ERRORS", payload: [] });
            router.push("/input");
          }}
          onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
        />
      </main>
    );
  }

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
  const changedBullets = allBullets.filter((b) => b.original !== b.tailored);
  const riskBullets = allBullets.filter((b) => !!b.riskFlag && b.original !== b.tailored);
  const highConfidence = allBullets.filter((b) => b.confidence === "high").length;
  const medConfidence = allBullets.filter((b) => b.confidence === "medium").length;
  const lowConfidence = allBullets.filter((b) => b.confidence === "low").length;

  // Review progress
  const reviewedCount = changedBullets.filter(
    (b) => b.confirmed !== undefined
  ).length;
  const reviewProgress =
    changedBullets.length > 0
      ? Math.round((reviewedCount / changedBullets.length) * 100)
      : 100;

  // Partial pipeline warnings
  const isPartial = state.status === "partial";

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

      {/* Partial pipeline warning */}
      {isPartial && state.errors.length > 0 && (
        <ErrorBanner
          title="Some pipeline steps had issues"
          errors={state.errors}
          onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
          className="mb-6"
        />
      )}

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

      {/* Review progress bar */}
      {changedBullets.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-3 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Review Progress</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {reviewedCount} / {changedBullets.length} bullets reviewed
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                reviewProgress === 100
                  ? "bg-emerald-500"
                  : reviewProgress > 50
                  ? "bg-primary"
                  : "bg-amber-500"
              )}
              style={{ width: `${reviewProgress}%` }}
            />
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
