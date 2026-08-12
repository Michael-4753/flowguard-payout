import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupplierById, updateSupplierWallet } from "@/lib/db/queries/suppliers";
import { listPaymentsBySupplier } from "@/lib/db/queries/payments";
import { validateWalletAddress } from "@/lib/supplier-input";

/** GET /api/suppliers/[id] — a single supplier profile + its payment records. */
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

/** PATCH /api/suppliers/[id] — backfill the stablecoin wallet address. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const wallet = typeof body?.stablecoinWallet === "string" ? body.stablecoinWallet.trim() : "";
  const err = validateWalletAddress(wallet);
  if (err) return NextResponse.json({ error: "invalid_wallet", message: err }, { status: 400 });

  const supplier = await updateSupplierWallet(userId, id, wallet);
  if (!supplier) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ supplier });
}
