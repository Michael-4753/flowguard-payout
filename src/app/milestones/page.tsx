import { redirect } from "next/navigation";

// The milestone workbench was removed: milestone / outsourcing tracking is a
// business-team concern, not part of the cashier's payout control console, and
// it was disconnected from the actual payout flow (payout instructions are
// created in /pay). Any old link to /milestones now redirects home.
export default function MilestonesPage() {
  redirect("/");
}
