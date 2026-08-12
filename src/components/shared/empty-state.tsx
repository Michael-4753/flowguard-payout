import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/utils";

/**
 * Unified empty-state block used across list screens.
 *
 * Gives every empty list a consistent shape: a softly-tinted icon medallion,
 * a short title, an optional supporting line, and an optional primary action.
 * Keeps the app's `fg-glass` card language so it reads as "intentional empty"
 * rather than "something failed to load".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fg-glass flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center",
        className,
      )}
      data-el="empty-state"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 inline-flex min-h-[40px] items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]"
          data-el="empty-state-action"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
