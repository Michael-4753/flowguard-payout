"use client";

import { cn } from "@/utils/utils";
import {
  RISK_LEVEL_LABEL,
  STATUS_LABEL,
  type PaymentStatus,
  type RiskLevel,
  type Severity,
} from "@/lib/engine/types";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30",
  medium: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  high: "bg-[color:var(--danger)]/15 text-[color:var(--danger)] border-[color:var(--danger)]/40",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        RISK_STYLES[level],
        className,
      )}
      data-el="risk-badge"
    >
      {RISK_LEVEL_LABEL[level]}
    </span>
  );
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  draft: "text-muted-foreground border-border",
  initiated: "text-foreground border-border",
  settling: "text-[color:var(--warning)] border-[color:var(--warning)]/40",
  arrived: "text-[color:var(--success)] border-[color:var(--success)]/40",
  returned: "text-[color:var(--danger)] border-[color:var(--danger)]/40",
};

export function StatusPill({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        STATUS_STYLES[status],
        className,
      )}
      data-el="status-pill"
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "arrived" && "bg-[color:var(--success)]",
          status === "settling" && "bg-[color:var(--warning)] animate-pulse",
          status === "initiated" && "bg-foreground",
          status === "draft" && "bg-muted-foreground",
          status === "returned" && "bg-[color:var(--danger)]",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

const SEVERITY_DOT: Record<Severity, string> = {
  info: "bg-[color:var(--success)]",
  warn: "bg-[color:var(--warning)]",
  critical: "bg-[color:var(--danger)]",
};

export function SeverityDot({ severity }: { severity: Severity }) {
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[severity])} />;
}
