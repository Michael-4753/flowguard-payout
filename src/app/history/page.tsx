"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ShieldCheck, Receipt, Send, CheckCircle2, Link2, Copy, Check } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { RiskBadge, StatusPill } from "@/components/shared/badges";
import { FlowProgressTimeline } from "@/components/shared/flow-progress-timeline";
import { PayoutExecutionPanel } from "@/components/screens/payout-execution-panel";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/errors/error-state";
import { formatUsd, formatDate, formatPercent } from "@/lib/format";
import {
  CHANNEL_CLASS_LABEL,
  RISK_LEVEL_LABEL,
  STATUS_LABEL,
  type PaymentRecord,
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
  const { payments, suppliers, loading, error, refresh, clarifiedFactors, effectiveRisk } = useFlowGuardData();
  const [level, setLevel] = useState<RiskLevel | "all">("all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [execId, setExecId] = useState<string | null>(null);

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
      ) : error ? (
        <div className="mt-4">
          <ErrorState onRetry={() => void refresh()} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Receipt}
            title={payments.length === 0 ? "No payments yet" : "No payments match these filters"}
            description={
              payments.length === 0
                ? "Once you route a payment, it appears here with its pre-check snapshot."
                : "Try resetting the risk or status filter above."
            }
            action={
              payments.length === 0
                ? { label: "New payment", onClick: () => router.push("/pay") }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((p, i) => {
            const eff = effectiveRisk(p);
            return (
            <article key={p.id} className="fg-enter fg-glass rounded-2xl p-4" style={{ "--i": i } as React.CSSProperties} data-el="history-item">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold">{p.supplierName}</span>
                    <span className="shrink-0"><RiskBadge level={eff.riskLevel} /></span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <Cell label={`Amount (${p.settleCurrency})`} value={p.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <Cell label="Channel" value={CHANNEL_CLASS_LABEL[p.route.channelClass]} />
                <Cell label="Return prob." value={formatPercent(eff.returnProbability, 0)} />
              </div>
              {p.currency !== p.settleCurrency && (
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground" data-el="history-currency">
                  结算 {p.settleCurrency} → 到账 {p.currency}（供应商本地币种）
                </p>
              )}

              <ClarifiedChips record={p} clarified={clarifiedFactors(p.supplierId)} />

              {p.status !== "draft" &&
                p.status !== "pending_review" &&
                p.status !== "rejected" && <FlowProgressTimeline record={p} />}

              {p.status === "initiated" && (() => {
                const supplier = suppliers.find((s) => s.id === p.supplierId);
                if (!supplier) return null;
                return (
                  <div className="mt-3">
                    {execId === p.id ? (
                      <PayoutExecutionPanel
                        payment={p}
                        supplier={supplier}
                        onSent={async () => {
                          setExecId(null);
                          await refresh();
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExecId(p.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]"
                        data-el="history-execute"
                      >
                        <Send className="h-3.5 w-3.5" /> Execute payout
                      </button>
                    )}
                  </div>
                );
              })()}

              {p.status === "settling" && p.receiptToken && !p.receipt && (
                <ReceiptLinkRow token={p.receiptToken} />
              )}
              {p.receipt && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 p-2.5 text-[11px]"
                  data-el="history-receipt-confirmed"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" aria-hidden />
                  <span>
                    Payee confirmed receipt on {formatDate(p.receipt.confirmedAt)}
                    {p.receipt.note ? ` — “${p.receipt.note}”` : ""}.
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push(`/pay?supplier=${p.supplierId}&amount=${p.amountUsd}`)}
                className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                data-el="history-reuse"
              >
                <RotateCcw className="h-3 w-3" /> Reuse draft
              </button>
            </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-1">
      <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
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
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}

/** Green "Clarified" chips for risk factors resolved via a verification case. */
function ClarifiedChips({ record, clarified }: { record: PaymentRecord; clarified: Set<string> }) {
  const hits = record.riskFactors.filter((f) => f.hit && clarified.has(f.id));
  if (hits.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" data-el="history-clarified">
      {hits.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--success)]/40 bg-[color:var(--success)]/12 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--success)]"
        >
          <ShieldCheck className="h-3 w-3" aria-hidden /> {f.title} · clarified
        </span>
      ))}
    </div>
  );
}

/** Copyable login-free receipt link the payer sends to the beneficiary. */
function ReceiptLinkRow({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/receipt/${token}` : `/receipt/${token}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  }
  return (
    <div
      className="mt-3 rounded-xl border border-border/60 bg-[color:var(--fg-soft)] p-2.5"
      data-el="history-receipt-link"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <Link2 className="h-3.5 w-3.5 text-primary" aria-hidden /> Payee receipt link
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Send this login-free link to the beneficiary so they can confirm the funds arrived.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-background/60 px-2 py-1.5 font-mono text-[10px]">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[10px] font-semibold hover:bg-background/60"
          data-el="history-receipt-copy"
        >
          {copied ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
