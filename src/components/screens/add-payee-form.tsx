"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addSupplier } from "@/lib/api";
import { validateNewSupplier, type NewSupplierInput } from "@/lib/supplier-input";
import type { AccountStatus, ChannelClass, Currency } from "@/lib/engine/types";
import { CHANNEL_CLASS_LABEL } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "SGD", "INR", "VND", "AED"];
const ACCOUNT_STATUSES: { value: AccountStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "dormant", label: "Dormant" },
  { value: "unverified", label: "Unverified" },
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
  stablecoinWallet: "",
};

export function AddPayeeForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

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
      toast.success("Payee added to the ledger");
      onAdded();
      onClose();
    } catch {
      toast.error("Couldn't add the payee. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" data-el="add-payee">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fg-fade relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-[color:var(--card)] p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Add payee</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full border border-border p-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Beneficiary name" error={errors.name}>
            <Text value={form.name} onChange={(v) => set("name", v)} placeholder="Lumen Viet Trading Co., Ltd" invalid={!!errors.name} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Country / region" error={errors.country}>
              <Text value={form.country} onChange={(v) => set("country", v)} placeholder="Vietnam" invalid={!!errors.country} />
            </Field>
            <Field label="Currency" error={errors.currency}>
              <Select value={form.currency} onChange={(v) => set("currency", v as Currency)} invalid={!!errors.currency}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Beneficiary bank" error={errors.bankName}>
            <Text value={form.bankName} onChange={(v) => set("bankName", v)} placeholder="Vietcombank" invalid={!!errors.bankName} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="SWIFT / BIC" error={errors.swift}>
              <Text value={form.swift} onChange={(v) => set("swift", v.toUpperCase())} placeholder="BFTVVNVX" invalid={!!errors.swift} mono />
            </Field>
            <Field label="IBAN" error={errors.iban}>
              <Text value={form.iban} onChange={(v) => set("iban", v.toUpperCase())} placeholder="VN82BFTV..." invalid={!!errors.iban} mono />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Account status" error={errors.accountStatus}>
              <Select value={form.accountStatus} onChange={(v) => set("accountStatus", v as AccountStatus)} invalid={!!errors.accountStatus}>
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Preferred channel" error={errors.preferredChannel}>
              <Select value={form.preferredChannel} onChange={(v) => set("preferredChannel", v as ChannelClass)} invalid={!!errors.preferredChannel}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{CHANNEL_CLASS_LABEL[c]}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label={form.preferredChannel === "stablecoin-direct" ? "Stablecoin wallet address (required for this channel)" : "Stablecoin wallet address (optional)"}
            error={errors.stablecoinWallet}
          >
            <Text
              value={form.stablecoinWallet}
              onChange={(v) => set("stablecoinWallet", v)}
              placeholder="0x… / T… (USDC-compatible)"
              invalid={!!errors.stablecoinWallet}
              mono
            />
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--primary)] py-2.5 text-sm font-bold text-[color:var(--primary-foreground)] transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add payee
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
