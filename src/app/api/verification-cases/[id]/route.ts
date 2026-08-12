import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { updateVerificationStatus } from "@/lib/db/queries/verification-cases";

const patchSchema = z.object({
  status: z.enum(["open", "verified", "clarified"]),
});

/** PATCH /api/verification-cases/[id] — update the reply status of a request. */
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

  const updated = await updateVerificationStatus(auth.user.id, id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ case: updated });
}
