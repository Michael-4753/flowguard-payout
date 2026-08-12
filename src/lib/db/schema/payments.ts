import type { InferSelectModel } from "drizzle-orm";
import {
  doublePrecision,
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import type { Currency, RiskFactor, RiskLevel, RouteOption, PaymentStatus, ReviewInfo } from "@/lib/engine/types";

/**
 * Payment record: input + pre-check snapshot (jsonb) + selected route (jsonb) + status.
 * Risk & routing come from the deterministic engine; the snapshot preserves history.
 */
export const payments = pgTable(
  "payments",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    supplierId: varchar("supplier_id", { length: 64 }).notNull(),
    supplierName: varchar("supplier_name", { length: 256 }).notNull(),
    supplierCodeName: varchar("supplier_code_name", { length: 64 }).notNull(),
    amountUsd: doublePrecision("amount_usd").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().$type<Currency>(),
    riskScore: doublePrecision("risk_score").notNull(),
    riskLevel: varchar("risk_level", { length: 16 }).notNull().$type<RiskLevel>(),
    returnProbability: doublePrecision("return_probability").notNull().default(0),
    chokepointBank: varchar("chokepoint_bank", { length: 128 }).notNull().default(""),
    riskFactors: jsonb("risk_factors").notNull().$type<RiskFactor[]>(),
    selectedRouteId: varchar("selected_route_id", { length: 64 }).notNull(),
    route: jsonb("route").notNull().$type<RouteOption>(),
    status: varchar("status", { length: 16 }).notNull().$type<PaymentStatus>(),
    review: jsonb("review").$type<ReviewInfo>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("payments_user_id_idx").on(table.userId),
    supplierIdIdx: index("payments_supplier_id_idx").on(table.supplierId),
    createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
  }),
);

export type PaymentRow = InferSelectModel<typeof payments>;
