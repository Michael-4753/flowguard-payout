// FlowGuard core domain types — payee ledger, risk pre-check, channel routing,
// money-flow link board, and failure-case library. Shared by the mock engine
// and the backend. English-only product: display strings live directly on the
// domain objects, no i18n keys.

export type RiskLevel = "low" | "medium" | "high";
export type Severity = "info" | "warn" | "critical";
export type PaymentStatus =
  | "draft"
  | "pending_review"
  | "rejected"
  | "initiated"
  | "settling"
  | "arrived"
  | "returned";

/** Settlement channel classes (module 2): two payout paths. */
export type ChannelClass = "stablecoin-direct" | "local-fiat";

export const CHANNEL_CLASS_LABEL: Record<ChannelClass, string> = {
  "stablecoin-direct": "Stablecoin Direct",
  "local-fiat": "Local Fiat Payout",
};

export type Currency = "USD" | "EUR" | "GBP" | "SGD" | "INR" | "VND" | "AED";

/** Whether the beneficiary is an overseas entity (gates stablecoin-direct). */
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
  /**
   * Risk family. `data-quality` issues (name, account, IBAN/SWIFT format) can be
   * resolved by verifying with the payee/business — these get a "Generate
   * verification request" action. `structural` issues (sanctions, FX controls,
   * blacklisted bank) are jurisdiction-level and can only be avoided via routing.
   */
  category: "data-quality" | "structural";
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

/** Quantified cost of a bounce (module 1 — "what a return actually costs"). */
export interface ReturnCost {
  /** Estimated days lost (bounce + investigate + re-send). */
  lostDays: number;
  /** Sunk / non-refundable fees on a returned wire (USD). */
  sunkFeesUsd: number;
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
  /** Quantified cost if this payment is returned. */
  returnCost: ReturnCost;
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
  /** Off-chain proof: bank wire reference / MT103 UETR. */
  offchainRef: string;
  /** Off-chain invoice number tied to this payout. */
  invoiceNo: string;
  /** On-chain / PSP proof: tx hash or PSP settlement reference. */
  onchainRef: string;
  /** Maker/checker approval trail (segregation of duties). */
  review: ReviewInfo;
  createdAt: string;
}

/**
 * Maker-checker approval trail. The maker (cashier) creates the payment; a
 * separate checker (finance supervisor) must approve before it is sent to the
 * bank. Simulated dual-role within one demo account.
 */
export interface ReviewInfo {
  /** Who created the payment (maker). */
  makerId: string;
  makerLabel: string;
  submittedAt: string;
  /** Who reviewed it (checker) — empty until reviewed. */
  checkerId: string;
  checkerLabel: string;
  /** When it was approved / rejected — empty until reviewed. */
  reviewedAt: string;
  /** Reviewer decision. */
  decision: "pending" | "approved" | "rejected";
  /** Reason, required on rejection. */
  note: string;
}

/** Verification-case status: awaiting reply → verified / clarified. */
export type VerificationStatus = "open" | "verified" | "clarified";

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  open: "Awaiting reply",
  verified: "Verified",
  clarified: "Clarified",
};

/** Who acted on a shared case (no real multi-user auth in this demo). */
export type CaseActor = "cashier" | "business" | "supplier";

export const CASE_ACTOR_LABEL: Record<CaseActor, string> = {
  cashier: "Cashier",
  business: "Business",
  supplier: "Supplier",
};

/** One entry in a case's shared activity timeline. */
export interface CaseEvent {
  id: string;
  actor: CaseActor;
  kind: "created" | "status" | "comment";
  message: string;
  at: string;
}

/**
 * A verification request (data-quality risk close-out). Generated for a
 * data-quality risk factor so the cashier can copy a ready-made message to the
 * payee/business, then track the reply status. Structural/jurisdiction risks
 * never produce one — they can only be avoided via routing.
 */
export interface VerificationCase {
  id: string;
  supplierId: string;
  supplierName: string;
  /** Which risk factor triggered this (e.g. "company-name"). */
  factorId: string;
  factorTitle: string;
  /** Ready-to-copy request message shown to the cashier. */
  template: string;
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

/** One payout-requirement checklist item for a corridor (module 4). */
export interface CorridorRequirement {
  id: string;
  label: string;
  /** Whether it is mandatory or a recommended best practice. */
  mandatory: boolean;
  /** Short why/how detail. */
  detail: string;
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
  pending_review: "Pending review",
  rejected: "Rejected",
  initiated: "Initiated",
  settling: "Settling",
  arrived: "Arrived",
  returned: "Returned",
};
