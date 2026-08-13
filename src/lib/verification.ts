// Verification-request templates (data-quality risk close-out).
//
// Only data-quality risk factors (name/account/IBAN/SWIFT format) can be
// resolved by asking the payee/business, so only those produce a request.
// Each template is a ready-to-copy message the cashier sends out-of-band
// (email / IM); no realtime channel is implied.

import type { CaseEvent, RiskFactor, Supplier, VerificationCase, PaymentRecord, RiskAssessment } from "@/lib/engine/types";
import { recomputeWithClarified } from "@/lib/engine";

/** Data-quality factor ids that can be closed out by a verification request. */
export const VERIFIABLE_FACTOR_IDS = ["company-name", "account-status", "iban", "swift"] as const;
export type VerifiableFactorId = (typeof VERIFIABLE_FACTOR_IDS)[number];

export function isVerifiable(factorId: string): factorId is VerifiableFactorId {
  return (VERIFIABLE_FACTOR_IDS as readonly string[]).includes(factorId);
}

/** Build a ready-to-copy verification message for a data-quality factor. */
export function buildTemplate(factorId: string, supplier: Supplier): string {
  const ref = `Ref: payee ${supplier.name} (${supplier.country})`;
  const sign = `\n\nPlease confirm by return so we can release your payment.\nThank you,\nAccounts Payable`;

  switch (factorId) {
    case "company-name":
      return (
        `Hi,\n\nBefore we release your payment we must match your beneficiary name exactly ` +
        `to your bank's records. We currently have:\n\n  "${supplier.name}"\n\n` +
        `Please confirm the exact registered legal name (including any suffix such ` +
        `as Ltd / GmbH / Pte Ltd) as it appears on your bank account.\n\n${ref}${sign}`
      );
    case "account-status":
      return (
        `Hi,\n\nOur pre-send checks flagged your receiving account as possibly dormant ` +
        `or unverified, which can cause inbound wires to bounce.\n\nPlease confirm ` +
        `that the account below is active and able to receive an international ` +
        `credit:\n\n  IBAN/Acct: ${supplier.iban}\n  Bank (SWIFT): ${supplier.swift}\n\n${ref}${sign}`
      );
    case "iban":
      return (
        `Hi,\n\nThe account number / IBAN we hold did not pass structural validation, ` +
        `so the wire may be returned as an invalid account. We have:\n\n  ` +
        `${supplier.iban}\n\nPlease re-send your full IBAN / account number and ` +
        `confirm the country and check digits.\n\n${ref}${sign}`
      );
    case "swift":
      return (
        `Hi,\n\nThe SWIFT/BIC we hold for your bank appears malformed, which will ` +
        `bounce the wire at the routing bank. We have:\n\n  ${supplier.swift}\n\n` +
        `Please confirm the correct 8 or 11-character SWIFT/BIC of your beneficiary ` +
        `bank.\n\n${ref}${sign}`
      );
    default:
      return `Hi,\n\nPlease confirm your payment details so we can release funds to ${supplier.name}.${sign}`;
  }
}

// ---- shared-case helpers (public link + timeline) ----

/** URL-safe random token; works in browser and Node (Web Crypto). */
export function makeToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Bank-side raw risk description shown first-hand on the shared case. */
export function bankRawDescription(factor: RiskFactor | undefined, supplier: Supplier): string {
  const head = `Beneficiary: ${supplier.name} (${supplier.country})\nBank SWIFT: ${supplier.swift}\nIBAN/Acct: ${supplier.iban}`;
  const body = factor
    ? `Flagged control: ${factor.title}\nSeverity: ${factor.severity}\n\n${factor.description}`
    : "A data-quality control requires beneficiary confirmation before release.";
  return `${head}\n\n${body}`;
}

export function makeEvent(input: {
  actor: CaseEvent["actor"];
  kind: CaseEvent["kind"];
  message: string;
}): CaseEvent {
  return { id: makeToken().slice(0, 12), at: new Date().toISOString(), ...input };
}

/** Build a full shared VerificationCase from a supplier + triggering factor. */
export function buildVerificationCase(input: {
  id: string;
  supplier: Supplier;
  factorId: string;
  factor: RiskFactor | undefined;
}): VerificationCase {
  const now = new Date().toISOString();
  return {
    id: input.id,
    supplierId: input.supplier.id,
    supplierName: input.supplier.name,
    factorId: input.factorId,
    factorTitle: input.factor?.title ?? input.factorId,
    template: buildTemplate(input.factorId, input.supplier),
    bankRawDescription: bankRawDescription(input.factor, input.supplier),
    status: "open",
    readToken: makeToken(),
    writeToken: makeToken(),
    timeline: [
      makeEvent({ actor: "cashier", kind: "created", message: "Verification request opened." }),
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/** Append a status-change event and return the mutated fields. */
export function applyStatusChange(
  prev: VerificationCase,
  status: VerificationCase["status"],
  actor: CaseEvent["actor"] = "cashier",
): { status: VerificationCase["status"]; timeline: CaseEvent[]; updatedAt: string } {
  const label =
    status === "verified" ? "Marked verified" : status === "clarified" ? "Marked clarified" : "Reopened";
  const ev = makeEvent({ actor, kind: "status", message: label });
  return {
    status,
    timeline: [...(prev.timeline ?? []), ev],
    updatedAt: ev.at,
  };
}

/** Append a comment event and return the mutated fields. */
export function applyComment(
  prev: VerificationCase,
  message: string,
  actor: CaseEvent["actor"],
): { timeline: CaseEvent[]; updatedAt: string } {
  const ev = makeEvent({ actor, kind: "comment", message: message.trim() });
  return { timeline: [...(prev.timeline ?? []), ev], updatedAt: ev.at };
}

// ---- feedback into the main flow ("clarified" downgrade) ----

/** A verification case is resolved once a party confirms the detail. */
export function isResolved(c: VerificationCase): boolean {
  return c.status === "verified" || c.status === "clarified";
}

/**
 * Map supplierId → (factorId → resolution mode) for resolved verification
 * cases. "verified" wins over "clarified" when both exist for the same factor.
 */
export function clarifiedBySupplier(
  cases: VerificationCase[],
): Record<string, Map<string, "verified" | "clarified">> {
  const map: Record<string, Map<string, "verified" | "clarified">> = {};
  for (const c of cases) {
    if (!isResolved(c)) continue;
    const mode: "verified" | "clarified" = c.status === "verified" ? "verified" : "clarified";
    const inner = (map[c.supplierId] ??= new Map());
    if (inner.get(c.factorId) !== "verified") inner.set(c.factorId, mode);
  }
  return map;
}

/** Effective (clarified-adjusted) risk view of a stored payment. */
export interface EffectiveRisk {
  riskScore: number;
  riskLevel: PaymentRecord["riskLevel"];
  returnProbability: number;
  hasBlocker: boolean;
  /** Factors that were actually cleared by a resolved case (hit + verifiable). */
  cleared: RiskFactor[];
  /** True when clearing changed the score / level / blocker. */
  changed: boolean;
}

/**
 * Recompute a payment's risk after resolved verification cases cleared some
 * data-quality factors. Only verifiable, hit factors that appear in `clarified`
 * are cleared; the score / level / blocker are recalculated via the engine.
 */
export function recomputePaymentRisk(
  record: PaymentRecord,
  clarified: ReadonlyMap<string, "verified" | "clarified">,
): EffectiveRisk {
  // Only data-quality factors the payee can actually clear.
  const clearable = new Map<string, "verified" | "clarified">();
  for (const [id, mode] of clarified) if (isVerifiable(id)) clearable.set(id, mode);

  // Reconstruct a minimal assessment from the stored snapshot.
  const hadBlocker = record.riskFactors.some((f) => f.hit && f.severity === "critical");
  const snapshot: RiskAssessment = {
    score: record.riskScore,
    level: record.riskLevel,
    returnProbability: record.returnProbability,
    chokepointBank: record.chokepointBank,
    avgHops: 0,
    factors: record.riskFactors,
    returnReasons: [],
    returnCost: { lostDays: 0, sunkFeesUsd: 0 },
    hasBlocker: hadBlocker,
  };

  const { risk, cleared } = recomputeWithClarified(snapshot, clearable);
  const changed =
    risk.score !== record.riskScore ||
    risk.level !== record.riskLevel ||
    risk.hasBlocker !== hadBlocker;

  return {
    riskScore: risk.score,
    riskLevel: risk.level,
    returnProbability: risk.returnProbability,
    hasBlocker: risk.hasBlocker,
    cleared,
    changed,
  };
}
