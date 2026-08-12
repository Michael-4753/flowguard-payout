"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Wrench, Copy, Check, FileCheck2, Inbox, Link as LinkIcon, Send } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { LoadingBlock } from "@/components/shared/loading-block";
import {
  fetchFailureCases,
  fetchVerificationCases,
  setVerificationStatus,
  addVerificationComment,
} from "@/lib/api";
import { useIsGuest, subscribeGuest } from "@/lib/guest/guest-session";
import { formatUsd, formatDate } from "@/lib/format";
import {
  CHANNEL_CLASS_LABEL,
  CASE_ACTOR_LABEL,
  VERIFICATION_STATUS_LABEL,
  type ChannelClass,
  type FailureCase,
  type VerificationCase,
  type VerificationStatus,
} from "@/lib/engine/types";
import { cn } from "@/utils/utils";

type Tab = "verification" | "library";

export function CasesScreen() {
  const [tab, setTab] = useState<Tab>("verification");

  return (
    <section className="pt-1" data-el="cases">
      <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track payee verification requests and study real return scenarios.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-[color:var(--fg-soft)] p-1" data-el="cases-tabs">
        <TabButton active={tab === "verification"} onClick={() => setTab("verification")}>
          Verification requests
        </TabButton>
        <TabButton active={tab === "library"} onClick={() => setTab("library")}>
          Failure library
        </TabButton>
      </div>

      {tab === "verification" ? <VerificationTab /> : <LibraryTab />}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground shadow-[var(--fg-shadow-sm)]" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Verification requests ---------------- */

function VerificationTab() {
  const user = useEazo((s) => s.auth.user);
  const guest = useIsGuest();
  const hasIdentity = Boolean(user) || guest;
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!hasIdentity) {
      setCases([]);
      setLoading(false);
      return;
    }
    try {
      setCases(await fetchVerificationCases());
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (alive) await load();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIdentity]);

  useEffect(() => {
    if (!guest) return;
    return subscribeGuest(() => void load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest]);

  if (loading) {
    return (
      <div className="mt-4">
        <LoadingBlock rows={3} />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div
        className="fg-glass mt-4 flex flex-col items-center gap-2 rounded-2xl p-6 text-center"
        data-el="verification-empty"
      >
        <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No verification requests yet. In a payment pre-check, open a data-quality risk factor and
          tap <b className="text-foreground">Generate verification request</b>.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {cases.map((c) => (
        <VerificationCard key={c.id} record={c} onChange={setCases} />
      ))}
    </div>
  );
}

function VerificationCard({
  record,
  onChange,
}: {
  record: VerificationCase;
  onChange: React.Dispatch<React.SetStateAction<VerificationCase[]>>;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(record.template);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function mark(status: VerificationStatus) {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await setVerificationStatus(record.id, status);
      onChange((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="fg-glass rounded-2xl p-4" data-el="verification-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate text-sm font-semibold">{record.supplierName}</span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {record.factorTitle} · opened {formatDate(record.createdAt)}
          </p>
        </div>
        <StatusChip status={record.status} />
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-[11px] font-medium text-primary"
        data-el="verification-toggle"
      >
        {open ? "Hide message" : "View request message"}
      </button>

      {open && (
        <textarea
          readOnly
          value={record.template}
          rows={6}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-[color:var(--fg-soft)] p-2.5 font-mono text-[11px] leading-relaxed"
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-primary/10"
          data-el="verification-copy"
        >
          {copied ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
        {record.status === "open" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => mark("verified")}
              className="rounded-full border border-[color:var(--success)]/50 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--success)] transition-colors hover:bg-[color:var(--success)]/10 disabled:opacity-60"
              data-el="verification-verified"
            >
              Mark verified
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => mark("clarified")}
              className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-primary/10 disabled:opacity-60"
              data-el="verification-clarified"
            >
              Mark clarified
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => mark("open")}
            className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 disabled:opacity-60"
            data-el="verification-reopen"
          >
            Reopen
          </button>
        )}
      </div>

      <ShareLinks record={record} />

      {record.timeline.length > 0 && (
        <ol className="mt-3 space-y-2 border-t border-border pt-3" data-el="verification-timeline">
          {record.timeline.map((ev) => (
            <li key={ev.id} className="flex gap-2 text-[11px]">
              <span className="shrink-0 font-semibold">{CASE_ACTOR_LABEL[ev.actor]}</span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-foreground">
                {ev.message}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                {formatDate(ev.at)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <CommentBox record={record} onChange={onChange} />
    </article>
  );
}

function ShareLinks({ record }: { record: VerificationCase }) {
  const [copied, setCopied] = useState<"read" | "write" | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function copy(kind: "read" | "write", token: string) {
    try {
      await navigator.clipboard.writeText(`${origin}/case/${token}`);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3" data-el="verification-share">
      <span className="text-[10px] text-muted-foreground">Share:</span>
      <button
        type="button"
        onClick={() => copy("read", record.readToken)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-primary/10"
        data-el="verification-copy-read"
      >
        {copied === "read" ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <LinkIcon className="h-3 w-3" />}
        {copied === "read" ? "Copied" : "Read-only link"}
      </button>
      <button
        type="button"
        onClick={() => copy("write", record.writeToken)}
        className="flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
        data-el="verification-copy-write"
      >
        {copied === "write" ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <LinkIcon className="h-3 w-3" />}
        {copied === "write" ? "Copied" : "Write link (business/supplier)"}
      </button>
    </div>
  );
}

function CommentBox({
  record,
  onChange,
}: {
  record: VerificationCase;
  onChange: React.Dispatch<React.SetStateAction<VerificationCase[]>>;
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!msg.trim() || busy) return;
    setBusy(true);
    try {
      const updated = await addVerificationComment(record.id, msg.trim());
      onChange((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setMsg("");
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex items-end gap-2">
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        rows={1}
        placeholder="Add an internal note…"
        className="min-w-0 flex-1 resize-none rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-[12px]"
      />
      <button
        type="button"
        disabled={busy || !msg.trim()}
        onClick={send}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
        data-el="verification-add-comment"
      >
        <Send className="h-3 w-3" /> Post
      </button>
    </div>
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
      data-el="verification-status"
    >
      {VERIFICATION_STATUS_LABEL[status]}
    </span>
  );
}

/* ---------------- Failure library ---------------- */

const FILTERS: (ChannelClass | "all")[] = ["all", "stablecoin-direct", "local-fiat"];

function LibraryTab() {
  const user = useEazo((s) => s.auth.user);
  const guest = useIsGuest();
  const [cases, setCases] = useState<FailureCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChannelClass | "all">("all");

  useEffect(() => {
    if (!user && !guest) return;
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
  }, [user, guest]);

  const filtered = useMemo(
    () => (filter === "all" ? cases : cases.filter((c) => c.channelClass === filter)),
    [cases, filter],
  );

  return (
    <>
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
    </>
  );
}
