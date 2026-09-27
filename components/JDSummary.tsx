"use client";

import { JobDescriptionProfile } from "@/types";
import { Briefcase, Building2, TrendingUp, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface JDSummaryProps {
  profile: JobDescriptionProfile;
  className?: string;
}

const SENIORITY_LABELS: Record<string, { label: string; color: string }> = {
  intern: { label: "Intern", color: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
  junior: { label: "Junior", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  mid: { label: "Mid-level", color: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  senior: { label: "Senior", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  lead: { label: "Lead", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  principal: { label: "Principal", color: "bg-red-500/10 text-red-600 border-red-500/30" },
};

export default function JDSummary({ profile, className }: JDSummaryProps) {
  const seniority = SENIORITY_LABELS[profile.seniorityLevel] || {
    label: profile.seniorityLevel,
    color: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className={cn("rounded-2xl border bg-card p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{profile.jobTitle}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {profile.company}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "chip text-xs font-semibold border self-start sm:self-auto",
            seniority.color
          )}
        >
          <TrendingUp className="h-3 w-3" />
          {seniority.label}
        </span>
      </div>

      {/* Required Skills */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
          Required Skills
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.requiredSkills.map((skill) => (
            <span
              key={skill}
              className="chip text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Preferred Skills */}
      {profile.preferredSkills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
            Preferred Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.preferredSkills.map((skill) => (
              <span
                key={skill}
                className="chip text-xs bg-primary/10 text-primary border border-primary/20 font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {profile.tools.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tools & Technologies
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.tools.map((tool) => (
              <span
                key={tool}
                className="chip text-xs bg-muted text-muted-foreground border border-border"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Responsibilities */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
          Key Responsibilities
        </p>
        <ul className="space-y-1.5">
          {profile.responsibilities.map((resp, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              {resp}
            </li>
          ))}
        </ul>
      </div>

      {/* Soft Skills */}
      {profile.softSkills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
            Soft Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.softSkills.map((s) => (
              <span
                key={s}
                className="chip text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
