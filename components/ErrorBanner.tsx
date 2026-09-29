"use client";

import { AlertCircle, RefreshCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  title?: string;
  errors: string[];
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * ErrorBanner — shows pipeline errors with retry + dismiss actions.
 * Supports displaying multiple error messages with a prominent retry button.
 */
export default function ErrorBanner({
  title = "Something went wrong",
  errors,
  onRetry,
  onDismiss,
  className,
}: ErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden transition-all duration-300",
        className
      )}
      role="alert"
    >
      <div className="px-4 py-3.5 flex items-start gap-3">
        {/* Icon */}
        <div className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">{title}</p>
          <div className="mt-1 space-y-0.5">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-destructive/80 leading-relaxed">
                {errors.length > 1 && `${i + 1}. `}
                {err}
              </p>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            {onRetry && (
              <button
                type="button"
                id="error-retry-btn"
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:text-destructive/80 bg-destructive/10 hover:bg-destructive/15 px-3 py-1.5 rounded-lg border border-destructive/20 transition-all"
              >
                <RefreshCcw className="h-3 w-3" />
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                id="error-dismiss-btn"
                onClick={onDismiss}
                className="text-xs text-destructive/60 hover:text-destructive underline underline-offset-2 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Close button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-destructive/40 hover:text-destructive transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
