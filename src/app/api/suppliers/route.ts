import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";
import {
  listSuppliers,
  countSuppliers,
  insertSuppliers,
  insertSupplier,
} from "@/lib/db/queries/suppliers";
import { SEED_SUPPLIERS } from "@/lib/db/seed-suppliers";
import { buildSupplier, validateNewSupplier } from "@/lib/supplier-input";

/** GET /api/suppliers — list the current user's suppliers; seed default profiles on first sign-in. */
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

/** POST /api/suppliers — add a new payee to the current user's ledger. */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const body = await request.json().catch(() => null);
  const result = validateNewSupplier(body);
  if (!result.ok || !result.value) {
    return NextResponse.json({ error: "invalid_supplier", fields: result.errors }, { status: 400 });
  }

  const supplier = await insertSupplier(userId, buildSupplier(result.value));
  return NextResponse.json({ supplier }, { status: 201 });
}
