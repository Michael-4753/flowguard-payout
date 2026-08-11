"use client";

// Guest-mode local data engine. Mirrors the six network functions in
// lib/api/flowguard.ts but computes everything client-side using the built-in
// deterministic engine, the seed ledger, and localStorage-backed payment
// history. No network, no auth — usable offline.

import { assessRisk, routePayment } from "@/lib/engine";
import { SEED_SUPPLIERS } from "@/lib/db/seed-suppliers";
import { FAILURE_CASES } from "@/lib/engine/failure-cases";
import type {
  ChannelClass,
  FailureCase,
  PaymentRecord,
  RiskAssessment,
  RoutingResult,
  Supplier,
} from "@/lib/engine/types";
import { addGuestPayment, readGuestPayments } from "./guest-session";

/** Stable createdAt for seed payees so guest data is reproducible. */
const GUEST_SEED_TS = "2026-01-01T00:00:00.000Z";

export function guestSuppliers(): Supplier[] {
  return SEED_SUPPLIERS.map((s) => ({ ...s, createdAt: GUEST_SEED_TS }));
}

export function guestSupplier(
  id: string,
): { supplier: Supplier; payments: PaymentRecord[] } | null {
  const supplier = guestSuppliers().find((s) => s.id === id);
  if (!supplier) return null;
  const payments = readGuestPayments().filter((p) => p.supplierId === id);
  return { supplier, payments };
}

export function guestPayments(): PaymentRecord[] {
  return readGuestPayments();
}

export function guestFailureCases(): FailureCase[] {
  return FAILURE_CASES;
}

export function guestAssess(input: {
  supplierId: string;
  amountUsd: number;
  preferredChannel?: ChannelClass;
}): { supplier: Supplier; risk: RiskAssessment; routing: RoutingResult } {
  const supplier = guestSuppliers().find((s) => s.id === input.supplierId);
  if (!supplier) throw new Error("not_found");
  const risk = assessRisk(supplier);
  const routing = routePayment(supplier, input, risk);
  return { supplier, risk, routing };
}

export function guestCreatePayment(input: {
  supplierId: string;
  amountUsd: number;
  preferredChannel?: ChannelClass;
  selectedRouteId: string;
}): PaymentRecord {
  const { supplier, risk, routing } = guestAssess(input);
  const route =
    routing.options.find((o) => o.id === input.selectedRouteId && o.available) ??
    routing.options.find((o) => o.id === routing.recommendedId)!;

  const record: PaymentRecord = {
    id: `guest-${Date.now().toString(36)}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierCodeName: supplier.codeName,
    amountUsd: input.amountUsd,
    currency: supplier.currency,
    riskScore: risk.score,
    riskLevel: risk.level,
    returnProbability: risk.returnProbability,
    chokepointBank: risk.chokepointBank,
    riskFactors: risk.factors,
    selectedRouteId: route.id,
    route,
    status: "initiated",
    createdAt: new Date().toISOString(),
  };
  addGuestPayment(record);
  return record;
}
