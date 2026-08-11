"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { RiskBadge } from "@/components/shared/badges";
import { formatPercent, formatHours, formatUsd } from "@/lib/format";
import { distinctCurrencies, groupByCountry } from "@/lib/analytics";
import type { Currency, Supplier } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

export default function SuppliersPage() {
  return (
    <AppShell>
      <SuppliersBody />
    </AppShell>
  );
}

function SuppliersBody() {
  const { suppliers, payments, loading } = useFlowGuardData();
  const [currency, setCurrency] = useState<Currency | "all">("all");

  const currencies = useMemo(() => distinctCurrencies(suppliers), [suppliers]);

  const filtered = useMemo(
    () => (currency === "all" ? suppliers : suppliers.filter((s) => s.currency === currency)),
    [suppliers, currency],
  );

  const groups = useMemo(() => groupByCountry(filtered, payments), [filtered, payments]);

  return (
    <section className="pt-1" data-el="suppliers">
      <h1 className="text-2xl font-bold tracking-tight">Payee ledger</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Beneficiaries grouped by country, with SWIFT/IBAN, channel and failure history.
      </p>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {suppliers.length} payees · {groups.length} countries
      </p>

      {/* Currency / corridor filter */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" data-el="currency-filter">
        <Chip active={currency === "all"} onClick={() => setCurrency("all")}>
          All currencies
        </Chip>
        {currencies.map((c) => (
          <Chip key={c} active={currency === c} onClick={() => setCurrency(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={4} />
        </div>
      ) : groups.length === 0 ? (
        <p className="fg-glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No payees match this currency.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((g) => (
            <div key={g.countryCode || g.country} data-el="country-group">
              {/* Country header */}
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="truncate text-sm font-semibold">{g.country}</span>
                  {g.restricted && (
                    <AlertTriangle
                      className="h-3.5 w-3.5 shrink-0 text-[color:var(--danger)]"
                      aria-hidden
                    />
                  )}
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {g.currencies.join(" · ")}
                </span>
              </div>
              {/* Country exposure line */}
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-0.5 px-1 font-mono text-[10px] text-muted-foreground">
                <span>{g.suppliers.length} payee(s)</span>
                <span>volume {formatUsd(g.volumeUsd)}</span>
                <span
                  style={g.returnRate > 0.05 ? { color: "var(--danger)" } : undefined}
                >
                  return {formatPercent(g.returnRate, 1)}
                </span>
              </div>
              <div className="space-y-2.5">
                {g.suppliers.map((s) => (
                  <PayeeCard key={s.id} supplier={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PayeeCard({ supplier: s }: { supplier: Supplier }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/suppliers/${s.id}`)}
      className="fg-glass flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-transform active:scale-[0.99]"
      data-el="supplier-card"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{s.name}</span>
          <RiskBadge level={s.riskTag} />
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="font-mono">{s.swift}</span>
          <span>·</span>
          <span className="font-mono">{s.currency}</span>
        </div>
        <div className="mt-2 flex gap-4 font-mono text-[10px] text-muted-foreground">
          <span>
            Return rate{" "}
            <b
              className="text-foreground"
              style={s.historicalReturnRate > 0.05 ? { color: "var(--danger)" } : undefined}
            >
              {formatPercent(s.historicalReturnRate, 1)}
            </b>
          </span>
          <span>
            Avg. ETA <b className="text-foreground">{formatHours(s.avgSettlementHours)}</b>
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

function Chip({
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
        "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
