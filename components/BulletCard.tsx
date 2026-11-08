"use client";

import { useState } from "react";
import { RewrittenBullet } from "@/types";
import ConfidenceBadge from "./ConfidenceBadge";
import {
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  AlertTriangle,
  Lightbulb,
  Pencil,
  Save,
  X,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulletCardProps {
  bullet: RewrittenBullet;
  experienceIndex: number;
  bulletIndex: number;
  onConfirm?: (ei: number, bi: number, confirmed: boolean) => void;
  onEdit?: (ei: number, bi: number, tailored: string) => void;
  className?: string;
}

export default function BulletCard({
  bullet,
  experienceIndex,
  bulletIndex,
  onConfirm,
  onEdit,
  className,
}: BulletCardProps) {
  const [showReason, setShowReason] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(bullet.tailored);
  const [copied, setCopied] = useState(false);

  const isUnchanged = bullet.original === bullet.tailored;
  const hasRisk = !!bullet.riskFlag;

  const handleCopyBullet = async () => {
    try {
      await navigator.clipboard.writeText(bullet.tailored);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy bullet:", err);
    }
  };

  const handleSaveEdit = () => {
    if (editedText.trim().length > 0 && onEdit) {
      onEdit(experienceIndex, bulletIndex, editedText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(bullet.tailored);
    setIsEditing(false);
  };

  return (
    <div
      id={`bullet-${experienceIndex}-${bulletIndex}`}
      className={cn(
        "bg-[#121318] border border-[#20232c] rounded-xl p-4 space-y-4 shadow-sm transition-all duration-200",
        isUnchanged && "opacity-60 border-gray-800/40",
        hasRisk && "border-amber-900/40 hover:border-amber-800/60",
        !isUnchanged && !hasRisk && "hover:border-[#2f3545]",
        className
      )}
    >
      {/* ── Card Header Badges ───────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
        <div className="flex items-center space-x-2">
          <ConfidenceBadge confidence={bullet.confidence} riskFlag={bullet.riskFlag} />
        </div>

        <div className="flex items-center space-x-2">
          {!isUnchanged ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>MODIFIED</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-zinc-400 font-mono">
              UNCHANGED
            </span>
          )}
        </div>
      </div>

      {/* ── Diff Columns Side-by-Side ────────────────────────────── */}
      {isUnchanged ? (
        <div className="p-3.5 bg-[#0e1014]/40 rounded-lg border border-gray-800/40 text-zinc-300 leading-relaxed text-sm sm:text-base font-sans">
          {bullet.original}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base font-sans">
          {/* BEFORE Column */}
          <div className="space-y-1.5 bg-[#0e1014]/60 p-3.5 rounded-lg border border-gray-800/50">
            <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span>BEFORE</span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-sans text-sm sm:text-base line-through decoration-zinc-700 decoration-1">
              {bullet.original}
            </p>
          </div>

          {/* AFTER Column */}
          <div className="space-y-1.5 bg-[#10141b]/70 p-3.5 rounded-lg border border-teal-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase text-teal-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                <span>AFTER</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBullet}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all duration-150 ease-out shadow-sm",
                    copied
                      ? "bg-zinc-800 border border-zinc-600 text-zinc-200"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                  )}
                  title="Copy tailored bullet text to clipboard"
                  aria-label="Copy tailored bullet text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {!isEditing && onEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors font-mono font-medium px-2 py-1"
                    title="Manually edit tailored bullet"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full bg-[#0c0d10] border border-teal-500/40 rounded-lg p-2.5 text-sm text-zinc-100 font-sans focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none min-h-[90px] leading-relaxed"
                  aria-label="Edit tailored bullet text"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-gray-800 text-zinc-300 hover:text-white transition"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm bg-teal-500 text-gray-950 font-bold hover:bg-teal-400 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-zinc-100 leading-relaxed font-sans text-sm sm:text-base">
                {bullet.tailored}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Tags & Keywords ──────────────────────────────────────── */}
      {bullet.keywordsAddressed.length > 0 && !isUnchanged && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {bullet.keywordsAddressed.map((kw) => (
            <span
              key={kw}
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-[#1a1d26] text-zinc-200 border border-zinc-700/60"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* ── Risk Warning Callout ─────────────────────────────────── */}
      {hasRisk && (
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 px-3.5 py-2.5 text-sm text-amber-200/90 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-amber-400">Verify: </span>
            {bullet.riskFlag}
          </p>
        </div>
      )}

      {/* ── Reasoning & Actions Row ──────────────────────────────── */}
      {!isUnchanged && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-gray-800/60">
          {/* Reason Toggle */}
          <div>
            {bullet.changeReason && (
              <button
                type="button"
                onClick={() => setShowReason((v) => !v)}
                className="text-xs sm:text-sm text-zinc-300 hover:text-white flex items-center space-x-1.5 transition font-mono font-medium"
                aria-expanded={showReason}
              >
                <Lightbulb className="w-4 h-4 text-zinc-400" />
                <span>{showReason ? "Hide" : "Show"} change reasoning</span>
                {showReason ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>
            )}
          </div>

          {/* Accept / Revert Actions */}
          {onConfirm && (
            <div className="flex items-center space-x-2.5">
              {/* Accept */}
              <button
                type="button"
                id={`accept-bullet-${experienceIndex}-${bulletIndex}`}
                onClick={() => onConfirm(experienceIndex, bulletIndex, true)}
                className={cn(
                  "flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-150 shadow-sm",
                  bullet.confirmed === true
                    ? "bg-zinc-800 text-emerald-400 border border-emerald-500/40"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60"
                )}
              >
                <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                <span>{bullet.confirmed === true ? "Accepted" : "Accept"}</span>
              </button>

              {/* Revert */}
              <button
                type="button"
                id={`revert-bullet-${experienceIndex}-${bulletIndex}`}
                onClick={() => onConfirm(experienceIndex, bulletIndex, false)}
                className={cn(
                  "flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150",
                  bullet.confirmed === false
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-500"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/60"
                )}
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400 stroke-2" />
                <span>{bullet.confirmed === false ? "Reverted" : "Revert"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expanded Reasoning Box */}
      {showReason && bullet.changeReason && !isUnchanged && (
        <div className="bg-[#0e1014] border border-gray-800/80 rounded-lg p-3.5 text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono">
          {bullet.changeReason}
        </div>
      )}
    </div>
  );
}
