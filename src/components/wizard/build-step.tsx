"use client";

import { useState } from "react";
import { ArrowRight, Check, Wallet } from "lucide-react";
import type { ChannelClass, Currency, Supplier } from "@/lib/engine/types";
import { CHANNEL_CLASS_LABEL, RISK_LEVEL_LABEL } from "@/lib/engine/types";
import { WalletBackfillModal } from "./wallet-backfill-modal";
import { cn } from "@/utils/utils";

const CHANNELS: (ChannelClass | "auto")[] = ["auto", "stablecoin-direct", "local-fiat"];
const SETTLE_CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "SGD", "INR", "VND", "AED"];

export function BuildStep({
  suppliers,
  initialSupplierId,
  initialAmount,
  onSubmit,
}: {
  suppliers: Supplier[];
  initialSupplierId?: string;
  initialAmount?: number;
  onSubmit: (v: { supplierId: string; amountUsd: number; preferredChannel?: ChannelClass; settleCurrency: Currency }) => void;
}) {
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [settleCurrency, setSettleCurrency] = useState<Currency>("USD");
  const [channel, setChannel] = useState<ChannelClass | "auto">("auto");
  const [error, setError] = useState<string | null>(null);
  const [walletGate, setWalletGate] = useState(false);

  const MAX_AMOUNT = 100_000_000; // $100M ceiling — guards against overflow / typos.

  // Inline amount validation. Returns an error message, or null when valid.
  // Empty is treated as "not yet filled" (no error shown until submit).
  function amountError(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return "Enter a valid number.";
    if (n <= 0) return "Amount must be greater than 0.";
    if (n > MAX_AMOUNT) return "Amount is too large.";
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "Use at most 2 decimal places.";
    return null;
  }

  const liveAmountError = amountError(amount);
  const amountInvalid = amount.trim() !== "" && liveAmountError !== null;
  const canSubmit = Boolean(supplierId) && amount.trim() !== "" && liveAmountError === null;
  const selected = suppliers.find((s) => s.id === supplierId);

  function proceed() {
    onSubmit({
      supplierId,
      amountUsd: Number(amount),
      preferredChannel: channel === "auto" ? undefined : channel,
      settleCurrency,
    });
  }

  function submit() {
    if (!supplierId) return setError("Select a payee to continue.");
    if (amount.trim() === "") return setError("Enter an amount in USD.");
    const amtErr = amountError(amount);
    if (amtErr) return setError(amtErr);
    setError(null);
    // Hard-stop: an explicit Stablecoin Direct choice requires a payee wallet.
    if (channel === "stablecoin-direct" && selected && !selected.stablecoinWallet) {
      setWalletGate(true);
      return;
    }
    proceed();
  }

  return (
    <div className="fg-glass rounded-[24px] p-5" data-el="wizard-build">
      <h2 className="text-lg font-bold">New payment</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pick a payee and amount to run the return-risk pre-check.
      </p>

      {/* Payee */}
      <label className="mt-4 block text-xs text-muted-foreground">Payee</label>
      <div className="mt-2 space-y-2">
        {suppliers.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSupplierId(s.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-colors",
              supplierId === s.id ? "border-primary bg-primary/10" : "border-border",
            )}
            data-el="wizard-supplier-option"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{s.name}</div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">
                {s.country} · {s.swift}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{RISK_LEVEL_LABEL[s.riskTag]}</span>
              {supplierId === s.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </button>
        ))}
      </div>

      {/* Amount */}
      <label className="mt-4 flex items-center justify-between text-xs text-muted-foreground" htmlFor="amount">
        <span>Amount</span>
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. 18400"
          aria-invalid={amountInvalid}
          aria-describedby={amountInvalid ? "amount-error" : undefined}
          className={cn(
            "w-full rounded-2xl border bg-background/40 px-4 py-3 font-mono text-lg outline-none focus:border-primary",
            amountInvalid ? "border-[color:var(--danger)]" : "border-border",
          )}
          data-el="wizard-amount"
        />
        <select
          value={settleCurrency}
          onChange={(e) => setSettleCurrency(e.target.value as Currency)}
          aria-label="Settlement currency"
          className="shrink-0 rounded-2xl border border-border bg-[color:var(--card)] px-3 font-mono text-sm outline-none focus:border-primary"
          data-el="wizard-settle-currency"
        >
          {SETTLE_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {amountInvalid && (
        <p id="amount-error" className="mt-1.5 text-xs text-[color:var(--danger)]" data-el="wizard-amount-error">
          {liveAmountError}
        </p>
      )}
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground" data-el="settlement-note">
        You send in <b className="text-foreground">{settleCurrency}</b> (settlement currency).
        {selected && selected.currency !== settleCurrency && (
          <> The payee is credited in their local currency (<b className="text-foreground">{selected.currency}</b>) by the payout rail.</>
        )}
      </p>

      {/* Channel preference */}
      <label className="mt-4 block text-xs text-muted-foreground">Channel preference</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              channel === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {c === "auto" ? "Auto (recommended)" : CHANNEL_CLASS_LABEL[c]}
          </button>
        ))}
      </div>

      {channel === "stablecoin-direct" && (
        <p
          className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-[color:var(--warning)]"
          data-el="stablecoin-wallet-hint"
        >
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Stablecoin Direct requires the payee to hold a wallet that can receive an accepted
            stablecoin (e.g. USDC). Confirm this with them first — otherwise the payout cannot be
            claimed and is returned.
          </span>
        </p>
      )}

      {error && <p className="mt-3 text-xs text-[color:var(--danger)]">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        data-el="wizard-run-precheck"
      >
        Run pre-check <ArrowRight className="h-4 w-4" />
      </button>

      {walletGate && selected && (
        <WalletBackfillModal
          supplierId={selected.id}
          supplierName={selected.name}
          onClose={() => setWalletGate(false)}
          onSaved={() => {
            setWalletGate(false);
            proceed();
          }}
        />
      )}
    </div>
  );
}
