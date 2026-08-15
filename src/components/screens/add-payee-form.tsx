"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addSupplier } from "@/lib/api";
import { validateNewSupplier, type NewSupplierInput } from "@/lib/supplier-input";
import type { AccountStatus, ChannelClass, Currency } from "@/lib/engine/types";
import { CHANNEL_CLASS_LABEL } from "@/lib/engine/types";
import { cn } from "@/utils/utils";
import { AiInsightCard } from "@/components/ai/ai-insight-card";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "SGD", "INR", "VND", "AED"];
const ACCOUNT_STATUSES: { value: AccountStatus; labelKey: string }[] = [
  { value: "active", labelKey: "payeeDetail.accountActive" },
  { value: "dormant", labelKey: "payeeDetail.accountDormant" },
  { value: "unverified", labelKey: "payeeDetail.accountUnverified" },
];
const CHANNELS: ChannelClass[] = ["stablecoin-direct", "local-fiat"];

type FieldErrors = Partial<Record<keyof NewSupplierInput, string>>;

const EMPTY = {
  name: "",
  country: "",
  currency: "USD" as Currency,
  bankName: "",
  swift: "",
  iban: "",
  accountStatus: "active" as AccountStatus,
  preferredChannel: "local-fiat" as ChannelClass,
};

export function AddPayeeForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit() {
    const result = validateNewSupplier(form);
    if (!result.ok || !result.value) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    try {
      await addSupplier(result.value);
      toast.success(t("addPayee.toastAdded"));
      onAdded();
      onClose();
    } catch {
      toast.error(t("addPayee.toastError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" data-el="add-payee">
      <button type="button" aria-label={t("addPayee.close")} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fg-fade relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-[color:var(--card)] sm:max-h-[88dvh] sm:rounded-3xl">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-bold tracking-tight">{t("addPayee.title")}</h2>
          <button type="button" aria-label={t("addPayee.close")} onClick={onClose} className="rounded-full border border-border p-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="space-y-3">
            <Field label={t("addPayee.beneficiaryName")} error={errors.name}>
              <Text value={form.name} onChange={(v) => set("name", v)} placeholder="Lumen Viet Trading Co., Ltd" invalid={!!errors.name} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("addPayee.countryRegion")} error={errors.country}>
                <Text value={form.country} onChange={(v) => set("country", v)} placeholder="Vietnam" invalid={!!errors.country} />
              </Field>
              <Field label={t("addPayee.currency")} error={errors.currency}>
                <Select value={form.currency} onChange={(v) => set("currency", v as Currency)} invalid={!!errors.currency}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label={t("addPayee.beneficiaryBank")} error={errors.bankName}>
              <Text value={form.bankName} onChange={(v) => set("bankName", v)} placeholder="Vietcombank" invalid={!!errors.bankName} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("addPayee.swift")} error={errors.swift}>
                <Text value={form.swift} onChange={(v) => set("swift", v.toUpperCase())} placeholder="BFTVVNVX" invalid={!!errors.swift} mono />
              </Field>
              <Field label={t("addPayee.iban")} error={errors.iban}>
                <Text value={form.iban} onChange={(v) => set("iban", v.toUpperCase())} placeholder="VN82BFTV..." invalid={!!errors.iban} mono />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("addPayee.accountStatus")} error={errors.accountStatus}>
                <Select value={form.accountStatus} onChange={(v) => set("accountStatus", v as AccountStatus)} invalid={!!errors.accountStatus}>
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("addPayee.preferredChannel")} error={errors.preferredChannel}>
                <Select value={form.preferredChannel} onChange={(v) => set("preferredChannel", v as ChannelClass)} invalid={!!errors.preferredChannel}>
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>{channelLabel(t, c)}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Pain point ③: AI settlement-requirements checklist for this corridor. */}
            {form.country.trim().length > 1 && form.bankName.trim().length > 1 && (
              <AiInsightCard
                kind="corridor"
                title={t("addPayee.aiTitle")}
                cta={t("addPayee.aiCta")}
                hint={t("addPayee.aiHint")}
                loadingLabel={t("addPayee.aiLoading")}
                actionsLabel={t("addPayee.aiActions")}
                buildSnapshot={() => ({
                  country: form.country,
                  currency: form.currency,
                  bankName: form.bankName,
                  preferredChannel: form.preferredChannel,
                })}
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-border bg-[color:var(--card)] px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground">
            {t("addPayee.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--primary)] py-2.5 text-sm font-bold text-[color:var(--primary-foreground)] transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("addPayee.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-[color:var(--danger)]">{error}</span>}
    </label>
  );
}

function Text({
  value,
  onChange,
  placeholder,
  invalid,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[color:var(--primary)]",
        mono && "font-mono",
        invalid ? "border-[color:var(--danger)]" : "border-border",
      )}
    />
  );
}

function Select({
  value,
  onChange,
  invalid,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-xl border bg-[color:var(--card)] px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--primary)]",
        invalid ? "border-[color:var(--danger)]" : "border-border",
      )}
    >
      {children}
    </select>
  );
}
