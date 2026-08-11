"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, AlertTriangle, Send } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { AppShell } from "@/components/shell/app-shell";
import { PaymentRow } from "@/components/shared/payment-row";
import { LoadingBlock } from "@/components/shared/loading-block";
import { fetchSupplier } from "@/lib/api";
import { formatPercent, formatHours } from "@/lib/format";
import { useCurrentLocale } from "@/lib/use-locale";
import type { PaymentRecord, Supplier } from "@/lib/engine/types";

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AppShell>
      <SupplierDetailBody id={id} />
    </AppShell>
  );
}

function SupplierDetailBody({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useCurrentLocale();
  const user = useEazo((s) => s.auth.user);
  const [data, setData] = useState<{ supplier: Supplier; payments: PaymentRecord[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    fetchSupplier(id)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
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
        {t("suppliers.notFound")}
      </div>
    );
  }

  const { supplier, payments } = data;
  const chainLabel = `${supplier.preferredChain.toUpperCase()} · ${supplier.preferredCoin}`;

  return (
    <section className="pt-1" data-el="supplier-detail">
      <button
        type="button"
        onClick={() => router.push("/suppliers")}
        className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"
        data-el="supplier-back"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("common.back")}
      </button>

      <div className="fg-glass rounded-[24px] p-5" data-el="supplier-header">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{supplier.name}</h1>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{supplier.region}</p>
          </div>
          {supplier.restrictedRegion && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/15 px-2 py-1 text-[10px] font-semibold text-[color:var(--danger)]">
              <AlertTriangle className="h-3 w-3" />
              {t("suppliers.restricted")}
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label={t("suppliers.network")} value={chainLabel} mono />
          <Field label={t("suppliers.payments")} value={`${supplier.paymentCount}`} mono />
          <Field
            label={t("suppliers.returnRate")}
            value={formatPercent(supplier.historicalReturnRate, locale)}
            mono
            danger={supplier.historicalReturnRate > 0.05}
          />
          <Field label={t("suppliers.avgEta")} value={formatHours(supplier.avgSettlementHours)} mono />
          <Field
            label={t("suppliers.trCompleteness")}
            value={formatPercent(supplier.travelRuleCompleteness, locale, 0)}
            mono
            danger={supplier.travelRuleCompleteness < 0.95}
          />
          <Field label="ID" value={supplier.payoutAddress} mono />
        </dl>

        <button
          type="button"
          onClick={() => router.push(`/pay?supplier=${supplier.id}`)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]"
          data-el="supplier-pay"
        >
          <Send className="h-4 w-4" /> {t("suppliers.payThis")}
        </button>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground">
        {t("suppliers.recentForSupplier")}
      </h2>
      <div className="space-y-2.5">
        {payments.map((p) => (
          <PaymentRow key={p.id} record={p} />
        ))}
      </div>
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
    <div>
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
