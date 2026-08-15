// i18n label helpers for domain enums. The engine stores enum KEYS; display
// labels must be translated so Chinese mode shows Chinese. Pass a `t` from
// useTranslation (component) — keeps callers simple and SSR-safe.
import type { TFunction } from "i18next";
import type { ChannelClass, RiskLevel, PaymentStatus, RiskFactor } from "@/lib/engine/types";

export function channelLabel(t: TFunction, key: ChannelClass): string {
  return t(`enum.channel.${key}`);
}

export function riskLabel(t: TFunction, key: RiskLevel): string {
  return t(`enum.risk.${key}`);
}

export function statusLabel(t: TFunction, key: PaymentStatus): string {
  return t(`enum.status.${key}`);
}

export function verificationStatusLabel(t: TFunction, key: "open" | "verified" | "clarified"): string {
  return t(`enum.verification.${key}`);
}

/**
 * Localized display for a supplier's country/region. Seed suppliers have a
 * translation keyed by their stable id; user-added suppliers (free text) fall
 * back to the raw stored value so their input is preserved verbatim.
 */
export function countryLabel(t: TFunction, supplier: { id: string; country: string }): string {
  return t(`enum.country.${supplier.id}`, { defaultValue: supplier.country });
}

/** Localized country/region for grouped views keyed by ISO-ish country code. */
export function countryCodeLabel(t: TFunction, group: { countryCode?: string; country: string }): string {
  if (group.countryCode) {
    return t(`enum.countryCode.${group.countryCode}`, { defaultValue: group.country });
  }
  return group.country;
}

/**
 * Localized risk-factor text. The engine stores stable factor ids and English
 * fallbacks; the UI renders Chinese (or any locale) by translating on `id`,
 * `hit` state and optional `meta` (currency / amount tier). English engine
 * strings are used as `defaultValue` so nothing ever renders blank.
 */
export function factorTitle(t: TFunction, f: Pick<RiskFactor, "id" | "title">): string {
  return t(`factor.${f.id}.title`, { defaultValue: f.title });
}

export function factorDescription(
  t: TFunction,
  f: Pick<RiskFactor, "id" | "hit" | "description" | "meta">,
): string {
  // amount-tier has no simple hit/ok split — its copy depends on the tier band.
  if (f.id === "amount-tier") {
    const tier = f.meta?.tier ?? (f.hit ? "mid" : "small");
    return t(`factor.amount-tier.${tier}`, { defaultValue: f.description });
  }
  const state = f.hit ? "hit" : "ok";
  return t(`factor.${f.id}.${state}`, {
    defaultValue: f.description,
    currency: f.meta?.currency ?? "",
  });
}

export function factorRemediation(t: TFunction, f: Pick<RiskFactor, "id" | "remediation">): string {
  return t(`factor.${f.id}.remediation`, { defaultValue: f.remediation });
}

/**
 * Localized failure-case field. Cases have stable ids (fc-01…); translate on
 * `id` + field, falling back to the English value stored on the record.
 */
export function failCaseText(
  t: TFunction,
  c: { id: string; corridor: string; reason: string; failedAt: string; remediation: string },
  field: "corridor" | "reason" | "failedAt" | "remediation",
): string {
  return t(`failCase.${c.id}.${field}`, { defaultValue: c[field] });
}

/**
 * Localized money-flow hop label / handling-bank name. Hops have stable ids
 * (`local-fiat-hop-1` …); translate on id, falling back to the English value
 * the engine produced. Proper nouns (e.g. correspondent bank names) may stay
 * identical across locales by design.
 */
export function hopLabel(t: TFunction, hop: { id: string; label: string }): string {
  return t(`hop.${hop.id}.label`, { defaultValue: hop.label });
}

export function hopBank(t: TFunction, hop: { id: string; bankName: string }): string {
  return t(`hop.${hop.id}.bank`, { defaultValue: hop.bankName });
}
