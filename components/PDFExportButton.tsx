"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFExportButtonProps {
  runId?: string;
  onExportTailored?: () => Promise<void>;
  onExportComparison?: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export default function PDFExportButton({
  onExportTailored,
  onExportComparison,
  disabled = false,
  className,
}: PDFExportButtonProps) {
  const [loadingTailored, setLoadingTailored] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const handleTailored = async () => {
    if (!onExportTailored) return;
    setLoadingTailored(true);
    try {
      await onExportTailored();
    } finally {
      setLoadingTailored(false);
    }
  };

  const handleComparison = async () => {
    if (!onExportComparison) return;
    setLoadingComparison(true);
    try {
      await onExportComparison();
    } finally {
      setLoadingComparison(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Tailored Resume PDF */}
      <button
        type="button"
        id="export-tailored-pdf"
        disabled={disabled || loadingTailored}
        onClick={handleTailored}
        className={cn(
          "flex items-center gap-2 bg-[#d1d5db] text-gray-950 hover:bg-white px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        )}
        aria-label="Export tailored resume as PDF"
      >
        {loadingTailored ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        <span>{loadingTailored ? "Generating PDF…" : "Export Tailored Resume"}</span>
      </button>

      {/* Comparison PDF */}
      <button
        type="button"
        id="export-comparison-pdf"
        disabled={disabled || loadingComparison}
        onClick={handleComparison}
        className={cn(
          "flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 text-white px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        )}
        aria-label="Export side-by-side comparison PDF"
      >
        {loadingComparison ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        <span>{loadingComparison ? "Generating Report…" : "Export Comparison PDF"}</span>
      </button>
    </div>
  );
}
