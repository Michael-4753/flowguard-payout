"use client";

import { useState } from "react";
import { Check, Lock, Info, ShieldAlert } from "lucide-react";
import type { RiskAssessment, RouteOption, RoutingResult } from "@/lib/engine/types";
import { FlowNarrativeStage } from "@/components/flow/flow-narrative-stage";
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
  onConfirm: (routeId: string) => void;
  confirmed: boolean;
}) {
  const [selectedId, setSelectedId] = useState(routing.recommendedId);
  const guest = useIsGuest();
  const highRisk = risk.level === "high";

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
            <b>High-risk payment ({risk.score}/100, ~{formatPercent(risk.returnProbability, 0)} return probability).</b>{" "}
            You acknowledged the risk and chose to continue. High-risk payments can still proceed, but
            generate an audit trail for compliance review — you accept the compliance and loss responsibility.
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

      {/* Guest notice */}
      {guest && !confirmed && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3 text-[11px] leading-relaxed text-muted-foreground"
          data-el="guest-payment-notice"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            Guest mode — payment records are saved on this device only (browser local storage) and are
            cleared when you leave guest mode. Sign in to sync them to your account.
          </span>
        </div>
      )}

      {/* Confirm */}
      <button
        type="button"
        disabled={confirmed}
        onClick={() => onConfirm(selectedId)}
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
            <Check className="h-4 w-4" /> Payment initiated
          </>
        ) : highRisk ? (
          <>
            <ShieldAlert className="h-4 w-4" /> Initiate high-risk payment anyway
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
