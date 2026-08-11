"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Lock } from "lucide-react";
import type { RiskAssessment, RouteOption, RoutingResult } from "@/lib/engine/types";
import { FlowNarrativeStage } from "@/components/flow/flow-narrative-stage";
import { formatUsdCents, formatPercent, formatMinutes } from "@/lib/format";
import { useCurrentLocale } from "@/lib/use-locale";
import { cn } from "@/utils/utils";

export function RouteStep({
  routing,
  risk,
  onConfirm,
  confirmed,
}: {
  routing: RoutingResult;
  risk: RiskAssessment;
  onConfirm: (routeId: string) => void;
  confirmed: boolean;
}) {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const [selectedId, setSelectedId] = useState(routing.recommendedId);
  const selected = routing.options.find((o) => o.id === selectedId) ?? routing.options[0];

  return (
    <div className="space-y-4" data-el="wizard-route">
      <FlowNarrativeStage
        options={routing.options}
        selectedId={selectedId}
        onSelect={setSelectedId}
        riskHits={risk.factors}
        locale={locale}
      />

      <p className="text-center text-[11px] text-muted-foreground">{t("wizard.route.switchHint")}</p>

      {/* Route comparison cards */}
      <div className="space-y-2" data-el="route-options">
        {routing.options.map((o) => (
          <RouteCard
            key={o.id}
            option={o}
            active={o.id === selectedId}
            onClick={() => setSelectedId(o.id)}
            locale={locale}
          />
        ))}
      </div>

      {/* Hops for selected route */}
      <div className="fg-glass rounded-2xl p-4" data-el="route-hops">
        <div className="mb-3 text-xs font-semibold text-muted-foreground">{t("wizard.route.hops")}</div>
        <ol className="relative space-y-3">
          {selected.hops.map((h) => (
            <li key={h.id} className="flex items-center gap-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 flex-1 truncate text-sm">{h.label}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {formatMinutes(h.minutes)} · -{formatUsdCents(h.feeUsd, locale)}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-foreground">
                {formatUsdCents(h.remainingUsd, locale)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Confirm */}
      <button
        type="button"
        disabled={confirmed}
        onClick={() => onConfirm(selectedId)}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold transition-transform active:scale-[0.99]",
          confirmed
            ? "bg-[color:var(--success)] text-black"
            : "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]",
        )}
        data-el="wizard-confirm"
      >
        {confirmed ? (
          <>
            <Check className="h-4 w-4" /> {t("wizard.route.confirmed")}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" /> {t("wizard.route.confirm")}
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
  locale,
}: {
  option: RouteOption;
  active: boolean;
  onClick: () => void;
  locale: string;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-3.5 text-left transition-colors",
        active ? "border-primary bg-primary/10" : "border-border",
      )}
      data-el="route-card"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{option.name}</span>
          {option.recommended && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
              {t("wizard.route.recommended")}
            </span>
          )}
        </div>
        <span className="font-mono text-sm font-bold text-primary">{option.score}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{t(option.reason)}</p>
      <div className="mt-2.5 grid grid-cols-4 gap-1 font-mono text-[10px]">
        <Metric label={t("wizard.route.fee")} value={formatUsdCents(option.totalFeeUsd, locale)} />
        <Metric label={t("wizard.route.eta")} value={formatMinutes(option.etaMinutes)} />
        <Metric label={t("wizard.route.success")} value={formatPercent(option.successRate, locale)} />
        <Metric label={t("wizard.route.receive")} value={formatUsdCents(option.receiveUsd, locale)} highlight />
      </div>
    </button>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] uppercase text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 truncate", highlight ? "font-semibold text-primary" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
