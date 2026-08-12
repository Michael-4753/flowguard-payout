import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { payments, type PaymentRow } from "../schema/payments";
import { deriveVouchers } from "@/lib/engine";
import { initialReview, applyDecision } from "@/lib/review";
import type { Currency, PaymentRecord, PaymentStatus, ReviewInfo } from "@/lib/engine/types";

function toDomain(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    supplierCodeName: row.supplierCodeName,
    amountUsd: row.amountUsd,
    currency: row.currency as Currency,
    riskScore: row.riskScore,
    riskLevel: row.riskLevel,
    returnProbability: row.returnProbability,
    chokepointBank: row.chokepointBank,
    riskFactors: row.riskFactors,
    selectedRouteId: row.selectedRouteId,
    route: row.route,
    status: row.status,
    ...deriveVouchers(`${row.supplierId}-${row.selectedRouteId}`, row.route.channelClass, row.status),
    review: (row.review as ReviewInfo | null) ?? initialReview(row.userId),
    settlementProof: (row.settlementProof as PaymentRecord["settlementProof"]) ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listPayments(userId: string): Promise<PaymentRecord[]> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
  return rows.map(toDomain);
}

export async function listPaymentsBySupplier(
  userId: string,
  supplierId: string,
): Promise<PaymentRecord[]> {
  const rows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.supplierId, supplierId)))
    .orderBy(desc(payments.createdAt));
  return rows.map(toDomain);
}

export async function insertPayment(userId: string, record: PaymentRecord): Promise<PaymentRecord> {
  const rows = await db
    .insert(payments)
    .values({
      id: record.id,
      userId,
      supplierId: record.supplierId,
      supplierName: record.supplierName,
      supplierCodeName: record.supplierCodeName,
      amountUsd: record.amountUsd,
      currency: record.currency,
      riskScore: record.riskScore,
      riskLevel: record.riskLevel,
      returnProbability: record.returnProbability,
      chokepointBank: record.chokepointBank,
      riskFactors: record.riskFactors,
      selectedRouteId: record.selectedRouteId,
      route: record.route,
      status: record.status,
      review: record.review,
    })
    .returning();
  return toDomain(rows[0]);
}

export async function updatePaymentStatus(
  userId: string,
  id: string,
  status: PaymentStatus,
): Promise<PaymentRecord | undefined> {
  const rows = await db
    .update(payments)
    .set({ status })
    .where(and(eq(payments.userId, userId), eq(payments.id, id)))
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}

/** Discriminated result so callers can distinguish a self-review block. */
export type ReviewOutcome =
  | { ok: true; payment: PaymentRecord }
  | { ok: false; reason: "not_pending" | "self_review" };

/**
 * Checker action: approve (→ initiated) or reject (→ rejected) a pending payment.
 * Segregation of duties: a payment cannot be APPROVED by the same person who
 * submitted it (maker). The maker may still return/reject their own draft.
 */
export async function reviewPayment(input: {
  userId: string;
  id: string;
  approve: boolean;
  note?: string;
}): Promise<ReviewOutcome> {
  const existing = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, input.userId), eq(payments.id, input.id)))
    .limit(1);
  const row = existing[0];
  if (!row || row.status !== "pending_review") return { ok: false, reason: "not_pending" };
  const current = (row.review as ReviewInfo | null) ?? initialReview(input.userId);
  // Hard block: the maker cannot be their own checker on an approval.
  if (input.approve && current.makerId && current.makerId === input.userId) {
    return { ok: false, reason: "self_review" };
  }
  const { review, status } = applyDecision(current, {
    checkerId: input.userId,
    approve: input.approve,
    note: input.note,
  });
  const rows = await db
    .update(payments)
    .set({ status, review })
    .where(and(eq(payments.userId, input.userId), eq(payments.id, input.id)))
    .returning();
  if (!rows[0]) return { ok: false, reason: "not_pending" };
  return { ok: true, payment: toDomain(rows[0]) };
}

/**
 * Post-approval dispatch: the payer has actually sent the funds at the bank /
 * on-chain. Advances an approved (`initiated`) payment to `settling` so the
 * money-flow tracker starts. Only the owner can dispatch their own payment.
 */
export async function dispatchPayment(input: {
  userId: string;
  id: string;
}): Promise<PaymentRecord | undefined> {
  const rows = await db
    .update(payments)
    .set({ status: "settling" })
    .where(
      and(
        eq(payments.userId, input.userId),
        eq(payments.id, input.id),
        eq(payments.status, "initiated"),
      ),
    )
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}

export async function countPayments(userId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(payments)
    .where(eq(payments.userId, userId));
  return rows[0]?.value ?? 0;
}
