"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import JDSummary from "@/components/JDSummary";
import GapAnalysis from "@/components/GapAnalysis";
import ErrorBanner from "@/components/ErrorBanner";
import PipelineProgress, { type PipelineStep } from "@/components/PipelineProgress";
import { ArrowRight, ArrowLeft, ScanSearch } from "lucide-react";
import Link from "next/link";

export default function AnalyzePage() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  // Guard: redirect to input if no run
  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

  // Pipeline loading — show progress UI
  const isParsing = state.status === "parsing";
  const PIPELINE_STEPS: PipelineStep[] = [
    { id: "parse-resume", label: "Parsing Resume", status: isParsing ? "running" : "done" },
    { id: "parse-jd", label: "Parsing Job Description", status: isParsing ? "pending" : "done" },
    { id: "score", label: "Scoring Original Match", status: isParsing ? "pending" : "done" },
    { id: "tailor", label: "Tailoring Bullets", status: isParsing ? "pending" : "done" },
    { id: "gaps", label: "Analyzing Gaps", status: isParsing ? "pending" : "done" },
    { id: "score-tailored", label: "Scoring Tailored Resume", status: isParsing ? "pending" : "done" },
  ];

  if (isParsing) {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
            <ScanSearch className="h-4 w-4" />
            Step 2 of 4 — Analysis
          </div>
          <h1 className="text-3xl font-bold">Analyzing…</h1>
          <p className="text-muted-foreground mt-1">
            Running the full tailoring pipeline. This takes about 15–30 seconds.
          </p>
        </div>
        <PipelineProgress steps={PIPELINE_STEPS} />
      </main>
    );
  }

  // Error state — show error banner with retry

  if (state.status === "error" && state.errors.length > 0) {
    return (
      <main className="min-h-screen max-w-5xl mx-auto px-6 py-10 page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
            <ScanSearch className="h-4 w-4" />
            Step 2 of 4 — Analysis
          </div>
          <h1 className="text-3xl font-bold">Analysis Results</h1>
        </div>
        <ErrorBanner
          title="Analysis Pipeline Failed"
          errors={state.errors}
          onRetry={() => {
            dispatch({ type: "SET_ERRORS", payload: [] });
            router.push("/input");
          }}
          onDismiss={() => {
            dispatch({ type: "SET_ERRORS", payload: [] });
          }}
        />
      </main>
    );
  }

  if (!state.tailoringRun) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ScanSearch className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            No analysis found.{" "}
            <Link href="/input" className="text-primary underline">
              Go back to input.
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const { tailoringRun } = state;

  // Partial pipeline status
  const isPartial = state.status === "partial";

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
          <ScanSearch className="h-4 w-4" />
          Step 2 of 4 — Analysis
        </div>
        <h1 className="text-3xl font-bold">Analysis Results</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s how your resume matches{" "}
          <strong>{tailoringRun.jdProfile.jobTitle}</strong> at{" "}
          <strong>{tailoringRun.jdProfile.company}</strong>.
        </p>
      </div>

      {/* Partial success warning */}
      {isPartial && state.errors.length > 0 && (
        <ErrorBanner
          title="Some pipeline steps had issues"
          errors={state.errors}
          onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
          className="mb-6"
        />
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Score card (original only) */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Match Score</h2>
            <ScoreCard
              originalScore={tailoringRun.originalScore}
              showBoth={false}
            />
          </section>

          {/* Gap analysis */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Gap Analysis</h2>
            {tailoringRun.gaps.length > 0 ? (
              <GapAnalysis gaps={tailoringRun.gaps} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Gap analysis data is not available.
                {isPartial && " This step may have failed during processing."}
              </p>
            )}
          </section>
        </div>

        {/* Right column — JD Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Job Description</h2>
          <JDSummary profile={tailoringRun.jdProfile} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
        <Link
          href="/input"
          id="back-to-input"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Input
        </Link>

        <Link
          href="/tailor"
          id="generate-tailored-resume-btn"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          Generate Tailored Resume
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
