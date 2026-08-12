"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert, Check, X, Clock } from "lucide-react";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/errors/error-state";
import { RiskBadge } from "@/components/shared/badges";
import { reviewPayment } from "@/lib/api";
import { formatUsd, formatDate, formatPercent } from "@/lib/format";
import { CHANNEL_CLASS_LABEL, type PaymentRecord } from "@/lib/engine/types";
import type { EffectiveRisk } from "@/lib/verification";
import { MAKER_LABEL, CHECKER_LABEL } from "@/lib/review";
import { cn } from "@/utils/utils";

/**
 * Maker-checker review queue (segregation of duties). The maker (cashier) submits
 * a payment; a separate checker (finance supervisor) must approve before it is
 * sent to the bank. In this single-account demo both roles are the signed-in
 * user, distinguished by role labels and a persisted approval trail.
 */
export function ReviewScreen() {
  const { payments, loading, error, refresh, effectiveRisk, currentUserId, activeRole, setActiveRole } =
    useFlowGuardData();
  const pending = useMemo(
    () => payments.filter((p) => p.status === "pending_review"),
    [payments],
  );

  return (
    <section className="pt-1" data-el="review">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight">Reviewer queue</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Maker-checker control: every payment a cashier submits waits here for a
        second-signature approval before it is sent to the bank.
      </p>

      <div
        className="fg-glass mt-4 rounded-2xl p-4"
        data-el="review-summary"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">Awaiting approval</div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{pending.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">操作身份</div>
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
                经办
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
                审批
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          经办与审批相互制约:以「经办」身份提交的付款,必须切换到「审批」身份才能批准(不能自己批自己)。
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
            title="Nothing awaiting review"
            description="Payments a cashier submits for approval will appear here."
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
  currentUserId,
  onDone,
}: {
  record: PaymentRecord;
  eff: EffectiveRisk;
  currentUserId: string;
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<null | "generic" | "self_review">(null);
  // High-risk after clarified cases are cleared (score/level recomputed).
  const highRisk = eff.riskLevel === "high";
  // Very large payouts (≥ $1M) are forced into the high-risk approval lane by
  // the engine — surface the reason explicitly for the reviewer.
  const veryLargePayout = record.amountUsd >= 1_000_000;
  // Segregation of duties: the submitter (maker) cannot approve their own payment.
  const isOwnSubmission = Boolean(currentUserId) && record.review.makerId === currentUserId;
  // Verification feedback: factors that hit AND were cleared by a resolved case.
  const clarifiedHits = eff.cleared;
  const softened = eff.changed && clarifiedHits.length > 0;

  async function decide(approve: boolean) {
    if (busy) return;
    // Block self-approval before hitting the network (backend enforces it too).
    if (approve && isOwnSubmission) {
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
      await reviewPayment({ id: record.id, approve, note: approve ? undefined : note.trim() });
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
            {MAKER_LABEL} · submitted {formatDate(record.review.submittedAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-mono text-base font-bold tabular-nums">
            {formatUsd(record.amountUsd)}
          </span>
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            settled in USD
          </span>
        </div>
      </div>

      {veryLargePayout && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/15 p-2.5 text-[11px] font-semibold text-[color:var(--danger)]"
          data-el="review-verylarge"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Very large payout — high-risk lane, second signature required.</span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Cell label="Channel" value={CHANNEL_CLASS_LABEL[record.route.channelClass]} />
        <Cell label="Return prob." value={formatPercent(eff.returnProbability, 0)} />
        <Cell label="Risk score" value={eff.changed ? `${eff.riskScore} (was ${record.riskScore})` : String(eff.riskScore)} />
      </div>

      {highRisk && !softened && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 p-2.5 text-[11px] text-[color:var(--danger)]"
          data-el="review-highrisk"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            High-risk payment{record.chokepointBank ? ` — likely held at ${record.chokepointBank}` : ""}.
            Approving sends it to the bank and records your sign-off in the audit trail.
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
              ? `${clarifiedHits[0].title}已通过核查 case 向供应商核实并清除。`
              : `${clarifiedHits.length} 项信息问题已通过核查向供应商核实并清除。`}{" "}
            风险分已从 {record.riskScore} 下调至 {eff.riskScore}
            {record.riskLevel !== eff.riskLevel ? `，等级由 ${record.riskLevel} 降为 ${eff.riskLevel}` : ""}。
            请复核其余因子后再审批。
          </span>
        </div>
      )}

      {mode === "reject" && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for returning to the cashier (required)"
          rows={2}
          className="mt-3 w-full rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-sm"
          data-el="review-note"
        />
      )}

      {isOwnSubmission && (
        <div
          className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-2.5 text-[11px] text-foreground"
          data-el="review-self"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--warning)]" aria-hidden />
          <span>
            You submitted this payment. Segregation of duties requires a different
            person to approve it — you can only return it to yourself.
          </span>
        </div>
      )}

      {err && (
        <p className="mt-2 text-[11px] text-[color:var(--danger)]">
          {err === "self_review"
            ? "Approval blocked: the person who submitted a payment cannot approve it. Another reviewer must sign off."
            : "Could not record the decision. Please try again."}
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
          <X className="h-3.5 w-3.5" /> {mode === "reject" ? "Confirm return" : "Return"}
        </button>
        <button
          type="button"
          disabled={busy || isOwnSubmission}
          onClick={() => decide(true)}
          title={isOwnSubmission ? "You submitted this payment — another reviewer must approve it" : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]",
            highRisk && !softened ? "bg-[color:var(--danger)]" : "bg-primary",
            (busy || isOwnSubmission) && "opacity-60",
            isOwnSubmission && "cursor-not-allowed",
          )}
          data-el="review-approve"
        >
          {busy ? (
            <>
              <Clock className="h-3.5 w-3.5 animate-spin" /> Working…
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> Approve &amp; send to bank
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
