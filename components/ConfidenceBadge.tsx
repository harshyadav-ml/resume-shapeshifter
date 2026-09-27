"use client";

import { ConfidenceLevel } from "@/types";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  riskFlag?: string;
  className?: string;
}

const CONFIDENCE_STYLES: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: {
    label: "High",
    className:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  },
  medium: {
    label: "Med",
    className:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  },
  low: {
    label: "Low",
    className:
      "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
  },
};

export default function ConfidenceBadge({
  confidence,
  riskFlag,
  className,
}: ConfidenceBadgeProps) {
  const style = CONFIDENCE_STYLES[confidence];
  const hasRisk = !!riskFlag;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "chip text-xs font-semibold tracking-wide select-none",
          style.className
        )}
      >
        {style.label}
      </span>
      {hasRisk && (
        <div
          className="group relative"
          title={riskFlag}
          aria-label={`Risk: ${riskFlag}`}
        >
          <AlertTriangle
            className="h-4 w-4 text-amber-500 cursor-help"
            strokeWidth={2.5}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56">
            <div className="bg-zinc-900 dark:bg-zinc-800 text-zinc-100 text-xs rounded-lg px-3 py-2 shadow-xl border border-amber-500/30 leading-relaxed">
              ⚠️ {riskFlag}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
