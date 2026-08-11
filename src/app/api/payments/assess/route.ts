import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getSupplierById } from "@/lib/db/queries/suppliers";
import { assessAndRoute } from "@/lib/engine/service";

const schema = z.object({
  supplierId: z.string().min(1),
  amountUsd: z.number().positive(),
  preferredChannel: z.enum(["swift-gpi", "licensed-psp", "stablecoin-gateway"]).optional(),
});

/** POST /api/payments/assess — server-side return-risk pre-check + routing. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supplier = await getSupplierById(userId, parsed.data.supplierId);
  if (!supplier) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = assessAndRoute(supplier, parsed.data);
  return NextResponse.json(result);
}
