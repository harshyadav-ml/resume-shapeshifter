"use client";

import { useState } from "react";
import { TailoredExperienceEntry } from "@/types";
import BulletCard from "./BulletCard";
import { Building2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
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
    dispatch({
      type: "CONFIRM_BULLET",
      payload: { experienceIndex: ei, bulletIndex: bi, confirmed },
    });
  };

  const handleEdit = (ei: number, bi: number, tailored: string) => {
    dispatch({
      type: "EDIT_BULLET",
      payload: { experienceIndex: ei, bulletIndex: bi, tailored },
    });
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
    <div className={cn("space-y-4", className)}>
      {/* ── Filter Tabs Bar ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3.5">
        {/* Count Badge Tabs */}
        <div className="flex items-center space-x-2.5">
          <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-[#1c1f28] text-white border border-gray-700/80 shadow-sm flex items-center space-x-1.5 font-mono">
            <span>{totalChanged} bullets changed</span>
          </span>
          {totalRisks > 0 && (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-amber-950/40 text-amber-300 border border-amber-900/60 flex items-center space-x-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalRisks} risk flag{totalRisks > 1 ? "s" : ""}</span>
            </span>
          )}
        </div>

        {/* Filter Selector */}
        <div className="flex items-center space-x-1 text-xs sm:text-sm">
          <span className="text-zinc-400 mr-2 font-mono text-xs font-medium">Show:</span>
          {(["all", "high", "risks"] as ConfidenceFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-mono font-medium transition-all",
                filter === f
                  ? "bg-white text-gray-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {f === "all" ? "All" : f === "high" ? "High only" : "Risks only"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Experience Groups ─────────────────────────────────────── */}
      <div className="space-y-5">
        {filteredExperience.map((exp, ei) => {
          if (exp.bullets.length === 0) return null;
          const isCollapsed = collapsed[ei];

          return (
            <div key={`${exp.company}-${exp.title}`} className="space-y-3">
              {/* Accordion Header: Company & Role */}
              <button
                type="button"
                onClick={() => toggleCollapse(ei)}
                className="w-full flex items-center justify-between py-1.5 text-zinc-300 hover:text-white transition-colors group"
                aria-expanded={!isCollapsed}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-[#1a1c24] flex items-center justify-center border border-gray-800 text-zinc-400 group-hover:text-white group-hover:border-gray-700 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {exp.company}
                    </span>
                    <span className="text-zinc-400 ml-2 text-xs sm:text-sm">
                      {exp.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono font-medium text-zinc-300">
                  <span>{exp.bullets.length} bullet{exp.bullets.length > 1 ? "s" : ""}</span>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Bullet Cards */}
              {!isCollapsed && (
                <div className="space-y-3">
                  {exp.bullets.map((bullet, bi) => (
                    <BulletCard
                      key={bi}
                      bullet={bullet}
                      experienceIndex={ei}
                      bulletIndex={bi}
                      onConfirm={handleConfirm}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
