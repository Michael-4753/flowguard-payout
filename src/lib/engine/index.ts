// FlowGuard 确定性模拟引擎 —— 风险规则库、通道库与路由打分。
// 相同输入总是产生相同输出，便于演示与评审。

import type {
  ChainId,
  FlowHop,
  PaymentInput,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  RouteOption,
  RoutingResult,
  StableCoin,
  Supplier,
} from "./types";

/** 通道库：预置的结算通道基础参数。 */
interface ChannelSpec {
  id: string;
  name: string;
  chain: ChainId;
  coin: StableCoin;
  /** 基础费率 0-1。 */
  baseFeeRate: number;
  /** 固定网络费（USD）。 */
  fixedFeeUsd: number;
  /** 基础时效（分钟）。 */
  baseMinutes: number;
  /** 基础成功率 0-1。 */
  baseSuccessRate: number;
  /** 中转结构：每一跳的说明模板。 */
  hopLabels: string[];
}

export const CHANNELS: ChannelSpec[] = [
  {
    id: "base-usdc",
    name: "Base · USDC",
    chain: "base",
    coin: "USDC",
    baseFeeRate: 0.0032,
    fixedFeeUsd: 12,
    baseMinutes: 135,
    baseSuccessRate: 0.982,
    hopLabels: ["入金", "Base 结算", "供应商到账"],
  },
  {
    id: "polygon-usdc",
    name: "Polygon · USDC",
    chain: "polygon",
    coin: "USDC",
    baseFeeRate: 0.0022,
    fixedFeeUsd: 6,
    baseMinutes: 260,
    baseSuccessRate: 0.951,
    hopLabels: ["入金", "Polygon 结算", "供应商到账"],
  },
  {
    id: "arbitrum-usdc",
    name: "Arbitrum · USDC",
    chain: "arbitrum",
    coin: "USDC",
    baseFeeRate: 0.0041,
    fixedFeeUsd: 18,
    baseMinutes: 100,
    baseSuccessRate: 0.991,
    hopLabels: ["入金", "Arbitrum 结算", "供应商到账"],
  },
  {
    id: "tron-usdt",
    name: "Tron · USDT",
    chain: "tron",
    coin: "USDT",
    baseFeeRate: 0.0018,
    fixedFeeUsd: 3,
    baseMinutes: 190,
    baseSuccessRate: 0.928,
    hopLabels: ["入金", "Tron 结算", "供应商到账"],
  },
];

// ---------- 风险预检 ----------

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/**
 * 退回风险预检：按可解释规则算出命中项与总分。
 * 分数越高越危险，>=60 出现拦截高危。
 */
export function assessRisk(
  supplier: Supplier,
  input: PaymentInput,
): RiskAssessment {
  const factors: RiskFactor[] = [];

  // 1. 收款地址与目标网络匹配性
  const networkHit = !supplier.addressNetworkMatch;
  factors.push({
    id: "network-match",
    title: "risk.factor.network.title",
    severity: networkHit ? "critical" : "info",
    points: networkHit ? 34 : 0,
    description: networkHit
      ? "risk.factor.network.descHit"
      : "risk.factor.network.descOk",
    remediation: "risk.factor.network.fix",
    hit: networkHit,
  });

  // 2. 制裁 / 受限地区筛查
  const sanctionHit = supplier.restrictedRegion;
  factors.push({
    id: "sanction",
    title: "risk.factor.sanction.title",
    severity: sanctionHit ? "critical" : "info",
    points: sanctionHit ? 40 : 0,
    description: sanctionHit
      ? "risk.factor.sanction.descHit"
      : "risk.factor.sanction.descOk",
    remediation: "risk.factor.sanction.fix",
    hit: sanctionHit,
  });

  // 3. Travel Rule 信息完整度
  const trGap = supplier.travelRuleCompleteness < 0.95;
  const trCritical = supplier.travelRuleCompleteness < 0.7;
  factors.push({
    id: "travel-rule",
    title: "risk.factor.travelRule.title",
    severity: trCritical ? "critical" : trGap ? "warn" : "info",
    points: trCritical ? 26 : trGap ? 14 : 0,
    description: trGap
      ? "risk.factor.travelRule.descHit"
      : "risk.factor.travelRule.descOk",
    remediation: "risk.factor.travelRule.fix",
    hit: trGap,
  });

  // 4. 供应商历史退回记录
  const returnHit = supplier.historicalReturnRate > 0.03;
  const returnCritical = supplier.historicalReturnRate > 0.08;
  factors.push({
    id: "history-return",
    title: "risk.factor.history.title",
    severity: returnCritical ? "critical" : returnHit ? "warn" : "info",
    points: returnCritical ? 24 : returnHit ? 12 : 0,
    description: returnHit
      ? "risk.factor.history.descHit"
      : "risk.factor.history.descOk",
    remediation: "risk.factor.history.fix",
    hit: returnHit,
  });

  // 5. 金额异常（远高于历史均值）
  const ratio = supplier.avgAmountUsd > 0 ? input.amountUsd / supplier.avgAmountUsd : 1;
  const amountHit = ratio >= 2.2;
  factors.push({
    id: "amount-anomaly",
    title: "risk.factor.amount.title",
    severity: amountHit ? "warn" : "info",
    points: amountHit ? 16 : 0,
    description: amountHit
      ? "risk.factor.amount.descHit"
      : "risk.factor.amount.descOk",
    remediation: "risk.factor.amount.fix",
    hit: amountHit,
  });

  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const score = clamp(Math.round(rawScore), 0, 100);
  const level = scoreToLevel(score);
  const hasBlocker = factors.some((f) => f.hit && f.severity === "critical");

  return { score, level, factors, hasBlocker };
}

// ---------- 路由打分 ----------

/** 稳定的伪随机（基于字符串种子），保证同输入同输出。 */
function seededJitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 归一化到 [-0.5, 0.5]
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

function buildHops(
  channel: ChannelSpec,
  amountUsd: number,
  totalFeeUsd: number,
  etaMinutes: number,
): FlowHop[] {
  const labels = channel.hopLabels;
  const perHopFee = totalFeeUsd / labels.length;
  const perHopMin = etaMinutes / labels.length;
  let remaining = amountUsd;
  return labels.map((label, i) => {
    const feeUsd = Math.round(perHopFee * (i === labels.length - 1 ? 0.6 : 1.2) * 100) / 100;
    remaining = Math.round((remaining - feeUsd) * 100) / 100;
    return {
      id: `${channel.id}-hop-${i}`,
      label,
      minutes: Math.round(perHopMin),
      feeUsd,
      remainingUsd: remaining,
      note: `${label} · ${channel.name}`,
    };
  });
}

/**
 * 路由打分：对每条通道算综合费用/时效/成功率，并结合风险预检加权。
 * 高退回风险供应商时更偏向高成功率通道。
 */
export function routePayment(
  supplier: Supplier,
  input: PaymentInput,
  risk: RiskAssessment,
): RoutingResult {
  const targetCoin = input.targetCoin ?? supplier.preferredCoin;
  // 高风险时更看重成功率
  const riskWeight = risk.level === "high" ? 0.55 : risk.level === "medium" ? 0.4 : 0.28;
  const feeWeight = risk.level === "high" ? 0.22 : 0.36;
  const speedWeight = 1 - riskWeight - feeWeight;

  const options: RouteOption[] = CHANNELS.map((channel) => {
    const jitter = seededJitter(`${channel.id}:${supplier.id}`);
    const feeRate = clamp(channel.baseFeeRate + jitter * 0.0006, 0.001, 0.01);
    const totalFeeUsd = Math.round((input.amountUsd * feeRate + channel.fixedFeeUsd) * 100) / 100;
    const etaMinutes = Math.max(
      30,
      Math.round(channel.baseMinutes * (1 + jitter * 0.1)),
    );
    const successRate = clamp(
      channel.baseSuccessRate - supplier.historicalReturnRate * 0.35 + jitter * 0.004,
      0.8,
      0.999,
    );
    const receiveUsd = Math.round((input.amountUsd - totalFeeUsd) * 100) / 100;

    // 归一化打分：成功率越高越好、费率越低越好、时效越短越好
    const feeScore = clamp(1 - feeRate / 0.008, 0, 1);
    const speedScore = clamp(1 - etaMinutes / 360, 0, 1);
    const successScore = clamp((successRate - 0.8) / 0.2, 0, 1);
    // 币种偏好加成
    const coinBonus = channel.coin === targetCoin ? 0.05 : 0;
    const composite =
      feeScore * feeWeight +
      speedScore * speedWeight +
      successScore * riskWeight +
      coinBonus;
    const score = clamp(Math.round(composite * 100), 0, 100);

    return {
      id: channel.id,
      name: channel.name,
      chain: channel.chain,
      coin: channel.coin,
      totalFeeUsd,
      feeRate,
      etaMinutes,
      successRate,
      receiveUsd,
      score,
      reason: "",
      hops: buildHops(channel, input.amountUsd, totalFeeUsd, etaMinutes),
      recommended: false,
    };
  });

  options.sort((a, b) => b.score - a.score);
  const best = options[0];
  best.recommended = true;

  // 生成推荐理由
  for (const opt of options) {
    opt.reason = buildReason(opt, options, risk.level);
  }

  return { options, recommendedId: best.id };
}

function buildReason(
  opt: RouteOption,
  all: RouteOption[],
  level: RiskLevel,
): string {
  const cheapest = [...all].sort((a, b) => a.totalFeeUsd - b.totalFeeUsd)[0];
  const fastest = [...all].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
  const safest = [...all].sort((a, b) => b.successRate - a.successRate)[0];
  if (opt.recommended) {
    if (level === "high") return "route.reason.recommendedHighRisk";
    return "route.reason.recommendedBalanced";
  }
  if (opt.id === cheapest.id) return "route.reason.cheapest";
  if (opt.id === fastest.id) return "route.reason.fastest";
  if (opt.id === safest.id) return "route.reason.safest";
  return "route.reason.alternative";
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h${m}m`;
}
