"use client";

import { useState } from "react";
import { TailoredResume } from "@/types";
import { ShieldAlert, CheckCircle2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReviewGateProps {
  tailoredResume: TailoredResume;
  children: React.ReactNode;
  className?: string;
}

/**
 * ReviewGate wraps the export buttons and blocks them until:
 *   1. All risk-flagged bullets have been explicitly accepted or reverted.
 *   2. The user checks "I have reviewed all changes".
 *
 * If there are no risk flags at all, the gate is transparent.
 */
export default function ReviewGate({
  tailoredResume,
  children,
  className,
}: ReviewGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Gather all changed bullets with risk flags
  const riskyBullets: { company: string; title: string; ei: number; bi: number; text: string }[] = [];
  tailoredResume.tailoredExperience.forEach((exp, ei) => {
    exp.bullets.forEach((b, bi) => {
      if (b.riskFlag && b.original !== b.tailored) {
        riskyBullets.push({
          company: exp.company,
          title: exp.title,
          ei,
          bi,
          text: b.tailored.slice(0, 80) + (b.tailored.length > 80 ? "…" : ""),
        });
      }
    });
  });

  // Unreviewed = has risk flag but confirmed is undefined (neither accepted nor reverted)
  const unreviewedBullets = tailoredResume.tailoredExperience.flatMap((exp, ei) =>
    exp.bullets
      .map((b, bi) => ({ ...b, ei, bi, company: exp.company }))
      .filter(
        (b) =>
          b.riskFlag &&
          b.original !== b.tailored &&
          b.confirmed === undefined
      )
  );

  const hasRisks = riskyBullets.length > 0;
  const allReviewed = unreviewedBullets.length === 0;
  const canExport = !hasRisks || (allReviewed && acknowledged);

  // No risk flags → gate is transparent
  if (!hasRisks) {
    return <>{children}</>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status card */}
      <div
        className={cn(
          "rounded-2xl border p-5 transition-all duration-300",
          canExport
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-400/40 bg-amber-500/5"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {canExport ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          )}
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                canExport
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-amber-700 dark:text-amber-400"
              )}
            >
              {canExport
                ? "All changes reviewed — ready to export"
                : `${unreviewedBullets.length} unreviewed risk flag${
                    unreviewedBullets.length !== 1 ? "s" : ""
                  }. Please review before exporting.`}
            </p>
            {!allReviewed && (
              <p className="text-xs text-muted-foreground mt-1">
                Go to the tailor page and accept or revert each flagged bullet.
              </p>
            )}
          </div>
        </div>

        {/* Unreviewed bullets list */}
        {!allReviewed && unreviewedBullets.length > 0 && (
          <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-2">
            {unreviewedBullets.map((b) => (
              <div
                key={`${b.ei}-${b.bi}`}
                className="flex items-center justify-between gap-2 text-xs bg-background/60 rounded-lg px-3 py-2 border border-border/50"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-foreground">
                    {b.company}
                  </span>
                  <span className="text-muted-foreground"> — </span>
                  <span className="text-muted-foreground truncate">
                    &ldquo;{b.tailored.slice(0, 60)}
                    {b.tailored.length > 60 ? "…" : ""}&rdquo;
                  </span>
                </div>
                <Link
                  href={`/tailor#bullet-${b.ei}-${b.bi}`}
                  className="text-primary hover:underline shrink-0 flex items-center gap-0.5"
                >
                  Review
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Acknowledgment checkbox — only shown once all bullets have been individually reviewed */}
        {allReviewed && (
          <label
            htmlFor="review-ack-checkbox"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <input
              id="review-ack-checkbox"
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors select-none">
              I have reviewed all changes and understand the risk flags
            </span>
          </label>
        )}
      </div>

      {/* Export buttons — enabled/disabled based on gate status */}
      <div className={cn(!canExport && "opacity-50 pointer-events-none select-none")}>
        {children}
      </div>
    </div>
  );
}
