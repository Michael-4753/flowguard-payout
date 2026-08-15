"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Check, X, Clock, Info } from "lucide-react";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/errors/error-state";
import { RiskBadge } from "@/components/shared/badges";
import { reviewPayment } from "@/lib/api";
import { formatDate, formatPercent } from "@/lib/format";
import { type PaymentRecord } from "@/lib/engine/types";
import { channelLabel, factorTitle } from "@/lib/i18n-labels";
import type { EffectiveRisk } from "@/lib/verification";
import { MAKER_LABEL } from "@/lib/review";
import { cn } from "@/utils/utils";

/**
 * Maker-checker review queue (segregation of duties). The maker (cashier) submits
 * a payment; a separate checker (finance supervisor) must approve before it is
 * sent to the bank. In this single-account demo both roles are the signed-in
 * user, distinguished by role labels and a persisted approval trail.
 */
export function ReviewScreen() {
  const { payments, loading, error, refresh, effectiveRisk, activeRole, setActiveRole } =
    useFlowGuardData();
  const { t } = useTranslation();
  const pending = useMemo(
    () => payments.filter((p) => p.status === "pending_review"),
    [payments],
  );

  return (
    <section className="pt-1" data-el="review">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight">{t("review.title")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("review.subtitle")}
      </p>

      <div
        className="fg-glass mt-4 rounded-2xl p-4"
        data-el="review-summary"
      >
        <div
          className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          data-el="review-demo-mode-notice"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            <span className="font-semibold">{t("review.demoTitle")}</span> {t("review.demoBody")}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">{t("review.awaitingApproval")}</div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{pending.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("review.actingRole")}</div>
            <div className="mt-1 inline-flex rounded-full border border-border bg-[color:var(--fg-soft)] p-0.5" data-el="review-role-switch">
              <button
                type="button"
                onClick={() => setActiveRole("maker")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                  activeRole === "maker" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                data-el="review-role-maker"
              >
                {t("review.maker")}
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("checker")}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                  activeRole === "checker" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                data-el="review-role-checker"
              >
                {t("review.checker")}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("review.mutualControl")}
        </p>
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={3} />
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState onRetry={() => void refresh()} />
        </div>
      ) : pending.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ShieldCheck}
            title={t("review.emptyTitle")}
            description={t("review.emptyDesc")}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {pending.map((p) => (
            <ReviewCard
              key={p.id}
              record={p}
              eff={effectiveRisk(p)}
              activeRole={activeRole}
              onDone={refresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({
  record,
  eff,
  activeRole,
  onDone,
}: {
  record: PaymentRecord;
  eff: EffectiveRisk;
  activeRole: "maker" | "checker";
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const router = useRouter();
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<null | "generic" | "self_review">(null);
  // High-risk after clarified cases are cleared (score/level recomputed).
  const highRisk = eff.riskLevel === "high";
  // Very large payouts (≥ $1M) are forced into the high-risk approval lane by
  // the engine — surface the reason explicitly for the reviewer.
  const veryLargePayout = record.amountUsd >= 1_000_000;
  // Segregation of duties: approval is only allowed from the CHECKER identity.
  const canApprove = activeRole === "checker";
  // Verification feedback: factors that hit AND were cleared by a resolved case.
  const clarifiedHits = eff.cleared;
  const softened = eff.changed && clarifiedHits.length > 0;

  async function decide(approve: boolean) {
    if (busy) return;
    // Enforce role separation before hitting the network (backend enforces too).
    if (approve && !canApprove) {
      setErr("self_review");
      return;
    }
    if (!approve && !note.trim()) {
      setMode("reject");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await reviewPayment({
        id: record.id,
        approve,
        note: approve ? undefined : note.trim(),
        role: activeRole,
      });
      toast.success(
        approve
          ? t("review.toastApprovedNext")
          : t("review.toastReturned", { name: record.supplierName }),
        {
          action: {
            label: approve ? t("review.toastGoExecute") : t("review.toastViewInHistory"),
            onClick: () => router.push(`/history?focus=${record.id}`),
          },
        },
      );
      await onDone();
    } catch (e) {
      setErr(e instanceof Error && e.message === "self_review" ? "self_review" : "generic");
      setBusy(false);
    }
  }

  return (
    <article
      className={cn(
        "fg-glass rounded-2xl p-4",
        highRisk && !softened && "border border-[color:var(--danger)]/40",
        highRisk && softened && "border border-[color:var(--success)]/40",
      )}
      data-el="review-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold">{record.supplierName}</span>
            <span className="shrink-0"><RiskBadge level={eff.riskLevel} /></span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {t("review.submittedBy", { role: MAKER_LABEL, date: formatDate(record.review.submittedAt) })}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-mono text-base font-bold tabular-nums">
            {record.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {record.settleCurrency}
          </span>
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {record.currency !== record.settleCurrency
              ? t("review.settledCredited", { settle: record.settleCurrency, local: record.currency })
              : t("review.settledIn", { settle: record.settleCurrency })}
          </span>
        </div>
      </div>

      {veryLargePayout && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/15 p-2.5 text-[11px] font-semibold text-[color:var(--danger)]"
          data-el="review-verylarge"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{t("review.veryLarge")}</span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Cell label={t("review.channel")} value={channelLabel(t, record.route.channelClass)} />
        <Cell label={t("review.returnProb")} value={formatPercent(eff.returnProbability, 0)} />
        <Cell label={t("review.riskScore")} value={eff.changed ? t("review.riskScoreWas", { score: eff.riskScore, was: record.riskScore }) : String(eff.riskScore)} />
      </div>

      {highRisk && !softened && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 p-2.5 text-[11px] text-[color:var(--danger)]"
          data-el="review-highrisk"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {record.chokepointBank
              ? t("review.highRiskHeld", { bank: record.chokepointBank })
              : t("review.highRisk")}
          </span>
        </div>
      )}

      {softened && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 p-2.5 text-[11px] text-foreground"
          data-el="review-clarified"
        >
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" aria-hidden />
          <span>
            {clarifiedHits.length === 1
              ? t("review.softenedOne", {
                  title: factorTitle(t, clarifiedHits[0]),
                  from: record.riskScore,
                  to: eff.riskScore,
                  levelNote: record.riskLevel !== eff.riskLevel ? t("review.levelDowngraded", { from: record.riskLevel, to: eff.riskLevel }) : "",
                })
              : t("review.softenedMany", {
                  count: clarifiedHits.length,
                  from: record.riskScore,
                  to: eff.riskScore,
                  levelNote: record.riskLevel !== eff.riskLevel ? t("review.levelDowngraded", { from: record.riskLevel, to: eff.riskLevel }) : "",
                })}
          </span>
        </div>
      )}

      {mode === "reject" && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("review.rejectPlaceholder")}
          rows={2}
          className="mt-3 w-full rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-sm"
          data-el="review-note"
        />
      )}

      {!canApprove && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-2.5 text-[11px] text-foreground"
          data-el="review-self"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--warning)]" aria-hidden />
          <span>
            {t("review.actingMakerNote")}
          </span>
        </div>
      )}

      {err && (
        <p className="mt-2 text-[11px] text-[color:var(--danger)]">
          {err === "self_review"
            ? t("review.errSelfReview")
            : t("review.errGeneric")}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
            "border-[color:var(--danger)]/50 text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10",
            busy && "opacity-60",
          )}
          data-el="review-reject"
        >
          <X className="h-3.5 w-3.5" /> {mode === "reject" ? t("review.confirmReturn") : t("review.return")}
        </button>
        <button
          type="button"
          disabled={busy || !canApprove}
          onClick={() => decide(true)}
          title={!canApprove ? t("review.switchToApprove") : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]",
            highRisk && !softened ? "bg-[color:var(--danger)]" : "bg-primary",
            (busy || !canApprove) && "opacity-60",
            !canApprove && "cursor-not-allowed",
          )}
          data-el="review-approve"
        >
          {busy ? (
            <>
              <Clock className="h-3.5 w-3.5 animate-spin" /> {t("review.working")}
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> {t("review.approveGenerate")}
            </>
          )}
        </button>
      </div>
    </article>
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
