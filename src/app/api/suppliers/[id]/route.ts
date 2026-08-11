import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupplierById } from "@/lib/db/queries/suppliers";
import { listPaymentsBySupplier } from "@/lib/db/queries/payments";

/** GET /api/suppliers/[id] — 单个供应商档案 + 其付款记录。 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  const { id } = await params;

  const supplier = await getSupplierById(userId, id);
  if (!supplier) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const payments = await listPaymentsBySupplier(userId, id);
  return NextResponse.json({ supplier, payments });
}
