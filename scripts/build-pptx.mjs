// Generates FlowGuard-pitch.pptx from the same content as the /pitch web deck.
// Run: node scripts/build-pptx.mjs  (outputs to ./public/FlowGuard-pitch.pptx)
import PptxGenJS from "pptxgenjs";

const BG = "0B1613";
const CARD = "0E1A16";
const ACCENT = "E0783C";
const FG = "EDEBE5";
const MUTED = "9A9E97";
const LINE = "2A342F";

const DECK = [
  {
    kind: "cover",
    eyebrow: "CROSS-BORDER PAYOUT CONSOLE",
    title: "FlowGuard",
    subtitle: "Dual-route, risk-first cross-border payments — check before you send.",
    footnote: "INVESTOR PITCH · 2026",
  },
  {
    kind: "grid",
    eyebrow: "THE PROBLEM",
    title: "Cross-border B2B payouts are sent blind",
    bullets: [
      ["Send-and-pray wires", "You only learn a payment will bounce after it leaves — funds frozen for days while returns settle."],
      ["Dirty beneficiary data", "Wrong company name, bad IBAN, dormant accounts. Banks silently return the wire; reconciliation is manual."],
      ["No dual control", "A single cashier can push a large payout alone — real compliance and fraud exposure."],
      ["Wrong rail = wasted money", "Stablecoin direct vs local fiat payout picked by gut feel means higher fees and higher failure rates."],
    ],
  },
  {
    kind: "grid",
    eyebrow: "THE SOLUTION",
    title: "One console that de-risks the payout before it leaves",
    bullets: [
      ["AI pre-send precheck", "DeepSeek AI + a deterministic risk engine estimate the return probability before you commit."],
      ["Dual-route recommendation", "Stablecoin Direct vs Local Fiat Payout, auto-ranked by risk and cost."],
      ["Maker-checker control", "Cashier drafts, supervisor approves. Duties are split by design."],
      ["Escrow + shared case board", "Milestone escrow and login-free token links let clients and suppliers confirm data fixes online."],
    ],
  },
  {
    kind: "grid",
    eyebrow: "WHAT'S BUILT TODAY",
    title: "A working MVP — live, not slideware",
    bullets: [
      ["End-to-end flow", "Draft to AI precheck to dual-route to dual review to escrow to reconciliation, fully wired."],
      ["Real backend", "PostgreSQL with multi-tenant isolation, auth guards, and an audit timeline on every case."],
      ["Mobile-first, two modes", "Authenticated and guest mode — guests run locally for zero-friction trials."],
      ["Quality-checked", "Passed UI, engineering, database, and full-flow audits — ready for a live demo."],
    ],
  },
  {
    kind: "grid",
    eyebrow: "WHY US",
    title: "Risk control before the send — not after",
    bullets: [
      ["Pre-send, not post-hoc", "Competitors reconcile after failure. We block the failure first."],
      ["Two rails, one decision", "Stablecoin and local fiat compared in the same flow."],
      ["Compliance is native", "Maker-checker and audit trail are core, not a bolt-on."],
    ],
  },
  {
    kind: "grid",
    eyebrow: "BUSINESS MODEL",
    title: "Three aligned revenue lines",
    bullets: [
      ["Per-payout fee", "A small take rate on each successfully de-risked payout."],
      ["SaaS subscription", "Seat + tier pricing for teams needing dual control and audit."],
      ["Rail rebates", "Share of savings from routing volume to the optimal rail."],
    ],
  },
  {
    kind: "grid",
    eyebrow: "ROADMAP",
    title: "From simulation to real rails",
    bullets: [
      ["Live rail integrations", "Connect real stablecoin and local-fiat payout providers."],
      ["On-chain escrow", "Persist escrow to the backend and settle on real chains."],
      ["Multi-currency", "Expand corridor and currency coverage."],
      ["Enterprise RBAC", "Granular roles and approval policies for larger teams."],
    ],
  },
  {
    kind: "cover",
    title: "Stop sending blind.",
    subtitle: "FlowGuard checks every cross-border payout before the money moves.",
    footnote: "LET'S TALK — LIVE DEMO AVAILABLE NOW.",
  },
];

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "FlowGuard";
pptx.title = "FlowGuard — Investor Pitch";

function bg(slide) {
  slide.background = { color: BG };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: ACCENT } });
}

function eyebrow(slide, text, x = 0.7, y = 0.55) {
  if (!text) return;
  slide.addText(text, { x, y, w: 12, h: 0.3, fontFace: "Arial", fontSize: 12, color: ACCENT, bold: true, charSpacing: 2 });
}

for (const s of DECK) {
  const slide = pptx.addSlide();
  bg(slide);

  if (s.kind === "cover") {
    eyebrow(slide, s.eyebrow, 0.7, 2.2);
    slide.addText(
      s.title === "FlowGuard"
        ? [{ text: "Flow", options: { color: FG } }, { text: "Guard", options: { color: ACCENT } }]
        : [{ text: s.title, options: { color: FG } }],
      { x: 0.7, y: 2.5, w: 12, h: 1.6, fontFace: "Arial", fontSize: 54, bold: true, align: "center" },
    );
    if (s.subtitle)
      slide.addText(s.subtitle, { x: 2, y: 4.2, w: 9.33, h: 1, fontFace: "Arial", fontSize: 20, color: MUTED, align: "center" });
    if (s.footnote)
      slide.addText(s.footnote, { x: 0.7, y: 6.4, w: 12, h: 0.4, fontFace: "Arial", fontSize: 12, color: MUTED, bold: true, align: "center", charSpacing: 2 });
    continue;
  }

  // grid slide
  eyebrow(slide, s.eyebrow);
  slide.addText(s.title, { x: 0.7, y: 0.95, w: 12, h: 0.9, fontFace: "Arial", fontSize: 30, color: FG, bold: true });

  const n = s.bullets.length;
  const cols = n <= 3 ? n : 2;
  const rows = Math.ceil(n / cols);
  const gx = 0.4, gy = 0.35;
  const startY = 2.1;
  const totalW = 13.333 - 0.7 * 2;
  const cardW = (totalW - gx * (cols - 1)) / cols;
  const areaH = 7.5 - startY - 0.6;
  const cardH = (areaH - gy * (rows - 1)) / rows;

  s.bullets.forEach(([head, body], i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = 0.7 + c * (cardW + gx);
    const y = startY + r * (cardH + gy);
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: cardW, h: cardH, rectRadius: 0.12, fill: { color: CARD }, line: { color: LINE, width: 1 } });
    slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.25, y: y + 0.2, w: 0.8, h: 0.35, fontFace: "Arial", fontSize: 13, color: ACCENT, bold: true });
    slide.addText(head, { x: x + 0.9, y: y + 0.2, w: cardW - 1.1, h: 0.5, fontFace: "Arial", fontSize: 16, color: FG, bold: true, valign: "top" });
    slide.addText(body, { x: x + 0.25, y: y + 0.75, w: cardW - 0.5, h: cardH - 0.9, fontFace: "Arial", fontSize: 13, color: MUTED, valign: "top" });
  });
}

const out = "public/FlowGuard-pitch.pptx";
await pptx.writeFile({ fileName: out });
console.log("WROTE", out);
