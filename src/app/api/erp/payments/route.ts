import { NextRequest } from "next/server";
import { listPayments } from "@/lib/db/queries/payments";
import { toErpRecord } from "@/lib/erp/projection";

/**
 * Read-only ERP integration endpoint (machine-to-machine).
 *
 * Finance/ERP systems (SAP, Oracle, 用友, 金蝶, QuickBooks, …) PULL settled
 * payment + reconciliation data from here on a schedule. This is NOT the user
 * session API — it authenticates with a static API key and is scoped to one
 * FlowGuard account (the org owner) configured via env.
 *
 * Auth:  Authorization: Bearer <ERP_API_KEY>   (or  x-api-key: <ERP_API_KEY>)
 * Scope: ERP_OWNER_USER_ID  — the account whose payments are exposed.
 *
 * Query params (all optional):
 *   status=arrived|settling|initiated|...   filter by lifecycle status
 *   since=<ISO-8601>                         only records created at/after this time
 *   limit=<n>                                cap results (default 200, max 1000)
 *
 * Response: { data: ErpPaymentRecord[], count, generatedAt }
 * GET only — no write operations are exposed.
 */

export const dynamic = "force-dynamic";

function unauthorized(message: string) {
  return Response.json({ error: message }, { status: 401 });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function extractKey(request: NextRequest): string {
  const bearer = request.headers.get("authorization") ?? "";
  if (bearer.toLowerCase().startsWith("bearer ")) return bearer.slice(7).trim();
  return (request.headers.get("x-api-key") ?? "").trim();
}

export async function GET(request: NextRequest) {
  const expectedKey = process.env.ERP_API_KEY?.trim();
  const ownerUserId = process.env.ERP_OWNER_USER_ID?.trim();

  // Fail closed: if the integration isn't configured, expose nothing.
  if (!expectedKey || !ownerUserId) {
    return Response.json(
      { error: "ERP integration is not configured on this deployment." },
      { status: 503 },
    );
  }

  const presented = extractKey(request);
  if (!presented || !timingSafeEqual(presented, expectedKey)) {
    return unauthorized("Invalid or missing API key.");
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status")?.trim() || null;
  const sinceRaw = url.searchParams.get("since")?.trim() || null;
  const sinceMs = sinceRaw ? Date.parse(sinceRaw) : NaN;
  const limitRaw = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 1000) : 200;

  const payments = await listPayments(ownerUserId);

  let data = payments.map(toErpRecord);
  if (statusFilter) data = data.filter((r) => r.status === statusFilter);
  if (!Number.isNaN(sinceMs)) data = data.filter((r) => Date.parse(r.createdAt) >= sinceMs);
  data = data.slice(0, limit);

  return Response.json(
    { data, count: data.length, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
