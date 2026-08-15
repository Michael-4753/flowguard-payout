const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3000";
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 402, height: 1180, deviceScaleFactor: 2 }, locale: "zh-CN" });
  const p = await c.newPage();
  async function gate(){ try{const g=await p.waitForSelector('[data-el="auth-guest"]',{timeout:6000});await g.click();await p.waitForTimeout(2000);}catch{} try{const z=await p.$('[data-el="language-zh"]');if(z){await z.click();await p.waitForTimeout(1000);}}catch{} }
  for (const path of ["/review","/milestones"]) {
    await p.goto(BASE+path,{waitUntil:"networkidle"}); await p.waitForTimeout(1200); await gate(); await p.waitForTimeout(1500);
    const txt=(await p.textContent("body")||"").replace(/\s+/g," ").slice(0,300);
    const sizes=await p.evaluate(()=>({w:document.body.scrollWidth,h:document.body.scrollHeight}));
    console.log(path, JSON.stringify(sizes), "::", txt);
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
