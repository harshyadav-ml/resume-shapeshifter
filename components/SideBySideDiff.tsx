"use client";

import { useState } from "react";
import { TailoredExperienceEntry } from "@/types";
import BulletCard from "./BulletCard";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/lib/context";

interface SideBySideDiffProps {
  experience: TailoredExperienceEntry[];
  className?: string;
}

type ConfidenceFilter = "all" | "high" | "risks";

export default function SideBySideDiff({ experience, className }: SideBySideDiffProps) {
  const { dispatch } = useAppContext();
  const [filter, setFilter] = useState<ConfidenceFilter>("all");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const toggleCollapse = (idx: number) =>
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const handleConfirm = (ei: number, bi: number, confirmed: boolean) => {
    dispatch({ type: "CONFIRM_BULLET", payload: { experienceIndex: ei, bulletIndex: bi, confirmed } });
  };

  const filteredExperience = experience.map((exp) => ({
    ...exp,
    bullets: exp.bullets.filter((b) => {
      if (filter === "high") return b.confidence === "high";
      if (filter === "risks") return !!b.riskFlag;
      return true;
    }),
  }));

  const totalRisks = experience.reduce(
    (acc, exp) => acc + exp.bullets.filter((b) => !!b.riskFlag).length,
    0
  );
  const totalChanged = experience.reduce(
    (acc, exp) => acc + exp.bullets.filter((b) => b.original !== b.tailored).length,
    0
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 border border-border/50">
        <span className="text-sm font-medium text-foreground">
          {totalChanged} bullets changed
        </span>
        {totalRisks > 0 && (
          <span className="chip text-[11px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            ⚠️ {totalRisks} risk flag{totalRisks > 1 ? "s" : ""}
          </span>
        )}
        {/* Filter controls */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show:</span>
          {(["all", "high", "risks"] as ConfidenceFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {f === "all" ? "All" : f === "high" ? "High only" : "Risks only"}
            </button>
          ))}
        </div>
      </div>

      {/* Experience groups */}
      {filteredExperience.map((exp, ei) => {
        if (exp.bullets.length === 0) return null;
        const isCollapsed = collapsed[ei];

        return (
          <div
            key={`${exp.company}-${exp.title}`}
            className="rounded-2xl border bg-card/50 overflow-hidden"
          >
            {/* Company header */}
            <button
              type="button"
              onClick={() => toggleCollapse(ei)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
              aria-expanded={!isCollapsed}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{exp.company}</p>
                  <p className="text-xs text-muted-foreground">{exp.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {exp.bullets.length} bullet{exp.bullets.length > 1 ? "s" : ""}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Bullets */}
            {!isCollapsed && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-4">
                {exp.bullets.map((bullet, bi) => (
                  <BulletCard
                    key={bi}
                    bullet={bullet}
                    experienceIndex={ei}
                    bulletIndex={bi}
                    onConfirm={handleConfirm}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
