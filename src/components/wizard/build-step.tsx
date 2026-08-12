"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { ChannelClass, Supplier } from "@/lib/engine/types";
import { CHANNEL_CLASS_LABEL, RISK_LEVEL_LABEL } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

const CHANNELS: (ChannelClass | "auto")[] = ["auto", "stablecoin-direct", "local-fiat"];

export function BuildStep({
  suppliers,
  initialSupplierId,
  initialAmount,
  onSubmit,
}: {
  suppliers: Supplier[];
  initialSupplierId?: string;
  initialAmount?: number;
  onSubmit: (v: { supplierId: string; amountUsd: number; preferredChannel?: ChannelClass }) => void;
}) {
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [channel, setChannel] = useState<ChannelClass | "auto">("auto");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!supplierId) return setError("Select a payee to continue.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount in USD.");
    setError(null);
    onSubmit({ supplierId, amountUsd: amt, preferredChannel: channel === "auto" ? undefined : channel });
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
      <label className="mt-4 block text-xs text-muted-foreground" htmlFor="amount">
        Amount (USD)
      </label>
      <input
        id="amount"
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g. 18400"
        className="mt-2 w-full rounded-2xl border border-border bg-background/40 px-4 py-3 font-mono text-lg outline-none focus:border-primary"
        data-el="wizard-amount"
      />

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

      {error && <p className="mt-3 text-xs text-[color:var(--danger)]">{error}</p>}

      <button
        type="button"
        onClick={submit}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]"
        data-el="wizard-run-precheck"
      >
        Run pre-check <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
