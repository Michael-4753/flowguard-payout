"use client";

import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Check, Lock, Info, ShieldAlert, Globe2 } from "lucide-react";
import type { RiskAssessment, RouteOption, RoutingResult, Supplier } from "@/lib/engine/types";
import { FlowNarrativeStage } from "@/components/flow/flow-narrative-stage";
import { AiInsightCard } from "@/components/ai/ai-insight-card";
import { formatUsdCents, formatPercent, formatMinutes } from "@/lib/format";
import { useIsGuest } from "@/lib/guest/guest-session";
import { cn } from "@/utils/utils";

export function RouteStep({
  routing,
  risk,
  onConfirm,
  confirmed,
}: {
  routing: RoutingResult;
  risk: RiskAssessment;
  supplier: Supplier;
  onConfirm: (routeId: string) => void;
  confirmed: boolean;
}) {
  const [selectedId, setSelectedId] = useState(routing.recommendedId);
  const guest = useIsGuest();
  const { t } = useTranslation();
  const highRisk = risk.level === "high";

  function handleConfirm() {
    // Settlement is performed by a licensed institution; this platform collects no
    // wallet and moves no funds. The channel is a routing recommendation only.
    onConfirm(selectedId);
  }

  return (
    <div className="space-y-4" data-el="wizard-route">
      {/* Persistent high-risk warning through routing + confirm */}
      {highRisk && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/10 p-3"
          data-el="route-high-risk-banner"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--danger)]" aria-hidden />
          <p className="text-[11px] leading-relaxed text-[color:var(--danger)]">
            <Trans
              i18nKey="route.highRiskBanner"
              values={{ score: risk.score, prob: formatPercent(risk.returnProbability, 0) }}
              components={[<b key="0" />]}
            />
          </p>
        </div>
      )}

      <FlowNarrativeStage
        options={routing.options}
        selectedId={selectedId}
        onSelect={setSelectedId}
        riskHits={risk.factors}
        avgHops={risk.avgHops}
      />

      <p className="text-center text-[11px] text-muted-foreground">
        <Trans i18nKey="route.compareHint" components={[<b key="0" className="text-foreground" />]} />
      </p>

      {/* Route comparison cards */}
      <div className="space-y-2" data-el="route-options">
        {routing.options.map((o) => (
          <RouteCard
            key={o.id}
            option={o}
            active={o.id === selectedId}
            onClick={() => o.available && setSelectedId(o.id)}
          />
        ))}
      </div>

      {/* AI explains WHY the rule-engine recommended this route (engine still decides). */}
      <AiInsightCard
        kind="route"
        title={t("route.aiTitle")}
        cta={t("route.aiCta")}
        hint={t("route.aiHint")}
        loadingLabel={t("route.aiLoading")}
        actionsLabel={t("route.aiActions")}
        buildSnapshot={() => ({
          recommendedId: routing.recommendedId,
          options: routing.options.map((o) => ({
            id: o.id,
            name: o.name,
            channelClass: o.channelClass,
            recommended: o.recommended,
            available: o.available,
            score: o.available ? o.score : null,
            totalFeeUsd: o.totalFeeUsd / 100,
            etaMinutes: o.etaMinutes,
            returnRisk: Number(o.returnRisk.toFixed(2)),
            receiveUsd: o.receiveUsd / 100,
            reason: o.reason,
          })),
        })}
      />

      {/* Guest notice */}
      {guest && !confirmed && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3 text-[11px] leading-relaxed text-muted-foreground"
          data-el="guest-payment-notice"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            {t("route.guestNotice")}
          </span>
        </div>
      )}

      {/* Confirm */}
      <button
        type="button"
        disabled={confirmed}
        onClick={handleConfirm}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold transition-transform active:scale-[0.99]",
          confirmed
            ? "bg-[color:var(--success)] text-black"
            : highRisk
              ? "border border-[color:var(--danger)]/60 bg-[color:var(--danger)]/15 text-[color:var(--danger)]"
              : "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]",
        )}
        data-el="wizard-confirm"
      >
        {confirmed ? (
          <>
            <Check className="h-4 w-4" /> {t("route.submittedForReview")}
          </>
        ) : highRisk ? (
          <>
            <ShieldAlert className="h-4 w-4" /> {t("route.submitHighRisk")}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" /> {t("route.submitForReview")}
          </>
        )}
      </button>
    </div>
  );
}

function RouteCard({
  option,
  active,
  onClick,
}: {
  option: RouteOption;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!option.available}
      className={cn(
        "w-full rounded-2xl border p-3.5 text-left transition-colors",
        active ? "border-primary bg-primary/10" : "border-border",
        !option.available && "opacity-40",
      )}
      data-el="route-card"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold">{option.name}</span>
          {option.recommended && (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
              {t("route.best")}
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-sm font-bold text-primary">
          {option.available ? option.score : "—"}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{option.reason}</p>
      {option.available && (
        <div className="mt-2.5 grid grid-cols-4 gap-1 font-mono text-[10px]">
          <Metric label={t("route.fee")} value={formatUsdCents(option.totalFeeUsd)} />
          <Metric label={t("route.eta")} value={formatMinutes(option.etaMinutes)} />
          <Metric label={t("route.returnRisk")} value={formatPercent(option.returnRisk, 0)} />
          <Metric label={t("route.receivedUsd")} value={formatUsdCents(option.receiveUsd)} highlight />
        </div>
      )}
      {option.available && option.channelClass === "stablecoin-direct" && (
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[color:var(--warning)]" data-el="route-stablecoin-hint">
          <Globe2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span>{t("route.stablecoinHint")}</span>
        </p>
      )}
    </button>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 truncate", highlight ? "font-semibold text-primary" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
