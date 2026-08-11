"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, ShieldAlert, ChevronDown } from "lucide-react";
import type { RiskAssessment } from "@/lib/engine/types";
import { RiskBadge, SeverityDot } from "@/components/shared/badges";
import { RiskGauge } from "@/components/shared/risk-gauge";
import { cn } from "@/utils/utils";

const FACTOR_KEY: Record<string, string> = {
  "network-match": "network",
  sanction: "sanction",
  "travel-rule": "travelRule",
  "history-return": "history",
  "amount-anomaly": "amount",
};

export function PrecheckStep({
  risk,
  onContinue,
}: {
  risk: RiskAssessment;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // 挂载后播放扫描动画，结束揭晓评分。父级通过 key 重挂载以重置。
    const id = setTimeout(() => setScanning(false), 1100);
    return () => clearTimeout(id);
  }, []);

  const hits = risk.factors.filter((f) => f.hit);
  const shown = risk.factors.slice().sort((a, b) => Number(b.hit) - Number(a.hit) || b.points - a.points);
  const canContinue = !risk.hasBlocker || acknowledged;

  return (
    <div className="space-y-4" data-el="wizard-precheck">
      {/* Gauge */}
      <div className="fg-glass flex flex-col items-center rounded-[24px] p-5">
        <RiskGauge score={scanning ? 0 : risk.score} level={risk.level} />
        <div className="mt-3 flex items-center gap-2">
          <RiskBadge level={risk.level} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {scanning ? t("wizard.precheck.scanning") : t("wizard.precheck.hitCount", { count: hits.length })}
          </span>
        </div>
      </div>

      {/* Blocker banner */}
      {!scanning && risk.hasBlocker && (
        <div className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/12 p-4" data-el="wizard-blocker">
          <div className="flex items-center gap-2 text-[color:var(--danger)]">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm font-bold">{t("wizard.precheck.blockerTitle")}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("wizard.precheck.blockerDesc")}</p>
        </div>
      )}

      {!scanning && !risk.hasBlocker && hits.length === 0 && (
        <div className="rounded-2xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/12 p-4">
          <div className="flex items-center gap-2 text-[color:var(--success)]">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">{t("wizard.precheck.clean")}</span>
          </div>
        </div>
      )}

      {/* Factor list */}
      {!scanning && (
        <div className="space-y-2" data-el="wizard-factors">
          {shown.map((f) => {
            const key = FACTOR_KEY[f.id] ?? "network";
            const open = expanded === f.id;
            return (
              <div
                key={f.id}
                className={cn(
                  "fg-glass overflow-hidden rounded-2xl",
                  !f.hit && "opacity-60",
                )}
                data-el="wizard-factor"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : f.id)}
                  className="flex w-full items-center gap-3 p-3.5 text-left"
                >
                  <SeverityDot severity={f.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t(`risk.factor.${key}.title`)}</div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {t(f.description)}
                    </p>
                  </div>
                  {f.hit && (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">+{f.points}</span>
                  )}
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                  />
                </button>
                {open && (
                  <div className="border-t border-border px-3.5 pb-3.5 pt-3">
                    <p className="text-xs text-muted-foreground">{t(f.description)}</p>
                    <div className="mt-2 rounded-xl bg-primary/10 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {t("wizard.precheck.remediation")}
                      </div>
                      <p className="mt-0.5 text-xs text-foreground">{t(f.remediation)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Acknowledge / continue */}
      {!scanning && risk.hasBlocker && !acknowledged && (
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--danger)]/50 px-4 py-3 text-sm font-medium text-[color:var(--danger)]"
          data-el="wizard-acknowledge"
        >
          {t("wizard.precheck.acknowledge")}
        </button>
      )}

      {!scanning && (
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-transform active:scale-[0.99]",
            canContinue
              ? "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
          data-el="wizard-to-route"
        >
          {t("wizard.precheck.toRoute")} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
