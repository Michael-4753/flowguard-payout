import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { suppliers, type SupplierRow } from "../schema/suppliers";
import type { ChainId, StableCoin, Supplier } from "@/lib/engine/types";

function toDomain(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    codeName: row.codeName,
    region: row.region,
    countryCode: row.countryCode,
    restrictedRegion: row.restrictedRegion,
    preferredChain: row.preferredChain as ChainId,
    preferredCoin: row.preferredCoin as StableCoin,
    payoutAddress: row.payoutAddress,
    travelRuleCompleteness: row.travelRuleCompleteness,
    addressNetworkMatch: row.addressNetworkMatch,
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

export async function getSupplierById(
  userId: string,
  id: string,
): Promise<Supplier | undefined> {
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
        region: s.region,
        countryCode: s.countryCode,
        restrictedRegion: s.restrictedRegion,
        preferredChain: s.preferredChain,
        preferredCoin: s.preferredCoin,
        payoutAddress: s.payoutAddress,
        travelRuleCompleteness: s.travelRuleCompleteness,
        addressNetworkMatch: s.addressNetworkMatch,
        paymentCount: s.paymentCount,
        historicalReturnRate: s.historicalReturnRate,
        avgSettlementHours: s.avgSettlementHours,
        avgAmountUsd: s.avgAmountUsd,
      })),
    )
    .onConflictDoNothing();
}

export async function countSuppliers(userId: string): Promise<number> {
  const rows = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.userId, userId));
  return rows.length;
}
