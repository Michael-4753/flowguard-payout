"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { RiskBadge, StatusPill } from "@/components/shared/badges";
import { FlowProgressTimeline } from "@/components/shared/flow-progress-timeline";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { formatUsd, formatDate, formatPercent } from "@/lib/format";
import {
  CHANNEL_CLASS_LABEL,
  RISK_LEVEL_LABEL,
  STATUS_LABEL,
  type PaymentStatus,
  type RiskLevel,
} from "@/lib/engine/types";
import { cn } from "@/utils/utils";

const LEVELS: (RiskLevel | "all")[] = ["all", "low", "medium", "high"];
const STATUSES: (PaymentStatus | "all")[] = [
  "all",
  "pending_review",
  "rejected",
  "initiated",
  "settling",
  "arrived",
  "returned",
];

export default function HistoryPage() {
  return (
    <AppShell>
      <HistoryBody />
    </AppShell>
  );
}

function HistoryBody() {
  const router = useRouter();
  const { payments, loading, clarifiedFactors } = useFlowGuardData();
  const [level, setLevel] = useState<RiskLevel | "all">("all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");

  const filtered = useMemo(
    () =>
      payments.filter(
        (p) => (level === "all" || p.riskLevel === level) && (status === "all" || p.status === status),
      ),
    [payments, level, status],
  );

  return (
    <section className="pt-1" data-el="history">
      <h1 className="text-2xl font-bold tracking-tight">Payment history</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every routed payment with its pre-check snapshot and chosen channel.
      </p>

      {/* Filters */}
      <div className="mt-4 space-y-2" data-el="history-filters">
        <FilterRow label="Risk">
          {LEVELS.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
              {l === "all" ? "All" : RISK_LEVEL_LABEL[l]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Status">
          {STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : STATUS_LABEL[s]}
            </Chip>
          ))}
        </FilterRow>
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="fg-glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No payments match these filters.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((p) => (
            <article key={p.id} className="fg-glass rounded-2xl p-4" data-el="history-item">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{p.supplierName}</span>
                    <RiskBadge level={p.riskLevel} />
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <Cell label="Amount" value={formatUsd(p.amountUsd)} />
                <Cell label="Channel" value={CHANNEL_CLASS_LABEL[p.route.channelClass]} />
                <Cell label="Return prob." value={formatPercent(p.returnProbability, 0)} />
              </div>

              <ClarifiedChips record={p} clarified={clarifiedFactors(p.supplierId)} />

              {p.status !== "draft" &&
                p.status !== "pending_review" &&
                p.status !== "rejected" && <FlowProgressTimeline record={p} />}

              <button
                type="button"
                onClick={() => router.push(`/pay?supplier=${p.supplierId}&amount=${p.amountUsd}`)}
                className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                data-el="history-reuse"
              >
                <RotateCcw className="h-3 w-3" /> Reuse draft
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}
