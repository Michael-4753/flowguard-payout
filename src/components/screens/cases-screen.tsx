"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { AlertTriangle, Clock, Wrench, Copy, Check, FileCheck2, Inbox, Link as LinkIcon, Send } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import {
  fetchFailureCases,
  fetchVerificationCases,
  setVerificationStatus,
  addVerificationComment,
} from "@/lib/api";
import { useIsGuest, subscribeGuest } from "@/lib/guest/guest-session";
import { formatUsd, formatDate } from "@/lib/format";
import { copyText } from "@/utils/copy-text";
import {
  CASE_ACTOR_LABEL,
  type ChannelClass,
  type FailureCase,
  type VerificationCase,
  type VerificationStatus,
} from "@/lib/engine/types";
import { channelLabel, verificationStatusLabel } from "@/lib/i18n-labels";
import { cn } from "@/utils/utils";
import { AiInsightCard } from "@/components/ai/ai-insight-card";

type Tab = "verification" | "library";

export function CasesScreen() {
  const [tab, setTab] = useState<Tab>("verification");
  const { t } = useTranslation();

  return (
    <section className="pt-1" data-el="cases">
      <h1 className="text-2xl font-bold tracking-tight">{t("cases.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("cases.subtitle")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-[color:var(--fg-soft)] p-1" data-el="cases-tabs">
        <TabButton active={tab === "verification"} onClick={() => setTab("verification")}>
          {t("cases.tabVerification")}
        </TabButton>
        <TabButton active={tab === "library"} onClick={() => setTab("library")}>
          {t("cases.tabLibrary")}
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
  const { t } = useTranslation();
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
      <div className="mt-4" data-el="verification-empty">
        <EmptyState
          icon={Inbox}
          title={t("cases.emptyTitle")}
          description={
            <Trans i18nKey="cases.emptyDesc" components={[<b key="0" className="text-foreground" />]} />
          }
        />
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
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  async function copy() {
    const ok = await copyText(record.template);
    setCopied(ok ? "ok" : "fail");
    setTimeout(() => setCopied("idle"), 1800);
  }

  async function mark(status: VerificationStatus) {
    if (busy) return;
    // Guard against premature resolution: if the payee hasn't actually replied
    // on this case yet, confirm before verifying / clarifying (avoids the
    // "resolve with no reply" mistake).
    if (status === "verified" || status === "clarified") {
      const hasReply = (record.timeline ?? []).some(
        (e) => e.actor === "supplier" && e.kind === "comment",
      );
      if (!hasReply) {
        const verb = status === "verified" ? t("cases.confirmVerified") : t("cases.confirmClarified");
        const ok = window.confirm(
          t("cases.confirmNoReply", { verb }),
        );
        if (!ok) return;
      }
    }
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
          <div className="flex min-w-0 items-center gap-2">
            <FileCheck2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate text-sm font-semibold">{record.supplierName}</span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {t("cases.openedOn", { factor: record.factorTitle, date: formatDate(record.createdAt) })}
          </p>
        </div>
        <StatusChip status={record.status} />
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 -mx-1 inline-flex min-h-[36px] items-center px-1 text-[11px] font-medium text-primary"
        data-el="verification-toggle"
      >
        {open ? t("cases.hideMessage") : t("cases.viewMessage")}
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
          {copied === "ok" ? (
            <Check className="h-3 w-3 text-[color:var(--success)]" />
          ) : copied === "fail" ? (
            <AlertTriangle className="h-3 w-3 text-[color:var(--danger)]" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied === "ok" ? t("cases.copied") : copied === "fail" ? t("cases.copyFailed") : t("cases.copy")}
        </button>
        {record.status === "open" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => mark("verified")}
              title={t("cases.markVerifiedTitle")}
              className="rounded-full border border-[color:var(--success)]/50 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--success)] transition-colors hover:bg-[color:var(--success)]/10 disabled:opacity-60"
              data-el="verification-verified"
            >
              {t("cases.markVerified")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => mark("clarified")}
              title={t("cases.markClarifiedTitle")}
              className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-primary/10 disabled:opacity-60"
              data-el="verification-clarified"
            >
              {t("cases.markClarified")}
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
            {t("cases.reopen")}
          </button>
        )}
      </div>

      {/* Pain point ②: AI drafts a verification follow-up (closes the loop with the AI briefing above). */}
      {record.status === "open" && (
        <div className="mt-3">
          <AiInsightCard
            kind="return"
            title={t("cases.aiTitle")}
            cta={t("cases.aiCta")}
            hint={t("cases.aiHint")}
            loadingLabel={t("cases.aiLoading")}
            actionsLabel={t("cases.aiActions")}
            buildSnapshot={() => ({
              supplierName: record.supplierName,
              factorTitle: record.factorTitle,
              status: record.status,
              hasReplied: (record.timeline ?? []).some((e) => e.actor === "supplier" && e.kind === "comment"),
              existingTemplate: record.template.slice(0, 600),
            })}
          />
        </div>
      )}

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
  const [copied, setCopied] = useState<"read" | "write" | "fail" | null>(null);
  const guest = useIsGuest();
  const { t } = useTranslation();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function copy(kind: "read" | "write", token: string) {
    const ok = await copyText(`${origin}/case/${token}`);
    setCopied(ok ? kind : "fail");
    setTimeout(() => setCopied(null), 1800);
  }

  // Guest (offline) cases live only on this device and are never persisted, so a
  // share link would be invalid for anyone else. Hide the share buttons and
  // prompt the user to sign in before a shareable link can be generated.
  if (guest) {
    return (
      <div
        className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-[10px] text-muted-foreground"
        data-el="verification-share-guest"
      >
        <LinkIcon className="h-3 w-3 shrink-0" />
        <span>{t("cases.guestShare")}</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3" data-el="verification-share">
      <span className="text-[10px] text-muted-foreground">{t("cases.share")}</span>
      <button
        type="button"
        onClick={() => copy("read", record.readToken)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-primary/10"
        data-el="verification-copy-read"
      >
        {copied === "read" ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <LinkIcon className="h-3 w-3" />}
        {copied === "read" ? t("cases.copied") : t("cases.readOnlyLink")}
      </button>
      <button
        type="button"
        onClick={() => copy("write", record.writeToken)}
        className="flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
        data-el="verification-copy-write"
      >
        {copied === "write" ? <Check className="h-3 w-3 text-[color:var(--success)]" /> : <LinkIcon className="h-3 w-3" />}
        {copied === "write" ? t("cases.copied") : t("cases.writeLink")}
      </button>
      {copied === "fail" && (
        <span className="flex w-full items-center gap-1 text-[10px] text-[color:var(--danger)]">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {t("cases.copyFailedManual")}
        </span>
      )}
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
  const { t } = useTranslation();

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
        placeholder={t("cases.internalNote")}
        className="min-w-0 flex-1 resize-none rounded-xl border border-border bg-[color:var(--fg-soft)] px-3 py-2 text-[12px]"
      />
      <button
        type="button"
        disabled={busy || !msg.trim()}
        onClick={send}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
        data-el="verification-add-comment"
      >
        <Send className="h-3 w-3" /> {t("cases.post")}
      </button>
    </div>
  );
}

function StatusChip({ status }: { status: VerificationStatus }) {
  const { t } = useTranslation();
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
      {verificationStatusLabel(t, status)}
    </span>
  );
}

/* ---------------- Failure library ---------------- */

const FILTERS: (ChannelClass | "all")[] = ["all", "stablecoin-direct", "local-fiat"];

function LibraryTab() {
  const user = useEazo((s) => s.auth.user);
  const guest = useIsGuest();
  const { t } = useTranslation();
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
      <div className="mt-4 flex flex-wrap items-center gap-2 pb-1" data-el="cases-filters">
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
            {f === "all" ? t("cases.allChannels") : channelLabel(t, f)}
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
                    {c.corridor} · {channelLabel(t, c.channelClass)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold">{formatUsd(c.amountUsd)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
                <span>{t("cases.failedAt")} <b className="text-foreground">{c.failedAt}</b></span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden /> {t("cases.heldDays", { days: c.heldDays })}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 p-2.5">
                <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {t("cases.remediation")}
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
