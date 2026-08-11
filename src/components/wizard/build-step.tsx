"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check } from "lucide-react";
import type { StableCoin, Supplier } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

const COINS: (StableCoin | "auto")[] = ["auto", "USDC", "USDT", "PYUSD"];

export function BuildStep({
  suppliers,
  initialSupplierId,
  initialAmount,
  onSubmit,
}: {
  suppliers: Supplier[];
  initialSupplierId?: string;
  initialAmount?: number;
  onSubmit: (v: { supplierId: string; amountUsd: number; targetCoin?: StableCoin }) => void;
}) {
  const { t } = useTranslation();
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [coin, setCoin] = useState<StableCoin | "auto">("auto");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!supplierId) return setError(t("wizard.build.noSupplier"));
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError(t("wizard.build.invalidAmount"));
    setError(null);
    onSubmit({ supplierId, amountUsd: amt, targetCoin: coin === "auto" ? undefined : coin });
  }

  return (
    <div className="fg-glass rounded-[24px] p-5" data-el="wizard-build">
      <h2 className="text-lg font-bold">{t("wizard.build.title")}</h2>

      {/* Supplier */}
      <label className="mt-4 block text-xs text-muted-foreground">{t("wizard.build.supplier")}</label>
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
              <div className="font-mono text-[10px] text-muted-foreground">{s.region}</div>
            </div>
            {supplierId === s.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </button>
        ))}
      </div>

      {/* Amount */}
      <label className="mt-4 block text-xs text-muted-foreground" htmlFor="amount">
        {t("wizard.build.amount")}
      </label>
      <input
        id="amount"
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={t("wizard.build.amountPlaceholder")}
        className="mt-2 w-full rounded-2xl border border-border bg-background/40 px-4 py-3 font-mono text-lg outline-none focus:border-primary"
        data-el="wizard-amount"
      />

      {/* Coin */}
      <label className="mt-4 block text-xs text-muted-foreground">{t("wizard.build.coin")}</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {COINS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCoin(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-xs transition-colors",
              coin === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
            )}
          >
            {c === "auto" ? t("wizard.build.coinAuto") : c}
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
        {t("wizard.build.run")} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
