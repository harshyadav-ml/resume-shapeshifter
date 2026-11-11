"use client";

import { useState } from "react";
import { TailoredResume } from "@/types";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReviewGateProps {
  tailoredResume: TailoredResume;
  children: React.ReactNode;
  className?: string;
}

export default function ReviewGate({
  tailoredResume,
  children,
  className,
}: ReviewGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Unreviewed = has risk flag, was changed, but neither confirmed nor reverted
  const unreviewedBullets = tailoredResume.tailoredExperience.flatMap((exp, ei) =>
    exp.bullets
      .map((b, bi) => ({
        ...b,
        ei,
        bi,
        company: exp.company,
        title: exp.title,
        text: b.tailored.slice(0, 65) + (b.tailored.length > 65 ? "…" : ""),
      }))
      .filter(
        (b) =>
          b.riskFlag &&
          b.original !== b.tailored &&
          b.confirmed === undefined
      )
  );

  const hasUnreviewed = unreviewedBullets.length > 0;
  const canExport = !hasUnreviewed || acknowledged;

  return (
    <div className={cn("space-y-4", className)}>
      {hasUnreviewed && (
        <div className="border border-[#1e2a3a] bg-[#0c131c] rounded-xl p-4.5 space-y-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sky-400 text-xs sm:text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-sky-400" />
              <span>
                {unreviewedBullets.length} unreviewed risk flag
                {unreviewedBullets.length > 1 ? "s" : ""}. Please review before exporting.
              </span>
            </div>
            <p className="text-xs text-zinc-300 pl-6">
              Go to the tailor page and accept or revert each flagged bullet.
            </p>
          </div>

          {/* Warning Bullet Item Rows */}
          <div className="space-y-2 pt-1">
            {unreviewedBullets.slice(0, 5).map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-[#121a24] border border-[#1d2b3c] rounded-lg px-3.5 py-2 text-xs sm:text-sm"
              >
                <span className="text-zinc-200 truncate mr-2">
                  <strong className="font-semibold text-white">{b.company}</strong> —{" "}
                  <span className="text-zinc-400 font-mono text-xs">
                    &ldquo;{b.text}&rdquo;
                  </span>
                </span>
                <Link
                  href="/tailor"
                  className="text-zinc-200 hover:text-white flex items-center gap-1 shrink-0 text-xs font-semibold underline underline-offset-2"
                >
                  Review ↗
                </Link>
              </div>
            ))}
          </div>

          {/* Acknowledgment Checkbox */}
          <label className="flex items-center gap-2.5 pt-1 text-xs sm:text-sm text-sky-200 cursor-pointer select-none">
            <input
              type="checkbox"
              id="acknowledge-review"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded border-gray-700 bg-gray-900 text-teal-500 focus:ring-0 w-4 h-4"
            />
            <span className="font-medium">
              I acknowledge that I have reviewed all changes and accept any remaining risks
            </span>
          </label>
        </div>
      )}

      {/* Render export buttons with disabled state if unreviewed and not acknowledged */}
      <div className={cn(!canExport && "opacity-50 pointer-events-none select-none")}>
        {children}
      </div>
    </div>
  );
}

