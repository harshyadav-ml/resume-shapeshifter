"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import GapAnalysis from "@/components/GapAnalysis";
import PDFExportButton from "@/components/PDFExportButton";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ReviewGate from "@/components/ReviewGate";
import ErrorBanner from "@/components/ErrorBanner";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

// NOTE: @react-pdf/renderer uses browser-only APIs (canvas, Blob, etc.).
// Do NOT import it at module level — it crashes during Next.js SSR even on
// "use client" pages because Next.js evaluates the module on the server.
// Both `pdf` and the PDF document components are dynamically imported inside
// the click handlers so they are only ever evaluated in the browser.

export default function ExportPage() {
  const { state } = useAppContext();
  const router = useRouter();
  const [exportErrors, setExportErrors] = useState<string[]>([]);

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

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportTailored = async () => {
    try {
      setExportErrors([]);
      // Lazily import both the renderer and the PDF component at click time only.
      const [{ pdf }, { default: TailoredResumePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/TailoredResumePDF"),
      ]);
      const blob = await pdf(<TailoredResumePDF run={tailoringRun} />).toBlob();
      const safeCompany = tailoringRun.jdProfile.company.replace(/[^a-zA-Z0-9]/g, "-");
      downloadBlob(blob, `Tailored_Resume_${safeCompany}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setExportErrors(["Failed to generate Tailored Resume PDF: " + message]);
    }
  };

  const handleExportComparison = async () => {
    try {
      setExportErrors([]);
      // Same lazy-import pattern for the comparison PDF.
      const [{ pdf }, { default: ComparisonPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/ComparisonPDF"),
      ]);
      const blob = await pdf(<ComparisonPDF run={tailoringRun} />).toBlob();
      const safeCompany = tailoringRun.jdProfile.company.replace(/[^a-zA-Z0-9]/g, "-");
      downloadBlob(blob, `Comparison_Report_${safeCompany}.pdf`);
    } catch (err) {
      console.error("Comparison PDF generation failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setExportErrors(["Failed to generate Comparison PDF: " + message]);
    }
  };

  // Count review stats for the summary
  const allBullets = tailoringRun.tailoredResume.tailoredExperience.flatMap(
    (exp) => exp.bullets
  );
  const changedBullets = allBullets.filter(
    (b) => b.original !== b.tailored
  );
  const acceptedCount = changedBullets.filter(
    (b) => b.confirmed === true
  ).length;
  const revertedCount = changedBullets.filter(
    (b) => b.confirmed === false
  ).length;

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

      {/* Review stats */}
      {changedBullets.length > 0 && (
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {changedBullets.length} bullets changed
            </span>
            {acceptedCount > 0 && (
              <span className="chip text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                ✓ {acceptedCount} accepted
              </span>
            )}
            {revertedCount > 0 && (
              <span className="chip text-[11px] bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/25">
                ↩ {revertedCount} reverted
              </span>
            )}
          </div>
        </section>
      )}

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

      {/* Export errors */}
      {exportErrors.length > 0 && (
        <ErrorBanner
          title="PDF Export Failed"
          errors={exportErrors}
          onDismiss={() => setExportErrors([])}
          className="mb-6"
        />
      )}

      {/* Export buttons — wrapped in ReviewGate */}
      <section className="rounded-2xl border bg-card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Download</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Choose your export format:
        </p>
        <ReviewGate tailoredResume={tailoringRun.tailoredResume}>
          <PDFExportButton
            onExportTailored={handleExportTailored}
            onExportComparison={handleExportComparison}
          />
        </ReviewGate>
        <p className="text-xs text-muted-foreground mt-4">
          PDFs are generated locally in your browser. No data is sent to the server for PDF export.
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
