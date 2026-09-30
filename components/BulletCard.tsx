"use client";

import { useState } from "react";
import { RewrittenBullet } from "@/types";
import ConfidenceBadge from "./ConfidenceBadge";
import { ChevronDown, ChevronUp, CheckCheck, RotateCcw, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Props (UNCHANGED) ───────────────────────────────────────── */
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
      id={`bullet-${experienceIndex}-${bulletIndex}`}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-200 group/card",
        /* Base charcoal surface */
        "bg-[#141418] border",
        /* State variants */
        isUnchanged
          ? "border-white/[0.05] opacity-50"
          : hasRisk
          ? "border-amber-500/20 bullet-card-risk"
          : "border-white/[0.08] bullet-card-changed",
        /* Hover lift */
        !isUnchanged && "hover:border-white/[0.14] hover:-translate-y-px",
        className
      )}
    >
      {/* Top highlight line */}
      {!isUnchanged && (
        <div className={cn(
          "absolute inset-x-0 top-0 h-px",
          hasRisk
            ? "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
        )} />
      )}

      <div className="p-4 space-y-4">
        {/* ── Header row ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <ConfidenceBadge confidence={bullet.confidence} riskFlag={bullet.riskFlag} />
          {!isUnchanged ? (
            <span className={cn(
              "text-[10px] font-mono font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border",
              hasRisk
                ? "text-amber-300/70 border-amber-500/20 bg-amber-500/[0.04]"
                : "text-zinc-400 border-white/10 bg-white/[0.03]"
            )}>
              {hasRisk ? "⚠ Modified" : "◦ Modified"}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-600 tracking-widest uppercase font-mono">
              Unchanged
            </span>
          )}
        </div>

        {/* ── Side-by-side diff ──────────────────────────────────── */}
        {isUnchanged ? (
          /* Unchanged — single column, muted zinc */
          <p className="text-sm leading-relaxed text-zinc-600">
            {bullet.original}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Original column — muted, struck through */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-zinc-600">
                  Before
                </span>
              </div>
              <div className="bg-[#0c0c0e] border border-white/[0.05] p-3 rounded-xl">
                <p className="text-[13px] leading-relaxed text-zinc-600 line-through decoration-zinc-700 decoration-1">
                  {bullet.original}
                </p>
              </div>
            </div>

            {/* Tailored column — crisp white */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  hasRisk ? "bg-amber-400" : "bg-zinc-300"
                )} />
                <span className={cn(
                  "text-[10px] font-mono font-semibold tracking-widest uppercase",
                  hasRisk ? "text-amber-300/70" : "text-zinc-400"
                )}>
                  After
                </span>
              </div>
              <div className={cn(
                "p-3 rounded-xl border",
                hasRisk
                  ? "bg-amber-500/[0.04] border-amber-500/15"
                  : "bg-white/[0.03] border-white/[0.08]"
              )}>
                <p className="text-[13px] leading-relaxed font-medium text-zinc-100">
                  {bullet.tailored}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Keyword chips — outline-only pills ─────────────────── */}
        {bullet.keywordsAddressed.length > 0 && !isUnchanged && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {bullet.keywordsAddressed.map((kw) => (
              <span
                key={kw}
                className={cn(
                  "chip",
                  hasRisk
                    ? "text-amber-300/70 border border-amber-500/20"
                    : "text-zinc-400 border border-white/10"
                )}
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* ── Risk warning — ultra-subtle glass amber ─────────────── */}
        {hasRisk && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 px-3.5 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400/70 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/70 leading-relaxed">
              <span className="font-semibold text-amber-300">Verify: </span>
              {bullet.riskFlag}
            </p>
          </div>
        )}

        {/* ── Change reason toggle ───────────────────────────────── */}
        {!isUnchanged && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowReason((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-zinc-600 hover:text-zinc-400 transition-colors group/btn"
              aria-expanded={showReason}
            >
              <Lightbulb className="h-3 w-3 text-zinc-600 group-hover/btn:text-zinc-400 transition-colors" />
              {showReason ? "Hide" : "Show"} change reasoning
              {showReason ? (
                <ChevronUp className="h-3 w-3 ml-0.5" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-0.5" />
              )}
            </button>

            {showReason && bullet.changeReason && (
              <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-lg px-3.5 py-3 text-xs text-zinc-500 leading-relaxed animate-fade-in">
                {bullet.changeReason}
              </div>
            )}
          </div>
        )}

        {/* ── Accept / Revert ────────────────────────────────────── */}
        {!isUnchanged && onConfirm && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            {/* Accept */}
            <button
              type="button"
              id={`accept-bullet-${experienceIndex}-${bulletIndex}`}
              onClick={() => onConfirm(experienceIndex, bulletIndex, true)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150",
                bullet.confirmed === true
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-emerald-500/[0.06] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/[0.12] hover:border-emerald-500/30"
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {bullet.confirmed === true ? "Accepted" : "Accept"}
            </button>

            {/* Revert */}
            <button
              type="button"
              id={`revert-bullet-${experienceIndex}-${bulletIndex}`}
              onClick={() => onConfirm(experienceIndex, bulletIndex, false)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150",
                bullet.confirmed === false && bullet.confirmed !== undefined
                  ? "bg-white/[0.08] text-zinc-300 border border-white/10"
                  : "bg-white/[0.02] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.05] hover:text-zinc-400"
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {bullet.confirmed === false ? "Reverted" : "Revert"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
