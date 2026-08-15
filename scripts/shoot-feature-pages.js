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

  // ---- Feature ①/② : drive the /pay wizard to the precheck result ----
  await page.goto(`${BASE}/pay?supplier=meridian-freight&amount=42000`, { waitUntil: "networkidle" });
  // submit the draft step to run the precheck
  const runBtn = await page.waitForSelector('[data-el="wizard-run-precheck"]', { timeout: 15000 });
  await runBtn.click();
  // precheck panel appears
  await page.waitForSelector('[data-el="wizard-precheck"]', { timeout: 20000 });
  await page.waitForTimeout(1500);

  // ① precheck: capture the risk factors block (top of the precheck panel)
  await shootElement(page, '[data-el="wizard-precheck"]', "feat-precheck.png");

  // ② AI signals: wait for the AI cards to finish loading, then capture that region.
  // AiRiskSignals renders after AiPrecheckExplainer; give App AI time to respond.
  await page.waitForTimeout(9000);
  // Prefer a dedicated AI container if present; else fall back to precheck panel.
  const aiSel = (await page.$('[data-el="ai-risk-signals"]')) ? '[data-el="ai-risk-signals"]'
    : (await page.$('[data-el="return-reasons"]')) ? '[data-el="return-reasons"]'
    : '[data-el="wizard-precheck"]';
  await shootElement(page, aiSel, "feat-ai.png");

  // ---- Feature ③ : dual approval queue ----
  await page.goto(`${BASE}/review`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/feat-review.png` });
  console.log("saved feat-review.png (full page)");

  // ---- Feature ④ : milestones workbench ----
  await page.goto(`${BASE}/milestones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/feat-milestones.png` });
  console.log("saved feat-milestones.png (full page)");

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
