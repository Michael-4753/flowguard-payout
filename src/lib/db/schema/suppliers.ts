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

/** Supplier / payee ledger (module 4). History feeds the risk pre-check. Owned by a user. */
export const suppliers = pgTable(
  "suppliers",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    codeName: varchar("code_name", { length: 64 }).notNull(),
    country: text("country").notNull(),
    countryCode: varchar("country_code", { length: 8 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    entityType: varchar("entity_type", { length: 16 }).notNull(),
    bankName: text("bank_name").notNull(),
    swift: varchar("swift", { length: 16 }).notNull(),
    iban: varchar("iban", { length: 40 }).notNull(),
    accountStatus: varchar("account_status", { length: 16 }).notNull(),
    restrictedRegion: boolean("restricted_region").notNull().default(false),
    bankBlacklisted: boolean("bank_blacklisted").notNull().default(false),
    preferredChannel: varchar("preferred_channel", { length: 32 }).notNull(),
    riskTag: varchar("risk_tag", { length: 16 }).notNull().default("low"),
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
