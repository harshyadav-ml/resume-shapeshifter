"use client";

import { ResumeGap, GapImportance } from "@/types";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface GapAnalysisProps {
  gaps: ResumeGap[];
  highOnly?: boolean;
  className?: string;
}

const IMPORTANCE_CONFIG: Record<
  GapImportance,
  { label: string; badgeClass: string; dotClass: string; order: number }
> = {
  high: {
    label: "High",
    badgeClass: "bg-[#291316] text-[#f87171] border border-[#471920]",
    dotClass: "bg-rose-500",
    order: 0,
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-[#241f17] text-[#fbbf24] border border-[#4d3d1e]",
    dotClass: "bg-amber-500",
    order: 1,
  },
  low: {
    label: "Low",
    badgeClass: "bg-[#181a22] text-zinc-400 border border-[#23232b]",
    dotClass: "bg-zinc-500",
    order: 2,
  },
};

function GapItem({ gap, index }: { gap: ResumeGap; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = IMPORTANCE_CONFIG[gap.importance] ?? IMPORTANCE_CONFIG.high;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#23232b] bg-[#0d0d11] text-xs overflow-hidden transition-all duration-150 hover:border-[#2f2f3a]",
        expanded && "border-gray-700"
      )}
      id={`gap-${index}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#121217] transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 mr-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", config.dotClass)} />
          <span className="text-zinc-200 font-medium text-xs sm:text-sm truncate">
            {gap.name}
          </span>
          <span className={cn("px-2.5 py-0.5 rounded text-xs font-mono font-semibold shrink-0", config.badgeClass)}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-zinc-400">
          {gap.canSafelyAdd && (
            <span title="Can safely address in resume" aria-label="Can safely address">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-[#1b1e28] pt-3 space-y-2.5 bg-[#0a0a0e] text-xs sm:text-sm">
          {/* JD evidence */}
          {gap.jdEvidence && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium mb-1">
                JD Evidence
              </p>
              <p className="text-xs sm:text-sm text-zinc-200 italic leading-relaxed">
                &ldquo;{gap.jdEvidence}&rdquo;
              </p>
            </div>
          )}

          {/* Resume evidence */}
          {gap.resumeEvidence && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium mb-1">
                Resume Evidence
              </p>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                {gap.resumeEvidence}
              </p>
            </div>
          )}

          {/* Actionable advice */}
          {gap.suggestedAction && (
            <div className="rounded-lg bg-[#121217] border border-[#23232b] p-3">
              <p className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold mb-1">
                Actionable Advice
              </p>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                {gap.suggestedAction}
              </p>
            </div>
          )}
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
  const displayedGaps = highOnly
    ? gaps.filter((g) => g.importance === "high")
    : gaps;

  if (displayedGaps.length === 0) {
    return (
      <div className="rounded-xl border border-[#23232b] bg-[#0d0d11] p-4 text-center">
        <p className="text-xs text-gray-400 font-mono">
          No {highOnly ? "high-priority " : ""}gaps identified.
        </p>
      </div>
    );
  }

  // Sort: high → medium → low
  const sortedGaps = [...displayedGaps].sort(
    (a, b) =>
      (IMPORTANCE_CONFIG[a.importance]?.order ?? 99) -
      (IMPORTANCE_CONFIG[b.importance]?.order ?? 99)
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {sortedGaps.map((gap, i) => (
        <GapItem key={`${gap.name}-${i}`} gap={gap} index={i} />
      ))}
    </div>
  );
}
