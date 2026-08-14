import { redirect } from "next/navigation";

// The milestone-escrow module was removed for compliance: this platform holds no
// funds and provides no custody/escrow. Any old link to /escrow now redirects home.
export default function EscrowPage() {
  redirect("/");
}
