"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert, Check, X, Clock } from "lucide-react";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { RiskBadge } from "@/components/shared/badges";
import { reviewPayment } from "@/lib/api";
import { formatUsd, formatDate, formatPercent } from "@/lib/format";
import { CHANNEL_CLASS_LABEL, type PaymentRecord } from "@/lib/engine/types";
import { MAKER_LABEL, CHECKER_LABEL } from "@/lib/review";
import { cn } from "@/utils/utils";

/**
 * Maker-checker review queue (segregation of duties). The maker (cashier) submits
 * a payment; a separate checker (finance supervisor) must approve before it is
 * sent to the bank. In this single-account demo both roles are the signed-in
 * user, distinguished by role labels and a persisted approval trail.
 */
export function ReviewScreen() {
  const { payments, loading, refresh } = useFlowGuardData();
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
        className="fg-glass mt-4 flex items-center justify-between rounded-2xl p-4"
        data-el="review-summary"
      >
        <div>
          <div className="text-[11px] text-muted-foreground">Awaiting your approval</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{pending.length}</div>
        </div>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          Acting as {CHECKER_LABEL}
        </span>
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={3} />
        </div>
      ) : pending.length === 0 ? (
        <p className="fg-glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Nothing awaiting review. Payments a cashier submits will appear here.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {pending.map((p) => (
            <ReviewCard key={p.id} record={p} onDone={refresh} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ record, onDone }: { record: PaymentRecord; onDone: () => Promise<void> }) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const highRisk = record.riskLevel === "high";

  async function decide(approve: boolean) {
    if (busy) return;
    if (!approve && !note.trim()) {
      setMode("reject");
      return;
    }
    setBusy(true);
    setErr(false);
    try {
      await reviewPayment({ id: record.id, approve, note: approve ? undefined : note.trim() });
      await onDone();
    } catch {
      setErr(true);
      setBusy(false);
    }
  }

  return (
    <article
      className={cn(
        "fg-glass rounded-2xl p-4",
        highRisk && "border border-[color:var(--danger)]/40",
      )}
      data-el="review-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{record.supplierName}</span>
            <RiskBadge level={record.riskLevel} />
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {MAKER_LABEL} · submitted {formatDate(record.review.submittedAt)}
          </p>
        </div>
        <span className="shrink-0 font-mono text-base font-bold tabular-nums">
          {formatUsd(record.amountUsd)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Cell label="Channel" value={CHANNEL_CLASS_LABEL[record.route.channelClass]} />
        <Cell label="Return prob." value={formatPercent(record.returnProbability, 0)} />
        <Cell label="Risk score" value={String(record.riskScore)} />
      </div>

      {highRisk && (
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

      {err && (
        <p className="mt-2 text-[11px] text-[color:var(--danger)]">
          Could not record the decision. Please try again.
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
          disabled={busy}
          onClick={() => decide(true)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]",
            highRisk ? "bg-[color:var(--danger)]" : "bg-primary",
            busy && "opacity-60",
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
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}
