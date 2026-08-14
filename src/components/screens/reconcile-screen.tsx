"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, CheckCircle2, Circle } from "lucide-react";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/errors/error-state";
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
import { AiInsightCard } from "@/components/ai/ai-insight-card";

type Filter = "all" | "outstanding" | "pending" | "reconciled";

export function ReconcileScreen() {
  const { payments, loading, error, refresh } = useFlowGuardData();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeReconcile(bump), []);

  const rows = useMemo(
    () => toReconcileRows(payments).map((r) => ({ ...r, reconciled: isReconciled(r.id) })),
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
          <h1 className="text-2xl font-bold tracking-tight">{t("reconcile.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("reconcile.subtitle")}
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
        <SummaryCard label={t("reconcile.totalSent")} value={formatUsdCents(summary.totalSent)} />
        <SummaryCard label={t("reconcile.expectedReceived")} value={formatUsdCents(summary.totalExpected)} highlight />
        <SummaryCard label={t("reconcile.fees")} value={formatUsdCents(summary.totalFees)} />
        <SummaryCard label={t("reconcile.fxLoss")} value={formatUsdCents(summary.totalFxLoss)} />
        <SummaryCard label={t("reconcile.outstanding")} value={formatUsdCents(summary.outstanding)} />
        <SummaryCard
          label={t("reconcile.reconciled")}
          value={`${summary.reconciledCount}/${summary.reconciledCount + summary.pendingCount}`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 pb-1" data-el="reconcile-filters">
        {(["all", "outstanding", "pending", "reconciled"] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === "all"
              ? t("reconcile.filterAll")
              : f === "outstanding"
                ? t("reconcile.filterOutstanding")
                : f === "pending"
                  ? t("reconcile.filterToReconcile")
                  : t("reconcile.filterReconciled")}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={4} />
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState onRetry={() => void refresh()} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={CheckCircle2}
            title={rows.length === 0 ? t("reconcile.emptyNoneTitle") : t("reconcile.emptyNoMatchTitle")}
            description={
              rows.length === 0
                ? t("reconcile.emptyNoneDesc")
                : t("reconcile.emptyNoMatchDesc")
            }
          />
        </div>
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
  const { t } = useTranslation();
  return (
    <article className="fg-glass rounded-2xl p-4" data-el="reconcile-row">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{r.supplierName}</span>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {r.currency !== r.settleCurrency ? `${r.settleCurrency} → ${r.currency}` : r.settleCurrency}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {formatDate(r.createdAt)} · {r.channel}
          </p>
        </div>
        <StatusPill status={r.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Cell label={t("reconcile.sent", { currency: r.settleCurrency })} value={formatUsdCents(r.amountUsd)} />
        <Cell label={t("reconcile.fees")} value={formatUsdCents(r.feeUsd)} />
        <Cell label={t("reconcile.fxLoss")} value={formatUsdCents(r.fxLossUsd)} />
        <Cell label={t("reconcile.expected")} value={formatUsdCents(r.expectedUsd)} />
        <Cell label={t("reconcile.received")} value={r.receivedUsd > 0 ? formatUsdCents(r.receivedUsd) : "—"} />
        <Cell label={t("reconcile.variance")} value={formatUsdCents(r.varianceUsd)} danger={r.varianceUsd < 0} />
      </div>

      {/* On-chain / off-chain proof matching (pain point 4) */}
      <div className="mt-3 rounded-xl border border-border bg-[color:var(--fg-soft)] p-2.5" data-el="reconcile-proofs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("reconcile.proofMatch")}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
              r.matchStatus === "matched"
                ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                : r.matchStatus === "unmatched"
                  ? "bg-[color:var(--danger)]/15 text-[color:var(--danger)]"
                  : "bg-[color:var(--fg-soft)] text-muted-foreground",
            )}
          >
            {r.matchStatus === "matched"
              ? t("reconcile.matched")
              : r.matchStatus === "unmatched"
                ? t("reconcile.unmatched")
                : t("reconcile.notSentYet")}
          </span>
        </div>
        <dl className="mt-2 space-y-1 font-mono text-[10px]">
          <ProofLine label={t("reconcile.invoice")} value={r.invoiceNo} />
          <ProofLine label={t("reconcile.bankRef")} value={r.offchainRef} />
          <ProofLine label={t("reconcile.onchain")} value={r.onchainRef || "—"} muted={!r.onchainRef} />
          <ProofLine
            label={r.settlementMethod === "onchain-tx" ? t("reconcile.settlementTx") : t("reconcile.settlementRef")}
            value={r.settlementRef || t("reconcile.settlementPending")}
            muted={!r.settlementRef}
          />
          {r.settlementAttachmentUrl && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{t("reconcile.slip")}</dt>
              <dd>
                <a
                  href={r.settlementAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {t("reconcile.viewAttachment")}
                </a>
              </dd>
            </div>
          )}
          <ProofLine
            label={t("reconcile.payeeReceipt")}
            value={r.payeeConfirmedAt ? t("reconcile.confirmedOn", { date: new Date(r.payeeConfirmedAt).toLocaleDateString() }) : t("reconcile.awaiting")}
            muted={!r.payeeConfirmedAt}
          />
        </dl>
      </div>

      {/* Pain point ④: AI explains why the figures / proofs don't line up. */}
      {(r.varianceUsd < 0 || r.matchStatus === "unmatched") && (
        <div className="mt-3">
          <AiInsightCard
            kind="reconcile"
            title={t("reconcile.aiTitle")}
            cta={t("reconcile.aiCta")}
            hint={t("reconcile.aiHint")}
            loadingLabel={t("reconcile.aiLoading")}
            actionsLabel={t("reconcile.aiActions")}
            buildSnapshot={() => ({
              currency: r.currency,
              settleCurrency: r.settleCurrency,
              channel: r.channel,
              status: r.status,
              sentUsd: r.amountUsd / 100,
              feeUsd: r.feeUsd / 100,
              fxLossUsd: r.fxLossUsd / 100,
              expectedUsd: r.expectedUsd / 100,
              receivedUsd: r.receivedUsd / 100,
              varianceUsd: r.varianceUsd / 100,
              matchStatus: r.matchStatus,
              hasInvoice: Boolean(r.invoiceNo),
              hasBankRef: Boolean(r.offchainRef),
              hasOnchainRef: Boolean(r.onchainRef),
              hasSettlementRef: Boolean(r.settlementRef),
              payeeConfirmed: Boolean(r.payeeConfirmedAt),
              settlementMethod: r.settlementMethod,
            })}
          />
        </div>
      )}

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
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {t("reconcile.reconciled")}
          </>
        ) : (
          <>
            <Circle className="h-3.5 w-3.5" aria-hidden /> {t("reconcile.markReconciled")}
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
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate" style={danger ? { color: "var(--danger)" } : undefined}>
        {value}
      </div>
    </div>
  );
}

function ProofLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 truncate", muted ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </dd>
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
