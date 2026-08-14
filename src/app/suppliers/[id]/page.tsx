"use client";

import { use, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Send, ClipboardCheck, Circle } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { AppShell } from "@/components/shell/app-shell";
import { PaymentRow } from "@/components/shared/payment-row";
import { LoadingBlock } from "@/components/shared/loading-block";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/shared/badges";
import { fetchSupplier } from "@/lib/api";
import { corridorRequirements } from "@/lib/engine";
import { formatPercent, formatHours } from "@/lib/format";
import { CHANNEL_CLASS_LABEL } from "@/lib/engine/types";
import type { PaymentRecord, Supplier } from "@/lib/engine/types";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <SupplierDetailBody id={id} />
    </AppShell>
  );
}

const ACCOUNT_KEY: Record<string, string> = {
  active: "payeeDetail.accountActive",
  dormant: "payeeDetail.accountDormant",
  unverified: "payeeDetail.accountUnverified",
};

function SupplierDetailBody({ id }: { id: string }) {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const { t } = useTranslation();
  const [data, setData] = useState<{ supplier: Supplier; payments: PaymentRecord[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      setLoading(true);
      try {
        const res = await fetchSupplier(id);
        if (alive) setData(res);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="pt-4">
        <LoadingBlock rows={3} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fg-glass mt-6 rounded-2xl p-6 text-center text-sm text-muted-foreground">
        {t("payeeDetail.notFound")}
      </div>
    );
  }

  const { supplier, payments } = data;
  const returned = payments.filter((p) => p.status === "returned" || p.riskLevel === "high");
  const requirements = corridorRequirements(supplier);

  return (
    <section className="pt-1" data-el="supplier-detail">
      <button
        type="button"
        onClick={() => router.push("/suppliers")}
        className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"
        data-el="supplier-back"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("payeeDetail.back")}
      </button>

      <div className="fg-glass rounded-[24px] p-5" data-el="supplier-header">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{supplier.name}</h1>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{supplier.country}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <RiskBadge level={supplier.riskTag} />
            {supplier.restrictedRegion && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/15 px-2 py-1 text-[10px] font-semibold text-[color:var(--danger)]">
                <AlertTriangle className="h-3 w-3" />
                {t("payeeDetail.restricted")}
              </span>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label={t("payeeDetail.beneficiaryBank")} value={supplier.bankName} danger={supplier.bankBlacklisted} />
          <Field label={t("payeeDetail.accountStatus")} value={t(ACCOUNT_KEY[supplier.accountStatus])} danger={supplier.accountStatus !== "active"} />
          <Field label={t("payeeDetail.swift")} value={supplier.swift} mono />
          <Field label={t("payeeDetail.iban")} value={supplier.iban} mono />
          <Field label={t("payeeDetail.currency")} value={supplier.currency} mono />
          <Field label={t("payeeDetail.preferredChannel")} value={CHANNEL_CLASS_LABEL[supplier.preferredChannel]} />
          <Field
            label={t("payeeDetail.returnRate")}
            value={formatPercent(supplier.historicalReturnRate, 1)}
            mono
            danger={supplier.historicalReturnRate > 0.05}
          />
          <Field label={t("payeeDetail.avgEta")} value={formatHours(supplier.avgSettlementHours)} mono />
        </dl>

        <button
          type="button"
          onClick={() => router.push(`/pay?supplier=${supplier.id}`)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]"
          data-el="supplier-pay"
        >
          <Send className="h-4 w-4" /> {t("payeeDetail.payThisPayee")}
        </button>
      </div>

      {/* Payout requirements checklist (pain point 3: stop re-learning each bank's rules) */}
      <div className="fg-glass mt-4 rounded-2xl p-4" data-el="payout-requirements">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-bold">{t("payeeDetail.payoutRequirements")}</h2>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("payeeDetail.payoutRequirementsDesc")}
        </p>
        <ul className="mt-3 space-y-2.5">
          {requirements.map((req) => (
            <li key={req.id} className="flex gap-2.5" data-el="requirement">
              {req.mandatory ? (
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--warning)]"
                  aria-hidden
                />
              ) : (
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium">{req.label}</span>
                  {req.mandatory ? (
                    <span className="rounded-full bg-[color:var(--warning)]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[color:var(--warning)]">
                      {t("payeeDetail.required")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[color:var(--fg-soft)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("payeeDetail.recommended")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{req.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {returned.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 p-4">
          <div className="text-xs font-semibold text-[color:var(--danger)]">
            {t("payeeDetail.failureHistory", { count: returned.length })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("payeeDetail.failureHistoryDesc")}
          </p>
        </div>
      )}

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground">{t("payeeDetail.recentPayments")}</h2>
      {payments.length === 0 ? (
        <EmptyState
          icon={Send}
          title={t("payeeDetail.emptyTitle")}
          description={t("payeeDetail.emptyDesc")}
          action={{ label: t("payeeDetail.newPayment"), onClick: () => router.push(`/pay?supplier=${id}`) }}
        />
      ) : (
        <div className="space-y-2.5">
          {payments.map((p) => (
            <PaymentRow key={p.id} record={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
  danger,
}: {
  label: string;
  value: string;
  mono?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 truncate text-sm ${mono ? "font-mono" : ""}`}
        style={danger ? { color: "var(--danger)" } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
