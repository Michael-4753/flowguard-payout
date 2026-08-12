"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Wrench } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { AppShell } from "@/components/shell/app-shell";
import { LoadingBlock } from "@/components/shared/loading-block";
import { fetchFailureCases } from "@/lib/api";
import { formatUsd } from "@/lib/format";
import { CHANNEL_CLASS_LABEL, type ChannelClass, type FailureCase } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

const FILTERS: (ChannelClass | "all")[] = ["all", "stablecoin-direct", "local-fiat"];

export default function CasesPage() {
  return (
    <AppShell>
      <CasesBody />
    </AppShell>
  );
}

function CasesBody() {
  const user = useEazo((s) => s.auth.user);
  const [cases, setCases] = useState<FailureCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChannelClass | "all">("all");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      setLoading(true);
      try {
        const res = await fetchFailureCases();
        if (alive) setCases(res);
      } catch {
        if (alive) setCases([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const filtered = useMemo(
    () => (filter === "all" ? cases : cases.filter((c) => c.channelClass === filter)),
    [cases, filter],
  );

  return (
    <section className="pt-1" data-el="cases">
      <h1 className="text-2xl font-bold tracking-tight">Failure-case library</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real return scenarios, where they failed, and the fix to avoid a repeat.
      </p>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1" data-el="cases-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {f === "all" ? "All channels" : CHANNEL_CLASS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={4} />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((c) => (
            <article key={c.id} className="fg-glass rounded-2xl p-4" data-el="case-item">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[color:var(--danger)]">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-sm font-semibold text-foreground">{c.reason}</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {c.corridor} · {CHANNEL_CLASS_LABEL[c.channelClass]}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold">{formatUsd(c.amountUsd)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
                <span>Failed at: <b className="text-foreground">{c.failedAt}</b></span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden /> held {c.heldDays}d
                </span>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 p-2.5">
                <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Remediation
                  </div>
                  <p className="mt-0.5 text-xs text-foreground">{c.remediation}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
