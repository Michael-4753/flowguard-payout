"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Clock, MessageSquare, Send, Lock, CheckCircle2 } from "lucide-react";
import {
  CASE_ACTOR_LABEL,
  VERIFICATION_STATUS_LABEL,
  type CaseActor,
  type VerificationCase,
  type VerificationStatus,
} from "@/lib/engine/types";
import { cn } from "@/utils/utils";

interface Payload {
  case: VerificationCase;
  canWrite: boolean;
}

/**
 * Public shared-case page. No login — the URL token is the access control.
 * Read-only visitors see the bank's raw description + timeline; write-token
 * holders (business / supplier) can post updates directly, removing the
 * "relay by word of mouth" chain.
 */
export function PublicCaseScreen({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/case/${encodeURIComponent(token)}`, { cache: "no-store" });
      if (!res.ok) {
        setState("notfound");
        return;
      }
      setData((await res.json()) as Payload);
      setState("ready");
    } catch {
      setState("notfound");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading") {
    return <Centered>Loading shared case…</Centered>;
  }
  if (state === "notfound" || !data) {
    return <Centered>This shared link is invalid or has expired.</Centered>;
  }

  const c = data.case;

  return (
    <div className="min-h-[100svh] bg-background px-4 py-8" data-el="public-case">
      <div className="mx-auto w-full max-w-[640px] space-y-4">
        <header className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-mono text-base font-bold text-primary-foreground">
            F
          </span>
          <div>
            <div className="text-sm font-bold tracking-tight">FlowGuard · Verification case</div>
            <div className="text-[11px] text-muted-foreground">
              Shared securely — {data.canWrite ? "you can post updates" : "read-only view"}
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="fg-glass rounded-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-base font-bold">{c.supplierName}</div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{c.factorTitle}</div>
            </div>
            <StatusChip status={c.status} />
          </div>
        </section>

        {/* Bank-side raw description (first-hand) */}
        <section className="rounded-2xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-4">
          <div className="flex items-center gap-2 text-[color:var(--warning)]">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            <h2 className="text-sm font-bold">Bank-side risk description</h2>
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground">
            {c.bankRawDescription}
          </pre>
        </section>

        {/* Write actions */}
        {data.canWrite ? (
          <WritePanel token={token} status={c.status} onDone={load} />
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-[color:var(--fg-soft)] p-3 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Read-only link. Ask the sender for the write link to post an update.
          </div>
        )}

        {/* Timeline */}
        <section className="fg-glass rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-bold">Activity</h2>
          </div>
          <ol className="mt-3 space-y-3">
            {c.timeline.map((ev) => (
              <li key={ev.id} className="flex gap-2.5" data-el="timeline-event">
                <span className="mt-0.5 shrink-0">
                  {ev.kind === "comment" ? (
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  ) : ev.kind === "status" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold">{CASE_ACTOR_LABEL[ev.actor]}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {new Date(ev.at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] text-foreground">
                    {ev.message}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function WritePanel({
  token,
  status,
  onDone,
}: {
  token: string;
  status: VerificationStatus;
  onDone: () => Promise<void>;
}) {
  const [actor, setActor] = useState<CaseActor>("supplier");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/public/case/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, actor }),
      });
      setMessage("");
      await onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fg-glass rounded-2xl p-4" data-el="public-write">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Posting as</span>
        {(["business", "supplier"] as CaseActor[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setActor(a)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              actor === a ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
            )}
          >
            {CASE_ACTOR_LABEL[a]}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Reply with the confirmed detail (e.g. correct legal name / IBAN)…"
        className="mt-3 w-full resize-none rounded-xl border border-border bg-[color:var(--fg-soft)] p-2.5 text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !message.trim()}
          onClick={() => post({ action: "comment", message: message.trim() })}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          data-el="public-comment"
        >
          <Send className="h-3.5 w-3.5" /> Post reply
        </button>
        {status !== "verified" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: "status", status: "verified" })}
            className="rounded-full border border-[color:var(--success)]/50 px-3 py-2 text-[11px] font-semibold text-[color:var(--success)] disabled:opacity-60"
            data-el="public-verified"
          >
            Confirm details correct
          </button>
        )}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "verified"
          ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/15 text-[color:var(--success)]"
          : status === "clarified"
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
      )}
    >
      {VERIFICATION_STATUS_LABEL[status]}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100svh] place-items-center bg-background px-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
