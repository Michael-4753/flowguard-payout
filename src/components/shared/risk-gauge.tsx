"use client";

import type { RiskLevel } from "@/lib/engine/types";

const RING_COLOR: Record<RiskLevel, string> = {
  low: "var(--success)",
  medium: "var(--warning)",
  high: "var(--danger)",
};

/** Circular return-risk gauge — soft-focus orb style. */
export function RiskGauge({
  score,
  level,
  size = 168,
}: {
  score: number;
  level: RiskLevel;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * pct;
  const color = RING_COLOR[level];

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      data-el="risk-gauge"
    >
      {/* soft orb halo */}
      <div
        className="fg-orb fg-orb-main absolute inset-2 rounded-full"
        aria-hidden
        style={{ filter: `drop-shadow(0 0 30px ${color}55)` }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--fg-soft)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 700ms var(--fg-ease)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-4xl font-bold leading-none" style={{ color }}>
            {Math.round(score)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("wizard.precheck.scoreLabel")}
          </div>
        </div>
      </div>
    </div>
  );
}
