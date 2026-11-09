"use client";

import { useEffect, useState } from "react";
import { MatchScore } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ── Props ───────────────────────────────────────────────────── */
interface ScoreCardProps {
  originalScore: MatchScore;
  tailoredScore?: MatchScore;
  className?: string;
  showBoth?: boolean;
  tailoredLabel?: string;
}

const R = 40;
const CIRCUMFERENCE = 2 * Math.PI * R; // ~251.327

export default function ScoreCard({
  originalScore,
  tailoredScore,
  className,
  showBoth = false,
  tailoredLabel = "Tailored",
}: ScoreCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const origScoreVal = Math.min(Math.max(originalScore.overallScore ?? 0, 0), 100);
  const tailoredScoreVal = tailoredScore
    ? Math.min(Math.max(tailoredScore.overallScore ?? 0, 0), 100)
    : origScoreVal;

  const origOffset = CIRCUMFERENCE - (origScoreVal / 100) * CIRCUMFERENCE;
  const tailoredOffset = CIRCUMFERENCE - (tailoredScoreVal / 100) * CIRCUMFERENCE;

  const improvement = tailoredScore
    ? tailoredScore.overallScore - originalScore.overallScore
    : null;

  // Subscores & deltas
  const skillsVal = showBoth && tailoredScore
    ? tailoredScore.skillCoverageScore
    : originalScore.skillCoverageScore;
  const skillsDelta = tailoredScore
    ? tailoredScore.skillCoverageScore - originalScore.skillCoverageScore
    : 0;

  const respVal = showBoth && tailoredScore
    ? tailoredScore.responsibilityAlignmentScore
    : originalScore.responsibilityAlignmentScore;
  const respDelta = tailoredScore
    ? tailoredScore.responsibilityAlignmentScore - originalScore.responsibilityAlignmentScore
    : 0;

  const kwVal = showBoth && tailoredScore
    ? tailoredScore.keywordScore
    : originalScore.keywordScore;
  const kwDelta = tailoredScore
    ? tailoredScore.keywordScore - originalScore.keywordScore
    : 0;

  const senVal = showBoth && tailoredScore
    ? tailoredScore.seniorityScore
    : originalScore.seniorityScore;
  const senDelta = tailoredScore
    ? tailoredScore.seniorityScore - originalScore.seniorityScore
    : 0;

  return (
    <div
      className={cn(
        "border border-[#26262e] rounded-xl bg-[#0d0d11] p-5 space-y-5 shadow-xl",
        className
      )}
    >
      {/* ── Score Circular Gauges Comparison ─────────────────────── */}
      <div className="flex items-center justify-center gap-6 py-1">
        {/* Original Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="origGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#1f1f26"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="url(#origGradient)"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={mounted ? origOffset : CIRCUMFERENCE}
                strokeLinecap="round"
                strokeWidth="7"
                style={{
                  transition: "stroke-dashoffset 1s ease-in-out",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#fca5a5] tracking-tight leading-none">
                {originalScore.overallScore}
              </span>
              <span className="text-xs text-zinc-400 mt-1 font-mono font-medium">/ 100</span>
            </div>
          </div>
          <span className="text-xs tracking-wider uppercase font-semibold text-[#f87171] mt-2 font-mono">
            Original
          </span>
        </div>

        {/* Transfer Arrow Badge / Delta Pill */}
        {showBoth && tailoredScore && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16161c] border border-[#26262e] text-[#10b981] text-xs font-semibold self-center -mt-4 font-mono">
            {improvement !== null && improvement > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" />
            ) : improvement !== null && improvement < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span>
              {improvement !== null && improvement > 0
                ? `+${improvement}`
                : improvement ?? 0}{" "}
              pts
            </span>
            <span className="text-zinc-400">→</span>
          </div>
        )}

        {/* Tailored Gauge */}
        {showBoth && tailoredScore && (
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="tailoredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="2"
                      floodColor="#10b981"
                      floodOpacity="0.45"
                    />
                  </filter>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="#1f1f26"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  filter="url(#glowGreen)"
                  r="40"
                  stroke="url(#tailoredGradient)"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={mounted ? tailoredOffset : CIRCUMFERENCE}
                  strokeLinecap="round"
                  strokeWidth="7"
                  style={{
                    transition: "stroke-dashoffset 1s ease-in-out",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#34d399] tracking-tight leading-none">
                  {tailoredScore.overallScore}
                </span>
                <span className="text-xs text-emerald-400/90 mt-1 font-mono font-medium">/ 100</span>
              </div>
            </div>
            <span className="text-xs tracking-wider uppercase font-semibold text-emerald-400 mt-2 font-mono">
              {tailoredLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Metric Description Paragraph ─────────────────────────── */}
      <p className="text-sm text-zinc-300 leading-relaxed text-center px-4 max-w-xl mx-auto">
        {(showBoth && tailoredScore?.explanation) || originalScore.explanation}
      </p>

      {/* ── Category Progress Grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Skills */}
        <div className="bg-[#121217] border border-[#23232b] rounded-lg p-3">
          <div className="flex justify-between items-center mb-1.5 font-mono">
            <span className="text-xs tracking-wider uppercase font-medium text-zinc-400">
              Skills
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {skillsVal}
              {showBoth && skillsDelta !== 0 && (
                <span
                  className={cn(
                    "font-medium text-xs ml-1",
                    skillsDelta > 0 ? "text-[#10b981]" : "text-red-400"
                  )}
                >
                  {skillsDelta > 0 ? `+${skillsDelta}` : skillsDelta}
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-[#202028] h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                skillsVal >= 70
                  ? "bg-[#10b981]"
                  : skillsVal >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              )}
              style={{ width: `${Math.min(Math.max(skillsVal, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Responsibilities */}
        <div className="bg-[#121217] border border-[#23232b] rounded-lg p-3">
          <div className="flex justify-between items-center mb-1.5 font-mono">
            <span className="text-xs tracking-wider uppercase font-medium text-zinc-400 truncate">
              Responsibilities
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {respVal}
              {showBoth && respDelta !== 0 && (
                <span
                  className={cn(
                    "font-medium text-xs ml-1",
                    respDelta > 0 ? "text-[#10b981]" : "text-red-400"
                  )}
                >
                  {respDelta > 0 ? `+${respDelta}` : respDelta}
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-[#202028] h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                respVal >= 70
                  ? "bg-[#10b981]"
                  : respVal >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              )}
              style={{ width: `${Math.min(Math.max(respVal, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-[#121217] border border-[#23232b] rounded-lg p-3">
          <div className="flex justify-between items-center mb-1.5 font-mono">
            <span className="text-xs tracking-wider uppercase font-medium text-zinc-400">
              Keywords
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {kwVal}
              {showBoth && kwDelta !== 0 && (
                <span
                  className={cn(
                    "font-medium text-xs ml-1",
                    kwDelta > 0 ? "text-sky-400" : "text-red-400"
                  )}
                >
                  {kwDelta > 0 ? `+${kwDelta}` : kwDelta}
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-[#202028] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(Math.max(kwVal, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Seniority */}
        <div className="bg-[#121217] border border-[#23232b] rounded-lg p-3">
          <div className="flex justify-between items-center mb-1.5 font-mono">
            <span className="text-xs tracking-wider uppercase font-medium text-zinc-400">
              Seniority
            </span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-400">
              {senVal}
              {showBoth && senDelta !== 0 && (
                <span
                  className={cn(
                    "font-medium text-xs ml-1",
                    senDelta > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {senDelta > 0 ? `+${senDelta}` : senDelta}
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-[#202028] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(Math.max(senVal, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Critical Gaps Pills ───────────────────────────────────── */}
      {originalScore.criticalMissingRequirements.length > 0 && (
        <div className="pt-1">
          <div className="text-xs tracking-wider uppercase font-medium text-zinc-400 mb-2 font-mono">
            Critical Gaps
          </div>
          <div className="flex flex-wrap gap-2">
            {originalScore.criticalMissingRequirements.map((gap) => (
              <span
                key={gap}
                className="px-2.5 py-1 rounded text-xs font-medium bg-[#241315] text-[#f87171] border border-[#401c20] font-mono"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
