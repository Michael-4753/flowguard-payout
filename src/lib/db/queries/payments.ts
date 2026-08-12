import { and, desc, eq } from "drizzle-orm";
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

/** Checker action: approve (→ initiated) or reject (→ rejected) a pending payment. */
export async function reviewPayment(input: {
  userId: string;
  id: string;
  approve: boolean;
  note?: string;
}): Promise<PaymentRecord | undefined> {
  const existing = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, input.userId), eq(payments.id, input.id)))
    .limit(1);
  const row = existing[0];
  if (!row || row.status !== "pending_review") return undefined;
  const current = (row.review as ReviewInfo | null) ?? initialReview(input.userId);
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
  return rows[0] ? toDomain(rows[0]) : undefined;
}

export async function countPayments(userId: string): Promise<number> {
  const rows = await db.select({ id: payments.id }).from(payments).where(eq(payments.userId, userId));
  return rows.length;
}
