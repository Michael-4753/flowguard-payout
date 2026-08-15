"use client";

import { AlertTriangle, ArrowDown, Clock, TrendingDown, Eye, EyeOff, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/utils";
import type { FlowHop, RiskFactor, RouteOption } from "@/lib/engine/types";
import { channelLabel, factorTitle } from "@/lib/i18n-labels";
import { formatMinutes, formatUsdCents } from "@/lib/format";

const BLACKBOX_META: Record<
  FlowHop["blackboxLevel"],
  { labelKey: string; className: string }
> = {
  clear: { labelKey: "flow.blackboxClear", className: "text-[color:var(--success)]" },
  partial: { labelKey: "flow.blackboxPartial", className: "text-[color:var(--warning)]" },
  opaque: { labelKey: "flow.blackboxOpaque", className: "text-[color:var(--danger)]" },
};

/**
 * Money-flow link board (module 3). A vertical, flex-based rail — origin →
 * intermediaries → beneficiary — with the chokepoint layer highlighted, per-hop
 * ETA / withholding, per-hop handling bank + transparency, and route-selector
 * chips. No absolute positioning, so it never overlaps at any viewport width.
 */
export function FlowNarrativeStage({
  options,
  selectedId,
  onSelect,
  riskHits,
  avgHops,
}: {
  options: RouteOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  riskHits: RiskFactor[];
  avgHops?: number;
}) {
  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const { t } = useTranslation();
  const criticalHits = riskHits.filter((f) => f.hit && f.severity === "critical");
  const intermediaries = selected.hops.filter((h) => h.role === "intermediary").length;
  const opaque = selected.hops.filter((h) => h.blackboxLevel === "opaque").length;

  return (
    <div className="fg-glass w-full overflow-hidden rounded-[28px] p-4" data-el="flow-stage">
      {/* Route selector chips */}
      <div className="mb-4 flex flex-wrap gap-2" data-el="flow-route-chips">
        {options.map((o) => {
          const active = o.id === selectedId;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => o.available && onSelect(o.id)}
              disabled={!o.available}
              aria-pressed={active}
              className={cn(
                "flex min-w-0 flex-1 basis-[30%] flex-col items-start gap-0.5 rounded-2xl border px-3 py-2 text-left transition-colors",
                active
                  ? "border-primary/60 bg-primary/15"
                  : "border-border bg-[color:var(--fg-soft)]",
                !o.available && "opacity-40",
              )}
              data-el="flow-route-node"
            >
              <span className="truncate text-[11px] font-semibold">
                {channelLabel(t, o.channelClass)}
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                {o.available ? (
                  <>
                    <span className={cn(active && "text-primary")}>score {o.score}</span>
                    {o.recommended && <span className="text-primary">· best</span>}
                  </>
                ) : (
                  <span>n/a</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Critical risk banner */}
      {criticalHits.length > 0 && (
        <div
          className="mb-4 flex items-start gap-2 rounded-2xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 p-3"
          data-el="flow-risk-banner"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--danger)]" aria-hidden />
          <div className="min-w-0 text-[11px] leading-relaxed text-[color:var(--danger)]">
            <span className="font-semibold">{t("flow.blockingRisks", { count: criticalHits.length })}</span>
            {criticalHits.map((f) => factorTitle(t, f)).join(" · ")}
          </div>
        </div>
      )}

      {/* Corridor transparency summary (de-blackboxing intermediaries) */}
      <div
        className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 font-mono text-[10px] text-muted-foreground"
        data-el="flow-corridor-summary"
      >
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3 w-3" aria-hidden /> {t("flow.intermediaryHops", { count: intermediaries })}
        </span>
        {typeof avgHops === "number" && <span>{t("flow.corridorAvg", { count: avgHops })}</span>}
        <span
          className={cn(
            "inline-flex items-center gap-1",
            opaque > 0 ? "text-[color:var(--danger)]" : "text-[color:var(--success)]",
          )}
        >
          {opaque > 0 ? <EyeOff className="h-3 w-3" aria-hidden /> : <Eye className="h-3 w-3" aria-hidden />}
          {opaque > 0 ? t("flow.blackBoxHops", { count: opaque }) : t("flow.fullyTraceable")}
        </span>
      </div>

      {/* Vertical hop rail — keyed on the selected route so switching triggers a
          visible re-layout (each hop re-enters with a staggered fade/rise). */}
      <ol className="relative flex flex-col gap-0" data-el="flow-rail" key={selected.id}>
        {selected.hops.map((hop, i) => (
          <HopNode key={hop.id} hop={hop} index={i} last={i === selected.hops.length - 1} />
        ))}
      </ol>

      {/* Footer totals */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="ETA" value={formatMinutes(selected.etaMinutes)} icon={<Clock className="h-3.5 w-3.5" />} />
        <Stat
          label="Total fee"
          value={formatUsdCents(selected.totalFeeUsd)}
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <Stat label="Received" value={formatUsdCents(selected.receiveUsd)} highlight />
      </div>
    </div>
  );
}

function HopNode({ hop, index, last }: { hop: FlowHop; index: number; last: boolean }) {
  const { t } = useTranslation();
  const roleColor =
    hop.role === "origin"
      ? "var(--success)"
      : hop.role === "beneficiary"
        ? "var(--primary)"
        : hop.chokepoint
          ? "var(--danger)"
          : "var(--muted-foreground)";

  return (
    <li
      className="fg-enter relative flex gap-3"
      data-el="flow-hop"
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* rail + node */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "fg-orb-route grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-bold",
            hop.chokepoint && "fg-orb-pulse-danger",
          )}
          data-active="true"
          style={{
            filter: `drop-shadow(0 0 12px ${roleColor}55)`,
            color: roleColor,
            border: `1.5px solid ${roleColor}`,
          }}
          aria-hidden
        >
          {hop.role === "origin" ? "•" : hop.role === "beneficiary" ? "★" : hop.chokepoint ? "!" : "·"}
        </span>
        {!last && (
          <span
            className="my-0.5 w-[2px] flex-1"
            style={{ background: "linear-gradient(var(--fg-soft), transparent)" }}
            aria-hidden
          />
        )}
      </div>

      {/* card */}
      <div
        className={cn(
          "mb-3 min-w-0 flex-1 rounded-2xl border p-3",
          hop.chokepoint
            ? "border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10"
            : "border-border bg-[color:var(--fg-soft)]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{hop.label}</span>
          {hop.chokepoint && (
            <span className="shrink-0 rounded-full bg-[color:var(--danger)]/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[color:var(--danger)]">
              Chokepoint
            </span>
          )}
        </div>
        {/* Handling bank + transparency — de-blackboxes the intermediary */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{hop.bankName}</span>
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 text-[10px] font-medium",
              BLACKBOX_META[hop.blackboxLevel].className,
            )}
          >
            {hop.blackboxLevel === "opaque" ? (
              <EyeOff className="h-3 w-3" aria-hidden />
            ) : (
              <Eye className="h-3 w-3" aria-hidden />
            )}
            {t(BLACKBOX_META[hop.blackboxLevel].labelKey)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ArrowDown className="h-3 w-3" aria-hidden /> {formatUsdCents(hop.remainingUsd)}
          </span>
          <span>fee {formatUsdCents(hop.feeUsd)}</span>
          <span>{formatMinutes(hop.minutes)}</span>
          {hop.chokepoint && (
            <span className="text-[color:var(--danger)]">hold ~{formatMinutes(hop.idleMinutes)}</span>
          )}
        </div>
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-2.5 text-center",
        highlight ? "border-primary/50 bg-primary/10" : "border-border bg-[color:var(--fg-soft)]",
      )}
    >
      <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("mt-0.5 font-mono text-sm font-bold", highlight && "text-primary")}>
        {value}
      </div>
    </div>
  );
}
