"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Coins, Timer, ShieldAlert, Send, Globe, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PaymentRow } from "@/components/shared/payment-row";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { formatUsd, formatHours, formatPercent } from "@/lib/format";
import { groupByCountry } from "@/lib/analytics";
import { cn } from "@/utils/utils";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardBody />
    </AppShell>
  );
}

function DashboardBody() {
  const router = useRouter();
  const { suppliers, payments, loading } = useFlowGuardData();

  const stats = useMemo(() => {
    const count = payments.length;
    const volume = payments.reduce((s, p) => s + p.amountUsd, 0);
    const avgEta =
      payments.length > 0
        ? payments.reduce((s, p) => s + p.route.etaMinutes, 0) / payments.length / 60
        : 0;
    const highRisk = payments.filter((p) => p.riskLevel === "high").length;
    return { count, volume, avgEta, highRisk };
  }, [payments]);

  const countries = useMemo(
    () => groupByCountry(suppliers, payments).slice(0, 6),
    [suppliers, payments],
  );
  const recent = payments.slice(0, 4);

  return (
    <section className="pt-1" data-el="dashboard">
      <h1 className="text-2xl font-bold tracking-tight">Payout console</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pre-check return risk and route every cross-border payment before it leaves.
      </p>

      <button
        type="button"
        onClick={() => router.push("/pay")}
        className="mt-4 flex w-full items-center justify-between rounded-[24px] bg-primary px-5 py-4 text-primary-foreground shadow-[var(--fg-shadow-sm)] transition-transform active:scale-[0.99]"
        data-el="dashboard-new-payment"
      >
        <span className="flex items-center gap-3">
          <Send className="h-5 w-5" aria-hidden />
          <span className="text-base font-bold">New payment</span>
        </span>
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3" data-el="dashboard-stats">
        <StatCard icon={<Coins className="h-4 w-4" />} label="Payments" value={`${stats.count}`} />
        <StatCard icon={<Send className="h-4 w-4" />} label="Volume" value={formatUsd(stats.volume)} />
        <StatCard icon={<Timer className="h-4 w-4" />} label="Avg. ETA" value={formatHours(stats.avgEta)} />
        <StatCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label="High risk"
          value={`${stats.highRisk}`}
          danger={stats.highRisk > 0}
        />
      </div>

      {/* Country exposure overview (multi-country payees) */}
      {!loading && countries.length > 0 && (
        <div className="mt-6" data-el="country-exposure">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-muted-foreground">Country exposure</h2>
          </div>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {countries.map((g) => (
              <button
                key={g.countryCode || g.country}
                type="button"
                onClick={() => router.push("/suppliers")}
                className="fg-glass w-40 shrink-0 rounded-2xl p-3 text-left transition-transform active:scale-[0.99]"
                data-el="country-card"
              >
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold">{g.country}</span>
                  {g.restricted && (
                    <AlertTriangle
                      className="h-3 w-3 shrink-0 text-[color:var(--danger)]"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="mt-2 font-mono text-base font-bold tabular-nums">
                  {formatUsd(g.volumeUsd)}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 font-mono text-[9px] text-muted-foreground">
                  <span>{g.suppliers.length} payee(s)</span>
                  <span style={g.returnRate > 0.05 ? { color: "var(--danger)" } : undefined}>
                    ret {formatPercent(g.returnRate, 0)}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                  {g.currencies.join(" · ")}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Recent payments</h2>
        <button
          type="button"
          onClick={() => router.push("/history")}
          className="text-xs font-medium text-primary"
          data-el="dashboard-view-all"
        >
          View all
        </button>
      </div>

      {loading ? (
        <LoadingBlock rows={3} />
      ) : recent.length === 0 ? (
        <p className="fg-glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No payments yet. Start with a new payment above.
        </p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((p) => (
            <PaymentRow key={p.id} record={p} />
          ))}
        </div>
      )}
    </section>
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
    <div className="fg-glass min-w-0 rounded-2xl p-4" data-el="stat-card">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn("shrink-0", danger ? "text-[color:var(--danger)]" : "text-primary")}>
          {icon}
        </span>
        <span className="min-w-0 truncate text-[11px]">{label}</span>
      </div>
      <div
        className="mt-2 truncate font-mono text-xl font-bold leading-tight tabular-nums"
        style={danger ? { color: "var(--danger)" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
