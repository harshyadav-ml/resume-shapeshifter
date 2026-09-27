"use client";

import { useState } from "react";
import { Clipboard, Link, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const MOCK_JD = `Senior Frontend Engineer — Nebula Systems

We're looking for a Senior Frontend Engineer to join our core product team.

Required Skills:
- React (4+ years)
- TypeScript (strong proficiency required)
- GraphQL with Apollo or urql
- CI/CD pipeline experience (GitHub Actions preferred)
- Strong unit and integration testing background

Preferred:
- Next.js, AWS, Storybook, WebSockets, Design Systems

Responsibilities:
- Lead frontend architecture for our enterprise data dashboard
- Collaborate with design to build and maintain a component library
- Define GraphQL contracts with backend teams
- Mentor junior engineers; lead biweekly frontend guild meetings
- Drive CI/CD improvements to reduce deployment lead time

Qualifications:
- 4+ years React experience in production SaaS environments
- Track record of improving test coverage and code quality
- Experience leading or mentoring small teams`;

interface JDInputProps {
  value: string;
  onChange: (text: string) => void;
  className?: string;
}

export default function JDInput({ value, onChange, className }: JDInputProps) {
  const [urlValue, setUrlValue] = useState("");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-accent" />
        Job Description
      </div>

      {/* URL input (non-functional in Phase 1) */}
      <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-border/60 bg-muted/30">
        <Link className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          id="jd-url-input"
          type="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          placeholder="Paste job posting URL (Phase 2 feature)"
          disabled
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/60 text-muted-foreground cursor-not-allowed"
          aria-label="Job posting URL (coming in Phase 2)"
        />
        <span className="text-[10px] font-semibold text-muted-foreground/60 px-1.5 py-0.5 rounded-md bg-muted/60 border border-border/40 whitespace-nowrap">
          Phase 2
        </span>
      </div>

      {/* JD textarea */}
      <Textarea
        id="jd-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here..."
        className="min-h-[300px] resize-none font-mono text-sm leading-relaxed"
        aria-label="Job description text input"
      />

      {/* Load mock JD button */}
      <button
        type="button"
        id="load-example-jd"
        onClick={() => onChange(MOCK_JD)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all"
      >
        <Clipboard className="h-3.5 w-3.5" />
        Paste Example JD
      </button>
    </div>
  );
}
