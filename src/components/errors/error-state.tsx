"use client";

import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/utils/utils";

/**
 * Inline error state for list screens whose data failed to load.
 *
 * Distinct from an empty state: this signals "something went wrong, your data
 * may still exist" and offers a retry, rather than "there is nothing here".
 * Mirrors EmptyState's card language but uses the danger accent.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("errorState.title");
  const resolvedDescription = description ?? t("errorState.description");
  return (
    <div
      className={cn(
        "fg-glass flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center",
        className,
      )}
      data-el="error-state"
      role="alert"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--danger)]/10 text-[color:var(--danger)]"
        aria-hidden
      >
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-muted-foreground">
          {resolvedDescription}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex min-h-[40px] items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]"
          data-el="error-state-retry"
        >
          {t("errorState.tryAgain")}
        </button>
      )}
    </div>
  );
}
