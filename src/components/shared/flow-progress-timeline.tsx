"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { deriveFlowProgress } from "@/lib/analytics";
import type { PaymentRecord } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

/**
 * In-transit position timeline (pain point 1). Shows where the money currently
 * sits on the route — which hop / intermediary bank it reached or is held at —
 * so the payer isn't left blindly waiting.
 */
export function FlowProgressTimeline({ record }: { record: PaymentRecord }) {
  const progress = deriveFlowProgress(record);
  const { hops, currentIndex, done, returned, caption } = progress;
  if (hops.length === 0) return null;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3" data-el="flow-progress">
      <div className="flex items-center gap-1.5 text-[11px]">
        {returned ? (
          <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--danger)]" aria-hidden />
        ) : done ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" aria-hidden />
        ) : (
          <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
        )}
        <span
          className={cn(
            "font-medium",
            returned
              ? "text-[color:var(--danger)]"
              : done
                ? "text-[color:var(--success)]"
                : "text-foreground",
          )}
        >
          {caption}
        </span>
      </div>

      {/* Horizontal hop rail */}
      <ol className="mt-3 flex items-center" data-el="flow-progress-rail">
        {hops.map((hop, i) => {
          const reached = i < currentIndex || (done && i <= currentIndex);
          const current = i === currentIndex && !done;
          const color = returned && current
            ? "var(--danger)"
            : reached || (done && i === currentIndex)
              ? "var(--success)"
              : current
                ? "var(--primary)"
                : "var(--muted-foreground)";
          return (
            <li key={hop.id} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                style={{
                  color,
                  border: `1.5px solid ${color}`,
                  filter: current ? `drop-shadow(0 0 8px ${color}66)` : undefined,
                }}
                title={hop.bankName}
                aria-label={hop.bankName}
              >
                {hop.role === "origin" ? "•" : hop.role === "beneficiary" ? "★" : i}
              </span>
              {i < hops.length - 1 && (
                <span
                  className="mx-1 h-[2px] flex-1"
                  style={{
                    background: i < currentIndex ? "var(--success)" : "var(--border)",
                  }}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Current hop bank label */}
      {!done && hops[currentIndex] && (
        <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
          Now at: {hops[currentIndex].bankName}
        </p>
      )}
    </div>
  );
}
