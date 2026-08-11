"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { PaymentRecord } from "@/lib/engine/types";
import { CHANNEL_CLASS_LABEL } from "@/lib/engine/types";
import { RiskBadge, StatusPill } from "@/components/shared/badges";
import { formatUsd, formatDate } from "@/lib/format";

export function PaymentRow({ record }: { record: PaymentRecord }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/history")}
      className="fg-glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.99]"
      data-el="payment-row"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{record.supplierName}</span>
          <RiskBadge level={record.riskLevel} />
        </div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="truncate">{CHANNEL_CLASS_LABEL[record.route.channelClass]}</span>
          <span>·</span>
          <span className="shrink-0">{formatDate(record.createdAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-mono text-sm font-semibold">{formatUsd(record.amountUsd)}</span>
        <StatusPill status={record.status} />
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
