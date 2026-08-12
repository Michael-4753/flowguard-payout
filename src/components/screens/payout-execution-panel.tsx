"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Printer, Send, Landmark, Wallet, Clock } from "lucide-react";
import { dispatchPayment } from "@/lib/api";
import { buildPayoutInstruction, type PayoutInstruction } from "@/lib/payout-instruction";
import { formatUsd } from "@/lib/format";
import type { PaymentRecord, Supplier } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

/**
 * Post-approval execution panel. Turns an approved (`initiated`) payment into the
 * concrete material a finance operator uses: an MT103 remittance advice for Local
 * Fiat, or a wallet-address QR card for Stablecoin Direct. Supports copy,
 * print-to-PDF, and "Mark as sent" (advances the payment to `settling`).
 */
export function PayoutExecutionPanel({
  payment,
  supplier,
  onSent,
}: {
  payment: PaymentRecord;
  supplier: Supplier;
  onSent: () => Promise<void>;
}) {
  const instruction = useMemo(
    () => buildPayoutInstruction(payment, supplier),
    [payment, supplier],
  );
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(instruction.copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  }

  async function markSent() {
    if (busy) return;
    setBusy(true);
    setErr(false);
    try {
      await dispatchPayment({ id: payment.id });
      await onSent();
    } catch {
      setErr(true);
      setBusy(false);
    }
  }

  const isStable = instruction.channel === "stablecoin-direct";

  return (
    <div className="fg-glass rounded-2xl p-4" data-el="payout-execution">
      <div className="flex items-center gap-2">
        {isStable ? (
          <Wallet className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <Landmark className="h-4 w-4 text-primary" aria-hidden />
        )}
        <h3 className="text-sm font-bold">{instruction.title}</h3>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Approved · {formatUsd(payment.amountUsd)} settled in USD. Execute at your{" "}
        {isStable ? "company wallet" : "bank / PSP"}, then mark it as sent.
      </p>

      {isStable && instruction.channel === "stablecoin-direct" && (
        <WalletQr address={instruction.walletAddress} amountLabel={instruction.amountLabel} />
      )}

      <dl className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60">
        {instruction.fields.map((f) => (
          <div key={f.label} className="flex items-start justify-between gap-3 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
            <dd className={cn("text-right text-[12px] text-foreground", f.mono && "font-mono")}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {err && (
        <p className="mt-2 text-[11px] text-[color:var(--danger)]">
          Could not mark as sent. Please try again.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyAll}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-[color:var(--fg-soft)]"
          data-el="payout-copy"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => printInstruction(instruction, payment)}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-[color:var(--fg-soft)]"
          data-el="payout-print"
        >
          <Printer className="h-3.5 w-3.5" /> PDF
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={markSent}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.98]",
            busy && "opacity-60",
          )}
          data-el="payout-mark-sent"
        >
          {busy ? (
            <>
              <Clock className="h-3.5 w-3.5 animate-spin" /> Working…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" /> Mark as sent
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function WalletQr({ address, amountLabel }: { address: string; amountLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!address || !canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, address, { width: 160, margin: 1 });
  }, [address]);

  if (!address) {
    return (
      <div className="mt-3 rounded-xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 p-3 text-[11px] text-[color:var(--danger)]">
        No stablecoin wallet on file for this payee. Backfill the wallet address before sending.
      </div>
    );
  }
  return (
    <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-[color:var(--fg-soft)] p-3">
      <canvas ref={canvasRef} className="rounded-lg bg-white p-1.5" aria-label="Wallet address QR" />
      <span className="font-mono text-[12px] font-bold">{amountLabel}</span>
    </div>
  );
}

/** Render the instruction into a clean printable window and trigger the browser's PDF dialog. */
function printInstruction(instruction: PayoutInstruction, payment: PaymentRecord) {
  const rows = instruction.fields
    .map(
      (f) =>
        `<tr><td class="k">${escapeHtml(f.label)}</td><td class="v">${escapeHtml(f.value)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    instruction.title,
  )}</title><style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;color:#1c110b;padding:32px;max-width:640px;margin:0 auto}
    h1{font-size:18px;margin:0 0 4px}
    .sub{color:#6b6157;font-size:12px;margin:0 0 20px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    td{padding:8px 10px;border-bottom:1px solid #e7e0d8;vertical-align:top}
    .k{color:#6b6157;text-transform:uppercase;font-size:10px;letter-spacing:.04em;width:45%}
    .v{text-align:right;font-family:ui-monospace,monospace}
    .foot{margin-top:24px;font-size:10px;color:#9a8f83}
  </style></head><body>
    <h1>${escapeHtml(instruction.title)}</h1>
    <p class="sub">FlowGuard payout advice · ${escapeHtml(payment.id)} · ${new Date().toLocaleString()}</p>
    <table>${rows}</table>
    <p class="foot">Generated by FlowGuard. Verify all details against the beneficiary record before submitting to the bank.</p>
  </body></html>`;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
