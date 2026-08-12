import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { dispatchPayment } from "@/lib/db/queries/payments";

/**
 * POST /api/payments/[id]/dispatch — post-approval execution.
 * The payer has sent the funds at the bank / on-chain; advance an approved
 * (`initiated`) payment to `settling` so the money-flow tracker begins.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const payment = await dispatchPayment({ userId: auth.user.id, id });
  if (!payment) {
    return NextResponse.json({ error: "not_initiated" }, { status: 409 });
  }
  return NextResponse.json({ payment });
}
