"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, History, FileWarning, ShieldCheck } from "lucide-react";
import { request } from "@/lib/api/request";
import { AppAIClientUnavailableError } from "@/lib/api/app-ai-request";

interface Signals {
  contradictions: string[];
  similarCases: { case: string; why: string }[];
  missingDocs: string[];
}

function parseSignals(text: string): Signals | null {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    const strArr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    const cases = Array.isArray(obj.similarCases)
      ? obj.similarCases
          .filter((c: unknown) => c && typeof c === "object")
          .map((c: Record<string, unknown>) => ({
            case: String(c.case ?? ""),
            why: String(c.why ?? ""),
          }))
          .filter((c: { case: string }) => c.case)
      : [];
    return {
      contradictions: strArr(obj.contradictions),
      similarCases: cases,
      missingDocs: strArr(obj.missingDocs),
    };
  } catch {
    return null;
  }
}

/**
 * AI-only supplementary risk detection layered on the deterministic pre-check.
 * The engine's score/factors are the hard floor — this card can only RAISE
 * attention (semantic contradictions, similar past failures, likely-missing
 * docs), never lower the engine's risk. On-demand; if AI is unavailable the
 * deterministic report is unaffected.
 */
export function AiRiskSignals({ buildSnapshot }: { buildSnapshot: () => Record<string, unknown> }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [signals, setSignals] = useState<Signals | null>(null);
  const { t } = useTranslation();

  async function run() {
    setState("loading");
    setSignals(null);
    try {
      const res = await request("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "risk-signals", snapshot: buildSnapshot() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSignals(parseSignals(data.text ?? ""));
      setState("done");
    } catch (error) {
      if (error instanceof AppAIClientUnavailableError) {
        setState("idle");
        return;
      }
      setState("error");
    }
  }

  const nothing =
    signals &&
    signals.contradictions.length === 0 &&
    signals.similarCases.length === 0 &&
    signals.missingDocs.length === 0;

  return (
    <div className="fg-glass rounded-2xl p-4" data-el="ai-risk-signals">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold">{t("aiSignals.title")}</h3>
        </div>
        {(state === "done" || state === "error") && (
          <button
            type="button"
            onClick={run}
            className="flex items-center gap-1 text-[11px] font-medium text-primary"
            data-el="ai-risk-signals-retry"
          >
            <RefreshCw className="h-3 w-3" /> {t("aiSignals.regenerate")}
          </button>
        )}
      </div>

      {state === "idle" && (
        <>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("aiSignals.hint")}
          </p>
          <button
            type="button"
            onClick={run}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            data-el="ai-risk-signals-run"
          >
            <Sparkles className="h-4 w-4" /> {t("aiSignals.scan")}
          </button>
        </>
      )}

      {state === "loading" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          {t("aiSignals.loading")}
        </div>
      )}

      {state === "error" && (
        <p className="mt-3 text-[12px] text-[color:var(--danger)]">
          {t("aiSignals.error")}
        </p>
      )}

      {state === "done" && nothing && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[color:var(--success)]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {t("aiSignals.nothing")}
        </div>
      )}

      {state === "done" && signals && !nothing && (
        <div className="mt-3 space-y-3">
          {signals.contradictions.length > 0 && (
            <Section
              icon={<AlertTriangle className="h-3.5 w-3.5 text-[color:var(--danger)]" />}
              label={t("aiSignals.contradictions")}
              tone="danger"
            >
              {signals.contradictions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </Section>
          )}
          {signals.missingDocs.length > 0 && (
            <Section
              icon={<FileWarning className="h-3.5 w-3.5 text-[color:var(--warning)]" />}
              label={t("aiSignals.missingDocs")}
              tone="warning"
            >
              {signals.missingDocs.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </Section>
          )}
          {signals.similarCases.length > 0 && (
            <Section icon={<History className="h-3.5 w-3.5 text-primary" />} label={t("aiSignals.similarFailures")} tone="muted">
              {signals.similarCases.map((c, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{c.case}</span>
                  {c.why && <span className="text-muted-foreground"> — {c.why}</span>}
                </li>
              ))}
            </Section>
          )}
          <p className="font-mono text-[9px] text-muted-foreground">
            {t("aiSignals.footer")}
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  label,
  tone,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "danger" | "warning" | "muted";
  children: React.ReactNode;
}) {
  const color =
    tone === "danger"
      ? "text-[color:var(--danger)]"
      : tone === "warning"
        ? "text-[color:var(--warning)]"
        : "text-primary";
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${color}`}>
        {icon}
        {label}
      </div>
      <ul className="mt-1.5 space-y-1 pl-1 text-[12px] leading-relaxed text-foreground [&>li]:list-disc [&>li]:list-inside">
        {children}
      </ul>
    </div>
  );
}
