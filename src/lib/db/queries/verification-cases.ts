import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { verificationCases, type VerificationCaseRow } from "../schema/verification-cases";
import type { VerificationCase, VerificationStatus } from "@/lib/engine/types";

function toDomain(row: VerificationCaseRow): VerificationCase {
  return {
    id: row.id,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    factorId: row.factorId,
    factorTitle: row.factorTitle,
    template: row.template,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listVerificationCases(userId: string): Promise<VerificationCase[]> {
  const rows = await db
    .select()
    .from(verificationCases)
    .where(eq(verificationCases.userId, userId))
    .orderBy(desc(verificationCases.createdAt));
  return rows.map(toDomain);
}

export async function insertVerificationCase(
  userId: string,
  record: VerificationCase,
): Promise<VerificationCase> {
  const rows = await db
    .insert(verificationCases)
    .values({
      id: record.id,
      userId,
      supplierId: record.supplierId,
      supplierName: record.supplierName,
      factorId: record.factorId,
      factorTitle: record.factorTitle,
      template: record.template,
      status: record.status,
    })
    .returning();
  return toDomain(rows[0]);
}

export async function updateVerificationStatus(
  userId: string,
  id: string,
  status: VerificationStatus,
): Promise<VerificationCase | undefined> {
  const rows = await db
    .update(verificationCases)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(verificationCases.userId, userId), eq(verificationCases.id, id)))
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}
