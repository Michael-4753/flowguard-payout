"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight, MapPin, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { formatPercent, formatHours } from "@/lib/format";
import { useCurrentLocale } from "@/lib/use-locale";

export default function SuppliersPage() {
  return (
    <AppShell>
      <SuppliersBody />
    </AppShell>
  );
}

function SuppliersBody() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useCurrentLocale();
  const { suppliers, loading } = useFlowGuardData();

  return (
    <section className="pt-1" data-el="suppliers">
      <h1 className="text-2xl font-bold tracking-tight">{t("suppliers.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("suppliers.subtitle")}</p>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {t("suppliers.count", { count: suppliers.length })}
      </p>

      {loading ? (
        <div className="mt-4">
          <LoadingBlock rows={4} />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {suppliers.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/suppliers/${s.id}`)}
              className="fg-glass flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-transform active:scale-[0.99]"
              data-el="supplier-card"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{s.name}</span>
                  {s.restrictedRegion && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/15 px-2 py-0.5 text-[9px] font-semibold text-[color:var(--danger)]">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {t("suppliers.restricted")}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {s.region}
                </div>
                <div className="mt-2 flex gap-4 font-mono text-[10px] text-muted-foreground">
                  <span>
                    {t("suppliers.returnRate")}{" "}
                    <b
                      className="text-foreground"
                      style={s.historicalReturnRate > 0.05 ? { color: "var(--danger)" } : undefined}
                    >
                      {formatPercent(s.historicalReturnRate, locale)}
                    </b>
                  </span>
                  <span>
                    {t("suppliers.avgEta")} <b className="text-foreground">{formatHours(s.avgSettlementHours)}</b>
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
