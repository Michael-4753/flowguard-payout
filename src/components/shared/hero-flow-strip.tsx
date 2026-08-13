"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { deriveFlowProgress } from "@/lib/analytics";
import type { PaymentRecord } from "@/lib/engine/types";
import { formatUsd } from "@/lib/format";
import { cn } from "@/utils/utils";

/**
 * Home-screen signature: a compact money-flow narrative strip. Picks the most
 * "in-motion" recent payment (settling first, then arrived, then latest) and
 * renders it as a single row of softly-lit orb nodes — the product's core
 * visual language, surfaced on the front door. Tapping it opens History.
 */
export function HeroFlowStrip({
  payments,
  onOpen,
}: {
  payments: PaymentRecord[];
  onOpen: () => void;
}) {
  const record = useMemo(() => pickNarrativePayment(payments), [payments]);
  if (!record) return null;

  const { hops, currentIndex, done, returned, caption } = deriveFlowProgress(record);
  if (hops.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fg-glass mt-4 w-full overflow-hidden rounded-[24px] p-4 text-left transition-transform active:scale-[0.99]"
      data-el="hero-flow-strip"
    >
      {/* header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] font-medium text-muted-foreground">
          <span className="text-foreground">{record.supplierName}</span> · {caption}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary">
          Track <ArrowRight className="h-3 w-3" aria-hidden />
        </span>
      </div>

      {/* orb chain */}
      <ol className="mt-3 flex items-center" data-el="hero-flow-rail">
        {hops.map((hop, i) => {
          const reached = i < currentIndex || (done && i <= currentIndex);
          const current = i === currentIndex && !done;
          const isDanger = hop.chokepoint && (current || returned);
          const color = isDanger
            ? "var(--danger)"
            : reached || done
              ? "var(--success)"
              : current
                ? "var(--primary)"
                : "var(--muted-foreground)";
          return (
            <li key={hop.id} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span
                className={cn(
                  "fg-orb-route grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  current && !isDanger && "fg-orb-pulse",
                  isDanger && "fg-orb-pulse-danger",
                )}
                data-active={reached || current || done ? "true" : "false"}
                style={{ color, border: `1.5px solid ${color}` }}
                title={hop.bankName}
                aria-label={hop.bankName}
              >
                {hop.role === "origin" ? "•" : hop.role === "beneficiary" ? "★" : isDanger ? "!" : i}
              </span>
              {i < hops.length - 1 && (
                <span
                  className="mx-1 h-[2px] flex-1"
                  aria-hidden
                  style={{ background: i < currentIndex ? "var(--success)" : "var(--fg-line)" }}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* amount → received */}
      <div className="mt-2.5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span className="text-foreground">{formatUsd(record.amountUsd)}</span>
        <ArrowRight className="h-3 w-3" aria-hidden />
        <span>{formatUsd(record.route.receiveUsd)} received</span>
      </div>
    </button>
  );
}

/** Prefer an in-transit payment (best narrative), else arrived, else latest. */
function pickNarrativePayment(payments: PaymentRecord[]): PaymentRecord | undefined {
  if (payments.length === 0) return undefined;
  return (
    payments.find((p) => p.status === "settling") ??
    payments.find((p) => p.status === "arrived") ??
    payments.find((p) => p.status === "returned") ??
    payments[0]
  );
}
