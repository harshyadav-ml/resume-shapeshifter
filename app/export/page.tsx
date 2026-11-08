"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import ScoreCard from "@/components/ScoreCard";
import GapAnalysis from "@/components/GapAnalysis";
import PDFExportButton from "@/components/PDFExportButton";
import ReviewGate from "@/components/ReviewGate";
import ErrorBanner from "@/components/ErrorBanner";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import Link from "next/link";
import { TailoringRun } from "@/types";
import { cn } from "@/lib/utils";

// NOTE: @react-pdf/renderer uses browser-only APIs (canvas, Blob, etc.).
// Do NOT import it at module level — it crashes during Next.js SSR even on
// "use client" pages because Next.js evaluates the module on the server.
// Both `pdf` and the PDF document components are dynamically imported inside
// the click handlers so they are only ever evaluated in the browser.

function buildMarkdownResume(run: TailoringRun): string {
  const { tailoredResume } = run;
  const lines: string[] = [];

  if (run.resumeProfile?.contact?.name) {
    lines.push(`# ${run.resumeProfile.contact.name}`);
    const contactParts = [
      run.resumeProfile.contact.email,
      run.resumeProfile.contact.phone,
      run.resumeProfile.contact.location,
      run.resumeProfile.contact.linkedin,
      run.resumeProfile.contact.github,
    ].filter(Boolean);
    if (contactParts.length > 0) {
      lines.push(contactParts.join(" | "));
    }
    lines.push("");
  }

  if (tailoredResume?.tailoredSummary) {
    lines.push("## Summary");
    lines.push(tailoredResume.tailoredSummary);
    lines.push("");
  }

  if (tailoredResume?.tailoredSkills && tailoredResume.tailoredSkills.length > 0) {
    lines.push("## Skills");
    lines.push(tailoredResume.tailoredSkills.join(", "));
    lines.push("");
  }

  if (tailoredResume?.tailoredExperience && tailoredResume.tailoredExperience.length > 0) {
    lines.push("## Experience");
    tailoredResume.tailoredExperience.forEach((exp) => {
      lines.push(`### ${exp.title} — ${exp.company}`);
      exp.bullets.forEach((b) => {
        lines.push(`- ${b.tailored}`);
      });
      lines.push("");
    });
  }

  if (run.resumeProfile?.education && run.resumeProfile.education.length > 0) {
    lines.push("## Education");
    run.resumeProfile.education.forEach((edu) => {
      lines.push(`- ${edu.degree} in ${edu.field}, ${edu.institution} (${edu.graduationDate})`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

export default function ExportPage() {
  const { state } = useAppContext();
  const router = useRouter();
  const [exportErrors, setExportErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

  if (!state.tailoringRun) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <p className="text-gray-400 text-sm font-mono">
          No run found.{" "}
          <Link href="/input" className="text-teal-400 underline underline-offset-4">
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
      const [{ pdf }, { default: TailoredResumePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/TailoredResumePDF"),
      ]);
      const blob = await pdf(<TailoredResumePDF run={tailoringRun} />).toBlob();
      const safeCompany = (tailoringRun.jdProfile.company || "Company").replace(
        /[^a-zA-Z0-9]/g,
        "-"
      );
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
      const [{ pdf }, { default: ComparisonPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/ComparisonPDF"),
      ]);
      const blob = await pdf(<ComparisonPDF run={tailoringRun} />).toBlob();
      const safeCompany = (tailoringRun.jdProfile.company || "Company").replace(
        /[^a-zA-Z0-9]/g,
        "-"
      );
      downloadBlob(blob, `Comparison_Report_${safeCompany}.pdf`);
    } catch (err) {
      console.error("Comparison PDF generation failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setExportErrors(["Failed to generate Comparison PDF: " + message]);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      const md = buildMarkdownResume(tailoringRun);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy markdown:", err);
    }
  };

  // Count review stats for the summary
  const allBullets = tailoringRun.tailoredResume.tailoredExperience.flatMap(
    (exp) => exp.bullets
  );
  const changedBullets = allBullets.filter((b) => b.original !== b.tailored);
  const acceptedCount = changedBullets.filter((b) => b.confirmed === true).length;
  const revertedCount = changedBullets.filter((b) => b.confirmed === false).length;

  const highGaps = tailoringRun.gaps.filter((g) => g.importance === "high");
  const medGaps = tailoringRun.gaps.filter((g) => g.importance === "medium");

  return (
    <main className="min-h-screen bg-[#070709] text-gray-200 antialiased max-w-3xl mx-auto px-6 sm:px-8 md:px-10 pt-8 pb-24 space-y-7">
      {/* ── Page Title & Subtitle ─────────────────────────────────── */}
      <section className="space-y-1.5" data-purpose="page-heading">
        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-medium font-mono mb-1">
          <Download className="w-4 h-4 text-[#41F0B1]" />
          <span>Step 4 of 4 — Export</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Export Your Resume</h1>
        <p className="text-sm text-zinc-300">
          Download your tailored resume PDF or a full side-by-side comparison.
        </p>
      </section>

      {/* ── BEGIN: FinalScoreSection ──────────────────────────────── */}
      <section className="space-y-3" data-purpose="score-summary">
        {/* Section Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-white">Final Score</h2>
            {improvement !== null && improvement > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0f2e24] text-[#34d399] border border-[#164e3b] font-mono">
                +{improvement} pts improvement
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 font-mono">
            From {tailoringRun.originalScore.overallScore} →{" "}
            {tailoringRun.tailoredScore.overallScore} out of 100
          </p>
        </div>

        {/* Scorecard Component */}
        <ScoreCard
          originalScore={tailoringRun.originalScore}
          tailoredScore={tailoringRun.tailoredScore}
          showBoth
        />
      </section>

      {/* ── Bullets Changed Simple Info ───────────────────────────── */}
      {changedBullets.length > 0 && (
        <div className="text-xs sm:text-sm text-zinc-300 pt-1 flex flex-wrap items-center gap-3 font-mono">
          <span>{changedBullets.length} bullets changed</span>
          {acceptedCount > 0 && (
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              ✓ {acceptedCount} accepted
            </span>
          )}
          {revertedCount > 0 && (
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-zinc-500/10 text-zinc-300 border border-zinc-500/25">
              ↩ {revertedCount} reverted
            </span>
          )}
        </div>
      )}

      {/* ── BEGIN: RemainingGapsSection ───────────────────────────── */}
      {highGaps.length > 0 && (
        <section className="space-y-3.5" data-purpose="remaining-gaps">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Remaining High-Priority Gaps
            </h2>
            <p className="text-sm text-zinc-300">
              These gaps still exist in your tailored resume. Review before submitting.
            </p>
            <div className="flex items-center gap-2.5 pt-1 text-xs sm:text-sm font-mono">
              <span className="text-zinc-200 font-medium">
                {tailoringRun.gaps.length} gaps identified
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2e1518] text-[#f87171] border border-[#4f1f25]">
                {highGaps.length} High
              </span>
              {medGaps.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#241f17] text-[#fbbf24] border border-[#4d3d1e]">
                  {medGaps.length} Medium
                </span>
              )}
            </div>
          </div>

          <GapAnalysis gaps={tailoringRun.gaps} highOnly />
        </section>
      )}

      {/* ── Export Errors ─────────────────────────────────────────── */}
      {exportErrors.length > 0 && (
        <ErrorBanner
          title="PDF Export Failed"
          errors={exportErrors}
          onDismiss={() => setExportErrors([])}
        />
      )}

      {/* ── BEGIN: DownloadSection ────────────────────────────────── */}
      <section className="space-y-4 pt-2" data-purpose="download-box">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-white">Download</h2>
          <p className="text-sm text-zinc-300">Choose your export format:</p>
        </div>

        <ReviewGate tailoredResume={tailoringRun.tailoredResume}>
          <div className="flex flex-wrap items-center gap-3">
            <PDFExportButton
              onExportTailored={handleExportTailored}
              onExportComparison={handleExportComparison}
            />

            {/* Copy Markdown Button */}
            <button
              type="button"
              id="copy-markdown-btn"
              onClick={handleCopyMarkdown}
              className={cn(
                "flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ease-out shadow-sm",
                copied
                  ? "bg-zinc-800 border border-zinc-600 text-zinc-200"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60"
              )}
              aria-label="Copy tailored resume markdown to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </ReviewGate>

        <p className="text-xs text-zinc-400 pt-0.5 font-mono">
          PDFs are generated locally in your browser. No data is sent to the server for PDF export.
        </p>
      </section>

      {/* ── BEGIN: FooterBackNav ──────────────────────────────────── */}
      <footer className="pt-2">
        <Link
          href="/tailor"
          id="back-to-tailor"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tailor</span>
        </Link>
      </footer>
    </main>
  );
}
