import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getVerificationCaseByToken,
  publicUpdateStatus,
  publicAddComment,
} from "@/lib/db/queries/verification-cases";

// Public, token-authorized access to a shared verification case. No login
// required — access is controlled by the unguessable token in the URL. Only
// this single case's fields are ever returned; nothing else about the owner.

const actor = z.enum(["business", "supplier", "cashier"]);
const bodySchema = z.union([
  z.object({ action: z.literal("status"), status: z.enum(["open", "verified", "clarified"]), actor }),
  z.object({ action: z.literal("comment"), message: z.string().min(1).max(1000), actor }),
]);

/** GET /api/public/case/[token] — read a shared case (read or write token). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const found = await getVerificationCaseByToken(token);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ case: found.case, canWrite: found.canWrite });
}

/** POST /api/public/case/[token] — write action; token MUST be a write token. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const found = await getVerificationCaseByToken(token);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!found.canWrite) {
    return NextResponse.json({ error: "read_only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const updated =
    parsed.data.action === "status"
      ? await publicUpdateStatus(token, parsed.data.status, parsed.data.actor)
      : await publicAddComment(token, parsed.data.message, parsed.data.actor);

  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ case: updated, canWrite: true });
}
