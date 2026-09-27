"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisclaimerBannerProps {
  className?: string;
}

export default function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "w-full flex items-start gap-3 rounded-xl px-4 py-3.5",
        "bg-amber-500/10 border border-amber-500/30",
        "text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={2.5} />
      <div>
        <p className="text-sm font-semibold leading-tight mb-0.5">
          All suggestions must be verified before use.
        </p>
        <p className="text-xs leading-relaxed opacity-80">
          Resume Shapeshifter uses AI to suggest improvements. AI can make mistakes.
          You are responsible for ensuring every statement in your resume is accurate
          and truthful. Never include fabricated experience, metrics, or certifications.
        </p>
      </div>
    </div>
  );
}
