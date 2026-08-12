import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getSupplierById } from "@/lib/db/queries/suppliers";
import {
  listVerificationCases,
  insertVerificationCase,
} from "@/lib/db/queries/verification-cases";
import { assessRisk } from "@/lib/engine";
import { buildVerificationCase, isVerifiable } from "@/lib/verification";

const createSchema = z.object({
  supplierId: z.string().min(1),
  factorId: z.string().min(1),
});

/** GET /api/verification-cases — list the current user's verification requests. */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const cases = await listVerificationCases(auth.user.id);
  return NextResponse.json({ cases });
}

/**
 * POST /api/verification-cases — open a verification request for a data-quality
 * risk factor. The template is generated server-side from the payee record;
 * structural/jurisdiction factors are rejected (they can only be routed around).
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
  if (!isVerifiable(parsed.data.factorId)) {
    return NextResponse.json({ error: "not_verifiable" }, { status: 400 });
  }

  const supplier = await getSupplierById(userId, parsed.data.supplierId);
  if (!supplier) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const factor = assessRisk(supplier).factors.find((f) => f.id === parsed.data.factorId);
  const record = buildVerificationCase({
    id: `vc-${Date.now().toString(36)}`,
    supplier,
    factorId: parsed.data.factorId,
    factor,
  });
  const saved = await insertVerificationCase(userId, record);
  return NextResponse.json({ case: saved }, { status: 201 });
}
