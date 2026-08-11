"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Download, CheckCircle2, Circle } from "lucide-react";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { StatusPill } from "@/components/shared/badges";
import { formatUsdCents, formatDate } from "@/lib/format";
import {
  downloadCsv,
  isReconciled,
  subscribeReconcile,
  summarize,
  toggleReconciled,
  toReconcileRows,
  type ReconcileRow,
} from "@/lib/reconcile";
import { cn } from "@/utils/utils";

type Filter = "all" | "outstanding" | "pending" | "reconciled";

export function ReconcileScreen() {
  const { payments, loading } = useFlowGuardData();
  const [filter, setFilter] = useState<Filter>("all");
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeReconcile(bump), []);

  const rows = useMemo(
    () => toReconcileRows(payments).map((r) => ({ ...r, reconciled: isReconciled(r.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [payments],
  );
  const summary = useMemo(() => summarize(rows), [rows]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "outstanding":
        return rows.filter((r) => r.status !== "arrived" && r.status !== "returned");
      case "pending":
        return rows.filter((r) => !r.reconciled);
      case "reconciled":
        return rows.filter((r) => r.reconciled);
      default:
        return rows;
    }
  }, [rows, filter]);

  return (
    <section className="pt-1" data-el="reconcile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Reconciliation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Expected vs received, fees and FX loss — with an exportable statement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(filtered)}
          disabled={filtered.length === 0}
          className={cn(
            "mt-1 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-transform active:scale-[0.98]",
            filtered.length === 0
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]",
          )}
          data-el="reconcile-export"
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> CSV
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3" data-el="reconcile-summary">
        <SummaryCard label="Total sent" value={formatUsdCents(summary.totalSent)} />
        <SummaryCard label="Expected received" value={formatUsdCents(summary.totalExpected)} highlight />
        <SummaryCard label="Fees" value={formatUsdCents(summary.totalFees)} />
        <SummaryCard label="FX loss" value={formatUsdCents(summary.totalFxLoss)} />
        <SummaryCard label="Outstanding" value={formatUsdCents(summary.outstanding)} />
        <SummaryCard
          label="Reconciled"
          value={`${summary.reconciledCount}/${summary.reconciledCount + summary.pendingCount}`}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1" data-el="reconcile-filters">
        {(["all", "outstanding", "pending", "reconciled"] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === "all"
              ? "All"
              : f === "outstanding"
                ? "Outstanding"
                : f === "pending"
                  ? "To reconcile"
                  : "Reconciled"}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="fg-glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Nothing to reconcile here yet.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((r) => (
            <ReconcileCard key={r.id} row={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReconcileCard({ row: r }: { row: ReconcileRow }) {
  return (
    <article className="fg-glass rounded-2xl p-4" data-el="reconcile-row">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{r.supplierName}</span>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{r.currency}</span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {formatDate(r.createdAt)} · {r.channel}
          </p>
        </div>
        <StatusPill status={r.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Cell label="Sent" value={formatUsdCents(r.amountUsd)} />
        <Cell label="Fees" value={formatUsdCents(r.feeUsd)} />
        <Cell label="FX loss" value={formatUsdCents(r.fxLossUsd)} />
        <Cell label="Expected" value={formatUsdCents(r.expectedUsd)} />
        <Cell label="Received" value={r.receivedUsd > 0 ? formatUsdCents(r.receivedUsd) : "—"} />
        <Cell label="Variance" value={formatUsdCents(r.varianceUsd)} danger={r.varianceUsd < 0} />
      </div>

      <button
        type="button"
        onClick={() => toggleReconciled(r.id)}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-medium transition-colors",
          r.reconciled
            ? "border-[color:var(--success)]/50 text-[color:var(--success)]"
            : "border-border text-muted-foreground hover:bg-[color:var(--fg-soft)]",
        )}
        data-el="reconcile-toggle"
      >
        {r.reconciled ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Reconciled
          </>
        ) : (
          <>
            <Circle className="h-3.5 w-3.5" aria-hidden /> Mark reconciled
          </>
        )}
      </button>
    </article>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("fg-glass min-w-0 rounded-2xl p-3", highlight && "border border-primary/40")}>
      <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 truncate font-mono text-base font-bold tabular-nums",
          highlight && "text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Cell({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate" style={danger ? { color: "var(--danger)" } : undefined}>
        {value}
      </div>
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
