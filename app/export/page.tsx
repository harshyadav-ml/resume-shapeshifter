"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import GapAnalysis from "@/components/GapAnalysis";
import PDFExportButton from "@/components/PDFExportButton";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

function showToast(message: string) {
  // Simple browser toast via alert for Phase 1
  // Phase 3 will use real PDF generation
  alert(message);
}

export default function ExportPage() {
  const { state } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

  if (!state.tailoringRun) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No run found.{" "}
          <Link href="/input" className="text-primary underline">
            Start over.
          </Link>
        </p>
      </div>
    );
  }

  const { tailoringRun } = state;
  const improvement =
    tailoringRun.tailoredScore.overallScore - tailoringRun.originalScore.overallScore;

  const handleExportTailored = async () => {
    await new Promise((r) => setTimeout(r, 1500));
    showToast(
      "✅ PDF export will be available in Phase 3. Your tailored resume would download here."
    );
  };

  const handleExportComparison = async () => {
    await new Promise((r) => setTimeout(r, 2000));
    showToast(
      "✅ Comparison PDF export will be available in Phase 3 (Playwright-powered server rendering)."
    );
  };

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-2">
          <Download className="h-4 w-4" />
          Step 4 of 4 — Export
        </div>
        <h1 className="text-3xl font-bold">Export Your Resume</h1>
        <p className="text-muted-foreground mt-1">
          Download your tailored resume PDF or a full side-by-side comparison.
        </p>
      </div>

      {/* Score summary */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          Final Score
          {improvement > 0 && (
            <span className="text-sm font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5">
              +{improvement} pts improvement
            </span>
          )}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          From {tailoringRun.originalScore.overallScore} → {tailoringRun.tailoredScore.overallScore} out of 100
        </p>
        <ScoreCard
          originalScore={tailoringRun.originalScore}
          tailoredScore={tailoringRun.tailoredScore}
          showBoth
        />
      </section>

      {/* High priority gaps */}
      {tailoringRun.gaps.filter((g) => g.importance === "high").length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Remaining High-Priority Gaps</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These gaps still exist in your tailored resume. Review before submitting.
          </p>
          <GapAnalysis gaps={tailoringRun.gaps} highOnly />
        </section>
      )}

      {/* Export buttons */}
      <section className="rounded-2xl border bg-card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Download</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Choose your export format:
        </p>
        <PDFExportButton
          onExportTailored={handleExportTailored}
          onExportComparison={handleExportComparison}
        />
        <p className="text-xs text-muted-foreground mt-4">
          💡 PDF generation powered by React PDF (tailored) and Playwright (comparison) — Phase 3.
        </p>
      </section>

      {/* Disclaimer */}
      <DisclaimerBanner className="mb-8" />

      {/* Back nav */}
      <div className="pt-4 border-t border-border/50">
        <Link
          href="/tailor"
          id="back-to-tailor"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tailor
        </Link>
      </div>
    </main>
  );
}
