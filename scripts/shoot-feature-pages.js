// Capture REAL app pages with headless Chromium for the pitch feature slides.
// Mobile viewport, drives the /pay wizard to the precheck result, and screenshots
// the four core features straight from the running app (no hand-drawn mockups).
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = "/home/user/flowguard-payout/public/pitch-shots";
const VIEW = { width: 402, height: 1180, deviceScaleFactor: 2 };

async function shootElement(page, selector, file, { timeout = 15000 } = {}) {
  const el = await page.waitForSelector(selector, { timeout });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await el.screenshot({ path: `${OUT}/${file}` });
  console.log("saved", file);
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEW, locale: "zh-CN" });
  const page = await ctx.newPage();

  async function passAuthGate() {
    try {
      const guest = await page.waitForSelector('[data-el="auth-guest"]', { timeout: 8000 });
      await guest.click();
      await page.waitForTimeout(2500);
    } catch { /* no gate (already guest) */ }
  }

  async function switchToZh() {
    try {
      const zh = await page.$('[data-el="language-zh"]');
      if (zh) { await zh.click(); await page.waitForTimeout(1200); }
    } catch { /* ignore */ }
  }

  // ---- Feature ①/② : drive the /pay wizard to the precheck result ----
  await page.goto(`${BASE}/pay?supplier=meridian-freight&amount=42000`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await passAuthGate();
  await switchToZh();
  await page.waitForSelector('[data-el="wizard-build"]', { timeout: 15000 });
  // ensure a payee is selected (prefill picks meridian-freight; click the last/high-risk option as fallback)
  const opts = await page.$$('[data-el="wizard-supplier-option"]');
  if (opts.length) { await opts[opts.length - 1].click(); await page.waitForTimeout(400); }
  // submit the draft step to run the precheck
  const runBtn = await page.waitForSelector('[data-el="wizard-run-precheck"]', { timeout: 15000 });
  await runBtn.click();
  // precheck panel appears
  await page.waitForSelector('[data-el="wizard-precheck"]', { timeout: 20000 });
  await page.waitForTimeout(1500);

  // ① precheck: capture the risk factors block (top of the precheck panel)
  await shootElement(page, '[data-el="wizard-precheck"]', "feat-precheck.png");

  // ② AI signals: this card is on-demand — click "scan", wait for the AI result,
  // then screenshot it. If App AI is unavailable it returns to idle; we still
  // capture the compliance-briefing region as a fallback so the slide is real.
  try {
    const runAi = await page.$('[data-el="ai-risk-signals-run"]');
    if (runAi) { await runAi.click(); }
    // wait for the scan to resolve (retry button appears when done/error)
    await page.waitForSelector('[data-el="ai-risk-signals-retry"]', { timeout: 20000 });
    await page.waitForTimeout(800);
  } catch { /* AI may be slow/unavailable; capture whatever is there */ }
  await shootElement(page, '[data-el="ai-risk-signals"]', "feat-ai.png");

  // ---- Seed the review queue: submit ONE low-risk payment end-to-end ----
  // A low-risk payee has no blocker/verify gate, so we can go straight to route + confirm.
  await page.goto(`${BASE}/pay?supplier=nordwind-dev&amount=6400`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.waitForSelector('[data-el="wizard-build"]', { timeout: 15000 });
  const runBtn2 = await page.waitForSelector('[data-el="wizard-run-precheck"]', { timeout: 15000 });
  await runBtn2.click();
  await page.waitForSelector('[data-el="wizard-precheck"]', { timeout: 20000 });
  const toRoute = await page.waitForSelector('[data-el="wizard-to-route"]:not([disabled])', { timeout: 15000 });
  await toRoute.click();
  const confirm = await page.waitForSelector('[data-el="wizard-confirm"]', { timeout: 15000 });
  await confirm.click();
  // handleConfirm redirects to /review after ~900ms
  await page.waitForTimeout(2500);

  // ---- Feature ③ : dual approval queue (now has a pending instruction) ----
  await page.goto(`${BASE}/review`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/feat-review.png`, fullPage: true });
  console.log("saved feat-review.png (full page)");

  // ---- Feature ④ : milestones workbench ----
  await page.goto(`${BASE}/milestones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/feat-milestones.png`, fullPage: true });
  console.log("saved feat-milestones.png (full page)");

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
