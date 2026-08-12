"use client";

// Guest-mode local data engine. Mirrors the six network functions in
// lib/api/flowguard.ts but computes everything client-side using the built-in
// deterministic engine, the seed ledger, and localStorage-backed payment
// history. No network, no auth — usable offline.

import { assessRisk, deriveVouchers, routePayment } from "@/lib/engine";
import { initialReview, applyDecision } from "@/lib/review";
import { buildVerificationCase, applyStatusChange, applyComment, isVerifiable, makeToken } from "@/lib/verification";
import { SEED_SUPPLIERS } from "@/lib/db/seed-suppliers";
import { FAILURE_CASES } from "@/lib/engine/failure-cases";
import type {
  ChannelClass,
  Currency,
  FailureCase,
  PaymentRecord,
  RiskAssessment,
  RoutingResult,
  SettlementProof,
  PayeeReceipt,
  Supplier,
  CaseActor,
  VerificationCase,
  VerificationStatus,
} from "@/lib/engine/types";
import {
  addGuestPayment,
  readGuestPayments,
  updateGuestPayment,
  addGuestVerificationCase,
  readGuestVerificationCases,
  updateGuestVerificationCase,
  addGuestSupplier,
  readGuestSuppliers,
  readGuestWalletOverrides,
  setGuestWalletOverride,
} from "./guest-session";
import { buildSupplier, validateNewSupplier, validateWalletAddress, type NewSupplierInput } from "@/lib/supplier-input";

/** Stable createdAt for seed payees so guest data is reproducible. */
const GUEST_SEED_TS = "2026-01-01T00:00:00.000Z";

export function guestSuppliers(): Supplier[] {
  const overrides = readGuestWalletOverrides();
  const apply = (s: Supplier): Supplier =>
    overrides[s.id] ? { ...s, stablecoinWallet: overrides[s.id] } : s;
  const seeded = SEED_SUPPLIERS.map((s) => apply({ ...s, createdAt: GUEST_SEED_TS }));
  // User-added payees appear first, then the seed ledger.
  return [...readGuestSuppliers().map(apply), ...seeded];
}

/** Guest wallet backfill: persist a wallet override for any payee (seed or added). */
export function guestUpdateSupplierWallet(id: string, wallet: string): Supplier {
  const err = validateWalletAddress(wallet);
  if (err) throw new Error("invalid_wallet");
  setGuestWalletOverride(id, wallet.trim());
  const updated = guestSuppliers().find((s) => s.id === id);
  if (!updated) throw new Error("not_found");
  return updated;
}

/** Guest add-payee: validate + persist a new supplier in localStorage. */
export function guestCreateSupplier(input: NewSupplierInput): Supplier {
  const result = validateNewSupplier(input);
  if (!result.ok || !result.value) throw new Error("invalid_supplier");
  const supplier: Supplier = { ...buildSupplier(result.value), createdAt: new Date().toISOString() };
  addGuestSupplier(supplier);
  return supplier;
}

export function guestSupplier(
  id: string,
): { supplier: Supplier; payments: PaymentRecord[] } | null {
  const supplier = guestSuppliers().find((s) => s.id === id);
  if (!supplier) return null;
  const payments = readGuestPayments().filter((p) => p.supplierId === id);
  return { supplier, payments };
}

export function guestPayments(): PaymentRecord[] {
  return readGuestPayments();
}

/** Checker action: approve (→ initiated) or reject (→ rejected) a pending payment. */
export type GuestReviewOutcome =
  | { ok: true; payment: PaymentRecord }
  | { ok: false; reason: "not_pending" | "self_review" };

export function guestReviewPayment(input: {
  id: string;
  approve: boolean;
  note?: string;
  role?: "maker" | "checker";
}): GuestReviewOutcome {
  const current = readGuestPayments().find((p) => p.id === input.id);
  if (!current || current.status !== "pending_review") return { ok: false, reason: "not_pending" };
  // Segregation of duties: an approval must be made from the CHECKER identity,
  // distinct from the MAKER identity that submitted the payment. Switch to the
  // reviewer role to approve; rejecting/returning does not require it.
  if (input.approve && input.role !== "checker") {
    return { ok: false, reason: "self_review" };
  }
  const { review, status } = applyDecision(current.review, {
    checkerId: input.approve ? "guest:checker" : "guest",
    approve: input.approve,
    note: input.note,
  });
  const vouchers = input.approve
    ? deriveVouchers(`guest-${current.supplierId}-${current.selectedRouteId}`, current.route.channelClass, status)
    : { offchainRef: current.offchainRef, invoiceNo: current.invoiceNo, onchainRef: current.onchainRef };
  const updated: PaymentRecord = { ...current, ...vouchers, status, review };
  updateGuestPayment(updated);
  return { ok: true, payment: updated };
}

/** Post-approval dispatch (guest): advance an `initiated` payment to `settling`. */
export function guestDispatchPayment(input: { id: string }): PaymentRecord | null {
  const current = readGuestPayments().find((p) => p.id === input.id);
  if (!current || current.status !== "initiated") return null;
  const updated: PaymentRecord = { ...current, status: "settling", receiptToken: makeToken() };
  updateGuestPayment(updated);
  return updated;
}

/** Public lookup by receipt token (guest). */
export function guestGetPaymentByReceiptToken(token: string): PaymentRecord | null {
  if (!token) return null;
  return readGuestPayments().find((p) => p.receiptToken === token) ?? null;
}

/** Public payee confirmation (guest): settling → arrived + proof of receipt. */
export function guestConfirmReceipt(token: string, note: string): PaymentRecord | null {
  if (!token) return null;
  const current = readGuestPayments().find((p) => p.receiptToken === token);
  if (!current || current.status !== "settling") return null;
  const receipt: PayeeReceipt = { confirmedAt: new Date().toISOString(), note: note.trim() };
  const updated: PaymentRecord = { ...current, status: "arrived", receipt };
  updateGuestPayment(updated);
  return updated;
}

/** Attach settlement proof (guest): store bank slip / on-chain tx on the payment. */
export function guestAttachSettlementProof(input: {
  id: string;
  proof: SettlementProof;
}): PaymentRecord | null {
  const current = readGuestPayments().find((p) => p.id === input.id);
  if (!current) return null;
  const updated: PaymentRecord = { ...current, settlementProof: input.proof };
  updateGuestPayment(updated);
  return updated;
}

export function guestFailureCases(): FailureCase[] {
  return FAILURE_CASES;
}

export function guestVerificationCases(): VerificationCase[] {
  return readGuestVerificationCases();
}

export function guestCreateVerificationCase(input: {
  supplierId: string;
  factorId: string;
}): VerificationCase | null {
  const supplier = guestSuppliers().find((s) => s.id === input.supplierId);
  if (!supplier || !isVerifiable(input.factorId)) return null;
  const factor = assessRisk(supplier).factors.find((f) => f.id === input.factorId);
  const record = buildVerificationCase({
    id: `vc-guest-${Date.now().toString(36)}`,
    supplier,
    factorId: input.factorId,
    factor,
  });
  addGuestVerificationCase(record);
  return record;
}

export function guestSetVerificationStatus(
  id: string,
  status: VerificationStatus,
): VerificationCase | null {
  const current = readGuestVerificationCases().find((c) => c.id === id);
  if (!current) return null;
  const updated: VerificationCase = { ...current, ...applyStatusChange(current, status, "cashier") };
  updateGuestVerificationCase(updated);
  return updated;
}

export function guestAddVerificationComment(input: {
  id: string;
  message: string;
  actor: CaseActor;
}): VerificationCase | null {
  const current = readGuestVerificationCases().find((c) => c.id === input.id);
  if (!current || !input.message.trim()) return null;
  const updated: VerificationCase = {
    ...current,
    ...applyComment(current, input.message, input.actor),
  };
  updateGuestVerificationCase(updated);
  return updated;
}

export function guestAssess(input: {
  supplierId: string;
  amountUsd: number;
  preferredChannel?: ChannelClass;
}): { supplier: Supplier; risk: RiskAssessment; routing: RoutingResult } {
  const supplier = guestSuppliers().find((s) => s.id === input.supplierId);
  if (!supplier) throw new Error("not_found");
  const risk = assessRisk(supplier, input.amountUsd);
  const routing = routePayment(supplier, input, risk);
  return { supplier, risk, routing };
}

export function guestCreatePayment(input: {
  supplierId: string;
  amountUsd: number;
  preferredChannel?: ChannelClass;
  selectedRouteId: string;
  settleCurrency?: Currency;
}): PaymentRecord {
  const { supplier, risk, routing } = guestAssess(input);
  const route =
    routing.options.find((o) => o.id === input.selectedRouteId && o.available) ??
    routing.options.find((o) => o.id === routing.recommendedId)!;

  const record: PaymentRecord = {
    id: `guest-${Date.now().toString(36)}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierCodeName: supplier.codeName,
    amountUsd: input.amountUsd,
    currency: supplier.currency,
    settleCurrency: input.settleCurrency ?? "USD",
    riskScore: risk.score,
    riskLevel: risk.level,
    returnProbability: risk.returnProbability,
    chokepointBank: risk.chokepointBank,
    riskFactors: risk.factors,
    selectedRouteId: route.id,
    route,
    status: "pending_review",
    ...deriveVouchers(`guest-${supplier.id}-${route.id}`, route.channelClass, "pending_review"),
    review: initialReview("guest"),
    createdAt: new Date().toISOString(),
  };
  addGuestPayment(record);
  return record;
}
