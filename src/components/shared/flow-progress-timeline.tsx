"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deriveFlowProgress } from "@/lib/analytics";
import type { FlowHop, PaymentRecord } from "@/lib/engine/types";
import { formatMinutes, formatUsd } from "@/lib/format";
import { cn } from "@/utils/utils";
import { hopBank } from "@/lib/i18n-labels";
import { AiInsightCard } from "@/components/ai/ai-insight-card";

/**
 * Money-flow narrative board (design signature: "资金流叙事"). Renders the
 * selected route as a causal chain of softly-lit orb nodes — origin →
 * intermediaries → beneficiary — annotating each hop's time, fee, and remaining
 * amount, so the payer can literally read where the money is, what it costs, and
 * which layer it is stuck at. Risk chokepoints render as a red node.
 */
export function FlowProgressTimeline({ record }: { record: PaymentRecord }) {
  const progress = deriveFlowProgress(record);
  const { hops, currentIndex, done, returned, caption } = progress;
  const { t } = useTranslation();
  if (hops.length === 0) return null;

  return (
    <div
      className="fg-fade relative mt-3 overflow-hidden rounded-2xl border border-border bg-[color:var(--fg-glass)] p-3 backdrop-blur"
      data-el="flow-progress"
    >
      {/* status caption */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {returned ? (
          <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--danger)]" aria-hidden />
        ) : done ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" aria-hidden />
        ) : (
          <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
        )}
        <span
          className={cn(
            "font-medium",
            returned
              ? "text-[color:var(--danger)]"
              : done
                ? "text-[color:var(--success)]"
                : "text-foreground",
          )}
        >
          {caption}
        </span>
      </div>

      {/* narrative chain — scrolls horizontally on small screens */}
      <ol
        className="mt-4 flex items-stretch overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-el="flow-progress-rail"
      >
        {hops.map((hop, i) => (
          <HopNode
            key={hop.id}
            hop={hop}
            index={i}
            isFirst={i === 0}
            isLast={i === hops.length - 1}
            currentIndex={currentIndex}
            done={done}
            returned={returned}
          />
        ))}
      </ol>

      {/* Pain point ①: AI reads WHERE the money is stuck on this corridor. */}
      {!done && (
        <div className="mt-3">
          <AiInsightCard
            kind="flow"
            title={t("flow.aiTitle")}
            cta={t("flow.aiCta")}
            hint={t("flow.aiHint")}
            loadingLabel={t("flow.aiLoading")}
            actionsLabel={t("flow.aiActions")}
            buildSnapshot={() => ({
              status: record.status,
              returned,
              currentHop: hops[currentIndex]?.bankName,
              currentHopRole: hops[currentIndex]?.role,
              hops: hops.map((h, i) => ({
                order: i,
                bank: h.bankName,
                role: h.role,
                minutes: h.minutes,
                feeUsd: h.feeUsd,
                remainingUsd: h.remainingUsd,
                chokepoint: h.chokepoint,
                reached: i < currentIndex,
              })),
            })}
          />
        </div>
      )}
    </div>
  );
}

function HopNode({
  hop,
  index,
  isFirst,
  isLast,
  currentIndex,
  done,
  returned,
}: {
  hop: FlowHop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  currentIndex: number;
  done: boolean;
  returned: boolean;
}) {
  const reached = index < currentIndex || (done && index <= currentIndex);
  const current = index === currentIndex && !done;
  const isDanger = hop.chokepoint && (current || returned);

  const nodeColor = isDanger
    ? "var(--danger)"
    : reached || done
      ? "var(--success)"
      : current
        ? "var(--primary)"
        : "var(--muted-foreground)";

  const glyph =
    hop.role === "origin" ? "•" : hop.role === "beneficiary" ? "★" : String(index);

  return (
    <li className="flex min-w-[88px] flex-1 flex-col items-center">
      {/* orb + connector rail */}
      <div className="flex w-full items-center">
        <span
          className="h-[2px] flex-1"
          aria-hidden
          style={{ background: isFirst ? "transparent" : index <= currentIndex ? "var(--success)" : "var(--fg-line)" }}
        />
        <span
          className={cn(
            "fg-orb-route relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-transform",
            current && !isDanger && "fg-orb-pulse",
            isDanger && "fg-orb-pulse-danger",
          )}
          data-active={reached || current || (done && index === currentIndex) ? "true" : "false"}
          style={{ color: nodeColor, border: `1.5px solid ${nodeColor}` }}
          title={hop.bankName}
          aria-label={`${hop.bankName}${hop.chokepoint ? " · chokepoint" : ""}`}
        >
          {isDanger ? "!" : glyph}
        </span>
        <span
          className="h-[2px] flex-1"
          aria-hidden
          style={{ background: isLast ? "transparent" : index < currentIndex ? "var(--success)" : "var(--fg-line)" }}
        />
      </div>

      {/* bank label */}
      <p
        className="mt-1.5 max-w-[86px] truncate text-center text-[10px] font-medium text-foreground"
        title={hop.bankName}
      >
        {hop.bankName}
      </p>

      {/* per-hop annotations: time · fee · remaining */}
      <div className="mt-0.5 flex flex-col items-center gap-0.5 text-center font-mono text-[9px] leading-tight text-muted-foreground">
        <span>{formatMinutes(hop.minutes)}</span>
        {hop.feeUsd > 0 && <span className="text-[color:var(--danger)]">-{formatUsd(hop.feeUsd)}</span>}
        <span className="text-foreground/80">{formatUsd(hop.remainingUsd)}</span>
      </div>
    </li>
  );
}
