"use client";

import { AlertTriangle, ArrowDown, Clock, TrendingDown } from "lucide-react";
import { cn } from "@/utils/utils";
import type { FlowHop, RiskFactor, RouteOption } from "@/lib/engine/types";
import { CHANNEL_CLASS_LABEL } from "@/lib/engine/types";
import { formatMinutes, formatUsdCents } from "@/lib/format";

/**
 * Money-flow link board (module 3). A vertical, flex-based rail — origin →
 * intermediaries → beneficiary — with the chokepoint layer highlighted, per-hop
 * ETA / withholding, and route-selector chips. No absolute positioning, so it
 * never overlaps at any viewport width.
 */
export function FlowNarrativeStage({
  options,
  selectedId,
  onSelect,
  riskHits,
}: {
  options: RouteOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  riskHits: RiskFactor[];
}) {
  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const criticalHits = riskHits.filter((f) => f.hit && f.severity === "critical");

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
                {CHANNEL_CLASS_LABEL[o.channelClass]}
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
            <span className="font-semibold">{criticalHits.length} blocking risk(s): </span>
            {criticalHits.map((f) => f.title).join(" · ")}
          </div>
        </div>
      )}

      {/* Vertical hop rail */}
      <ol className="relative flex flex-col gap-0" data-el="flow-rail">
        {selected.hops.map((hop, i) => (
          <HopNode key={hop.id} hop={hop} last={i === selected.hops.length - 1} />
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

function HopNode({ hop, last }: { hop: FlowHop; last: boolean }) {
  const roleColor =
    hop.role === "origin"
      ? "var(--success)"
      : hop.role === "beneficiary"
        ? "var(--primary)"
        : hop.chokepoint
          ? "var(--danger)"
          : "var(--muted-foreground)";

  return (
    <li className="relative flex gap-3" data-el="flow-hop">
      {/* rail + node */}
      <div className="flex flex-col items-center">
        <span
          className="fg-orb grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-bold"
          style={{
            filter: `drop-shadow(0 0 12px ${roleColor}55)`,
            color: roleColor,
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
