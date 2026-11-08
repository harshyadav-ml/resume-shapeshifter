"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import SideBySideDiff from "@/components/SideBySideDiff";
import ErrorBanner from "@/components/ErrorBanner";
import {
  ArrowLeft,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TailorPage() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();

  // Animation trigger for SVG gauges and progress bars
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/input");
    }
  }, [state.status, router]);

  // Loading skeleton state
  if (state.status === "parsing") {
    return (
      <main className="min-h-screen bg-[#0c0d10] text-gray-300 max-w-3xl lg:max-w-4xl mx-auto px-4 pt-8 pb-24 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-gray-800/60 rounded-full animate-pulse font-mono" />
          <div className="h-8 w-64 bg-gray-800/80 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-800/40 rounded-full animate-pulse" />
        </div>
        <div className="h-64 rounded-xl bg-[#121318] border border-[#20232c] animate-pulse" />
        <div className="h-20 rounded-xl bg-[#121318] border border-[#20232c] animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl bg-[#121318] border border-[#20232c] animate-pulse"
            />
          ))}
        </div>
      </main>
    );
  }

  // Error state
  if (state.status === "error" && state.errors.length > 0) {
    return (
      <main className="min-h-screen bg-[#0c0d10] text-gray-300 max-w-3xl lg:max-w-4xl mx-auto px-4 pt-8 pb-24 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium font-mono">
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
            <span>Step 3 of 4 — Tailored Resume</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Side-by-Side Editor
          </h1>
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

  // Empty state fallback
  if (!state.tailoringRun || !state.tailoredResume) {
    return (
      <div className="min-h-screen bg-[#0c0d10] flex items-center justify-center">
        <p className="text-gray-400 text-sm font-mono">
          No data found.{" "}
          <Link href="/input" className="text-teal-400 underline underline-offset-4">
            Start over.
          </Link>
        </p>
      </div>
    );
  }

  const { tailoringRun, tailoredResume } = state;
  const originalScore = tailoringRun.originalScore;
  const tailoredScore = tailoringRun.tailoredScore;

  // Bullet metrics
  const allBullets = tailoredResume.tailoredExperience.flatMap((e) => e.bullets);
  const changedBullets = allBullets.filter((b) => b.original !== b.tailored);
  const riskBullets = allBullets.filter((b) => !!b.riskFlag && b.original !== b.tailored);
  const highConfidence = allBullets.filter((b) => b.confidence === "high").length;
  const medConfidence = allBullets.filter((b) => b.confidence === "medium").length;
  const lowConfidence = allBullets.filter((b) => b.confidence === "low").length;

  // Review progress
  const reviewedCount = changedBullets.filter((b) => b.confirmed !== undefined).length;
  const reviewProgress =
    changedBullets.length > 0
      ? Math.round((reviewedCount / changedBullets.length) * 100)
      : 100;

  // Score improvements & gauge geometry
  const CIRCUMFERENCE = 289; // 2 * PI * 46 ≈ 289
  const origOffset =
    CIRCUMFERENCE - (Math.min(Math.max(originalScore.overallScore, 0), 100) / 100) * CIRCUMFERENCE;
  const tailoredOffset =
    CIRCUMFERENCE - (Math.min(Math.max(tailoredScore.overallScore, 0), 100) / 100) * CIRCUMFERENCE;
  const scoreDelta = tailoredScore.overallScore - originalScore.overallScore;

  // Subscore deltas
  const skillsDelta =
    (tailoredScore.skillCoverageScore ?? 0) - (originalScore.skillCoverageScore ?? 0);
  const respDelta =
    (tailoredScore.responsibilityAlignmentScore ?? 0) -
    (originalScore.responsibilityAlignmentScore ?? 0);
  const kwDelta =
    (tailoredScore.keywordScore ?? 0) - (originalScore.keywordScore ?? 0);
  const senDelta =
    (tailoredScore.seniorityScore ?? 0) - (originalScore.seniorityScore ?? 0);

  const isPartial = state.status === "partial";

  return (
    <div className="min-h-screen bg-[#0c0d10] text-gray-300 flex flex-col justify-between selection:bg-[#41F0B1]/20 selection:text-[#41F0B1]">
      <main className="max-w-3xl lg:max-w-4xl mx-auto w-full px-6 sm:px-8 md:px-10 pt-8 pb-24 space-y-7">
        {/* ── Step Subtitle and Page Title ────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs text-zinc-400 font-medium font-mono">
            <Pencil className="w-4 h-4 text-[#41F0B1]" />
            <span>Step 3 of 4 — Tailored Resume</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Side-by-Side Editor
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Review every changed bullet. Accept or revert individual changes before exporting.
          </p>
        </div>

        {/* ── Partial Pipeline Warnings ───────────────────────────── */}
        {isPartial && state.errors.length > 0 && (
          <ErrorBanner
            title="Some pipeline steps had issues"
            errors={state.errors}
            onDismiss={() => dispatch({ type: "SET_ERRORS", payload: [] })}
          />
        )}

        {/* ── BEGIN: ScoreImprovementCard ─────────────────────────── */}
        <section aria-label="Score Improvement" className="space-y-2.5">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-200">Score Improvement</h2>
          <div className="bg-[#121318] border border-[#20232c] rounded-xl p-6 shadow-xl space-y-6">
            {/* Gauges Row */}
            <div className="flex items-center justify-center space-x-8 pt-2">
              {/* Original Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <defs>
                      <linearGradient id="origScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#fb923c" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="56"
                      cy="56"
                      fill="none"
                      r="46"
                      stroke="#252936"
                      strokeWidth="6"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      fill="none"
                      r="46"
                      stroke="url(#origScoreGradient)"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={isMounted ? origOffset : CIRCUMFERENCE}
                      strokeLinecap="round"
                      strokeWidth="6"
                      style={{
                        transition: "stroke-dashoffset 1s ease-in-out",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-white leading-none">
                      {originalScore.overallScore}
                    </span>
                    <span className="text-xs text-zinc-400 mt-1 font-mono font-medium">/ 100</span>
                  </div>
                </div>
                <span className="mt-2 text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-gray-800/80 text-zinc-300 border border-gray-700/50 font-mono">
                  ORIGINAL
                </span>
              </div>

              {/* Points Improvement Pill Indicator */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold font-mono",
                    scoreDelta > 0
                      ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
                      : scoreDelta < 0
                      ? "bg-red-950/60 border border-red-500/30 text-red-400"
                      : "bg-gray-800/60 border border-gray-700 text-gray-300"
                  )}
                >
                  {scoreDelta > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : scoreDelta < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span>{scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts</span>
                </div>
                <div className="w-12 h-px bg-gray-800 mt-2 relative">
                  <div className="absolute right-0 -top-1 border-t-4 border-l-4 border-b-4 border-transparent border-l-gray-700" />
                </div>
              </div>

              {/* Tailored Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <defs>
                      <linearGradient id="tailoredScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="56"
                      cy="56"
                      fill="none"
                      r="46"
                      stroke="#252936"
                      strokeWidth="6"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      fill="none"
                      r="46"
                      stroke="url(#tailoredScoreGradient)"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={isMounted ? tailoredOffset : CIRCUMFERENCE}
                      strokeLinecap="round"
                      strokeWidth="6"
                      style={{
                        transition: "stroke-dashoffset 1s ease-in-out",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-emerald-400 leading-none">
                      {tailoredScore.overallScore}
                    </span>
                    <span className="text-xs text-emerald-400/80 mt-1 font-mono font-medium">/ 100</span>
                  </div>
                </div>
                <span className="mt-2 text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-mono">
                  TAILORED
                </span>
              </div>
            </div>

            {/* Analytical Match Description */}
            <p className="text-sm text-center text-zinc-300 leading-relaxed max-w-xl mx-auto px-4">
              {tailoredScore.explanation || originalScore.explanation}
            </p>

            {/* Category Progress Bars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {/* Skills Progress */}
              <div className="bg-[#181a20] p-3 rounded-lg border border-[#232733] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                    SKILLS
                  </span>
                  <div className="flex items-center space-x-1 font-mono">
                    <span className="text-white font-semibold">
                      {tailoredScore.skillCoverageScore}
                    </span>
                    {skillsDelta !== 0 && (
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          skillsDelta > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {skillsDelta > 0 ? `+${skillsDelta}` : skillsDelta}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(Math.max(tailoredScore.skillCoverageScore, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Responsibilities Progress */}
              <div className="bg-[#181a20] p-3 rounded-lg border border-[#232733] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                    RESPONSIBILITIES
                  </span>
                  <div className="flex items-center space-x-1 font-mono">
                    <span className="text-white font-semibold">
                      {tailoredScore.responsibilityAlignmentScore}
                    </span>
                    {respDelta !== 0 && (
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          respDelta > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {respDelta > 0 ? `+${respDelta}` : respDelta}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        Math.max(tailoredScore.responsibilityAlignmentScore, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Keywords Progress */}
              <div className="bg-[#181a20] p-3 rounded-lg border border-[#232733] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                    KEYWORDS
                  </span>
                  <div className="flex items-center space-x-1 font-mono">
                    <span className="text-white font-semibold">{tailoredScore.keywordScore}</span>
                    {kwDelta !== 0 && (
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          kwDelta > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {kwDelta > 0 ? `+${kwDelta}` : kwDelta}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(Math.max(tailoredScore.keywordScore, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Seniority Progress */}
              <div className="bg-[#181a20] p-3 rounded-lg border border-[#232733] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                    SENIORITY
                  </span>
                  <div className="flex items-center space-x-1 font-mono">
                    <span className="text-white font-semibold">{tailoredScore.seniorityScore}</span>
                    {senDelta !== 0 && (
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          senDelta > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {senDelta > 0 ? `+${senDelta}` : senDelta}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(Math.max(tailoredScore.seniorityScore, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Critical Gaps List */}
            {originalScore.criticalMissingRequirements.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-800/60">
                <span className="text-xs uppercase font-bold tracking-wider text-zinc-300 block font-mono">
                  CRITICAL GAPS
                </span>
                <div className="flex flex-wrap gap-2">
                  {originalScore.criticalMissingRequirements.map((gap) => (
                    <span
                      key={gap}
                      className="text-xs px-2.5 py-1 rounded bg-red-950/40 text-red-200 border border-red-900/60 font-mono font-medium"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── BEGIN: RiskCallout ───────────────────────────────────── */}
        {riskBullets.length > 0 && (
          <div
            role="alert"
            className="bg-[#121c2c]/80 border border-sky-800/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-sm text-sky-200 shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span className="font-medium text-sky-100">
                {riskBullets.length} bullet{riskBullets.length > 1 ? "s have" : " has"} risk
                flags — please review before exporting.
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-sky-300 font-mono font-medium">
              {highConfidence > 0 && <span>{highConfidence} high confidence</span>}
              {medConfidence > 0 && (
                <>
                  <span>•</span>
                  <span>{medConfidence} medium</span>
                </>
              )}
              {lowConfidence > 0 && (
                <>
                  <span>•</span>
                  <span>{lowConfidence} low</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── BEGIN: ReviewProgress ────────────────────────────────── */}
        {changedBullets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-zinc-200">Review Progress</span>
              </div>
              <span className="font-mono text-zinc-300 font-medium">
                {reviewedCount} / {changedBullets.length} bullets reviewed
              </span>
            </div>
            <div className="w-full bg-[#1b1e27] h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── BEGIN: TailoredSkillsSection ─────────────────────────── */}
        <section aria-label="Tailored Skills" className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            TAILORED SKILLS
          </h3>
          <div className="flex flex-wrap gap-2">
            {tailoredResume.tailoredSkills.map((skill) => (
              <span
                key={skill}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-[#16181f] text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition font-mono font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* ── BEGIN: TailoredSummarySection ────────────────────────── */}
        <section aria-label="Tailored Summary" className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            TAILORED SUMMARY
          </h3>
          <div className="bg-[#121318] border border-[#20232c] p-4.5 rounded-xl text-sm sm:text-base text-zinc-200 leading-relaxed font-sans shadow-sm">
            {tailoredResume.tailoredSummary}
          </div>
        </section>

        {/* ── BEGIN: BulletChangesSection ──────────────────────────── */}
        <section aria-label="Bullet Changes" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-white">Bullet Changes</h2>
          </div>
          <SideBySideDiff experience={tailoredResume.tailoredExperience} />
        </section>
      </main>

      {/* ── BEGIN: BottomStickyBar ───────────────────────────────── */}
      <footer className="sticky bottom-0 border-t border-gray-800/80 bg-[#0c0d10]/95 backdrop-blur z-40 px-6 sm:px-8 md:px-10 py-4 shadow-2xl">
        <div className="max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between text-sm">
          <Link
            href="/analyze"
            id="back-to-analyze"
            className="px-4 py-2 rounded-lg bg-transparent hover:bg-gray-800 text-zinc-400 hover:text-white font-medium flex items-center space-x-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Analysis</span>
          </Link>

          <Link
            href="/export"
            id="proceed-to-export-btn"
            className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-gray-950 font-medium text-sm transition shadow-sm flex items-center justify-center"
          >
            <span>Proceed to Export →</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
