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
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {/* Tailored Resume */}
      <button
        type="button"
        id="export-tailored-pdf"
        disabled={disabled || loadingTailored}
        onClick={handleTailored}
        className={cn(
          "flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        )}
        aria-label="Export tailored resume as PDF"
      >
        {loadingTailored ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {loadingTailored ? "Generating..." : "Export Tailored Resume"}
      </button>

      {/* Comparison PDF */}
      <button
        type="button"
        id="export-comparison-pdf"
        disabled={disabled || loadingComparison}
        onClick={handleComparison}
        className={cn(
          "flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all",
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        )}
        aria-label="Export side-by-side comparison PDF"
      >
        {loadingComparison ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {loadingComparison ? "Generating..." : "Export Comparison PDF"}
      </button>
    </div>
  );
}
