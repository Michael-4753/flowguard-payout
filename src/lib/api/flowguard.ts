import { request } from "./request";
import {
  guestAssess,
  guestCreatePayment,
  guestCreateVerificationCase,
  guestFailureCases,
  guestPayments,
  guestReviewPayment,
  guestSetVerificationStatus,
  guestSupplier,
  guestSuppliers,
  guestVerificationCases,
} from "@/lib/guest/guest-data";
import { isGuest } from "@/lib/guest/guest-session";
import type {
  ChannelClass,
  FailureCase,
  PaymentRecord,
  RiskAssessment,
  RoutingResult,
  Supplier,
  VerificationCase,
  VerificationStatus,
} from "@/lib/engine/types";

export async function fetchSuppliers(): Promise<Supplier[]> {
  if (isGuest()) return guestSuppliers();
  const res = await request("/api/suppliers");
  if (!res.ok) throw new Error("failed_to_load_suppliers");
  const json = (await res.json()) as { suppliers: Supplier[] };
  return json.suppliers;
}

export async function fetchSupplier(
  id: string,
): Promise<{ supplier: Supplier; payments: PaymentRecord[] } | null> {
  if (isGuest()) return guestSupplier(id);
  const res = await request(`/api/suppliers/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("failed_to_load_supplier");
  return (await res.json()) as { supplier: Supplier; payments: PaymentRecord[] };
}

export interface AssessInput {
  supplierId: string;
  amountUsd: number;
  preferredChannel?: ChannelClass;
}

export async function assessPayment(input: AssessInput): Promise<{
  supplier: Supplier;
  risk: RiskAssessment;
  routing: RoutingResult;
}> {
  if (isGuest()) return guestAssess(input);
  const res = await request("/api/payments/assess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("failed_to_assess");
  return (await res.json()) as {
    supplier: Supplier;
    risk: RiskAssessment;
    routing: RoutingResult;
  };
}

export async function fetchPayments(): Promise<PaymentRecord[]> {
  if (isGuest()) return guestPayments();
  const res = await request("/api/payments");
  if (!res.ok) throw new Error("failed_to_load_payments");
  const json = (await res.json()) as { payments: PaymentRecord[] };
  return json.payments;
}

export async function createPayment(input: {
  supplierId: string;
  amountUsd: number;
  preferredChannel?: ChannelClass;
  selectedRouteId: string;
}): Promise<PaymentRecord> {
  if (isGuest()) return guestCreatePayment(input);
  const res = await request("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("failed_to_create_payment");
  const json = (await res.json()) as { payment: PaymentRecord };
  return json.payment;
}

/** Checker decision: approve or reject a pending-review payment. */
export async function reviewPayment(input: {
  id: string;
  approve: boolean;
  note?: string;
}): Promise<PaymentRecord> {
  if (isGuest()) {
    const updated = guestReviewPayment(input);
    if (!updated) throw new Error("not_pending");
    return updated;
  }
  const res = await request(`/api/payments/${encodeURIComponent(input.id)}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approve: input.approve, note: input.note }),
  });
  if (!res.ok) throw new Error("failed_to_review_payment");
  const json = (await res.json()) as { payment: PaymentRecord };
  return json.payment;
}

export async function fetchFailureCases(): Promise<FailureCase[]> {
  if (isGuest()) return guestFailureCases();
  const res = await request("/api/cases");
  if (!res.ok) throw new Error("failed_to_load_cases");
  const json = (await res.json()) as { cases: FailureCase[] };
  return json.cases;
}
