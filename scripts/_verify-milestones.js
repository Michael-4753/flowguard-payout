const { chromium } = require("playwright");
const BASE = "http://localhost:3000";
(async () => {
  const b = await chromium.launch();
  const p = await b.newContext({ viewport: { width: 402, height: 1180, deviceScaleFactor: 2 } }).then(c => c.newPage());
  async function gate(){try{const g=await p.waitForSelector('[data-el="auth-guest"]',{timeout:6000});await g.click();await p.waitForTimeout(1800);}catch{}}
  await p.goto(`${BASE}/milestones`,{waitUntil:"networkidle"}); await p.waitForTimeout(1200); await gate(); await p.waitForTimeout(1500);
  const t=(await p.textContent("body")||"");
  console.log("HAS_ERROR:", /Something went wrong|Maximum update depth/.test(t));
  console.log("HAS_CONTENT:", /里程碑|Milestone/.test(t));
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
