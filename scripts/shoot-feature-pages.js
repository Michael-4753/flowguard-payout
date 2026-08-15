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

  // ---- Feature ① : 收款方信息预检-AI Agent (drive /pay to precheck) ----
  await page.goto(`${BASE}/pay?supplier=meridian-freight&amount=42000`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await passAuthGate();
  await switchToZh();
  await page.waitForSelector('[data-el="wizard-build"]', { timeout: 15000 });
  const opts = await page.$$('[data-el="wizard-supplier-option"]');
  if (opts.length) { await opts[opts.length - 1].click(); await page.waitForTimeout(400); }
  const runBtn = await page.waitForSelector('[data-el="wizard-run-precheck"]', { timeout: 15000 });
  await runBtn.click();
  await page.waitForSelector('[data-el="wizard-precheck"]', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shootElement(page, '[data-el="wizard-precheck"]', "feat-precheck.png");

  // ---- Feature ② : 多路径智能路由推荐引擎 (route step) ----
  // Use a low-risk payee so precheck has no blocker/verify gate → straight to route.
  await page.goto(`${BASE}/pay?supplier=nordwind-dev&amount=6400`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.waitForSelector('[data-el="wizard-build"]', { timeout: 15000 });
  const runBtn2 = await page.waitForSelector('[data-el="wizard-run-precheck"]', { timeout: 15000 });
  await runBtn2.click();
  await page.waitForSelector('[data-el="wizard-precheck"]', { timeout: 20000 });
  const toRoute = await page.waitForSelector('[data-el="wizard-to-route"]:not([disabled])', { timeout: 15000 });
  await toRoute.click();
  await page.waitForSelector('[data-el="wizard-route"]', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await shootElement(page, '[data-el="wizard-route"]', "feat-route.png");

  // ---- Feature ③ : 分阶段里程碑付款工作台 ----
  await page.goto(`${BASE}/milestones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/feat-milestones.png`, fullPage: true });
  console.log("saved feat-milestones.png (full page)");

  // ---- Feature ④ : 统一结算状态与对账看板 ----
  // Seed one payment end-to-end first so the reconcile board shows real rows.
  await page.goto(`${BASE}/pay?supplier=nordwind-dev&amount=6400`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.waitForSelector('[data-el="wizard-run-precheck"]', { timeout: 15000 });
  await (await page.$('[data-el="wizard-run-precheck"]')).click();
  await page.waitForSelector('[data-el="wizard-precheck"]', { timeout: 20000 });
  await (await page.waitForSelector('[data-el="wizard-to-route"]:not([disabled])', { timeout: 15000 })).click();
  await (await page.waitForSelector('[data-el="wizard-confirm"]', { timeout: 15000 })).click();
  await page.waitForTimeout(2500);

  await page.goto(`${BASE}/reconcile`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/feat-reconcile.png`, fullPage: true });
  console.log("saved feat-reconcile.png (full page)");

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
