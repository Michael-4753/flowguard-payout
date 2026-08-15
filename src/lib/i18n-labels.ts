// i18n label helpers for domain enums. The engine stores enum KEYS; display
// labels must be translated so Chinese mode shows Chinese. Pass a `t` from
// useTranslation (component) — keeps callers simple and SSR-safe.
import type { TFunction } from "i18next";
import type { ChannelClass, RiskLevel, PaymentStatus } from "@/lib/engine/types";

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
