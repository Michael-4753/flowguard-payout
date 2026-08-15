const { chromium } = require("playwright");
const BASE = "http://localhost:3000";
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 402, height: 1180, deviceScaleFactor: 2 }, locale: "zh-CN" });
  const p = await c.newPage();
  async function gate(){try{const g=await p.waitForSelector('[data-el="auth-guest"]',{timeout:6000});await g.click();await p.waitForTimeout(2000);}catch{}}
  async function zh(){try{const z=await p.$('[data-el="language-zh"]');if(z){await z.click();await p.waitForTimeout(1000);}}catch{}}
  for (const path of ["/reconcile"]) {
    await p.goto(BASE+path,{waitUntil:"networkidle"}); await p.waitForTimeout(1200); await gate(); await zh(); await p.waitForTimeout(1500);
    const t=(await p.textContent("body")||"").replace(/\s+/g," ").slice(0,350);
    console.log(path, "::", t);
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
