"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Flag, ShieldCheck } from "lucide-react";
import {
  useMilestonePrograms,
  setMilestoneStatus,
  resetMilestones,
  programProgress,
  type Milestone,
  type MilestoneProgram,
  type MilestoneStatus,
} from "@/lib/milestones/milestone-store";
import { countryLabel } from "@/lib/i18n-labels";

const STATUS_STYLE: Record<MilestoneStatus, string> = {
  pending: "bg-[color:var(--fg-soft)] text-muted-foreground",
  in_progress: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  awaiting_check: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  verified: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  instructed: "bg-[color:var(--primary)]/15 text-[color:var(--primary)]",
};

function usd(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function MilestonesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const programs = useMilestonePrograms();

  function statusLabel(s: MilestoneStatus): string {
    return t(
      s === "pending" ? "milestones.statusPending"
      : s === "in_progress" ? "milestones.statusInProgress"
      : s === "awaiting_check" ? "milestones.statusAwaiting"
      : s === "verified" ? "milestones.statusVerified"
      : "milestones.statusInstructed",
    );
  }

  return (
    <section className="pt-1" data-el="milestones-screen">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground">{t("milestones.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("milestones.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => { if (window.confirm(t("milestones.resetConfirm"))) { resetMilestones(); toast.success(t("milestones.reset")); } }}
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-[color:var(--fg-soft)]"
        >
          {t("milestones.reset")}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[color:var(--primary)]/25 bg-[color:var(--primary)]/5 px-3.5 py-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[color:var(--primary)]" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("milestones.complianceNote")}</p>
      </div>

      {programs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold text-foreground">{t("milestones.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("milestones.emptyDesc")}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} statusLabel={statusLabel} onGenerate={(m) => {
              setMilestoneStatus(p.id, m.id, "instructed");
              router.push(`/pay?supplier=${encodeURIComponent(p.supplierId)}&amount=${m.amountUsd}`);
            }} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProgramCard({
  program,
  statusLabel,
  onGenerate,
}: {
  program: MilestoneProgram;
  statusLabel: (s: MilestoneStatus) => string;
  onGenerate: (m: Milestone) => void;
}) {
  const { t } = useTranslation();
  const { done, total, releasedUsd, totalUsd } = programProgress(program);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-base font-bold text-foreground">
            <Flag className="h-4 w-4 text-[color:var(--primary)]" /> {program.project}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{program.supplierName} · {countryLabel(t, { id: program.supplierId, country: program.supplierCountry })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-foreground">{t("milestones.progress", { done, total })}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{t("milestones.released", { released: usd(releasedUsd), total: usd(totalUsd) })}</p>
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--fg-soft)]">
        <div className="h-full rounded-full bg-[color:var(--primary)] transition-[width]" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-2.5">
        {program.milestones.map((m) => (
          <MilestoneRow key={m.id} programId={program.id} milestone={m} statusLabel={statusLabel} onGenerate={onGenerate} />
        ))}
      </div>
    </div>
  );
}

function MilestoneRow({
  programId,
  milestone: m,
  statusLabel,
  onGenerate,
}: {
  programId: string;
  milestone: Milestone;
  statusLabel: (s: MilestoneStatus) => string;
  onGenerate: (m: Milestone) => void;
}) {
  const { t } = useTranslation();
  const [evidence, setEvidence] = useState("");

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{m.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="text-foreground/70">{t("milestones.condition")}：</span>{m.condition}
          </p>
          {m.evidence && <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">✓ {m.evidence}</p>}
        </div>
        <div className="shrink-0 text-right">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[m.status]}`}>
            {statusLabel(m.status)}
          </span>
          <p className="mt-1 font-mono text-xs font-bold text-foreground">{usd(m.amountUsd)} USD</p>
        </div>
      </div>

      {/* actions by status */}
      {m.status === "pending" && (
        <button type="button" onClick={() => setMilestoneStatus(programId, m.id, "in_progress")}
          className="mt-2.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-[color:var(--fg-soft)]">
          {t("milestones.start")}
        </button>
      )}
      {m.status === "in_progress" && (
        <button type="button" onClick={() => setMilestoneStatus(programId, m.id, "awaiting_check")}
          className="mt-2.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-[color:var(--fg-soft)]">
          {t("milestones.submitCheck")}
        </button>
      )}
      {m.status === "awaiting_check" && (
        <div className="mt-2.5 space-y-2">
          <input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder={t("milestones.evidencePlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-[color:var(--primary)]"
          />
          <button type="button" title={t("milestones.verifyTitle")}
            onClick={() => setMilestoneStatus(programId, m.id, "verified", evidence.trim() || undefined)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t("milestones.verify")}
          </button>
        </div>
      )}
      {m.status === "verified" && (
        <div className="mt-2.5 rounded-xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-3">
          <p className="text-xs font-bold text-[color:var(--primary)]">{t("milestones.reminderTitle")}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t("milestones.reminderBody")}</p>
          <button type="button" onClick={() => onGenerate(m)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--primary)] px-3 py-1.5 text-xs font-semibold text-[color:var(--primary-foreground)] transition hover:opacity-90">
            {t("milestones.generateInstruction")} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {m.status === "instructed" && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t("milestones.statusInstructed")}
        </p>
      )}
    </div>
  );
}
