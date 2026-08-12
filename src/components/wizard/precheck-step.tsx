"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, ShieldAlert, ChevronDown, TrendingUp, Copy, Check, FileCheck2, Route as RouteIcon } from "lucide-react";
import type { RiskAssessment, RiskFactor, Supplier } from "@/lib/engine/types";
import { RiskBadge, SeverityDot } from "@/components/shared/badges";
import { RiskGauge } from "@/components/shared/risk-gauge";
import { AiPrecheckExplainer } from "@/components/wizard/ai-precheck-explainer";
import { createVerificationCase } from "@/lib/api";
import { formatPercent, formatUsdCents } from "@/lib/format";
import { cn } from "@/utils/utils";

export function PrecheckStep({
  supplier,
  risk,
  onContinue,
}: {
  supplier: Supplier;
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

      {/* Return-reason prediction: "why it might bounce" (top-3) */}
      {!scanning && (
        <div className="fg-glass rounded-2xl p-4" data-el="return-reasons">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-bold">Why it might bounce</h3>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Most likely return reasons on this corridor, ranked by probability.
          </p>
          {/* Quantified cost of a bounce (pain point 2) */}
          <div
            className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-2.5"
            data-el="return-cost"
          >
            <span className="text-[11px] font-semibold text-[color:var(--warning)]">If returned:</span>
            <span className="font-mono text-[11px] text-foreground">
              ≈ {risk.returnCost.lostDays} days lost
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-[11px] text-foreground">
              {formatUsdCents(risk.returnCost.sunkFeesUsd)} sunk fees
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {risk.returnReasons.map((r) => (
              <li key={r.id} data-el="return-reason">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[13px] font-medium">{r.title}</span>
                  <span className="shrink-0 font-mono text-[11px] font-bold text-primary">
                    {formatPercent(r.probability, 0)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--fg-soft)]">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, Math.round(r.probability * 100))}%` }}
                  />
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                  {r.source}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* LLM compliance briefing (DeepSeek, App AI) layered on the rules */}
      {!scanning && <AiPrecheckExplainer supplier={supplier} risk={risk} />}

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
                    {f.hit && <FactorAction factor={f} supplier={supplier} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Acknowledge / continue */}
      {!scanning && risk.hasBlocker && !acknowledged && (
        <div
          className="rounded-2xl border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/10 p-4"
          data-el="wizard-acknowledge-box"
        >
          <div className="flex items-center gap-2 text-[color:var(--danger)]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="text-sm font-bold">Continuing releases a high-risk payment</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This payee scores <b className="text-[color:var(--danger)]">{risk.score}/100</b> with an estimated{" "}
            <b className="text-[color:var(--danger)]">{formatPercent(risk.returnProbability, 0)}</b> return
            probability. If returned, expect a loss of about{" "}
            <b className="text-foreground">{risk.returnCost.lostDays} days</b> and{" "}
            <b className="text-foreground">{formatUsdCents(risk.returnCost.sunkFeesUsd)}</b> in
            non-refundable fees. High-risk payments can still proceed, but generate an audit trail
            for compliance review — you accept the compliance and loss responsibility.
          </p>
          <button
            type="button"
            onClick={() => setAcknowledged(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--danger)]/60 bg-[color:var(--danger)]/15 px-4 py-3 text-sm font-semibold text-[color:var(--danger)] transition-transform active:scale-[0.99]"
            data-el="wizard-acknowledge"
          >
            I acknowledge the risk — continue
          </button>
        </div>
      )}

      {!scanning && (
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-transform active:scale-[0.99]",
            canContinue
              ? risk.hasBlocker
                ? "border border-[color:var(--danger)]/60 bg-[color:var(--danger)]/15 text-[color:var(--danger)]"
                : "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
          data-el="wizard-to-route"
        >
          {risk.hasBlocker ? "Compare routes anyway" : "Compare routes"} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Per-factor action inside an expanded risk factor.
 * - data-quality factors → "Generate verification request" (creates a Case,
 *   shows a copy-ready template).
 * - structural factors → a routing-only note (contacting the payee won't help).
 */
function FactorAction({ factor, supplier }: { factor: RiskFactor; supplier: Supplier }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  if (factor.category === "structural") {
    return (
      <div
        className="mt-2 flex items-start gap-2 rounded-xl border border-border bg-[color:var(--fg-soft)] p-2.5 text-[11px] text-muted-foreground"
        data-el="factor-structural-note"
      >
        <RouteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Jurisdiction-level risk — contacting the payee can&apos;t clear it. Avoid it by choosing a
          compliant route in the next step.
        </span>
      </div>
    );
  }

  async function generate() {
    if (busy) return;
    setBusy(true);
    setErr(false);
    try {
      const created = await createVerificationCase({ supplierId: supplier.id, factorId: factor.id });
      setTemplate(created.template);
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!template) return;
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  if (template) {
    return (
      <div className="mt-2 space-y-2" data-el="factor-verification-result">
        <textarea
          readOnly
          value={template}
          rows={6}
          className="w-full resize-none rounded-xl border border-border bg-[color:var(--fg-soft)] p-2.5 font-mono text-[11px] leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-primary/10"
            data-el="factor-verification-copy"
          >
            {copied ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy message"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/cases")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
            data-el="factor-verification-track"
          >
            <FileCheck2 className="h-3 w-3" /> Track in Cases
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Saved to Cases → Verification requests. Update the status there once the payee replies.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10",
          busy && "opacity-60",
        )}
        data-el="factor-verification-generate"
      >
        <FileCheck2 className="h-3 w-3" /> {busy ? "Generating…" : "Generate verification request"}
      </button>
      {err && (
        <p className="mt-1 text-[10px] text-[color:var(--danger)]">
          Could not generate the request. Please try again.
        </p>
      )}
    </div>
  );
}
