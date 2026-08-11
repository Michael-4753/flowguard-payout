import type { FailureCase } from "@/lib/engine/types";

/**
 * Failure-case library (module 3): real-world-style returned-payment cases with
 * return reasons and remediation plans. Public reference content, not per-user.
 */
export const FAILURE_CASES: FailureCase[] = [
  {
    id: "fc-01",
    corridor: "US → Vietnam",
    channelClass: "swift-gpi",
    amountUsd: 24000,
    reason: "Beneficiary name mismatch at beneficiary bank screening",
    failedAt: "Beneficiary bank",
    heldDays: 6,
    remediation:
      "Match the beneficiary legal name exactly to the bank record (including suffix). Re-send with corrected name field.",
    factorId: "company-name",
  },
  {
    id: "fc-02",
    corridor: "US → UAE",
    channelClass: "swift-gpi",
    amountUsd: 51000,
    reason: "FX-control hold — missing business-purpose documentation",
    failedAt: "Correspondent (intermediary)",
    heldDays: 9,
    remediation:
      "Attach invoice + contract + business purpose. Prefer a licensed local PSP corridor for controlled currencies.",
    factorId: "currency-control",
  },
  {
    id: "fc-03",
    corridor: "EU → India",
    channelClass: "licensed-psp",
    amountUsd: 8600,
    reason: "Invalid IBAN check digits — invalid-account return",
    failedAt: "Local payout bank",
    heldDays: 3,
    remediation: "Re-collect and validate the IBAN structure and check digits before re-submitting.",
    factorId: "iban",
  },
  {
    id: "fc-04",
    corridor: "US → Estonia",
    channelClass: "swift-gpi",
    amountUsd: 33000,
    reason: "Dormant beneficiary account rejected the inbound wire",
    failedAt: "Beneficiary bank",
    heldDays: 5,
    remediation: "Confirm the account is active with the beneficiary before sending; ask for a recent statement.",
    factorId: "account-status",
  },
  {
    id: "fc-05",
    corridor: "US → high-risk region",
    channelClass: "swift-gpi",
    amountUsd: 47000,
    reason: "Sanctions screening hold at correspondent bank",
    failedAt: "Correspondent (intermediary)",
    heldDays: 14,
    remediation:
      "Do not resend without compliance clearance. Complete enhanced due diligence and obtain a compliance sign-off.",
    factorId: "sanction",
  },
  {
    id: "fc-06",
    corridor: "US → Singapore",
    channelClass: "licensed-psp",
    amountUsd: 15200,
    reason: "Beneficiary bank on internal risk blacklist — interception",
    failedAt: "PSP netting hub",
    heldDays: 7,
    remediation: "Request an alternate beneficiary bank; re-route via a different licensed PSP or stablecoin gateway.",
    factorId: "bank-blacklist",
  },
  {
    id: "fc-07",
    corridor: "US → Vietnam",
    channelClass: "swift-gpi",
    amountUsd: 12800,
    reason: "Malformed SWIFT/BIC — bounced at routing bank",
    failedAt: "Correspondent (intermediary)",
    heldDays: 2,
    remediation: "Verify the 8/11-character SWIFT/BIC with the beneficiary bank and re-submit.",
    factorId: "swift",
  },
];

export function casesForFactor(factorId: string): FailureCase[] {
  return FAILURE_CASES.filter((c) => c.factorId === factorId);
}
