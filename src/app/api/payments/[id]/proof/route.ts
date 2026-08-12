import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { attachSettlementProof } from "@/lib/db/queries/payments";

const proofSchema = z.object({
  reference: z.string().trim().min(1).max(200),
  method: z.enum(["bank-slip", "onchain-tx"]),
  attachmentUrl: z.string().url().max(1000).optional(),
  attachmentKey: z.string().max(500).optional(),
});

/**
 * PATCH /api/payments/[id]/proof — attach settlement proof (bank MT103
 * confirmation / on-chain tx hash + optional uploaded slip) to a dispatched
 * payment. The reconciliation center uses this to auto-match.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = proofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const payment = await attachSettlementProof({
    userId: auth.user.id,
    id,
    proof: {
      reference: parsed.data.reference,
      method: parsed.data.method,
      attachmentUrl: parsed.data.attachmentUrl,
      attachmentKey: parsed.data.attachmentKey,
      confirmedAt: new Date().toISOString(),
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ payment });
}
