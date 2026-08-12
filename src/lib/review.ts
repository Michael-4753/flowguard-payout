// Maker-checker (segregation of duties) helpers. The maker (cashier) creates a
// payment; a separate checker (finance supervisor) must approve before it is
// sent to the bank. In this single-account demo both roles are the same signed-in
// user, distinguished by role labels and an approval trail.

import type { PaymentStatus, ReviewInfo } from "@/lib/engine/types";

export const MAKER_LABEL = "Cashier (maker)";
export const CHECKER_LABEL = "Reviewer (checker)";

/** Build the initial approval trail when a maker submits a payment for review. */
export function initialReview(makerId: string): ReviewInfo {
  return {
    makerId: makerId || "guest",
    makerLabel: MAKER_LABEL,
    submittedAt: new Date().toISOString(),
    checkerId: "",
    checkerLabel: "",
    reviewedAt: "",
    decision: "pending",
    note: "",
  };
}

/** Apply a checker decision, returning the updated review + resulting status. */
export function applyDecision(
  review: ReviewInfo,
  input: { checkerId: string; approve: boolean; note?: string },
): { review: ReviewInfo; status: Extract<PaymentStatus, "initiated" | "rejected"> } {
  const reviewed: ReviewInfo = {
    ...review,
    checkerId: input.checkerId || "guest",
    checkerLabel: CHECKER_LABEL,
    reviewedAt: new Date().toISOString(),
    decision: input.approve ? "approved" : "rejected",
    note: input.note?.trim() ?? "",
  };
  return { review: reviewed, status: input.approve ? "initiated" : "rejected" };
}
