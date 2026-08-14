"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { request } from "@/lib/api/request";
import { AppAIClientUnavailableError } from "@/lib/api/app-ai-request";

export type InsightKind = "flow" | "return" | "corridor" | "reconcile" | "route";

interface Insight {
  summary: string;
  actions: string[];
}

/** Extract the JSON insight from model output (tolerates stray fences). */
function parseInsight(text: string): Insight | null {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    const actions = Array.isArray(obj.actions)
      ? obj.actions.filter((a: unknown) => typeof a === "string")
      : [];
    if (typeof obj.summary !== "string") return null;
    return { summary: obj.summary, actions };
  } catch {
    return null;
  }
}

/**
 * Reusable AI insight card backed by /api/ai/insight. The deterministic engine
 * stays the source of truth; this adds an on-demand plain-language layer. Fully
 * optional — if AI is unavailable the deterministic UI is unaffected.
 */
export function AiInsightCard({
  kind,
  title,
  cta,
  hint,
  loadingLabel,
  actionsLabel,
  buildSnapshot,
  className = "",
}: {
  kind: InsightKind;
  title: string;
  cta: string;
  hint: string;
  loadingLabel: string;
  actionsLabel?: string;
  /** Build the compact, PII-light snapshot sent to the model. */
  buildSnapshot: () => Record<string, unknown>;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [rawFallback, setRawFallback] = useState("");
  const { t } = useTranslation();
  const resolvedActionsLabel = actionsLabel ?? t("aiCard.recommendedActions");

  async function run() {
    setState("loading");
    setInsight(null);
    setRawFallback("");
    try {
      const res = await request("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, snapshot: buildSnapshot() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = parseInsight(data.text ?? "");
      if (parsed) setInsight(parsed);
      else setRawFallback(String(data.text ?? "").slice(0, 600));
      setState("done");
    } catch (error) {
      if (error instanceof AppAIClientUnavailableError) {
        setState("idle");
        return; // toast already shown by the wrapper
      }
      setState("error");
    }
  }

  return (
    <div className={`fg-glass rounded-2xl p-4 ${className}`} data-el={`ai-insight-${kind}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        {(state === "done" || state === "error") && (
          <button
            type="button"
            onClick={run}
            className="flex items-center gap-1 text-[11px] font-medium text-primary"
            data-el={`ai-insight-${kind}-retry`}
          >
            <RefreshCw className="h-3 w-3" /> {t("aiCard.regenerate")}
          </button>
        )}
      </div>

      {state === "idle" && (
        <>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          <button
            type="button"
            onClick={run}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            data-el={`ai-insight-${kind}-run`}
          >
            <Sparkles className="h-4 w-4" /> {cta}
          </button>
        </>
      )}

      {state === "loading" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          {loadingLabel}
        </div>
      )}

      {state === "error" && (
        <p className="mt-3 text-[12px] text-[color:var(--danger)]">
          {t("aiCard.error")}
        </p>
      )}

      {state === "done" && insight && (
        <div className="mt-3 space-y-3">
          <p className="text-[13px] leading-relaxed text-foreground">{insight.summary}</p>
          {insight.actions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                {resolvedActionsLabel}
              </div>
              <ol className="mt-1.5 space-y-1.5">
                {insight.actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-muted-foreground">
                    <span className="font-mono text-primary">{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="font-mono text-[9px] text-muted-foreground">{t("aiCard.generatedBy")}</p>
        </div>
      )}

      {state === "done" && !insight && rawFallback && (
        <p className="mt-3 whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">{rawFallback}</p>
      )}
    </div>
  );
}
