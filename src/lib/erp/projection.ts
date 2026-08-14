import type { PaymentRecord } from "@/lib/engine/types";

/**
 * Server-side, PII-light reconciliation projection for the read-only ERP API.
 *
 * This intentionally mirrors the reconcile-center math (fees / FX loss /
 * expected / received / variance / proof match) but WITHOUT any browser-only
 * concerns (no localStorage "reconciled" flag). It is a STABLE external contract
 * for finance/ERP systems: field names here should stay backwards-compatible
 * even if internal domain types are refactored.
 *
 * All monetary amounts are USD (the settlement currency), in major units.
 */
export interface ErpPaymentRecord {
  /** Stable FlowGuard payment id — use as the external reference / idempotency key. */
  id: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Beneficiary (payee) display name. */
  payeeName: string;
  /** Payee's local (credited) currency. */
  payeeCurrency: string;
  /** Settlement (source) currency the payer sent in. */
  settleCurrency: string;
  /** Payout channel class (e.g. local-fiat / stablecoin-direct). */
  channel: string;
  /** Lifecycle status (draft / pending_review / initiated / settling / arrived / returned / rejected). */
  status: string;
  /** Amount sent, USD. */
  amountSentUsd: number;
  /** Total route fees, USD. */
  feesUsd: number;
  /** FX conversion loss, USD. */
  fxLossUsd: number;
  /** Amount the beneficiary is expected to receive, USD. */
  expectedUsd: number;
  /** Amount actually received (0 until arrived), USD. */
  receivedUsd: number;
  /** received − expected, USD (negative = shortfall). */
  varianceUsd: number;
  /** Invoice number, if any. */
  invoiceNo: string;
  /** Bank wire reference (off-chain), if any. */
  bankRef: string;
  /** On-chain / PSP reference, if any. */
  onchainRef: string;
  /** Real captured settlement proof reference (MT103 confirmation / tx hash), if any. */
  settlementRef: string;
  /** Proof-match state for reconciliation: matched / unmatched / n/a. */
  matchStatus: "matched" | "unmatched" | "n/a";
  /** When the payee confirmed receipt (ISO-8601), if any. */
  payeeConfirmedAt: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Map one domain payment to the external ERP contract. Pure & server-safe. */
export function toErpRecord(p: PaymentRecord): ErpPaymentRecord {
  const feesUsd = p.route.totalFeeUsd;
  const fxLossUsd = round2(p.amountUsd * p.route.fxLoss);
  const expectedUsd = p.route.receiveUsd;
  const arrived = p.status === "arrived";
  const receivedUsd = arrived ? expectedUsd : 0;
  const sent = p.status === "settling" || p.status === "arrived";

  const proofRef = p.settlementProof?.reference ?? "";
  const hasOnchainLeg = p.route.channelClass === "stablecoin-direct";
  const onchainRef = p.onchainRef ?? "";

  let matchStatus: ErpPaymentRecord["matchStatus"];
  if (proofRef) matchStatus = "matched";
  else if (hasOnchainLeg && onchainRef) matchStatus = "matched";
  else if (sent) matchStatus = "unmatched";
  else matchStatus = "n/a";

  return {
    id: p.id,
    createdAt: p.createdAt,
    payeeName: p.supplierName,
    payeeCurrency: p.currency,
    settleCurrency: p.settleCurrency ?? "USD",
    channel: p.route.channelClass,
    status: p.status,
    amountSentUsd: round2(p.amountUsd),
    feesUsd: round2(feesUsd),
    fxLossUsd,
    expectedUsd: round2(expectedUsd),
    receivedUsd: round2(receivedUsd),
    varianceUsd: round2(receivedUsd - expectedUsd),
    invoiceNo: p.invoiceNo ?? "",
    bankRef: p.offchainRef ?? "",
    onchainRef,
    settlementRef: proofRef,
    matchStatus,
    payeeConfirmedAt: p.receipt?.confirmedAt ?? "",
  };
}
