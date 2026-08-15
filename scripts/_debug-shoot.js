const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3000";
(async () => {
  const b = await chromium.launch();
  const p = await b.newContext({ viewport: { width: 402, height: 1180, deviceScaleFactor: 2 }, locale: "zh-CN" }).then(c => c.newPage());
  const errs = [];
  p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(`${BASE}/pay?supplier=meridian-freight&amount=42000`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const guest = await p.$('[data-el="auth-guest"]');
  if (guest) { await guest.click(); await p.waitForTimeout(2000); }
  const els = await p.$$eval("[data-el]", ns => ns.map(n => n.getAttribute("data-el")));
  console.log("DATA_EL:", JSON.stringify([...new Set(els)]));
  const bodyText = (await p.textContent("body") || "").replace(/\s+/g, " ").slice(0, 400);
  console.log("BODY:", bodyText);
  console.log("URL:", p.url());
  console.log("ERRS:", errs.slice(0, 5));
  await p.screenshot({ path: "/home/user/flowguard-payout/public/pitch-shots/_debug-pay.png", fullPage: true });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
