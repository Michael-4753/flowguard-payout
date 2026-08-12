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
        head: "AI pre-send precheck",
        body: "DeepSeek AI + a deterministic risk engine estimate the return probability before you commit.",
      },
      {
        head: "Dual-route recommendation",
        body: "Stablecoin Direct vs Local Fiat Payout, auto-ranked by risk and cost.",
      },
      {
        head: "Maker-checker control",
        body: "Cashier drafts → Pending-review queue → supervisor approves. Duties are split by design.",
      },
      {
        head: "Escrow + shared case board",
        body: "Milestone escrow and login-free token links let clients and suppliers confirm data fixes online.",
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
        head: "End-to-end flow",
        body: "Draft → AI precheck → dual-route → dual review → escrow → reconciliation, fully wired.",
      },
      {
        head: "Real backend",
        body: "PostgreSQL with multi-tenant isolation, auth guards, and an audit timeline on every case.",
      },
      {
        head: "Mobile-first, two modes",
        body: "Authenticated and guest mode — guests run locally for zero-friction trials.",
      },
      {
        head: "Quality-checked",
        body: "Passed UI, engineering, database, and full-flow audits — ready for a live demo.",
      },
    ],
  },
  {
    id: "diff",
    kind: "diff",
    eyebrow: "Why us",
    title: "Risk control before the send — not after",
    subtitle: "Pre-send risk + dual-route + built-in compliance review, in one console.",
    bullets: [
      { head: "Pre-send, not post-hoc", body: "Competitors reconcile after failure. We block the failure first." },
      { head: "Two rails, one decision", body: "Stablecoin and local fiat compared in the same flow." },
      { head: "Compliance is native", body: "Maker-checker and audit trail are core, not a bolt-on." },
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
