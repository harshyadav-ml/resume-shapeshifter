"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import JDSummary from "@/components/JDSummary";
import GapAnalysis from "@/components/GapAnalysis";
import { ArrowRight, ArrowLeft, ScanSearch } from "lucide-react";
import Link from "next/link";

export default function AnalyzePage() {
  const { state } = useAppContext();
  const router = useRouter();

  // Guard: redirect to input if no run
  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

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
            <GapAnalysis gaps={tailoringRun.gaps} />
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
