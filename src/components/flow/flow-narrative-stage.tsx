"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/utils/utils";
import type { RiskFactor, RouteOption } from "@/lib/engine/types";
import { formatMinutes } from "@/lib/format";

/**
 * 资金流叙事图：中央流转链路 + 风险命中节点 + 路由候选支线。
 * 点击路由节点切换所选路径，链路实时重排（推荐支线高亮）。
 */
export function FlowNarrativeStage({
  options,
  selectedId,
  onSelect,
  riskHits,
  locale,
}: {
  options: RouteOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  riskHits: RiskFactor[];
  locale: string;
}) {
  const { t } = useTranslation();
  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const criticalHits = riskHits.filter((f) => f.hit && f.severity === "critical").slice(0, 2);

  // 路由候选节点固定散布位置
  const routePos = [
    { left: "70%", top: "20%" },
    { left: "50%", top: "80%" },
    { left: "88%", top: "36%" },
    { left: "33%", top: "78%" },
  ];
  const riskPos = [
    { left: "17%", top: "20%" },
    { left: "20%", top: "74%" },
  ];

  return (
    <div
      className="fg-glass relative w-full overflow-hidden rounded-[28px] p-3"
      style={{ minHeight: "clamp(400px, 56svh, 520px)" }}
      data-el="flow-stage"
    >
      {/* connectors */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 375 470"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* main flow: payer -> ramp -> bridge -> supplier */}
        <path className="fg-path fg-path-main" d="M60 226 C120 154, 162 146, 162 146 S240 194, 250 228 S308 300, 320 302" />
        {/* risk connectors into the chain */}
        {criticalHits.map((_, i) => (
          <path
            key={i}
            className="fg-path fg-path-risk"
            d={i === 0 ? "M68 103 C78 150, 63 178, 60 226" : "M81 348 C90 304, 82 260, 60 226"}
          />
        ))}
        {/* route branches */}
        {options.map((o, i) => {
          const active = o.id === selectedId;
          const p = routePos[i] ?? routePos[0];
          const x = (parseFloat(p.left) / 100) * 375;
          const y = (parseFloat(p.top) / 100) * 470;
          return (
            <path
              key={o.id}
              className={cn("fg-path", active ? "fg-path-route" : "fg-path-alt")}
              d={`M250 228 C${(250 + x) / 2} ${(228 + y) / 2 - 30}, ${x} ${y + 20}, ${x} ${y}`}
            />
          );
        })}
        {["60,226", "162,146", "250,228", "320,302"].map((pt) => {
          const [cx, cy] = pt.split(",");
          return <circle key={pt} cx={cx} cy={cy} r="2" fill="rgba(237,235,229,.9)" />;
        })}
      </svg>

      {/* Main nodes */}
      <Orb className="fg-orb-main" pos={{ left: "16%", top: "48%" }} size="clamp(74px,24vw,116px)">
        <span className="text-[10px]">
          {t("wizard.route.nodePayer")}
          <small className="mt-0.5 block text-[color:var(--success)]">OK</small>
        </span>
      </Orb>
      <Orb className="fg-orb-main" pos={{ left: "43%", top: "31%" }} size="clamp(64px,20vw,100px)">
        <span className="text-[9px]">
          {selected.hops[0]?.label ?? "IN"}
          <small className="mt-0.5 block text-muted-foreground">
            -{selected.hops[0]?.feeUsd ?? 0}
          </small>
        </span>
      </Orb>
      <Orb className="fg-orb-main" pos={{ left: "66%", top: "49%" }} size="clamp(64px,20vw,100px)">
        <span className="text-[9px]">
          {selected.chain.slice(0, 4)}
          <small className="mt-0.5 block text-muted-foreground">
            {formatMinutes(selected.etaMinutes)}
          </small>
        </span>
      </Orb>
      <Orb className="fg-orb-main" pos={{ left: "85%", top: "66%" }} size="clamp(78px,25vw,124px)" glow>
        <span>
          <strong className="block text-[clamp(13px,3.6vw,19px)] text-white">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(selected.receiveUsd)}
          </strong>
          <small className="mt-0.5 block text-muted-foreground">
            {t("wizard.route.nodeArrive")}
          </small>
        </span>
      </Orb>

      {/* Risk nodes */}
      {criticalHits.map((f, i) => (
        <Orb key={f.id} className="fg-orb-risk" pos={riskPos[i]} size="clamp(56px,17vw,84px)">
          <span className="text-[8px] leading-tight text-[color:var(--danger)]">
            {t(`risk.factor.${riskKey(f.id)}.title`).slice(0, 4)}
            <small className="mt-0.5 block">!</small>
          </span>
        </Orb>
      ))}

      {/* Route candidate nodes */}
      {options.map((o, i) => {
        const active = o.id === selectedId;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            data-active={active}
            className="fg-orb fg-orb-route absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            style={{
              left: (routePos[i] ?? routePos[0]).left,
              top: (routePos[i] ?? routePos[0]).top,
              width: "clamp(56px,17vw,84px)",
              height: "clamp(56px,17vw,84px)",
            }}
            aria-pressed={active}
            data-el="flow-route-node"
          >
            <span className="text-[8px] leading-tight">
              {o.chain.slice(0, 4)}
              <small className="mt-0.5 block text-primary">
                {o.recommended ? t("wizard.route.recommended").slice(0, 1) : `${o.score}`}
              </small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function riskKey(id: string): string {
  const map: Record<string, string> = {
    "network-match": "network",
    sanction: "sanction",
    "travel-rule": "travelRule",
    "history-return": "history",
    "amount-anomaly": "amount",
  };
  return map[id] ?? "network";
}

function Orb({
  children,
  className,
  pos,
  size,
  glow,
}: {
  children: React.ReactNode;
  className: string;
  pos: { left: string; top: string };
  size: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn("fg-orb absolute -translate-x-1/2 -translate-y-1/2", className)}
      style={{
        left: pos.left,
        top: pos.top,
        width: size,
        height: size,
        filter: glow ? "drop-shadow(0 0 22px rgba(224,120,60,.36))" : undefined,
      }}
      aria-hidden
    >
      {children}
    </div>
  );
}
