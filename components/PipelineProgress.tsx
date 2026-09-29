"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

interface PipelineProgressProps {
  steps: PipelineStep[];
  className?: string;
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
    case "running":
      return <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
    case "skipped":
      return <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />;
    default:
      return (
        <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
      );
  }
}

export default function PipelineProgress({
  steps,
  className,
}: PipelineProgressProps) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const totalCount = steps.length;
  const overallProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const hasFailed = steps.some((s) => s.status === "failed");
  const allDone = doneCount === totalCount;

  // Scroll running step into view
  const runningRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    runningRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [steps]);

  return (
    <div className={cn("rounded-2xl border bg-card p-5 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {allDone
            ? "Analysis complete ✓"
            : hasFailed
            ? "Pipeline encountered errors"
            : "Processing your resume…"}
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {doneCount}/{totalCount} steps
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            allDone
              ? "bg-emerald-500"
              : hasFailed
              ? "bg-red-500"
              : "bg-primary"
          )}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Step list */}
      <ol className="space-y-2.5">
        {steps.map((step, idx) => {
          const isRunning = step.status === "running";
          return (
            <li
              key={step.id}
              ref={isRunning ? runningRef : undefined}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
                isRunning && "bg-primary/5 border border-primary/20",
                step.status === "done" && "opacity-70",
                step.status === "failed" && "bg-red-500/5 border border-red-500/20"
              )}
            >
              <div className="mt-0.5">
                <StepIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium leading-snug",
                    step.status === "pending" && "text-muted-foreground",
                    step.status === "running" && "text-primary",
                    step.status === "failed" && "text-red-500 dark:text-red-400"
                  )}
                >
                  {idx + 1}. {step.label}
                </p>
                {step.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {step.detail}
                  </p>
                )}
              </div>
              {isRunning && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1 shrink-0">
                  Running
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Estimated time note */}
      {!allDone && !hasFailed && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          ⏱ This usually takes 15–30 seconds
        </p>
      )}
    </div>
  );
}
