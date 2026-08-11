import { request } from "./request";
import type {
  PaymentRecord,
  RiskAssessment,
  RoutingResult,
  StableCoin,
  Supplier,
} from "@/lib/engine/types";

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await request("/api/suppliers");
  if (!res.ok) throw new Error("failed_to_load_suppliers");
  const json = (await res.json()) as { suppliers: Supplier[] };
  return json.suppliers;
}

export async function fetchSupplier(
  id: string,
): Promise<{ supplier: Supplier; payments: PaymentRecord[] } | null> {
  const res = await request(`/api/suppliers/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("failed_to_load_supplier");
  return (await res.json()) as { supplier: Supplier; payments: PaymentRecord[] };
}

export interface AssessInput {
  supplierId: string;
  amountUsd: number;
  targetCoin?: StableCoin;
}

export async function assessPayment(input: AssessInput): Promise<{
  supplier: Supplier;
  risk: RiskAssessment;
  routing: RoutingResult;
}> {
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
  const res = await request("/api/payments");
  if (!res.ok) throw new Error("failed_to_load_payments");
  const json = (await res.json()) as { payments: PaymentRecord[] };
  return json.payments;
}

export async function createPayment(input: {
  supplierId: string;
  amountUsd: number;
  targetCoin?: StableCoin;
  selectedRouteId: string;
}): Promise<PaymentRecord> {
  const res = await request("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("failed_to_create_payment");
  const json = (await res.json()) as { payment: PaymentRecord };
  return json.payment;
}
