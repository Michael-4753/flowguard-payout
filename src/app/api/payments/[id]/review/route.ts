import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { reviewPayment } from "@/lib/db/queries/payments";

const reviewSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/payments/[id]/review — checker decision (maker-checker control).
 * Approve moves a pending payment to `initiated`; reject moves it to `rejected`.
 * A rejection note is required. The checker is the signed-in user (dual-role demo).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!parsed.data.approve && !parsed.data.note?.trim()) {
    return NextResponse.json({ error: "note_required" }, { status: 400 });
  }

  const payment = await reviewPayment({
    userId: auth.user.id,
    id,
    approve: parsed.data.approve,
    note: parsed.data.note,
  });
  if (!payment) {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }
  return NextResponse.json({ payment });
}
