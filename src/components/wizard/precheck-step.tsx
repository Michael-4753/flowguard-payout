"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, ShieldAlert, ChevronDown } from "lucide-react";
import type { RiskAssessment } from "@/lib/engine/types";
import { RiskBadge, SeverityDot } from "@/components/shared/badges";
import { RiskGauge } from "@/components/shared/risk-gauge";
import { formatPercent } from "@/lib/format";
import { cn } from "@/utils/utils";

export function PrecheckStep({
  risk,
  onContinue,
}: {
  risk: RiskAssessment;
  onContinue: () => void;
}) {
  const [scanning, setScanning] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setScanning(false), 1000);
    return () => clearTimeout(id);
  }, []);

  const hits = risk.factors.filter((f) => f.hit);
  const shown = risk.factors
    .slice()
    .sort((a, b) => Number(b.hit) - Number(a.hit) || b.points - a.points);
  const canContinue = !risk.hasBlocker || acknowledged;

  return (
    <div className="space-y-4" data-el="wizard-precheck">
      {/* Gauge */}
      <div className="fg-glass flex flex-col items-center rounded-[24px] p-5">
        <RiskGauge score={scanning ? 0 : risk.score} level={risk.level} />
        <div className="mt-3 flex items-center gap-2">
          <RiskBadge level={risk.level} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {scanning ? "Scanning…" : `${hits.length} risk factor(s) hit`}
          </span>
        </div>
        {!scanning && (
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <div className="rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3 text-center">
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Return probability
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold">
                {formatPercent(risk.returnProbability, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3 text-center">
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Likely chokepoint
              </div>
              <div className="mt-0.5 truncate text-[11px] font-semibold">{risk.chokepointBank}</div>
            </div>
          </div>
        )}
      </div>

      {/* Blocker banner */}
      {!scanning && risk.hasBlocker && (
        <div
          className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/12 p-4"
          data-el="wizard-blocker"
        >
          <div className="flex items-center gap-2 text-[color:var(--danger)]">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm font-bold">Do not send yet</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A critical blocker was detected. Resolve it, or acknowledge the risk to continue for review.
          </p>
        </div>
      )}

      {!scanning && !risk.hasBlocker && hits.length === 0 && (
        <div className="rounded-2xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/12 p-4">
          <div className="flex items-center gap-2 text-[color:var(--success)]">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">All checks passed — safe to route.</span>
          </div>
        </div>
      )}

      {/* Factor list */}
      {!scanning && (
        <div className="space-y-2" data-el="wizard-factors">
          {shown.map((f) => {
            const open = expanded === f.id;
            return (
              <div
                key={f.id}
                className={cn("fg-glass overflow-hidden rounded-2xl", !f.hit && "opacity-60")}
                data-el="wizard-factor"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : f.id)}
                  className="flex w-full items-center gap-3 p-3.5 text-left"
                >
                  <SeverityDot severity={f.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{f.title}</div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                  {f.hit && (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      +{f.points}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open && (
                  <div className="border-t border-border px-3.5 pb-3.5 pt-3">
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                    <div className="mt-2 rounded-xl bg-primary/10 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Remediation
                      </div>
                      <p className="mt-0.5 text-xs text-foreground">{f.remediation}</p>
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
          I acknowledge the risk — continue for review
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
          Compare routes <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
