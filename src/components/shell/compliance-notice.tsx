"use client";

import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

/**
 * App-wide compliance disclaimer. FlowGuard is a software decision-support tool
 * only — it does not hold a payment licence, does not touch or hold funds, and
 * performs no crypto/stablecoin exchange, custody or transfer. All settlement is
 * completed by licensed financial institutions. Rendered in the app footer so it
 * is present on every screen. Bilingual via i18n (default English).
 */
export function ComplianceNotice({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`mt-6 flex items-start gap-2 rounded-2xl border border-border/60 bg-[color:var(--fg-soft)] p-3 text-[10px] leading-relaxed text-muted-foreground ${className}`}
      data-el="compliance-notice"
    >
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <p>
        <b className="text-foreground">{t("compliance.label")}</b>{" "}
        {t("compliance.body")}
      </p>
    </div>
  );
}
