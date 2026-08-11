"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import type { RiskAssessment, RouteOption, RoutingResult } from "@/lib/engine/types";
import { FlowNarrativeStage } from "@/components/flow/flow-narrative-stage";
import { formatUsdCents, formatPercent, formatMinutes } from "@/lib/format";
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
  const [selectedId, setSelectedId] = useState(routing.recommendedId);

  return (
    <div className="space-y-4" data-el="wizard-route">
      <FlowNarrativeStage
        options={routing.options}
        selectedId={selectedId}
        onSelect={setSelectedId}
        riskHits={risk.factors}
      />

      <p className="text-center text-[11px] text-muted-foreground">
        Tap a channel to compare its money-flow, fees and return risk.
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
            <Check className="h-4 w-4" /> Payment initiated
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" /> Confirm &amp; initiate
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
              Best
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
          <Metric label="Fee" value={formatUsdCents(option.totalFeeUsd)} />
          <Metric label="ETA" value={formatMinutes(option.etaMinutes)} />
          <Metric label="Return risk" value={formatPercent(option.returnRisk, 0)} />
          <Metric label="Received" value={formatUsdCents(option.receiveUsd)} highlight />
        </div>
      )}
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
