// Generates FlowGuard-pitch.pptx (Chinese) from the same structure as the /pitch web deck.
// Run: node scripts/build-pptx.mjs  (outputs to ./public/FlowGuard-pitch.pptx)
import PptxGenJS from "pptxgenjs";

const BG = "0B1613";
const CARD = "0E1A16";
const ACCENT = "E0783C";
const FG = "EDEBE5";
const MUTED = "9A9E97";
const LINE = "2A342F";
// CJK-safe font so Chinese renders without tofu boxes in PowerPoint / Keynote.
const FONT = "Microsoft YaHei";

const DECK = [
  {
    kind: "cover",
    eyebrow: "跨境付款风控控制台",
    title: "FlowGuard",
    subtitle: "双通道、风险优先的跨境付款 —— 先核查,再付款。",
    footnote: "投资路演 · 2026",
  },
  {
    kind: "grid",
    eyebrow: "痛点",
    title: "跨境 B2B 付款都是「盲发」",
    bullets: [
      ["先发后祈祷", "钱打出去才知道会被退回 —— 资金冻结数日,等退汇结算,业务停摆。"],
      ["收款人信息脏数据", "公司名不符、IBAN 错误、账户休眠。银行静默退汇,对账全靠人工。"],
      ["缺少双人复核", "一名出纳就能单独推送大额付款 —— 真实的合规与欺诈敞口。"],
      ["选错通道 = 白花钱", "稳定币直付与本地法币凭感觉二选一,费用更高、失败率更高。"],
    ],
  },
  {
    kind: "grid",
    eyebrow: "解决方案",
    title: "一个控制台,在付款离账前先降风险",
    bullets: [
      ["AI + 金额分档预检", "DeepSeek AI 与确定性引擎评估退回概率;金额分档升级审查,≥ 100 万美元强制进入高风险车道。"],
      ["先向供应商核查", "数据质量问题(公司名 / IBAN / SWIFT / 账户)必须先作为 Case 同步给收款人 —— 未核实或未显式豁免前,审批被拦截。"],
      ["强制经办—审批分离", "以「经办」提交,以「审批」批准。自审在前端与服务端双重硬拦截 —— 真正的职责分离。"],
      ["双通道 + 双币种", "稳定币直付与本地法币按风险和成本自动排序;每笔付款展示 结算币种 → 收款人本地币种。"],
    ],
  },
  {
    kind: "grid",
    eyebrow: "已交付",
    title: "可运行的 MVP —— 真跑通,不是幻灯片",
    bullets: [
      ["完整控制闭环", "预检 → 供应商核查 → 双人审批 → 执行(MT103 / 钱包)→ 收款方到账回执 → 自动对账,全链路打通。"],
      ["核实即自动清风险", "供应商确认被标问题后,Case 关闭,风险分 / 阻断自动复算 —— 无需人工硬改。"],
      ["真后端", "PostgreSQL 多租户隔离、鉴权守卫、服务端强制状态机,每笔付款与 Case 均有审计轨迹。"],
      ["免登录到账证明", "收款人通过不可猜测的 token 链接确认收款;确认作为真实结算凭据存证,并在对账中自动匹配。"],
    ],
  },
  {
    kind: "grid",
    eyebrow: "为何是我们",
    title: "在付款离账前控风险 —— 而非事后",
    bullets: [
      ["事前拦截,而非事后补救", "同类产品在失败后才对账。我们先拦住失败 —— 并通过向供应商核查来清除它。"],
      ["两条通道,一次决策", "稳定币与本地法币在同一流程中比较,并带结算 / 到账双币种。"],
      ["合规是原生的", "金额分档车道、强制经办—审批、完整审计轨迹是核心 —— 而非附加功能。"],
    ],
  },
  {
    kind: "grid",
    eyebrow: "商业模式",
    title: "三条彼此对齐的收入线",
    bullets: [
      ["按笔付款费", "对每笔成功降风险的付款收取小额费率。"],
      ["SaaS 订阅", "面向需要双人控制与审计的团队,按席位 + 档位定价。"],
      ["通道返佣", "从把交易量路由到最优通道所节省的成本中分成。"],
    ],
  },
  {
    kind: "grid",
    eyebrow: "路线图",
    title: "从模拟走向真实通道",
    bullets: [
      ["真实通道接入", "接入真实的稳定币与本地法币付款服务商。"],
      ["链上托管", "把托管持久化到后端,并在真实链上结算。"],
      ["多币种", "扩展走廊与币种覆盖。"],
      ["企业级 RBAC", "为大型团队提供细粒度角色与审批策略。"],
    ],
  },
  {
    kind: "cover",
    title: "别再盲发。",
    subtitle: "FlowGuard 在每笔跨境付款离账前都先核查。",
    footnote: "欢迎联系 —— 现场演示随时可看。",
  },
];

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "FlowGuard";
pptx.title = "FlowGuard — 投资路演";

function bg(slide) {
  slide.background = { color: BG };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: ACCENT } });
}

function eyebrow(slide, text, x = 0.7, y = 0.55) {
  if (!text) return;
  slide.addText(text, { x, y, w: 12, h: 0.3, fontFace: FONT, fontSize: 12, color: ACCENT, bold: true, charSpacing: 2 });
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
      { x: 0.7, y: 2.5, w: 12, h: 1.6, fontFace: FONT, fontSize: 54, bold: true, align: "center" },
    );
    if (s.subtitle)
      slide.addText(s.subtitle, { x: 1.5, y: 4.2, w: 10.33, h: 1, fontFace: FONT, fontSize: 20, color: MUTED, align: "center" });
    if (s.footnote)
      slide.addText(s.footnote, { x: 0.7, y: 6.4, w: 12, h: 0.4, fontFace: FONT, fontSize: 12, color: MUTED, bold: true, align: "center", charSpacing: 2 });
    continue;
  }

  // grid slide
  eyebrow(slide, s.eyebrow);
  slide.addText(s.title, { x: 0.7, y: 0.95, w: 12, h: 0.9, fontFace: FONT, fontSize: 30, color: FG, bold: true });

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
    slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.25, y: y + 0.2, w: 0.8, h: 0.35, fontFace: FONT, fontSize: 13, color: ACCENT, bold: true });
    slide.addText(head, { x: x + 0.9, y: y + 0.2, w: cardW - 1.1, h: 0.5, fontFace: FONT, fontSize: 16, color: FG, bold: true, valign: "top" });
    slide.addText(body, { x: x + 0.25, y: y + 0.75, w: cardW - 0.5, h: cardH - 0.9, fontFace: FONT, fontSize: 13, color: MUTED, valign: "top" });
  });
}

const out = "public/FlowGuard-pitch.pptx";
await pptx.writeFile({ fileName: out });
console.log("WROTE", out);
