import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/** 供应商档案。历史统计会喂给风险预检。每条记录归属一个用户。 */
export const suppliers = pgTable(
  "suppliers",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    codeName: varchar("code_name", { length: 64 }).notNull(),
    region: text("region").notNull(),
    countryCode: varchar("country_code", { length: 8 }).notNull(),
    restrictedRegion: boolean("restricted_region").notNull().default(false),
    preferredChain: varchar("preferred_chain", { length: 32 }).notNull(),
    preferredCoin: varchar("preferred_coin", { length: 16 }).notNull(),
    payoutAddress: varchar("payout_address", { length: 128 }).notNull(),
    travelRuleCompleteness: doublePrecision("travel_rule_completeness").notNull().default(1),
    addressNetworkMatch: boolean("address_network_match").notNull().default(true),
    paymentCount: integer("payment_count").notNull().default(0),
    historicalReturnRate: doublePrecision("historical_return_rate").notNull().default(0),
    avgSettlementHours: doublePrecision("avg_settlement_hours").notNull().default(2),
    avgAmountUsd: doublePrecision("avg_amount_usd").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("suppliers_user_id_idx").on(table.userId),
  }),
);

export type SupplierRow = InferSelectModel<typeof suppliers>;
