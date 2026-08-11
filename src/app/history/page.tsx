"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { RiskBadge, StatusPill } from "@/components/shared/badges";
import { useFlowGuardData } from "@/components/shell/data-provider";
import { LoadingBlock } from "@/components/shared/loading-block";
import { formatUsd, formatDate, formatPercent } from "@/lib/format";
import { useCurrentLocale } from "@/lib/use-locale";
import type { PaymentStatus, RiskLevel } from "@/lib/engine/types";
import { cn } from "@/utils/utils";

const LEVELS: (RiskLevel | "all")[] = ["all", "low", "medium", "high"];
const STATUSES: (PaymentStatus | "all")[] = ["all", "draft", "initiated", "settling", "arrived"];

export default function HistoryPage() {
  return (
    <AppShell>
      <HistoryBody />
    </AppShell>
  );
}

function HistoryBody() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useCurrentLocale();
  const { payments, loading } = useFlowGuardData();
  const [level, setLevel] = useState<RiskLevel | "all">("all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");

  const filtered = useMemo(
    () =>
      payments.filter(
        (p) => (level === "all" || p.riskLevel === level) && (status === "all" || p.status === status),
      ),
    [payments, level, status],
  );

  return (
    <section className="pt-1" data-el="history">
        <h1 className="text-2xl font-bold tracking-tight">{t("history.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("history.subtitle")}</p>

        {/* Filters */}
        <div className="mt-4 space-y-2" data-el="history-filters">
          <FilterRow label={t("history.filterLevel")}>
            {LEVELS.map((l) => (
              <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                {l === "all" ? t("history.filterAll") : t(`risk.level.${l}`)}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label={t("history.filterStatus")}>
            {STATUSES.map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                {s === "all" ? t("history.filterAll") : t(`status.${s}`)}
              </Chip>
            ))}
          </FilterRow>
        </div>

        {loading ? (
          <div className="mt-4">
            <LoadingBlock rows={4} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="fg-glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
            {t("history.empty")}
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {filtered.map((p) => (
              <article key={p.id} className="fg-glass rounded-2xl p-4" data-el="history-item">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{p.supplierName}</span>
                      <RiskBadge level={p.riskLevel} />
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatDate(p.createdAt, locale)}
                    </p>
                  </div>
                  <StatusPill status={p.status} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <Cell label={t("history.amount")} value={formatUsd(p.amountUsd, locale)} />
                  <Cell label={t("history.route")} value={p.route.name} />
                  <Cell label={t("wizard.route.success")} value={formatPercent(p.route.successRate, locale)} />
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/pay?supplier=${p.supplierId}&amount=${p.amountUsd}`)}
                  className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                  data-el="history-reuse"
                >
                  <RotateCcw className="h-3 w-3" /> {t("history.reuse")}
                </button>
              </article>
            ))}
          </div>
        )}
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">{children}</div>
    </div>
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

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}
