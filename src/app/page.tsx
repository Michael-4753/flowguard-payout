"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowRight, Coins, Timer, ShieldAlert, Send } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PaymentRow } from "@/components/shared/payment-row";
import { usePayments } from "@/lib/mock/store";
import { formatUsd, formatHours } from "@/lib/format";
import { useCurrentLocale } from "@/lib/use-locale";

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useCurrentLocale();
  const payments = usePayments();

  const stats = useMemo(() => {
    const count = payments.length;
    const volume = payments.reduce((s, p) => s + p.amountUsd, 0);
    const avgEta =
      payments.length > 0
        ? payments.reduce((s, p) => s + p.route.etaMinutes, 0) / payments.length / 60
        : 0;
    const blocked = payments.filter((p) => p.riskLevel === "high").length;
    return { count, volume, avgEta, blocked };
  }, [payments]);

  const recent = payments.slice(0, 4);

  return (
    <AppShell>
      <section className="pt-1" data-el="dashboard">
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>

        <button
          type="button"
          onClick={() => router.push("/pay")}
          className="mt-4 flex w-full items-center justify-between rounded-[24px] bg-primary px-5 py-4 text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]"
          data-el="dashboard-new-payment"
        >
          <span className="flex items-center gap-3">
            <Send className="h-5 w-5" aria-hidden />
            <span className="text-base font-bold">{t("dashboard.newPayment")}</span>
          </span>
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>

        <div className="mt-4 grid grid-cols-2 gap-3" data-el="dashboard-stats">
          <StatCard icon={<Coins className="h-4 w-4" />} label={t("dashboard.stat.count")} value={`${stats.count}`} />
          <StatCard icon={<Send className="h-4 w-4" />} label={t("dashboard.stat.volume")} value={formatUsd(stats.volume, locale)} />
          <StatCard icon={<Timer className="h-4 w-4" />} label={t("dashboard.stat.avgEta")} value={formatHours(stats.avgEta)} />
          <StatCard
            icon={<ShieldAlert className="h-4 w-4" />}
            label={t("dashboard.stat.blocked")}
            value={`${stats.blocked}`}
            danger={stats.blocked > 0}
          />
        </div>

        <div className="mb-4 mt-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("dashboard.recent")}</h2>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="text-xs font-medium text-primary"
            data-el="dashboard-view-all"
          >
            {t("dashboard.viewAll")}
          </button>
        </div>

        {recent.length === 0 ? (
          <p className="fg-glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            {t("dashboard.empty")}
          </p>
        ) : (
          <div className="space-y-2.5">
            {recent.map((p) => (
              <PaymentRow key={p.id} record={p} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="fg-glass rounded-2xl p-4" data-el="stat-card">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={danger ? "text-[color:var(--danger)]" : "text-primary"}>{icon}</span>
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="mt-2 font-mono text-xl font-bold" style={danger ? { color: "var(--danger)" } : undefined}>
        {value}
      </div>
    </div>
  );
}
