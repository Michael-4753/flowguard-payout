// FlowGuard core domain types — payee ledger, risk pre-check, channel routing,
// money-flow link board, and failure-case library. Shared by the mock engine
// and the backend. English-only product: display strings live directly on the
// domain objects, no i18n keys.

export type RiskLevel = "low" | "medium" | "high";
export type Severity = "info" | "warn" | "critical";
export type PaymentStatus = "draft" | "initiated" | "settling" | "arrived" | "returned";

/** Settlement channel classes (module 2). */
export type ChannelClass = "swift-gpi" | "licensed-psp" | "stablecoin-gateway";

export const CHANNEL_CLASS_LABEL: Record<ChannelClass, string> = {
  "swift-gpi": "SWIFT-GPI Bank",
  "licensed-psp": "Licensed PSP",
  "stablecoin-gateway": "Stablecoin Gateway",
};

export type Currency = "USD" | "EUR" | "GBP" | "SGD" | "INR" | "VND" | "AED";

/** Whether the beneficiary is an overseas entity (gates stablecoin-gateway). */
export type EntityType = "overseas" | "domestic";

export type AccountStatus = "active" | "dormant" | "unverified";

/**
 * Supplier / payee ledger record (module 4). Static profile + historical stats
 * that feed the risk pre-check. Every record is owned by one user.
 */
export interface Supplier {
  id: string;
  /** Legal company / beneficiary name. */
  name: string;
  /** Short code for the draft badge, e.g. "LUMEN VIET". */
  codeName: string;
  country: string;
  countryCode: string;
  currency: Currency;
  entityType: EntityType;
  /** Beneficiary bank name. */
  bankName: string;
  /** SWIFT / BIC code (8 or 11 chars). */
  swift: string;
  /** IBAN (demo format, not a real account). */
  iban: string;
  accountStatus: AccountStatus;
  /** Whether the region is sanctioned / high-risk. */
  restrictedRegion: boolean;
  /** Whether the beneficiary bank is on the internal risk blacklist. */
  bankBlacklisted: boolean;
  /** Preferred channel class. */
  preferredChannel: ChannelClass;
  /** Manual risk tag on the ledger. */
  riskTag: RiskLevel;
  paymentCount: number;
  /** Historical return rate 0-1. */
  historicalReturnRate: number;
  /** Average settlement time (hours). */
  avgSettlementHours: number;
  /** Historical average amount (USD), for amount-anomaly checks. */
  avgAmountUsd: number;
  createdAt: string;
}

/** Payment draft input. */
export interface PaymentInput {
  supplierId: string;
  amountUsd: number;
  /** Preferred channel class; empty lets the router pick. */
  preferredChannel?: ChannelClass;
}

/** A single hit risk factor (module 1). */
export interface RiskFactor {
  id: string;
  title: string;
  severity: Severity;
  /** Contribution to the total score (points). */
  points: number;
  description: string;
  remediation: string;
  /** Whether it hit (non-hits still shown as "passed"). */
  hit: boolean;
}

/** A predicted return reason (module 1 — "why it might bounce"). */
export interface ReturnReason {
  id: string;
  /** Human-readable reason headline. */
  title: string;
  /** Estimated probability this is the cause of a return 0-1. */
  probability: number;
  /** Where the estimate comes from (rule / history / corridor). */
  source: string;
}

/**
 * Return-risk pre-check report (module 1).
 * tier: low / medium (needs supporting docs) / high (blocked).
 */
export interface RiskAssessment {
  /** Return-risk score 0-100, higher = more dangerous. */
  score: number;
  level: RiskLevel;
  /** Estimated return probability 0-1. */
  returnProbability: number;
  /** Name of the chokepoint intermediary bank most likely to hold funds. */
  chokepointBank: string;
  /** Typical number of intermediary hops on this corridor. */
  avgHops: number;
  factors: RiskFactor[];
  /** Top predicted return reasons, highest probability first. */
  returnReasons: ReturnReason[];
  /** True when a critical blocker requires acknowledgement. */
  hasBlocker: boolean;
}

/** One hop on the money-flow link board (module 3). */
export interface FlowHop {
  id: string;
  label: string;
  /** Layer role: origin, intermediary, or beneficiary. */
  role: "origin" | "intermediary" | "beneficiary";
  /** Concrete bank/institution handling this hop (de-blackboxes the corridor). */
  bankName: string;
  /** Hop duration (minutes). */
  minutes: number;
  /** Hop fee (USD). */
  feeUsd: number;
  /** Remaining amount after this hop (USD). */
  remainingUsd: number;
  /** Estimated idle/hold time at this layer (minutes). */
  idleMinutes: number;
  /** Whether this layer is a risk chokepoint. */
  chokepoint: boolean;
  /** Transparency of this hop: how much visibility you have into it. */
  blackboxLevel: "clear" | "partial" | "opaque";
  note: string;
}

/** A scored settlement route (module 2). */
export interface RouteOption {
  id: string;
  name: string;
  channelClass: ChannelClass;
  /** Total fee (USD). */
  totalFeeUsd: number;
  /** Total fee rate 0-1. */
  feeRate: number;
  /** Estimated total settlement time (minutes). */
  etaMinutes: number;
  /** Historical success rate 0-1. */
  successRate: number;
  /** Return risk 0-1 (lower is better). */
  returnRisk: number;
  /** FX conversion loss 0-1. */
  fxLoss: number;
  /** Amount received (USD). */
  receiveUsd: number;
  /** Composite score 0-100, higher is better. */
  score: number;
  /** Recommendation reason. */
  reason: string;
  /** Whether this class is unavailable for this payee (e.g. stablecoin for domestic). */
  available: boolean;
  /** Money-flow hops for the link board. */
  hops: FlowHop[];
  /** Whether it is the system-recommended route. */
  recommended: boolean;
}

/** Full routing result. */
export interface RoutingResult {
  options: RouteOption[];
  recommendedId: string;
}

/** A persisted payment record (with pre-check snapshot + selected route). */
export interface PaymentRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCodeName: string;
  amountUsd: number;
  currency: Currency;
  riskScore: number;
  riskLevel: RiskLevel;
  returnProbability: number;
  chokepointBank: string;
  /** Pre-check factor snapshot. */
  riskFactors: RiskFactor[];
  selectedRouteId: string;
  route: RouteOption;
  status: PaymentStatus;
  createdAt: string;
}

/** A failure-case library entry (module 3). */
export interface FailureCase {
  id: string;
  corridor: string;
  channelClass: ChannelClass;
  amountUsd: number;
  /** Short return-reason headline. */
  reason: string;
  /** Which layer failed. */
  failedAt: string;
  /** Days funds were held before return. */
  heldDays: number;
  /** Concrete remediation plan. */
  remediation: string;
  /** Risk factor family this case maps to. */
  factorId: string;
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium — needs docs",
  high: "High — do not send",
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  draft: "Draft",
  initiated: "Initiated",
  settling: "Settling",
  arrived: "Arrived",
  returned: "Returned",
};
