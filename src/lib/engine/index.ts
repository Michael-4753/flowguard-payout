// FlowGuard deterministic mock engine.
// Module 1: return-risk pre-check (SWIFT/IBAN/company validation, sanctions &
//   bank blacklist, currency-control / interception scoring, tiered report).
// Module 2: three-class channel pool + auto-scoring router.
// Same input always yields the same output — reproducible for demo & review.

import type {
  ChannelClass,
  CorridorRequirement,
  FlowHop,
  PaymentInput,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  RouteOption,
  RoutingResult,
  Supplier,
} from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ---------- validators ----------

/** SWIFT/BIC: 8 or 11 chars, 6 letters + 2 alnum (+ optional 3 alnum branch). */
export function isValidSwift(swift: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift.trim().toUpperCase());
}

/** IBAN: 2 letters + 2 digits + up to 30 alnum. Demo-grade structural check. */
export function isValidIban(iban: string): boolean {
  const v = iban.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v);
}

/** Company name red flags: trailing space, double space, or missing legal suffix. */
export function companyNameIssue(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed !== name || /\s{2,}/.test(name)) return true;
  const suffixes = /\b(ltd|llc|inc|gmbh|oy|ou|co|corp|pte|pvt|sa|srl|bv|ag|plc)\b/i;
  return !suffixes.test(trimmed);
}

// ---------- module 1: risk pre-check ----------

function scoreToLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 28) return "medium";
  return "low";
}

const CHOKEPOINT_BANKS = [
  "Deutsche Bank Trust (NY)",
  "Citibank N.A. (London)",
  "Standard Chartered (Singapore)",
  "HSBC Intermediary (HK)",
];

/** Stable pseudo-random from a string seed — keeps output reproducible. */
function seededJitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

/** Return-risk pre-check: explainable rules → hit factors + tiered report. */
export function assessRisk(supplier: Supplier): RiskAssessment {
  const factors: RiskFactor[] = [];

  // 1. SWIFT / BIC validation
  const swiftBad = !isValidSwift(supplier.swift);
  factors.push({
    id: "swift",
    title: "SWIFT / BIC validation",
    severity: swiftBad ? "critical" : "info",
    points: swiftBad ? 30 : 0,
    description: swiftBad
      ? "The beneficiary SWIFT/BIC code is malformed — the wire will bounce at the routing bank."
      : "SWIFT/BIC code format is valid.",
    remediation: "Confirm the 8 or 11-character SWIFT/BIC with the beneficiary bank.",
    hit: swiftBad,
  });

  // 2. IBAN validation
  const ibanBad = !isValidIban(supplier.iban);
  factors.push({
    id: "iban",
    title: "IBAN validation",
    severity: ibanBad ? "critical" : "info",
    points: ibanBad ? 28 : 0,
    description: ibanBad
      ? "The IBAN fails structural validation — high chance of an invalid-account return."
      : "IBAN structure is valid.",
    remediation: "Re-collect the IBAN and verify the country + check digits.",
    hit: ibanBad,
  });

  // 3. Company name spelling / suffix
  const nameBad = companyNameIssue(supplier.name);
  factors.push({
    id: "company-name",
    title: "Company name & suffix",
    severity: nameBad ? "warn" : "info",
    points: nameBad ? 10 : 0,
    description: nameBad
      ? "Beneficiary name has spacing/suffix issues that can trip name-screening at the beneficiary bank."
      : "Beneficiary legal name looks well-formed.",
    remediation: "Match the name exactly to the bank record, including the legal suffix.",
    hit: nameBad,
  });

  // 4. Dormant / unverified account
  const dormant = supplier.accountStatus !== "active";
  factors.push({
    id: "account-status",
    title: "Account dormancy risk",
    severity: supplier.accountStatus === "dormant" ? "warn" : "info",
    points: supplier.accountStatus === "dormant" ? 12 : supplier.accountStatus === "unverified" ? 8 : 0,
    description: dormant
      ? "The beneficiary account is dormant/unverified — dormant accounts frequently reject inbound wires."
      : "Beneficiary account is active.",
    remediation: "Ask the beneficiary to confirm the account is active before sending.",
    hit: dormant,
  });

  // 5. Sanctions & high-risk region
  const sanctionHit = supplier.restrictedRegion;
  factors.push({
    id: "sanction",
    title: "Sanctions & high-risk region",
    severity: sanctionHit ? "critical" : "info",
    points: sanctionHit ? 40 : 0,
    description: sanctionHit
      ? "Beneficiary is in a sanctioned/high-risk jurisdiction — likely compliance hold or return."
      : "Region hits no sanctions or high-risk list.",
    remediation: "Route through a compliance review; keep due-diligence records on file.",
    hit: sanctionHit,
  });

  // 6. Beneficiary bank blacklist
  const bankHit = supplier.bankBlacklisted;
  factors.push({
    id: "bank-blacklist",
    title: "Beneficiary bank blacklist",
    severity: bankHit ? "critical" : "info",
    points: bankHit ? 34 : 0,
    description: bankHit
      ? "The beneficiary bank is on the internal risk blacklist — elevated interception and return risk."
      : "Beneficiary bank is not blacklisted.",
    remediation: "Request an alternate beneficiary bank or use a licensed PSP corridor.",
    hit: bankHit,
  });

  // 7. Currency control / interception probability
  const controlled = supplier.currency === "INR" || supplier.currency === "VND" || supplier.currency === "AED";
  const jitter = seededJitter(`${supplier.id}:ctl`);
  const controlPts = controlled ? Math.round(14 + jitter * 6) : 0;
  factors.push({
    id: "currency-control",
    title: "Currency control & interception",
    severity: controlled ? "warn" : "info",
    points: controlPts,
    description: controlled
      ? `Destination currency (${supplier.currency}) is under FX control — cross-border interception probability is elevated.`
      : "Destination currency has no significant FX-control interception risk.",
    remediation: "Attach an invoice + business purpose; consider a licensed local PSP corridor.",
    hit: controlled,
  });

  const rawScore = factors.reduce((s, f) => s + f.points, 0);
  const score = clamp(Math.round(rawScore), 0, 100);
  const level = scoreToLevel(score);
  const returnProbability = clamp(
    score / 100 + supplier.historicalReturnRate * 0.5 + jitter * 0.03,
    0.01,
    0.97,
  );
  const chokepointBank =
    CHOKEPOINT_BANKS[Math.abs(Math.round(jitter * 1000)) % CHOKEPOINT_BANKS.length];
  const hasBlocker = factors.some((f) => f.hit && f.severity === "critical");
  // Controlled/high-risk corridors route through more intermediaries.
  const avgHops = supplier.restrictedRegion ? 4 : controlled ? 3 : supplier.entityType === "domestic" ? 1 : 2;
  const returnReasons = predictReturnReasons(supplier, factors, returnProbability);
  // Cost of a bounce: base 3d + 2d per extra hop; sunk fees rise with hops.
  const lostDays = Math.round((3 + avgHops * 2) * (1 + supplier.historicalReturnRate));
  const sunkFeesUsd = Math.round((45 + avgHops * 22) * 100) / 100;
  const returnCost = { lostDays, sunkFeesUsd };

  return {
    score,
    level,
    returnProbability,
    chokepointBank,
    avgHops,
    factors,
    returnReasons,
    returnCost,
    hasBlocker,
  };
}

/**
 * "Why it might bounce": rank the hit factors into the top-3 most likely return
 * reasons, each with a probability share and a plain-language source. Explains
 * the otherwise-mysterious return before the money leaves.
 */
export function predictReturnReasons(
  supplier: Supplier,
  factors: RiskFactor[],
  returnProbability: number,
): RiskAssessment["returnReasons"] {
  const REASON_META: Record<string, { title: string; source: string }> = {
    swift: { title: "Malformed SWIFT/BIC bounces at routing bank", source: "Rule: SWIFT format check" },
    iban: { title: "Invalid IBAN → invalid-account return", source: "Rule: IBAN structure check" },
    "company-name": { title: "Name mismatch at beneficiary screening", source: "Rule: name & suffix check" },
    "account-status": { title: "Dormant account rejects inbound wire", source: "Ledger: account status" },
    sanction: { title: "Sanctions/compliance hold at correspondent", source: "List: sanctions & high-risk" },
    "bank-blacklist": { title: "Beneficiary bank intercepts the wire", source: "List: bank blacklist" },
    "currency-control": { title: "FX-control hold — missing documentation", source: `Corridor: ${supplier.currency} controls` },
  };

  const hits = factors.filter((f) => f.hit && f.points > 0);
  if (hits.length === 0) {
    return [
      {
        id: "none",
        title: "No specific return cause detected",
        probability: clamp(returnProbability, 0.01, 0.2),
        source: "Corridor baseline",
      },
    ];
  }

  const totalPoints = hits.reduce((s, f) => s + f.points, 0);
  return hits
    .map((f) => {
      const meta = REASON_META[f.id] ?? { title: f.title, source: "Rule" };
      // Share of overall return probability attributable to this factor.
      const probability = clamp((f.points / totalPoints) * returnProbability, 0.01, 0.97);
      return { id: f.id, title: meta.title, probability, source: meta.source };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}

/**
 * Payout requirements for a corridor (module 4). Turns "re-learning each bank's
 * rules every time" into a reusable, per-payee checklist derived from country,
 * currency, entity type and account status.
 */
export function corridorRequirements(supplier: Supplier): CorridorRequirement[] {
  const reqs: CorridorRequirement[] = [];
  const isEuro = supplier.currency === "EUR" || supplier.currency === "GBP";
  const controlled =
    supplier.currency === "INR" || supplier.currency === "VND" || supplier.currency === "AED";

  reqs.push({
    id: "legal-name",
    label: "Exact legal name incl. suffix",
    mandatory: true,
    detail: "Beneficiary name must match the bank record character-for-character (Ltd/LLC/Pte etc.).",
  });
  reqs.push({
    id: "swift",
    label: "Valid 8 or 11-char SWIFT/BIC",
    mandatory: true,
    detail: `On file: ${supplier.swift}. Confirm branch code with the beneficiary bank.`,
  });
  reqs.push({
    id: "iban",
    label: isEuro ? "IBAN (mandatory in this corridor)" : "IBAN or local account number",
    mandatory: isEuro,
    detail: isEuro
      ? "EUR/GBP corridors require a valid IBAN with correct country + check digits."
      : "Provide IBAN where supported, otherwise the local account + routing number.",
  });

  if (controlled) {
    reqs.push({
      id: "invoice",
      label: "Commercial invoice + business purpose",
      mandatory: true,
      detail: `${supplier.currency} is under FX control — attach an invoice and stated purpose or funds are held.`,
    });
    reqs.push({
      id: "local-tax",
      label: "Local tax / registration ID",
      mandatory: true,
      detail: "Controlled corridors screen for a beneficiary tax or company registration number.",
    });
  }

  if (supplier.restrictedRegion) {
    reqs.push({
      id: "kyc",
      label: "Enhanced due-diligence pack",
      mandatory: true,
      detail: "High-risk/sanctioned region — keep KYC and source-of-funds records before sending.",
    });
  }

  if (supplier.accountStatus !== "active") {
    reqs.push({
      id: "account-confirm",
      label: "Confirm account is active",
      mandatory: true,
      detail: `Account is ${supplier.accountStatus} — have the beneficiary confirm it accepts inbound wires.`,
    });
  }

  reqs.push({
    id: "prenote",
    label: "Send a small pre-note first",
    mandatory: false,
    detail: "For a new corridor, a small test transfer verifies the details before the full amount.",
  });

  return reqs;
}

// ---------- module 2: channel pool + router ----------

interface ChannelSpec {
  id: string;
  channelClass: ChannelClass;
  name: string;
  baseFeeRate: number;
  fixedFeeUsd: number;
  baseMinutes: number;
  baseSuccessRate: number;
  baseFxLoss: number;
  /** Layer specs for the money-flow link board (label + handling bank). */
  layers: { label: string; role: FlowHop["role"]; bank: string }[];
}

export const CHANNELS: ChannelSpec[] = [
  {
    id: "stablecoin-direct",
    channelClass: "stablecoin-direct",
    name: "Stablecoin Direct",
    baseFeeRate: 0.0026,
    fixedFeeUsd: 5,
    baseMinutes: 150,
    baseSuccessRate: 0.985,
    baseFxLoss: 0.003,
    layers: [
      { label: "On-ramp (USDC)", role: "origin", bank: "Regulated on-ramp (USDC)" },
      { label: "Chain settlement", role: "intermediary", bank: "Public-chain settlement (on-chain)" },
      { label: "Local off-ramp", role: "beneficiary", bank: "Licensed local off-ramp" },
    ],
  },
  {
    id: "local-fiat",
    channelClass: "local-fiat",
    name: "Local Fiat Payout",
    // Consolidated bank/PSP rail: licensed PSP front with a correspondent-bank
    // fallback leg, so the money-flow keeps its intermediary chokepoint story.
    baseFeeRate: 0.0048,
    fixedFeeUsd: 14,
    baseMinutes: 600,
    baseSuccessRate: 0.96,
    baseFxLoss: 0.008,
    layers: [
      { label: "PSP collection", role: "origin", bank: "Licensed PSP collection account" },
      { label: "Correspondent bank", role: "intermediary", bank: "Citibank N.A. (New York)" },
      { label: "PSP netting hub", role: "intermediary", bank: "PSP in-network netting hub" },
      { label: "Local payout bank", role: "beneficiary", bank: "In-country payout partner bank" },
    ],
  },
];

function buildHops(
  channel: ChannelSpec,
  amountUsd: number,
  totalFeeUsd: number,
  etaMinutes: number,
  chokepointIdx: number,
): FlowHop[] {
  const n = channel.layers.length;
  const perFee = totalFeeUsd / n;
  const perMin = etaMinutes / n;
  let remaining = amountUsd;
  return channel.layers.map((layer, i) => {
    const feeUsd = Math.round(perFee * (i === n - 1 ? 0.6 : 1.2) * 100) / 100;
    remaining = Math.round((remaining - feeUsd) * 100) / 100;
    const chokepoint = i === chokepointIdx && layer.role === "intermediary";
    // Transparency: stablecoin chain settlement is fully traceable; a chokepoint
    // intermediary is opaque; other intermediaries are partial; endpoints clear.
    let blackboxLevel: FlowHop["blackboxLevel"];
    if (layer.role === "intermediary") {
      if (channel.channelClass === "stablecoin-direct") blackboxLevel = "clear";
      else if (chokepoint) blackboxLevel = "opaque";
      else blackboxLevel = "partial";
    } else {
      blackboxLevel = layer.role === "origin" ? "clear" : "partial";
    }
    return {
      id: `${channel.id}-hop-${i}`,
      label: layer.label,
      role: layer.role,
      bankName: layer.bank,
      minutes: Math.round(perMin),
      feeUsd,
      remainingUsd: remaining,
      idleMinutes: chokepoint ? Math.round(perMin * 1.8) : Math.round(perMin * 0.3),
      chokepoint,
      blackboxLevel,
      note: `${layer.bank} · ${channel.name}`,
    };
  });
}

/**
 * Router: score each channel on fee / time / return-risk / FX-loss, factoring
 * the risk pre-check. Stablecoin gateway is only available for overseas payees.
 */
export function routePayment(
  supplier: Supplier,
  input: PaymentInput,
  risk: RiskAssessment,
): RoutingResult {
  const riskWeight = risk.level === "high" ? 0.5 : risk.level === "medium" ? 0.38 : 0.26;
  const feeWeight = risk.level === "high" ? 0.2 : 0.32;
  const fxWeight = 0.14;
  const speedWeight = clamp(1 - riskWeight - feeWeight - fxWeight, 0.05, 0.6);

  const options: RouteOption[] = CHANNELS.map((channel) => {
    const jitter = seededJitter(`${channel.id}:${supplier.id}`);
    const feeRate = clamp(channel.baseFeeRate + jitter * 0.0008, 0.001, 0.02);
    const totalFeeUsd = Math.round((input.amountUsd * feeRate + channel.fixedFeeUsd) * 100) / 100;
    const etaMinutes = Math.max(60, Math.round(channel.baseMinutes * (1 + jitter * 0.12)));
    const successRate = clamp(
      channel.baseSuccessRate - supplier.historicalReturnRate * 0.4 + jitter * 0.004,
      0.75,
      0.998,
    );
    const returnRisk = clamp(1 - successRate + risk.returnProbability * 0.25, 0.01, 0.6);
    const fxLoss = clamp(channel.baseFxLoss + jitter * 0.0015, 0.001, 0.03);
    const receiveUsd =
      Math.round((input.amountUsd - totalFeeUsd - input.amountUsd * fxLoss) * 100) / 100;

    // stablecoin gateway only for overseas entities
    const available =
      channel.channelClass !== "stablecoin-gateway" || supplier.entityType === "overseas";

    const feeScore = clamp(1 - feeRate / 0.012, 0, 1);
    const speedScore = clamp(1 - etaMinutes / 1600, 0, 1);
    const successScore = clamp((successRate - 0.75) / 0.25, 0, 1);
    const fxScore = clamp(1 - fxLoss / 0.02, 0, 1);
    const composite =
      feeScore * feeWeight + speedScore * speedWeight + successScore * riskWeight + fxScore * fxWeight;
    const score = available ? clamp(Math.round(composite * 100), 0, 100) : 0;

    const chokepointIdx = channel.layers.findIndex((l) => l.role === "intermediary");

    return {
      id: channel.id,
      name: channel.name,
      channelClass: channel.channelClass,
      totalFeeUsd,
      feeRate,
      etaMinutes,
      successRate,
      returnRisk,
      fxLoss,
      receiveUsd,
      score,
      reason: "",
      available,
      hops: buildHops(channel, input.amountUsd, totalFeeUsd, etaMinutes, chokepointIdx),
      recommended: false,
    };
  });

  const ranked = [...options].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  best.recommended = true;

  for (const opt of options) opt.reason = buildReason(opt, options, risk.level);

  return { options, recommendedId: best.id };
}

function buildReason(opt: RouteOption, all: RouteOption[], level: RiskLevel): string {
  if (!opt.available) return "Not available for this payee (domestic entity).";
  const avail = all.filter((o) => o.available);
  const cheapest = [...avail].sort((a, b) => a.totalFeeUsd - b.totalFeeUsd)[0];
  const fastest = [...avail].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
  const safest = [...avail].sort((a, b) => a.returnRisk - b.returnRisk)[0];
  if (opt.recommended) {
    return level === "high"
      ? "High-risk payment — prioritizes the lowest return risk"
      : "Best balance of fee, speed, return risk and FX loss";
  }
  if (opt.id === cheapest.id) return "Lowest fee, slower settlement";
  if (opt.id === fastest.id) return "Fastest arrival";
  if (opt.id === safest.id) return "Lowest return risk";
  return "Alternative route";
}

export function formatMinutes(minutes: number): string {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return h > 0 ? `${d}d${h}h` : `${d}d`;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h${m}m`;
}

/**
 * Deterministic reconciliation vouchers (module 4). Derives off-chain (bank
 * wire ref + invoice no) and on-chain/PSP references from the payment id +
 * channel, so on-chain / off-chain proofs can be matched at reconciliation time
 * without extra storage. On-chain ref is only present for PSP / stablecoin.
 */
export function deriveVouchers(
  id: string,
  channelClass: ChannelClass,
  status: string,
): { offchainRef: string; invoiceNo: string; onchainRef: string } {
  const seed = Math.abs(Math.round(seededJitter(id) * 1e6));
  const hex = seed.toString(16).padStart(6, "0");
  const offchainRef = `MT103-${hex.toUpperCase()}`;
  const invoiceNo = `INV-${seed % 100000}`;
  // Only arrived/settling PSP or stablecoin transfers expose an on-chain proof.
  const hasOnchain =
    channelClass !== "swift-gpi" && (status === "arrived" || status === "settling");
  const onchainRef = hasOnchain
    ? channelClass === "stablecoin-gateway"
      ? `0x${seed.toString(16).padStart(8, "0")}`
      : `PSP-${hex.toUpperCase()}`
    : "";
  return { offchainRef, invoiceNo, onchainRef };
}
