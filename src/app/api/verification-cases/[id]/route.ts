import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  updateVerificationStatus,
  addVerificationComment,
} from "@/lib/db/queries/verification-cases";

const patchSchema = z.union([
  z.object({ status: z.enum(["open", "verified", "clarified"]) }),
  z.object({ comment: z.string().min(1).max(1000) }),
]);

/**
 * PATCH /api/verification-cases/[id] — authenticated cashier update.
 * Either change status or add a comment; both append a timeline event.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const updated =
    "status" in parsed.data
      ? await updateVerificationStatus(auth.user.id, id, parsed.data.status)
      : await addVerificationComment(auth.user.id, id, parsed.data.comment);

  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ case: updated });
}
