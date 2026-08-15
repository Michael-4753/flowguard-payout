const { chromium } = require("playwright");
const BASE = "http://localhost:3000";
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 402, height: 1180, deviceScaleFactor: 2 }, locale: "zh-CN" });
  const p = await c.newPage();
  async function gate(){try{const g=await p.waitForSelector('[data-el="auth-guest"]',{timeout:6000});await g.click();await p.waitForTimeout(2000);}catch{}}
  async function zh(){try{const z=await p.$('[data-el="language-zh"]');if(z){await z.click();await p.waitForTimeout(1000);}}catch{}}
  // seed a low-risk payment
  await p.goto(`${BASE}/pay?supplier=nordwind-dev&amount=6400`,{waitUntil:"networkidle"}); await p.waitForTimeout(1200); await gate(); await zh();
  await p.waitForSelector('[data-el="wizard-run-precheck"]',{timeout:15000}); await (await p.$('[data-el="wizard-run-precheck"]')).click();
  await p.waitForSelector('[data-el="wizard-precheck"]',{timeout:20000});
  await (await p.waitForSelector('[data-el="wizard-to-route"]:not([disabled])',{timeout:15000})).click();
  await (await p.waitForSelector('[data-el="wizard-confirm"]',{timeout:15000})).click();
  await p.waitForTimeout(2500);
  await p.goto(`${BASE}/review`,{waitUntil:"networkidle"}); await p.waitForTimeout(2000);
  const t=(await p.textContent("body")||"").replace(/\s+/g," ").slice(0,400);
  console.log("REVIEW:", t);
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
