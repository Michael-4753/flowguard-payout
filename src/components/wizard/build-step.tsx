"use client";

import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { ArrowRight, Check, Globe2, Lock } from "lucide-react";
import type { ChannelClass, Currency, Supplier } from "@/lib/engine/types";
import { channelLabel, riskLabel, countryLabel } from "@/lib/i18n-labels";
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
  onSubmit: (v: { supplierId: string; amountUsd: number; preferredChannel?: ChannelClass; settleCurrency: Currency }) => void;
}) {
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [channel, setChannel] = useState<ChannelClass | "auto">("auto");
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const MAX_AMOUNT = 100_000_000; // $100M ceiling — guards against overflow / typos.

  // Inline amount validation. Returns an error message, or null when valid.
  // Empty is treated as "not yet filled" (no error shown until submit).
  function amountError(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return t("build.errValidNumber");
    if (n <= 0) return t("build.errGreaterThanZero");
    if (n > MAX_AMOUNT) return t("build.errTooLarge");
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return t("build.errDecimals");
    return null;
  }

  const liveAmountError = amountError(amount);
  const amountInvalid = amount.trim() !== "" && liveAmountError !== null;
  const canSubmit = Boolean(supplierId) && amount.trim() !== "" && liveAmountError === null;
  const selected = suppliers.find((s) => s.id === supplierId);
  // Settlement currency is fixed by the contract: it is the selected payee's
  // bound currency and is NOT chosen at payout time. No payee selected yet → no
  // currency to show.
  const settleCurrency = selected?.currency;

  function proceed() {
    if (!settleCurrency) return;
    onSubmit({
      supplierId,
      amountUsd: Number(amount),
      preferredChannel: channel === "auto" ? undefined : channel,
      settleCurrency,
    });
  }

  function submit() {
    if (!supplierId) return setError(t("build.errSelectPayee"));
    if (amount.trim() === "") return setError(t("build.errEnterAmount"));
    const amtErr = amountError(amount);
    if (amtErr) return setError(amtErr);
    setError(null);
    proceed();
  }

  return (
    <div className="fg-glass rounded-[24px] p-5" data-el="wizard-build">
      <h2 className="text-lg font-bold">{t("build.title")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("build.subtitle")}
      </p>

      {/* Payee */}
      <label className="mt-4 block text-xs text-muted-foreground">{t("build.payee")}</label>
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
                {countryLabel(t, s)} · {s.swift}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{riskLabel(t, s.riskTag)}</span>
              {supplierId === s.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </button>
        ))}
      </div>

      {/* Amount */}
      <label className="mt-4 flex items-center justify-between text-xs text-muted-foreground" htmlFor="amount">
        <span>{t("build.amount")}</span>
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
          placeholder={t("build.amountPlaceholder")}
          aria-invalid={amountInvalid}
          aria-describedby={amountInvalid ? "amount-error" : undefined}
          className={cn(
            "w-full rounded-2xl border bg-background/40 px-4 py-3 font-mono text-lg outline-none focus:border-primary",
            amountInvalid ? "border-[color:var(--danger)]" : "border-border",
          )}
          data-el="wizard-amount"
        />
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-[color:var(--fg-soft)] px-3 font-mono text-sm text-foreground"
          aria-label={t("build.settlementCurrency")}
          title={t("build.currencyLockedTitle")}
          data-el="wizard-settle-currency"
        >
          <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
          {settleCurrency ?? "—"}
        </div>
      </div>
      {amountInvalid && (
        <p id="amount-error" className="mt-1.5 text-xs text-[color:var(--danger)]" data-el="wizard-amount-error">
          {liveAmountError}
        </p>
      )}
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground" data-el="settlement-note">
        {settleCurrency ? (
          <Trans i18nKey="build.currencyFromContract" values={{ currency: settleCurrency }} components={[<b key="0" className="text-foreground" />]} />
        ) : (
          t("build.currencyPickPayee")
        )}
      </p>

      {/* Channel preference */}
      <label className="mt-4 block text-xs text-muted-foreground">{t("build.channelPreference")}</label>
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
            {c === "auto" ? t("build.auto") : channelLabel(t, c)}
          </button>
        ))}
      </div>

      {channel === "stablecoin-direct" && (
        <p
          className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-[color:var(--warning)]"
          data-el="stablecoin-wallet-hint"
        >
          <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {t("build.digitalAssetHint")}
          </span>
        </p>
      )}

      {error && <p className="mt-3 text-xs text-[color:var(--danger)]">{error}</p>}

      <button
        type="button"
        onClick={submit}
        aria-disabled={!canSubmit}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]",
          !canSubmit && "opacity-60",
        )}
        data-el="wizard-run-precheck"
      >
        {t("build.runPrecheck")} <ArrowRight className="h-4 w-4" />
      </button>
      {!canSubmit && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground" data-el="wizard-run-hint">
          {!supplierId ? t("build.hintSelectPayee") : t("build.hintEnterAmount")}
        </p>
      )}
    </div>
  );
}
