"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import type { PublicReceiptView } from "@/app/api/public/receipt/[token]/route";

/**
 * Public payee receipt page. No login — the URL token is the access control.
 * The beneficiary sees the incoming amount + payer, and can confirm receipt,
 * which records real proof of arrival (settling → arrived).
 */
export function PublicReceiptScreen({ token }: { token: string }) {
  const [view, setView] = useState<PublicReceiptView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/public/receipt/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const json = (await res.json()) as { receipt: PublicReceiptView };
      setView(json.receipt);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (alive) await load();
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setErr(false);
    try {
      const res = await fetch(`/api/public/receipt/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { receipt: PublicReceiptView };
      setView(json.receipt);
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  const amount = view
    ? view.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        <span className="text-sm font-bold tracking-tight">FlowGuard · Payment receipt</span>
      </div>

      {loading ? (
        <div className="fg-glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : notFound || !view ? (
        <div className="fg-glass rounded-2xl p-6 text-center" data-el="receipt-notfound">
          <AlertCircle className="mx-auto h-6 w-6 text-[color:var(--danger)]" aria-hidden />
          <p className="mt-2 text-sm font-semibold">Receipt link not found</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            This link may be invalid or expired. Please contact the sender.
          </p>
        </div>
      ) : (
        <div className="fg-glass rounded-2xl p-5" data-el="receipt-card">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Incoming payment from
          </p>
          <p className="mt-0.5 text-base font-bold">{view.supplierName}</p>

          <div className="mt-4 rounded-xl border border-border/60 bg-[color:var(--fg-soft)] p-4 text-center">
            <div className="font-mono text-3xl font-bold tabular-nums">${amount}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {view.currency} · {view.channel}
            </div>
          </div>

          {view.confirmed ? (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 p-3 text-[12px]"
              data-el="receipt-confirmed"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" aria-hidden />
              <span>
                Receipt confirmed
                {view.confirmedAt
                  ? ` on ${new Date(view.confirmedAt).toLocaleString()}`
                  : ""}
                . Thank you — the sender has been notified.
              </span>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-[12px] text-muted-foreground">
                Once the funds land in your account, confirm receipt below. This
                records proof of arrival for the sender.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Optional note (e.g. amount received, remarks)"
                className="w-full rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-sm"
                data-el="receipt-note"
              />
              {err && (
                <p className="text-[11px] text-[color:var(--danger)]">
                  Could not confirm. Please try again.
                </p>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={confirm}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98] disabled:opacity-60"
                data-el="receipt-confirm"
              >
                {busy ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" /> Confirming…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Confirm funds received
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Secured by an unguessable link · no login required
      </p>
    </main>
  );
}
