// Single source of truth for the FlowGuard pitch deck content.
// Consumed by both the web deck (/pitch) and the .pptx export script,
// so the two deliverables never drift apart. English-only per policy.

export interface DeckSlide {
  id: string;
  kind: "cover" | "problem" | "solution" | "mvp" | "diff" | "business" | "roadmap" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bullets?: { head: string; body: string }[];
  footnote?: string;
}

export const DECK: DeckSlide[] = [
  {
    id: "cover",
    kind: "cover",
    eyebrow: "Cross-border payout console",
    title: "FlowGuard",
    subtitle: "Dual-route, risk-first cross-border payments — check before you send.",
    footnote: "Investor pitch · 2026",
  },
  {
    id: "problem",
    kind: "problem",
    eyebrow: "The problem",
    title: "Cross-border B2B payouts are sent blind",
    bullets: [
      {
        head: "Send-and-pray wires",
        body: "You only learn a payment will bounce after it leaves — funds frozen for days while returns settle.",
      },
      {
        head: "Dirty beneficiary data",
        body: "Wrong company name, bad IBAN, dormant accounts. Banks silently return the wire; reconciliation is manual.",
      },
      {
        head: "No dual control",
        body: "A single cashier can push a large payout alone — real compliance and fraud exposure.",
      },
      {
        head: "Wrong rail = wasted money",
        body: "Stablecoin direct vs local fiat payout picked by gut feel means higher fees and higher failure rates.",
      },
    ],
  },
  {
    id: "solution",
    kind: "solution",
    eyebrow: "The solution",
    title: "One console that de-risks the payout before it leaves",
    bullets: [
      {
        head: "AI + amount-tier precheck",
        body: "DeepSeek AI and a deterministic engine score return probability; amount tiers escalate scrutiny, and payouts ≥ $1M are forced into the high-risk lane.",
      },
      {
        head: "Verify-first with the supplier",
        body: "Data-quality problems (name / IBAN / SWIFT / account) must be synced to the payee as a Case first — approval is gated until verified or explicitly overridden.",
      },
      {
        head: "Maker-checker, enforced",
        body: "Submit as Maker, approve as Checker. Self-approval is hard-blocked front-end and server-side — real segregation of duties.",
      },
      {
        head: "Dual-route + dual currency",
        body: "Stablecoin Direct vs Local Fiat auto-ranked by risk and cost; each payout shows settlement currency → payee's local currency.",
      },
    ],
  },
  {
    id: "mvp",
    kind: "mvp",
    eyebrow: "What's built today",
    title: "A working MVP — live, not slideware",
    bullets: [
      {
        head: "Full control loop",
        body: "Precheck → verify-with-supplier → dual approve → execute (MT103 / wallet) → payee arrival receipt → auto-reconcile, fully wired.",
      },
      {
        head: "Verified risk clears itself",
        body: "When a supplier confirms a flagged detail, the case resolves and the risk score / blocker recompute automatically — no manual fudging.",
      },
      {
        head: "Real backend",
        body: "PostgreSQL with multi-tenant isolation, auth guards, a server-enforced state machine, and an audit trail on every payment and case.",
      },
      {
        head: "Login-free proof of arrival",
        body: "The payee confirms receipt via an unguessable token link; it's stored as real settlement evidence and auto-matched in reconciliation.",
      },
    ],
  },
  {
    id: "diff",
    kind: "diff",
    eyebrow: "Why us",
    title: "Risk control before the send — not after",
    subtitle: "Pre-send risk + verify-first + enforced dual control, in one console.",
    bullets: [
      { head: "Pre-send, not post-hoc", body: "Competitors reconcile after failure. We block it first — and clear it by verifying with the supplier." },
      { head: "Two rails, one decision", body: "Stablecoin and local fiat compared in the same flow, with dual settlement / payee currency." },
      { head: "Compliance is native", body: "Amount-tier lanes, enforced maker-checker, and a full audit trail are core — not a bolt-on." },
    ],
  },
  {
    id: "business",
    kind: "business",
    eyebrow: "Business model",
    title: "Three aligned revenue lines",
    bullets: [
      { head: "Per-payout fee", body: "A small take rate on each successfully de-risked payout." },
      { head: "SaaS subscription", body: "Seat + tier pricing for teams needing dual control and audit." },
      { head: "Rail rebates", body: "Share of savings from routing volume to the optimal rail." },
    ],
  },
  {
    id: "roadmap",
    kind: "roadmap",
    eyebrow: "Roadmap",
    title: "From simulation to real rails",
    bullets: [
      { head: "Live rail integrations", body: "Connect real stablecoin and local-fiat payout providers." },
      { head: "On-chain escrow", body: "Persist escrow to the backend and settle on real chains." },
      { head: "Multi-currency", body: "Expand corridor and currency coverage." },
      { head: "Enterprise RBAC", body: "Granular roles and approval policies for larger teams." },
    ],
  },
  {
    id: "cta",
    kind: "cta",
    title: "Stop sending blind.",
    subtitle: "FlowGuard checks every cross-border payout before the money moves.",
    footnote: "Let's talk — live demo available now.",
  },
];
