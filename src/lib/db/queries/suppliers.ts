import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { suppliers, type SupplierRow } from "../schema/suppliers";
import type {
  AccountStatus,
  ChannelClass,
  Currency,
  EntityType,
  RiskLevel,
  Supplier,
} from "@/lib/engine/types";

function toDomain(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    codeName: row.codeName,
    country: row.country,
    countryCode: row.countryCode,
    currency: row.currency as Currency,
    entityType: row.entityType as EntityType,
    bankName: row.bankName,
    swift: row.swift,
    iban: row.iban,
    accountStatus: row.accountStatus as AccountStatus,
    restrictedRegion: row.restrictedRegion,
    bankBlacklisted: row.bankBlacklisted,
    preferredChannel: row.preferredChannel as ChannelClass,
    riskTag: row.riskTag as RiskLevel,
    paymentCount: row.paymentCount,
    historicalReturnRate: row.historicalReturnRate,
    avgSettlementHours: row.avgSettlementHours,
    avgAmountUsd: row.avgAmountUsd,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSuppliers(userId: string): Promise<Supplier[]> {
  const rows = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.userId, userId))
    .orderBy(desc(suppliers.createdAt));
  return rows.map(toDomain);
}

export async function getSupplierById(userId: string, id: string): Promise<Supplier | undefined> {
  const rows = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.userId, userId), eq(suppliers.id, id)))
    .limit(1);
  return rows[0] ? toDomain(rows[0]) : undefined;
}

export async function insertSuppliers(
  userId: string,
  items: Omit<Supplier, "createdAt">[],
): Promise<void> {
  if (items.length === 0) return;
  await db
    .insert(suppliers)
    .values(
      items.map((s) => ({
        id: s.id,
        userId,
        name: s.name,
        codeName: s.codeName,
        country: s.country,
        countryCode: s.countryCode,
        currency: s.currency,
        entityType: s.entityType,
        bankName: s.bankName,
        swift: s.swift,
        iban: s.iban,
        accountStatus: s.accountStatus,
        restrictedRegion: s.restrictedRegion,
        bankBlacklisted: s.bankBlacklisted,
        preferredChannel: s.preferredChannel,
        riskTag: s.riskTag,
        paymentCount: s.paymentCount,
        historicalReturnRate: s.historicalReturnRate,
        avgSettlementHours: s.avgSettlementHours,
        avgAmountUsd: s.avgAmountUsd,
      })),
    )
    .onConflictDoNothing();
}

export async function countSuppliers(userId: string): Promise<number> {
  const rows = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.userId, userId));
  return rows.length;
}
