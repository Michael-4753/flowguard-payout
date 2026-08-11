import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { FAILURE_CASES } from "@/lib/engine/failure-cases";

/** GET /api/cases — failure-case library (module 3). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ cases: FAILURE_CASES });
}
