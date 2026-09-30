"use client";

import { useEffect, useState } from "react";
import { MatchScore } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ── Props (UNCHANGED) ───────────────────────────────────────── */
interface ScoreCardProps {
  originalScore: MatchScore;
  tailoredScore?: MatchScore;
  className?: string;
  showBoth?: boolean;
}

/* ── Constants ───────────────────────────────────────────────── */
const R = 88;
const CIRCUMFERENCE = 2 * Math.PI * R;

/* ── Score colour thresholds ──────────────────────────────────── */
function scoreColor(s: number): { stroke: string; text: string; bg: string; glow: string } {
  if (s >= 80) return {
    stroke: "#10b981",
    text:   "text-emerald-400",
    bg:     "bg-emerald-500/10",
    glow:   "shadow-glow-emerald",
  };
  if (s >= 60) return {
    stroke: "#f59e0b",
    text:   "text-amber-400",
    bg:     "bg-amber-500/10",
    glow:   "shadow-glow-amber",
  };
  return {
    stroke: "#ef4444",
    text:   "text-red-400",
    bg:     "bg-red-500/10",
    glow:   "",
  };
}

/* ── Animated counter hook ────────────────────────────────────── */
function useCounter(target: number, duration = 1300) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * ease));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return value;
}

/* ── Single gauge ring ───────────────────────────────────────── */
function GaugeRing({
  score,
  label,
  size = 200,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const [animated, setAnimated] = useState(false);
  const displayed = useCounter(score, 1300);
  const colors = scoreColor(score);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          className="-rotate-90"
          aria-label={`${label}: ${score} out of 100`}
        >
          {/* Outer decorative tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const cx = 100 + 96 * Math.cos(angle);
            const cy = 100 + 96 * Math.sin(angle);
            const ix = 100 + 88 * Math.cos(angle);
            const iy = 100 + 88 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={ix} y1={iy} x2={cx} y2={cy}
                stroke="hsl(220 100% 100% / 0.06)"
                strokeWidth={i % 9 === 0 ? "2" : "1"}
                strokeLinecap="round"
              />
            );
          })}
          {/* Background track */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke="hsl(222 28% 12%)"
            strokeWidth="14"
          />
          {/* Track inner shadow */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke="hsl(0 0% 0% / 0.4)"
            strokeWidth="16"
            strokeDasharray="4 2"
            opacity="0.3"
          />
          {/* Score arc */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={animated ? offset : CIRCUMFERENCE}
            style={{
              transition: "stroke-dashoffset 1.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter: `drop-shadow(0 0 8px ${colors.stroke}66)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={cn("text-[2.6rem] font-black tabular-nums leading-none tracking-tight", colors.text)}>
            {displayed}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground/60 tracking-widest uppercase">
            / 100
          </span>
        </div>
      </div>

      {/* Label pill */}
      <div className={cn(
        "px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase border",
        label === "Original"
          ? "bg-muted/40 border-border text-muted-foreground"
          : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
      )}>
        {label}
      </div>
    </div>
  );
}

/* ── Sub-score bar ───────────────────────────────────────────── */
function SubScoreBar({ label, original, tailored, showBoth }: {
  label: string;
  original: number;
  tailored?: number;
  showBoth: boolean;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const displayVal = showBoth && tailored != null ? tailored : original;
  const delta = tailored != null && showBoth ? tailored - original : 0;
  const colors = scoreColor(displayVal);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-bold tabular-nums", colors.text)}>{displayVal}</span>
          {showBoth && delta !== 0 && (
            <span className={cn(
              "text-[10px] font-bold rounded px-1",
              delta > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
            )}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </div>
      </div>
      {/* Track */}
      <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-smooth"
          style={{
            width: animated ? `${displayVal}%` : "0%",
            background: colors.stroke,
            boxShadow: `0 0 6px ${colors.stroke}66`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Main component (PROPS UNCHANGED) ────────────────────────── */
export default function ScoreCard({
  originalScore,
  tailoredScore,
  className,
  showBoth = false,
}: ScoreCardProps) {
  const improvement = tailoredScore
    ? tailoredScore.overallScore - originalScore.overallScore
    : null;

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden",
      "bg-card border border-border/60",
      "shadow-surface-2",
      "before:absolute before:inset-0 before:bg-mesh-subtle before:pointer-events-none",
      className
    )}>
      {/* Inner top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 p-6 space-y-6">
        {/* Rings row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
          <GaugeRing score={originalScore.overallScore} label="Original" size={192} />

          {showBoth && tailoredScore && (
            <>
              {/* Middle connector */}
              <div className="flex flex-col items-center gap-2 sm:mt-0 -mt-2">
                {improvement !== null && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                    improvement > 0
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : improvement < 0
                      ? "bg-red-500/10 border-red-500/25 text-red-400"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {improvement > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : improvement < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                    {improvement > 0 && "+"}{improvement} pts
                  </div>
                )}
                {/* Arrow */}
                <svg viewBox="0 0 48 16" className="w-12 h-4 text-border hidden sm:block" fill="none">
                  <path d="M0 8 H40 M33 2 L42 8 L33 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <GaugeRing score={tailoredScore.overallScore} label="Tailored" size={192} />
            </>
          )}
        </div>

        {/* Explanation */}
        <div className="separator-gradient" />
        <p className="text-sm text-muted-foreground/80 leading-relaxed">
          {(showBoth && tailoredScore?.explanation) || originalScore.explanation}
        </p>

        {/* Sub-scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Skills",          original: originalScore.skillCoverageScore,          tailored: tailoredScore?.skillCoverageScore },
            { label: "Responsibilities",original: originalScore.responsibilityAlignmentScore, tailored: tailoredScore?.responsibilityAlignmentScore },
            { label: "Keywords",        original: originalScore.keywordScore,                 tailored: tailoredScore?.keywordScore },
            { label: "Seniority",       original: originalScore.seniorityScore,               tailored: tailoredScore?.seniorityScore },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-muted/20 border border-border/40 px-3 py-3">
              <SubScoreBar
                label={item.label}
                original={item.original}
                tailored={item.tailored}
                showBoth={showBoth}
              />
            </div>
          ))}
        </div>

        {/* Critical gaps */}
        {originalScore.criticalMissingRequirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Critical Gaps
            </p>
            <div className="flex flex-wrap gap-1.5">
              {originalScore.criticalMissingRequirements.map((req) => (
                <span
                  key={req}
                  className="chip bg-red-500/8 text-red-400 border border-red-500/20"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
