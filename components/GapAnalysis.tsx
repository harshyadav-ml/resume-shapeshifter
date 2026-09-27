"use client";

import { ResumeGap, GapImportance } from "@/types";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface GapAnalysisProps {
  gaps: ResumeGap[];
  highOnly?: boolean;
  className?: string;
}

const IMPORTANCE_CONFIG: Record<
  GapImportance,
  { label: string; badgeClass: string; icon: React.ReactNode; order: number }
> = {
  high: {
    label: "High",
    badgeClass:
      "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    order: 0,
  },
  medium: {
    label: "Medium",
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
    order: 1,
  },
  low: {
    label: "Low",
    badgeClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    icon: <AlertCircle className="h-4 w-4 text-blue-400" />,
    order: 2,
  },
};

function GapItem({ gap, index }: { gap: ResumeGap; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = IMPORTANCE_CONFIG[gap.importance];

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all",
        gap.importance === "high"
          ? "border-red-400/30"
          : gap.importance === "medium"
          ? "border-amber-400/30"
          : "border-border/60"
      )}
      id={`gap-${index}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          {config.icon}
          <span className="font-semibold text-sm truncate">{gap.name}</span>
          <span className={cn("chip text-[10px] font-bold shrink-0", config.badgeClass)}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* canSafelyAdd indicator */}
          {gap.canSafelyAdd ? (
            <span aria-label="Can safely add to resume">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </span>
          ) : (
            <span aria-label="Do not fabricate — only add if accurate">
              <XCircle className="h-4 w-4 text-red-400" />
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          {/* JD evidence */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              JD Evidence
            </p>
            <p className="text-xs leading-relaxed text-foreground/80 italic">
              &ldquo;{gap.jdEvidence}&rdquo;
            </p>
          </div>

          {/* Resume evidence */}
          {gap.resumeEvidence && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Resume Evidence
              </p>
              <p className="text-xs leading-relaxed text-foreground/80">
                {gap.resumeEvidence}
              </p>
            </div>
          )}

          {/* Suggested action */}
          <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              💡 Suggested Action
            </p>
            <p className="text-xs leading-relaxed">{gap.suggestedAction}</p>
          </div>

          {/* Can safely add */}
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2",
              gap.canSafelyAdd
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/25"
            )}
          >
            {gap.canSafelyAdd ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                You may be able to safely add this to your resume if it&apos;s accurate.
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                🚫 Do not add this if it is not true. Adding false claims is resume fraud.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GapAnalysis({
  gaps,
  highOnly = false,
  className,
}: GapAnalysisProps) {
  const sorted = [...gaps].sort(
    (a, b) =>
      IMPORTANCE_CONFIG[a.importance].order - IMPORTANCE_CONFIG[b.importance].order
  );
  const filtered = highOnly ? sorted.filter((g) => g.importance === "high") : sorted;

  const highCount = gaps.filter((g) => g.importance === "high").length;
  const medCount = gaps.filter((g) => g.importance === "medium").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary row */}
      <div className="flex flex-wrap gap-3 items-center">
        <p className="text-sm font-semibold">
          {gaps.length} gap{gaps.length !== 1 ? "s" : ""} identified
        </p>
        {highCount > 0 && (
          <span className="chip text-[11px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
            {highCount} High
          </span>
        )}
        {medCount > 0 && (
          <span className="chip text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            {medCount} Medium
          </span>
        )}
      </div>

      {/* Gap list */}
      <div className="space-y-2.5">
        {filtered.map((gap, i) => (
          <GapItem key={gap.name} gap={gap} index={i} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No gaps found.</p>
        )}
      </div>
    </div>
  );
}
