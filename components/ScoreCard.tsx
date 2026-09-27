"use client";

import { useEffect, useRef, useState } from "react";
import { MatchScore } from "@/types";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  originalScore: MatchScore;
  tailoredScore?: MatchScore;
  className?: string;
  showBoth?: boolean;
}

const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90

function ScoreRing({
  score,
  label,
  color,
  size = 200,
}: {
  score: number;
  label: string;
  color: string;
  size?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGCircleElement>(null);

  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Animate counter
  useEffect(() => {
    if (!animated) return;
    let start = 0;
    const end = score;
    const duration = 1200;
    const step = (end / duration) * 16;
    const interval = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplayed(end);
        clearInterval(interval);
      } else {
        setDisplayed(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [animated, score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          className="-rotate-90"
          aria-label={`${label}: ${score} out of 100`}
        >
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
          />
          {/* Score ring */}
          <circle
            ref={ref}
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={animated ? offset : CIRCUMFERENCE}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "text-4xl font-bold tabular-nums",
              getScoreColor(score)
            )}
          >
            {displayed}
          </span>
          <span className="text-xs text-muted-foreground font-medium mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

export default function ScoreCard({
  originalScore,
  tailoredScore,
  className,
  showBoth = false,
}: ScoreCardProps) {
  const improvement =
    tailoredScore
      ? tailoredScore.overallScore - originalScore.overallScore
      : null;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
        <ScoreRing
          score={originalScore.overallScore}
          label="Original"
          color="hsl(220 20% 70%)"
        />

        {showBoth && tailoredScore && (
          <>
            {/* Arrow + improvement */}
            <div className="flex flex-col items-center gap-1">
              {improvement !== null && improvement > 0 && (
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  +{improvement} pts
                </span>
              )}
              <svg
                viewBox="0 0 40 16"
                className="w-10 h-4 text-muted-foreground hidden sm:block"
              >
                <path
                  d="M0 8 H35 M28 2 L36 8 L28 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <ScoreRing
              score={tailoredScore.overallScore}
              label="Tailored"
              color="hsl(142 70% 48%)"
            />
          </>
        )}
      </div>

      {/* Explanation */}
      <div className="mt-6 border-t pt-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {(showBoth && tailoredScore?.explanation) || originalScore.explanation}
        </p>
      </div>

      {/* Sub-scores */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Skills",
            original: originalScore.skillCoverageScore,
            tailored: tailoredScore?.skillCoverageScore,
          },
          {
            label: "Responsibilities",
            original: originalScore.responsibilityAlignmentScore,
            tailored: tailoredScore?.responsibilityAlignmentScore,
          },
          {
            label: "Keywords",
            original: originalScore.keywordScore,
            tailored: tailoredScore?.keywordScore,
          },
          {
            label: "Seniority",
            original: originalScore.seniorityScore,
            tailored: tailoredScore?.seniorityScore,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-muted/50 px-3 py-2 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">{item.label}</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm font-bold">{showBoth && item.tailored ? item.tailored : item.original}</span>
              {showBoth && item.tailored && item.tailored !== item.original && (
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    item.tailored > item.original
                      ? "text-emerald-500"
                      : "text-red-500"
                  )}
                >
                  ({item.tailored > item.original ? "+" : ""}{item.tailored - item.original})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Missing requirements */}
      {originalScore.criticalMissingRequirements.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Critical Gaps
          </p>
          <div className="flex flex-wrap gap-2">
            {originalScore.criticalMissingRequirements.map((req) => (
              <span
                key={req}
                className="chip text-[11px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              >
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
