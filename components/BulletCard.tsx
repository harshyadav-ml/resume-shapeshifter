"use client";

import { useState } from "react";
import { RewrittenBullet } from "@/types";
import ConfidenceBadge from "./ConfidenceBadge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulletCardProps {
  bullet: RewrittenBullet;
  experienceIndex: number;
  bulletIndex: number;
  onConfirm?: (ei: number, bi: number, confirmed: boolean) => void;
  className?: string;
}

export default function BulletCard({
  bullet,
  experienceIndex,
  bulletIndex,
  onConfirm,
  className,
}: BulletCardProps) {
  const [showReason, setShowReason] = useState(false);
  const isUnchanged = bullet.original === bullet.tailored;
  const hasRisk = !!bullet.riskFlag;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        isUnchanged
          ? "opacity-60 border-border/50"
          : hasRisk
          ? "bullet-card-risk border-amber-400/40"
          : "bullet-card-changed border-primary/20",
        className
      )}
      id={`bullet-${experienceIndex}-${bulletIndex}`}
    >
      <div className="p-4 space-y-3">
        {/* Header: Confidence badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <ConfidenceBadge
            confidence={bullet.confidence}
            riskFlag={bullet.riskFlag}
          />
          {!isUnchanged && (
            <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">
              Changed
            </span>
          )}
          {isUnchanged && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Unchanged
            </span>
          )}
        </div>

        {/* Side-by-side bullets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Original */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Original
            </p>
            <p
              className={cn(
                "text-sm leading-relaxed",
                isUnchanged ? "text-foreground/70" : "text-muted-foreground line-through decoration-muted-foreground/40"
              )}
            >
              {bullet.original}
            </p>
          </div>

          {/* Tailored */}
          {!isUnchanged && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Tailored
              </p>
              <p className="text-sm leading-relaxed font-medium">
                {bullet.tailored}
              </p>
            </div>
          )}
        </div>

        {/* Keywords addressed */}
        {bullet.keywordsAddressed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bullet.keywordsAddressed.map((kw) => (
              <span
                key={kw}
                className="chip text-[10px] bg-primary/10 text-primary border border-primary/20"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Risk warning expanded */}
        {hasRisk && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚠️ <strong>Verify:</strong> {bullet.riskFlag}
          </div>
        )}

        {/* Change reason (collapsible) */}
        {!isUnchanged && (
          <button
            type="button"
            onClick={() => setShowReason((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={showReason}
          >
            {showReason ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showReason ? "Hide" : "Show"} change reason
          </button>
        )}

        {showReason && bullet.changeReason && (
          <div className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
            💡 {bullet.changeReason}
          </div>
        )}

        {/* Accept / Revert */}
        {!isUnchanged && onConfirm && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <button
              type="button"
              id={`accept-bullet-${experienceIndex}-${bulletIndex}`}
              onClick={() => onConfirm(experienceIndex, bulletIndex, true)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150",
                bullet.confirmed === true
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              )}
            >
              {bullet.confirmed === true ? "✓ Accepted" : "Accept Change"}
            </button>
            <button
              type="button"
              id={`revert-bullet-${experienceIndex}-${bulletIndex}`}
              onClick={() => onConfirm(experienceIndex, bulletIndex, false)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150",
                bullet.confirmed === false && bullet.confirmed !== undefined
                  ? "bg-zinc-600 text-white"
                  : "bg-muted text-muted-foreground border border-border hover:bg-muted/70"
              )}
            >
              {bullet.confirmed === false ? "↩ Reverted" : "Revert to Original"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
