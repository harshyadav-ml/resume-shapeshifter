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
    className: "bg-sky-950/60 text-sky-400 border border-sky-800/40",
  },
  medium: {
    label: "Med",
    className: "bg-blue-950/60 text-blue-400 border border-blue-800/40",
  },
  low: {
    label: "Low",
    className: "bg-red-950/60 text-red-400 border border-red-800/40",
  },
};

export default function ConfidenceBadge({
  confidence,
  riskFlag,
  className,
}: ConfidenceBadgeProps) {
  const style = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.high;
  const hasRisk = !!riskFlag;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "text-xs font-semibold px-2.5 py-0.5 rounded select-none font-mono",
          style.className
        )}
      >
        {style.label}
      </span>
      {hasRisk && (
        <div
          className="group relative flex items-center"
          title={riskFlag}
          aria-label={`Risk: ${riskFlag}`}
        >
          <span className="text-xs font-semibold p-1 rounded bg-amber-950/50 text-amber-400 border border-amber-900/50 flex items-center cursor-help">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </span>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 pointer-events-none">
            <div className="bg-[#121318] text-amber-200 text-xs rounded-lg px-3 py-2 shadow-xl border border-amber-800/50 leading-relaxed font-mono">
              ⚠️ {riskFlag}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#121318]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
