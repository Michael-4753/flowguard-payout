import type { InferSelectModel } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { CaseEvent, VerificationStatus } from "@/lib/engine/types";

/**
 * Verification case: a data-quality risk close-out request tied to a payee and
 * the risk factor that triggered it. The cashier copies the generated template
 * out-of-band and updates the status when the payee replies.
 */
export const verificationCases = pgTable(
  "verification_cases",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    supplierId: varchar("supplier_id", { length: 64 }).notNull(),
    supplierName: varchar("supplier_name", { length: 256 }).notNull(),
    factorId: varchar("factor_id", { length: 64 }).notNull(),
    factorTitle: varchar("factor_title", { length: 128 }).notNull(),
    template: text("template").notNull(),
    bankRawDescription: text("bank_raw_description").notNull().default(""),
    status: varchar("status", { length: 16 }).notNull().$type<VerificationStatus>(),
    readToken: varchar("read_token", { length: 64 }).notNull().default(""),
    writeToken: varchar("write_token", { length: 64 }).notNull().default(""),
    timeline: jsonb("timeline").$type<CaseEvent[]>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("verification_cases_user_id_idx").on(table.userId),
    createdAtIdx: index("verification_cases_created_at_idx").on(table.createdAt),
    readTokenIdx: index("verification_cases_read_token_idx").on(table.readToken),
    writeTokenIdx: index("verification_cases_write_token_idx").on(table.writeToken),
  }),
);

export type VerificationCaseRow = InferSelectModel<typeof verificationCases>;
