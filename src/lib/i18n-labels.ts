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
