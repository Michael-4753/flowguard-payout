"use client";

import { useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, ShieldAlert, ChevronDown, TrendingUp, Copy, Check, AlertTriangle, FileCheck2, Route as RouteIcon, Users, Send } from "lucide-react";
import type { RiskAssessment, RiskFactor, Supplier } from "@/lib/engine/types";
import { RiskBadge, SeverityDot } from "@/components/shared/badges";
import { RiskGauge } from "@/components/shared/risk-gauge";
import { AiPrecheckExplainer } from "@/components/wizard/ai-precheck-explainer";
import { AiRiskSignals } from "@/components/ai/ai-risk-signals";
import { FAILURE_CASES } from "@/lib/engine/failure-cases";
import { createVerificationCase } from "@/lib/api";
import { isVerifiable } from "@/lib/verification";
import { recomputeWithClarified } from "@/lib/engine";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { formatPercent, formatUsdCents } from "@/lib/format";
import { copyText } from "@/utils/copy-text";
import { cn } from "@/utils/utils";

export function PrecheckStep({
  supplier,
  risk: rawRisk,
  onContinue,
}: {
  supplier: Supplier;
  risk: RiskAssessment;
  onContinue: () => void;
}) {
  const router = useRouter();
  const { clarifiedFactors } = useFlowGuardData();
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // Supplier data-quality verification: sync the flagged fields to the payee
  // (open Cases) instead of jumping straight to "acknowledge risk → approval".
  const [synced, setSynced] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncTemplate, setSyncTemplate] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState(false);
  const [syncCopied, setSyncCopied] = useState<"idle" | "ok" | "fail">("idle");
  // The cashier can still override and accept the risk without verifying.
  const [overrideVerify, setOverrideVerify] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setScanning(false), 1000);
    return () => clearTimeout(id);
  }, []);

  // Feedback loop: pull this payee's resolved verification cases and recompute
  // the risk so verified factors clear and clarified ones soften — the precheck
  // now reflects the case outcomes instead of ignoring them.
  const resolved = clarifiedFactors(supplier.id);
  const { risk } = recomputeWithClarified(rawRisk, resolved);

  const hits = risk.factors.filter((f) => f.hit);
  const shown = risk.factors
    .slice()
    .sort((a, b) => Number(b.hit) - Number(a.hit) || b.points - a.points);
  // Supplier basic-info problems that the payee can actually clear — and that
  // are NOT already resolved via a verification case.
  const verifiableHits = hits.filter(
    (f) => f.category === "data-quality" && isVerifiable(f.id) && !resolved.has(f.id),
  );
  const hasVerifiable = verifiableHits.length > 0;
  const allSynced = hasVerifiable && verifiableHits.every((f) => synced.includes(f.id));
  // Gate is satisfied when there is nothing left to verify (already resolved via
  // cases), or the cashier synced/overrode the remaining items.
  const verifyGateSatisfied = !hasVerifiable || synced.length > 0 || overrideVerify;
  const canContinue = (!risk.hasBlocker || acknowledged) && verifyGateSatisfied;

  async function syncToSupplier() {
    if (syncing || !hasVerifiable) return;
    setSyncing(true);
    setSyncErr(false);
    try {
      const pending = verifiableHits.filter((f) => !synced.includes(f.id));
      const created = await Promise.all(
        pending.map((f) => createVerificationCase({ supplierId: supplier.id, factorId: f.id })),
      );
      setSynced((prev) => [...prev, ...pending.map((f) => f.id)]);
      const merged = created.map((c) => c.template).join("\n\n———\n\n");
      setSyncTemplate((prev) => (prev ? `${prev}\n\n———\n\n${merged}` : merged));
    } catch {
      setSyncErr(true);
    } finally {
      setSyncing(false);
    }
  }

  async function copySync() {
    if (!syncTemplate) return;
    const ok = await copyText(syncTemplate);
    setSyncCopied(ok ? "ok" : "fail");
    setTimeout(() => setSyncCopied("idle"), 1800);
  }

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
                {t("precheck.returnProbability")}
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold">
                {formatPercent(risk.returnProbability, 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3 text-center">
              <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                {t("precheck.likelyChokepoint")}
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
            <span className="text-sm font-bold">{t("precheck.doNotSend")}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("precheck.doNotSendDesc")}
          </p>
        </div>
      )}

      {/* Supplier basic-info problems → verify with the payee FIRST (open Cases),
          rather than jumping straight to acknowledging the risk. */}
      {!scanning && hasVerifiable && (
        <div
          className="rounded-2xl border border-primary/40 bg-primary/8 p-4"
          data-el="wizard-verify-card"
        >
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-4 w-4 shrink-0" />
            <span className="text-sm font-bold">{t("precheck.detailsNeedVerification")}</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {t("precheck.detailsNeedVerificationDesc", { count: verifiableHits.length })}
          </p>
          <ul className="mt-2 space-y-1">
            {verifiableHits.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-[12px]">
                {synced.includes(f.id) ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[color:var(--warning)]" />
                )}
                <span className={cn("font-medium", synced.includes(f.id) && "text-muted-foreground line-through")}>
                  {f.title}
                </span>
              </li>
            ))}
          </ul>

          {!allSynced && (
            <button
              type="button"
              onClick={syncToSupplier}
              disabled={syncing}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]",
                syncing && "opacity-60",
              )}
              data-el="wizard-verify-sync"
            >
              <Send className="h-4 w-4" />
              {syncing
                ? t("precheck.creatingCase")
                : synced.length > 0
                  ? t("precheck.syncRemaining")
                  : t("precheck.syncIssues")}
            </button>
          )}
          {syncErr && (
            <p className="mt-2 text-[11px] text-[color:var(--danger)]">
              {t("precheck.syncFailed")}
            </p>
          )}

          {syncTemplate && (
            <div className="mt-3 space-y-2" data-el="wizard-verify-result">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--success)]">
                <FileCheck2 className="h-3.5 w-3.5" /> {t("precheck.caseCreated")}
              </div>
              <textarea
                readOnly
                value={syncTemplate}
                rows={6}
                className="w-full resize-none rounded-xl border border-border bg-[color:var(--fg-soft)] p-2.5 font-mono text-[11px] leading-relaxed"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copySync}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-primary/10"
                  data-el="wizard-verify-copy"
                >
                  {syncCopied === "ok" ? (
                    <Check className="h-3 w-3 text-[color:var(--success)]" />
                  ) : syncCopied === "fail" ? (
                    <AlertTriangle className="h-3 w-3 text-[color:var(--danger)]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {syncCopied === "ok" ? t("precheck.copied") : syncCopied === "fail" ? t("precheck.copyFailed") : t("precheck.copyVerificationMessage")}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/cases")}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                  data-el="wizard-verify-track"
                >
                  <FileCheck2 className="h-3 w-3" /> {t("precheck.trackInCases")}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("precheck.replyHint")}
              </p>
            </div>
          )}
        </div>
      )}

      {!scanning && !risk.hasBlocker && hits.length === 0 && (
        <div className="rounded-2xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/12 p-4">
          <div className="flex items-center gap-2 text-[color:var(--success)]">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">{t("precheck.allChecksPassed")}</span>
          </div>
        </div>
      )}

      {/* Return-reason prediction: "why it might bounce" (top-3) */}
      {!scanning && (
        <div className="fg-glass rounded-2xl p-4" data-el="return-reasons">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-bold">{t("precheck.whyBounce")}</h3>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("precheck.whyBounceDesc")}
          </p>
          {/* Quantified cost of a bounce (pain point 2) */}
          <div
            className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-2.5"
            data-el="return-cost"
          >
            <span className="text-[11px] font-semibold text-[color:var(--warning)]">{t("precheck.ifReturned")}</span>
            <span className="font-mono text-[11px] text-foreground">
              {t("precheck.daysLost", { count: risk.returnCost.lostDays })}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-[11px] text-foreground">
              {t("precheck.sunkFees", { amount: formatUsdCents(risk.returnCost.sunkFeesUsd) })}
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

      {/* AI-only supplementary risk DETECTION (semantic/context) — additive, never lowers the score. */}
      {!scanning && (
        <AiRiskSignals
          buildSnapshot={() => ({
            beneficiary: {
              name: supplier.name,
              country: supplier.country,
              currency: supplier.currency,
              bankName: supplier.bankName,
              swift: supplier.swift,
              iban: supplier.iban,
              entityType: supplier.entityType,
              accountStatus: supplier.accountStatus,
            },
            engine: {
              score: risk.score,
              level: risk.level,
              hitFactors: risk.factors.filter((f) => f.hit).map((f) => ({ id: f.id, title: f.title })),
            },
            pastCases: FAILURE_CASES.map((c) => ({
              corridor: c.corridor,
              reason: c.reason,
              failedAt: c.failedAt,
            })),
          })}
        />
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
                        {t("precheck.remediation")}
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

      {/* Verify-first gate: block continuing until the payee has been contacted
          (or the cashier explicitly overrides) — applies to any verifiable
          supplier-info problem, blocker or warn-level alike. */}
      {!scanning && hasVerifiable && !verifyGateSatisfied && (
        <div
          className="rounded-2xl border border-border bg-[color:var(--fg-soft)] p-4"
          data-el="wizard-verify-gate"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("precheck.recommendVerify")}
          </p>
          <button
            type="button"
            onClick={() => setOverrideVerify(true)}
            className="mt-2 text-[12px] font-semibold text-[color:var(--danger)] underline underline-offset-2"
            data-el="wizard-verify-override"
          >
            {t("precheck.cantVerifyAck")}
          </button>
        </div>
      )}

      {/* Acknowledge / continue */}
      {!scanning && risk.hasBlocker && !acknowledged && verifyGateSatisfied && (
        <div
          className="rounded-2xl border border-[color:var(--danger)]/50 bg-[color:var(--danger)]/10 p-4"
          data-el="wizard-acknowledge-box"
        >
          <div className="flex items-center gap-2 text-[color:var(--danger)]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="text-sm font-bold">{t("precheck.continueReleases")}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <Trans
              i18nKey="precheck.acknowledgeDesc"
              values={{
                score: risk.score,
                prob: formatPercent(risk.returnProbability, 0),
                days: risk.returnCost.lostDays,
                fees: formatUsdCents(risk.returnCost.sunkFeesUsd),
              }}
              components={[
                <b key="0" className="text-[color:var(--danger)]" />,
                <b key="1" className="text-[color:var(--danger)]" />,
                <b key="2" className="text-foreground" />,
                <b key="3" className="text-foreground" />,
              ]}
            />
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground" data-el="wizard-track-case-hint">
            {t("precheck.trackCaseHint")}
          </p>
          {/* Recommended path: don't force a lone "override & continue" — the
              verification case already exists, so steer the cashier to track it
              first. Acknowledging the risk is the secondary, deliberate action. */}
          <button
            type="button"
            onClick={() => router.push("/cases")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]"
            data-el="wizard-track-case"
          >
            <FileCheck2 className="h-4 w-4" /> {t("precheck.trackCaseCta")}
          </button>
          <button
            type="button"
            onClick={() => setAcknowledged(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--danger)]/60 bg-transparent px-4 py-3 text-sm font-semibold text-[color:var(--danger)] transition-transform active:scale-[0.99]"
            data-el="wizard-acknowledge"
          >
            {t("precheck.acknowledgeContinue")}
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
          {risk.hasBlocker ? t("precheck.compareRoutesAnyway") : t("precheck.compareRoutes")} <ArrowRight className="h-4 w-4" />
        </button>
      )}
      {!scanning && !canContinue && hasVerifiable && !verifyGateSatisfied && (
        <p className="text-center text-[11px] text-muted-foreground" data-el="wizard-gate-hint">
          {t("precheck.gateHint")}
        </p>
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
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
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
          {t("precheck.structuralNote")}
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
    const ok = await copyText(template);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 1800);
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
            {copied === "ok" ? (
              <Check className="h-3 w-3 text-[color:var(--success)]" />
            ) : copied === "fail" ? (
              <AlertTriangle className="h-3 w-3 text-[color:var(--danger)]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied === "ok" ? t("precheck.copied") : copied === "fail" ? t("precheck.copyFailed") : t("precheck.copyMessage")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/cases")}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
            data-el="factor-verification-track"
          >
            <FileCheck2 className="h-3 w-3" /> {t("precheck.trackInCases")}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {t("precheck.savedToCases")}
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
        <FileCheck2 className="h-3 w-3" /> {busy ? t("precheck.generating") : t("precheck.generateVerification")}
      </button>
      {err && (
        <p className="mt-1 text-[10px] text-[color:var(--danger)]">
          {t("precheck.generateFailed")}
        </p>
      )}
    </div>
  );
}
