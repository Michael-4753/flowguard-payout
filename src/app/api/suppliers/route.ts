import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";
import { listSuppliers, countSuppliers, insertSuppliers } from "@/lib/db/queries/suppliers";
import { SEED_SUPPLIERS } from "@/lib/db/seed-suppliers";

/** GET /api/suppliers — 列出当前用户的供应商，新用户首登时播种默认档案。 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  await upsertUser({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    avatarUrl: auth.user.avatarUrl,
  });

  const existing = await countSuppliers(userId);
  if (existing === 0) {
    await insertSuppliers(userId, SEED_SUPPLIERS);
  }

  const suppliers = await listSuppliers(userId);
  return NextResponse.json({ suppliers });
}
