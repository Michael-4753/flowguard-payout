"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { RotateCcw, ShieldCheck, Receipt, Send, CheckCircle2, Link2, Copy, Check, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { RiskBadge, StatusPill } from "@/components/shared/badges";
import { FlowProgressTimeline } from "@/components/shared/flow-progress-timeline";
import { PayoutExecutionPanel } from "@/components/screens/payout-execution-panel";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { useIsGuest, resetGuestData } from "@/lib/guest/guest-session";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/errors/error-state";
import { formatDate, formatPercent } from "@/lib/format";
import {
  type PaymentRecord,
  type PaymentStatus,
  type RiskLevel,
} from "@/lib/engine/types";
import { channelLabel, riskLabel, statusLabel } from "@/lib/i18n-labels";
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
  const { t } = useTranslation();
  const guest = useIsGuest();
  const [level, setLevel] = useState<RiskLevel | "all">("all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [execId, setExecId] = useState<string | null>(() =>
    // Deep-linked right after approval (/history?focus={id})? Pre-open that row's
    // execution panel. It only renders for `initiated` payments, so seeding it
    // for any other row is harmless — this lands the reviewer directly on the
    // "submit to the licensed institution" step instead of a bare list.
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("focus"),
  );
  // Deep-link focus: /history?focus={id} scrolls to and briefly highlights that
  // record so the reviewer doesn't have to hunt for it after approving/returning.
  // Read once from the URL at mount (client component) — no effect needed.
  const [focusId, setFocusId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("focus"),
  );
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  // Once the target row is rendered, scroll it into view and clear the ring
  // after a moment. Depends on `payments` so it also runs after data loads.
  useEffect(() => {
    if (!focusId) return;
    const el = itemRefs.current[focusId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setFocusId(null), 2600);
    return () => clearTimeout(t);
  }, [focusId, payments]);

  const filtered = useMemo(
    () =>
      payments.filter(
        (p) => (level === "all" || p.riskLevel === level) && (status === "all" || p.status === status),
      ),
    [payments, level, status],
  );

  return (
    <section className="pt-1" data-el="history">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("history.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
        {t("history.subtitle")}
      </p>
        </div>
        {guest && payments.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(t("history.resetConfirm"))) return;
              resetGuestData();
              await refresh();
            }}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-[color:var(--danger)]/50 hover:text-[color:var(--danger)]"
            data-el="history-reset-demo"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t("history.resetDemo")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 space-y-2" data-el="history-filters">
        <FilterRow label={t("history.filterRisk")}>
          {LEVELS.map((l) => (
            <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
              {l === "all" ? t("history.all") : riskLabel(t, l)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label={t("history.filterStatus")}>
          {STATUSES.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === "all" ? t("history.all") : statusLabel(t, s)}
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
            title={payments.length === 0 ? t("history.emptyNoneTitle") : t("history.emptyNoMatchTitle")}
            description={
              payments.length === 0
                ? t("history.emptyNoneDesc")
                : t("history.emptyNoMatchDesc")
            }
            action={
              payments.length === 0
                ? { label: t("history.newPayment"), onClick: () => router.push("/pay") }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((p, i) => {
            const eff = effectiveRisk(p);
            return (
            <article
              key={p.id}
              ref={(el) => {
                itemRefs.current[p.id] = el;
              }}
              className={cn(
                "fg-enter fg-glass rounded-2xl p-4 transition-shadow duration-500",
                focusId === p.id &&
                  "ring-2 ring-[color:var(--success)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_20%,transparent)]",
              )}
              style={{ "--i": i } as React.CSSProperties}
              data-el="history-item"
            >
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
                <Cell label={t("history.amount", { currency: p.settleCurrency })} value={p.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                <Cell label={t("history.channel")} value={channelLabel(t, p.route.channelClass)} />
                <Cell label={t("history.returnProb")} value={formatPercent(eff.returnProbability, 0)} />
              </div>
              {p.currency !== p.settleCurrency && (
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground" data-el="history-currency">
                  {t("history.settledCredited", { settle: p.settleCurrency, local: p.currency })}
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
                        <Send className="h-3.5 w-3.5" /> {t("history.generateInstruction")}
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
                    {t("history.receiptConfirmed", { date: formatDate(p.receipt.confirmedAt), note: p.receipt.note ? ` — “${p.receipt.note}”` : "" })}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push(`/pay?supplier=${p.supplierId}&amount=${p.amountUsd}`)}
                className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                data-el="history-reuse"
              >
                <RotateCcw className="h-3 w-3" /> {t("history.reuseDraft")}
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

/** Green chips for risk factors resolved via a verification case (verified / clarified). */
function ClarifiedChips({
  record,
  clarified,
}: {
  record: PaymentRecord;
  clarified: Map<string, "verified" | "clarified">;
}) {
  const { t } = useTranslation();
  const hits = record.riskFactors.filter((f) => f.hit && clarified.has(f.id));
  if (hits.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" data-el="history-clarified">
      {hits.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--success)]/40 bg-[color:var(--success)]/12 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--success)]"
        >
          <ShieldCheck className="h-3 w-3" aria-hidden /> {f.title} ·{" "}
          {clarified.get(f.id) === "verified" ? t("history.verified") : t("history.clarified")}
        </span>
      ))}
    </div>
  );
}

/** Copyable login-free receipt link the payer sends to the beneficiary. */
function ReceiptLinkRow({ token }: { token: string }) {
  const { t } = useTranslation();
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
        <Link2 className="h-3.5 w-3.5 text-primary" aria-hidden /> {t("history.receiptLinkTitle")}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t("history.receiptLinkDesc")}
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
          {copied ? t("history.copied") : t("history.copy")}
        </button>
      </div>
    </div>
  );
}
