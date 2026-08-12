import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPaymentByReceiptToken,
  publicConfirmReceipt,
} from "@/lib/db/queries/payments";
import type { PaymentRecord } from "@/lib/engine/types";

/**
 * Public, login-free payee receipt. Access is controlled by the unguessable
 * receipt token in the URL. We expose ONLY what the beneficiary needs to see —
 * never the internal risk snapshot, routing internals, maker/checker trail, or
 * bank/settlement references.
 */
export interface PublicReceiptView {
  amountUsd: number;
  currency: string;
  supplierName: string;
  status: PaymentRecord["status"];
  channel: string;
  confirmed: boolean;
  confirmedAt: string;
}

function toPublicView(p: PaymentRecord): PublicReceiptView {
  return {
    amountUsd: p.amountUsd,
    currency: p.currency,
    supplierName: p.supplierName,
    status: p.status,
    channel: p.route.name,
    confirmed: Boolean(p.receipt),
    confirmedAt: p.receipt?.confirmedAt ?? "",
  };
}

/** GET /api/public/receipt/[token] — payee view of an outbound payment. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const payment = await getPaymentByReceiptToken(token);
  if (!payment) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ receipt: toPublicView(payment) });
}

const confirmSchema = z.object({
  action: z.literal("confirm"),
  note: z.string().max(500).optional(),
});

/** POST /api/public/receipt/[token] — payee confirms funds received. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const found = await getPaymentByReceiptToken(token);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const updated = await publicConfirmReceipt(token, parsed.data.note ?? "");
  if (!updated) {
    // Already confirmed / not in a confirmable state.
    return NextResponse.json({ error: "not_confirmable" }, { status: 409 });
  }
  return NextResponse.json({ receipt: toPublicView(updated) });
}
