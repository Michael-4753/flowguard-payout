"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { request } from "@/lib/api/request";
import { AppAIClientUnavailableError } from "@/lib/api/app-ai-request";
import type { RiskAssessment, Supplier } from "@/lib/engine/types";

interface Briefing {
  summary: string;
  actions: string[];
}

/** Extract the JSON briefing from the model output (tolerates stray fences). */
function parseBriefing(text: string): Briefing | null {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    const actions = Array.isArray(obj.actions) ? obj.actions.filter((a: unknown) => typeof a === "string") : [];
    if (typeof obj.summary !== "string") return null;
    return { summary: obj.summary, actions };
  } catch {
    return null;
  }
}

/**
 * LLM compliance briefing (DeepSeek via App AI). Layered on top of the
 * deterministic pre-check — the score/factors are already shown; this adds a
 * plain-language "why + how to fix" on demand. Fully optional: if AI is
 * unavailable the deterministic report still stands.
 */
export function AiPrecheckExplainer({
  supplier,
  risk,
}: {
  supplier: Supplier;
  risk: RiskAssessment;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [rawFallback, setRawFallback] = useState("");

  async function run() {
    setState("loading");
    setBriefing(null);
    setRawFallback("");
    // Compact, PII-light snapshot for the model.
    const snapshot = {
      country: supplier.country,
      currency: supplier.currency,
      entityType: supplier.entityType,
      accountStatus: supplier.accountStatus,
      restrictedRegion: supplier.restrictedRegion,
      bankBlacklisted: supplier.bankBlacklisted,
      score: risk.score,
      level: risk.level,
      returnProbability: Number(risk.returnProbability.toFixed(2)),
      chokepointBank: risk.chokepointBank,
      hitFactors: risk.factors.filter((f) => f.hit).map((f) => ({ title: f.title, points: f.points })),
    };
    try {
      const res = await request("/api/precheck/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = parseBriefing(data.text ?? "");
      if (parsed) {
        setBriefing(parsed);
      } else {
        setRawFallback(String(data.text ?? "").slice(0, 600));
      }
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
    <div className="fg-glass rounded-2xl p-4" data-el="ai-explainer">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold">AI compliance briefing</h3>
        </div>
        {(state === "done" || state === "error") && (
          <button
            type="button"
            onClick={run}
            className="flex items-center gap-1 text-[11px] font-medium text-primary"
            data-el="ai-explainer-retry"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
        )}
      </div>

      {state === "idle" && (
        <>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Get a plain-language explanation and fix steps from DeepSeek, based on the checks above.
          </p>
          <button
            type="button"
            onClick={run}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            data-el="ai-explainer-run"
          >
            <Sparkles className="h-4 w-4" /> Explain with AI
          </button>
        </>
      )}

      {state === "loading" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          Analyzing the corridor…
        </div>
      )}

      {state === "error" && (
        <p className="mt-3 text-[12px] text-[color:var(--danger)]">
          Could not generate the briefing. Tap Regenerate to retry — the deterministic report above is unaffected.
        </p>
      )}

      {state === "done" && briefing && (
        <div className="mt-3 space-y-3">
          <p className="text-[13px] leading-relaxed text-foreground">{briefing.summary}</p>
          {briefing.actions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Recommended actions
              </div>
              <ol className="mt-1.5 space-y-1.5">
                {briefing.actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-muted-foreground">
                    <span className="font-mono text-primary">{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="font-mono text-[9px] text-muted-foreground">Generated by DeepSeek · verify before sending</p>
        </div>
      )}

      {state === "done" && !briefing && rawFallback && (
        <p className="mt-3 whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">{rawFallback}</p>
      )}
    </div>
  );
}
