// FlowGuard 核心领域类型 —— 供应商、付款单、风险预检、结算通道与路由。
// 这些类型是模拟引擎与后续真实后端共享的契约。

export type RiskLevel = "low" | "medium" | "high";
export type Severity = "info" | "warn" | "critical";
export type PaymentStatus = "draft" | "initiated" | "settling" | "arrived";

export type StableCoin = "USDC" | "USDT" | "PYUSD";
export type ChainId = "base" | "polygon" | "arbitrum" | "tron" | "ethereum";

/** 供应商档案：静态资料 + 历史统计（历史统计会喂给风险预检）。 */
export interface Supplier {
  id: string;
  name: string;
  /** 简短代号，用于草稿角标，如 "LUMEN VIET"。 */
  codeName: string;
  region: string;
  countryCode: string;
  /** 是否位于受限/高风险地区。 */
  restrictedRegion: boolean;
  preferredChain: ChainId;
  preferredCoin: StableCoin;
  /** 收款地址（演示用，非真实资金）。 */
  payoutAddress: string;
  /** Travel Rule 受益方信息完整度 0-1。 */
  travelRuleCompleteness: number;
  /** 收款地址与目标网络是否匹配。 */
  addressNetworkMatch: boolean;
  /** 历史付款次数。 */
  paymentCount: number;
  /** 历史退回率 0-1。 */
  historicalReturnRate: number;
  /** 历史平均到账时效（小时）。 */
  avgSettlementHours: number;
  /** 历史单笔均值（USD），用于金额异常判断。 */
  avgAmountUsd: number;
  createdAt: string;
}

/** 付款单输入。 */
export interface PaymentInput {
  supplierId: string;
  amountUsd: number;
  /** 目标稳定币偏好，留空由系统按供应商偏好推荐。 */
  targetCoin?: StableCoin;
}

/** 单条风险因素命中项。 */
export interface RiskFactor {
  id: string;
  title: string;
  severity: Severity;
  /** 对总分的贡献（分）。 */
  points: number;
  description: string;
  remediation: string;
  /** 是否命中（未命中则不进入清单）。 */
  hit: boolean;
}

/** 风险预检结果。 */
export interface RiskAssessment {
  /** 退回风险评分 0-100，越高越危险。 */
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  /** 是否存在需要拦截确认的高危项。 */
  hasBlocker: boolean;
}

/** 一跳资金流转节点。 */
export interface FlowHop {
  id: string;
  label: string;
  /** 该跳耗时（分钟）。 */
  minutes: number;
  /** 该跳扣费（USD）。 */
  feeUsd: number;
  /** 该跳结束后剩余金额（USD）。 */
  remainingUsd: number;
  note: string;
}

/** 一条结算通道的路由评估结果。 */
export interface RouteOption {
  id: string;
  name: string;
  chain: ChainId;
  coin: StableCoin;
  /** 综合费用（USD）。 */
  totalFeeUsd: number;
  /** 综合费率 0-1。 */
  feeRate: number;
  /** 预计总到账时效（分钟）。 */
  etaMinutes: number;
  /** 历史成功率 0-1。 */
  successRate: number;
  /** 到手金额（USD）。 */
  receiveUsd: number;
  /** 综合评分 0-100，越高越优。 */
  score: number;
  /** 推荐理由。 */
  reason: string;
  /** 资金流转分段链路。 */
  hops: FlowHop[];
  /** 是否为系统推荐路径。 */
  recommended: boolean;
}

/** 完整的路由结果。 */
export interface RoutingResult {
  options: RouteOption[];
  recommendedId: string;
}

/** 一条落库的付款记录（含预检快照与所选路径）。 */
export interface PaymentRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCodeName: string;
  amountUsd: number;
  targetCoin: StableCoin;
  riskScore: number;
  riskLevel: RiskLevel;
  /** 预检命中项快照。 */
  riskFactors: RiskFactor[];
  selectedRouteId: string;
  route: RouteOption;
  status: PaymentStatus;
  createdAt: string;
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "risk.level.low",
  medium: "risk.level.medium",
  high: "risk.level.high",
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  draft: "status.draft",
  initiated: "status.initiated",
  settling: "status.settling",
  arrived: "status.arrived",
};
