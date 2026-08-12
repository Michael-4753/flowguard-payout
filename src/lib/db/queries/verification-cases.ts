import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../client";
import { verificationCases, type VerificationCaseRow } from "../schema/verification-cases";
import { applyStatusChange, applyComment } from "@/lib/verification";
import type { CaseActor, VerificationCase, VerificationStatus } from "@/lib/engine/types";

function toDomain(row: VerificationCaseRow): VerificationCase {
  return {
    id: row.id,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    factorId: row.factorId,
    factorTitle: row.factorTitle,
    template: row.template,
    bankRawDescription: row.bankRawDescription,
    status: row.status,
    readToken: row.readToken,
    writeToken: row.writeToken,
    timeline: row.timeline ?? [],
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
      bankRawDescription: record.bankRawDescription,
      status: record.status,
      readToken: record.readToken,
      writeToken: record.writeToken,
      timeline: record.timeline,
    })
    .returning();
  return toDomain(rows[0]);
}

/** Authenticated status change (cashier). Appends a timeline event. */
export async function updateVerificationStatus(
  userId: string,
  id: string,
  status: VerificationStatus,
): Promise<VerificationCase | undefined> {
  const existing = await db
    .select()
    .from(verificationCases)
    .where(and(eq(verificationCases.userId, userId), eq(verificationCases.id, id)))
    .limit(1);
  const current = existing[0];
  if (!current) return undefined;
  const patch = applyStatusChange(toDomain(current), status, "cashier");
  const rows = await db
    .update(verificationCases)
    .set({ status: patch.status, timeline: patch.timeline, updatedAt: new Date(patch.updatedAt) })
    .where(and(eq(verificationCases.userId, userId), eq(verificationCases.id, id)))
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}

/** Authenticated comment (cashier). Appends a timeline event. */
export async function addVerificationComment(
  userId: string,
  id: string,
  message: string,
): Promise<VerificationCase | undefined> {
  const existing = await db
    .select()
    .from(verificationCases)
    .where(and(eq(verificationCases.userId, userId), eq(verificationCases.id, id)))
    .limit(1);
  const current = existing[0];
  if (!current || !message.trim()) return undefined;
  const patch = applyComment(toDomain(current), message, "cashier");
  const rows = await db
    .update(verificationCases)
    .set({ timeline: patch.timeline, updatedAt: new Date(patch.updatedAt) })
    .where(and(eq(verificationCases.userId, userId), eq(verificationCases.id, id)))
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}

/* ---------------- public token access (no auth) ---------------- */

/** Look up a case by a read OR write token (public share links). */
export async function getVerificationCaseByToken(
  token: string,
): Promise<{ case: VerificationCase; canWrite: boolean } | undefined> {
  if (!token) return undefined;
  const rows = await db
    .select()
    .from(verificationCases)
    .where(or(eq(verificationCases.readToken, token), eq(verificationCases.writeToken, token)))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return { case: toDomain(row), canWrite: row.writeToken === token };
}

/** Public status change — requires a valid write token. */
export async function publicUpdateStatus(
  writeToken: string,
  status: VerificationStatus,
  actor: CaseActor,
): Promise<VerificationCase | undefined> {
  if (!writeToken) return undefined;
  const rows0 = await db
    .select()
    .from(verificationCases)
    .where(eq(verificationCases.writeToken, writeToken))
    .limit(1);
  const current = rows0[0];
  if (!current) return undefined;
  const patch = applyStatusChange(toDomain(current), status, actor);
  const rows = await db
    .update(verificationCases)
    .set({ status: patch.status, timeline: patch.timeline, updatedAt: new Date(patch.updatedAt) })
    .where(eq(verificationCases.writeToken, writeToken))
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}

/** Public comment — requires a valid write token. */
export async function publicAddComment(
  writeToken: string,
  message: string,
  actor: CaseActor,
): Promise<VerificationCase | undefined> {
  if (!writeToken || !message.trim()) return undefined;
  const rows0 = await db
    .select()
    .from(verificationCases)
    .where(eq(verificationCases.writeToken, writeToken))
    .limit(1);
  const current = rows0[0];
  if (!current) return undefined;
  const patch = applyComment(toDomain(current), message, actor);
  const rows = await db
    .update(verificationCases)
    .set({ timeline: patch.timeline, updatedAt: new Date(patch.updatedAt) })
    .where(eq(verificationCases.writeToken, writeToken))
    .returning();
  return rows[0] ? toDomain(rows[0]) : undefined;
}
