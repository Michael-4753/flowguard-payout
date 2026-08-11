import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getSupplierById } from "@/lib/db/queries/suppliers";
import { listPayments, insertPayment } from "@/lib/db/queries/payments";
import { assessAndRoute } from "@/lib/engine/service";
import type { PaymentRecord } from "@/lib/engine/types";

const createSchema = z.object({
  supplierId: z.string().min(1),
  amountUsd: z.number().positive(),
  preferredChannel: z.enum(["swift-gpi", "licensed-psp", "stablecoin-gateway"]).optional(),
  selectedRouteId: z.string().min(1),
});

/** GET /api/payments — list the current user's payment records. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const payments = await listPayments(auth.user.id);
  return NextResponse.json({ payments });
}

/**
 * POST /api/payments — persist a payment record.
 * Risk & routing are recomputed server-side (client scores are never trusted);
 * only the selected route id is taken from the request.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supplier = await getSupplierById(userId, parsed.data.supplierId);
  if (!supplier) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { risk, routing } = assessAndRoute(supplier, {
    supplierId: parsed.data.supplierId,
    amountUsd: parsed.data.amountUsd,
    preferredChannel: parsed.data.preferredChannel,
  });
  const route =
    routing.options.find((o) => o.id === parsed.data.selectedRouteId && o.available) ??
    routing.options.find((o) => o.id === routing.recommendedId)!;

  const record: PaymentRecord = {
    id: `pmt-${Date.now().toString(36)}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierCodeName: supplier.codeName,
    amountUsd: parsed.data.amountUsd,
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

  const saved = await insertPayment(userId, record);
  return NextResponse.json({ payment: saved }, { status: 201 });
}
