// Single source of truth for the FlowGuard pitch deck content.
// Consumed by the web deck (/pitch) — bilingual (zh / en). The .pptx export
// script keeps its own parallel copy. The "FlowGuard" brand name stays Latin.

export type DeckLang = "zh" | "en";

export interface DeckSlide {
  id: string;
  kind: "cover" | "problem" | "solution" | "mvp" | "diff" | "business" | "roadmap" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bullets?: { head: string; body: string }[];
  footnote?: string;
}

export const DECK_ZH: DeckSlide[] = [
  {
    id: "cover",
    kind: "cover",
    eyebrow: "跨境付款风控控制台",
    title: "FlowGuard",
    subtitle: "双通道、风险优先的跨境付款 —— 先核查,再付款。",
    footnote: "投资路演 · 2026",
  },
  {
    id: "problem",
    kind: "problem",
    eyebrow: "痛点",
    title: "跨境 B2B 付款都是「盲发」",
    bullets: [
      { head: "先发后祈祷", body: "钱打出去才知道会被退回 —— 资金冻结数日,等退汇结算,业务停摆。" },
      { head: "收款人信息脏数据", body: "公司名不符、IBAN 错误、账户休眠。银行静默退汇,对账全靠人工。" },
      { head: "缺少双人复核", body: "一名出纳就能单独推送大额付款 —— 真实的合规与欺诈敞口。" },
      { head: "选错通道 = 白花钱", body: "境外持牌数字结算与本地法币凭感觉二选一,费用更高、失败率更高。" },
    ],
  },
  {
    id: "solution",
    kind: "solution",
    eyebrow: "解决方案",
    title: "一个控制台,在付款离账前先降风险",
    bullets: [
      { head: "AI + 金额分档预检", body: "DeepSeek AI 与确定性引擎评估退回概率;金额分档升级审查,≥ 100 万美元强制进入高风险车道。" },
      { head: "先向供应商核查", body: "数据质量问题(公司名 / IBAN / SWIFT / 账户)必须先作为 Case 同步给收款人 —— 未核实或未显式豁免前,审批被拦截。" },
      { head: "强制经办—审批分离", body: "以「经办」提交,以「审批」批准,自审在前后端双重硬拦截。当前为单账户演示(切换身份展示机制),生产环境为两个独立账户。" },
      { head: "双通道 + 双币种", body: "境外持牌结算服务商与本地法币按风险和成本自动排序;每笔付款展示 结算币种 → 收款人本地币种。" },
    ],
  },
  {
    id: "mvp",
    kind: "mvp",
    eyebrow: "已交付",
    title: "可运行的 MVP —— 真跑通,不是幻灯片",
    bullets: [
      { head: "完整控制闭环", body: "预检 → 供应商核查 → 双人审批 → 生成付款指令提交持牌机构 → 收款方到账回执 → 自动对账,全链路打通。" },
      { head: "核实即自动清风险", body: "供应商确认被标问题后,Case 关闭,风险分 / 阻断自动复算 —— 无需人工硬改。" },
      { head: "真后端", body: "PostgreSQL 多租户隔离、鉴权守卫、服务端强制状态机,每笔付款与 Case 均有审计轨迹。" },
      { head: "免登录到账证明", body: "收款人通过不可猜测的 token 链接确认收款;确认作为真实结算凭据存证,并在对账中自动匹配。" },
    ],
  },
  {
    id: "diff",
    kind: "diff",
    eyebrow: "为何是我们",
    title: "在付款离账前控风险 —— 而非事后",
    subtitle: "事前风险 + 先核查 + 强制双人控制,集于一个控制台。",
    bullets: [
      { head: "事前拦截,而非事后补救", body: "同类产品在失败后才对账。我们先拦住失败 —— 并通过向供应商核查来清除它。" },
      { head: "两条通道,一次决策", body: "境外持牌结算服务商与本地法币在同一流程中比较,并带结算 / 到账双币种。" },
      { head: "合规是原生的", body: "金额分档车道、强制经办—审批、完整审计轨迹是核心 —— 而非附加功能。" },
    ],
  },
  {
    id: "business",
    kind: "business",
    eyebrow: "商业模式",
    title: "三条彼此对齐的收入线",
    bullets: [
      { head: "按笔付款费", body: "对每笔成功降风险的付款收取小额费率。" },
      { head: "SaaS 订阅", body: "面向需要双人控制与审计的团队,按席位 + 档位定价。" },
      { head: "通道返佣", body: "从把交易量路由到最优通道所节省的成本中分成。" },
    ],
  },
  {
    id: "roadmap",
    kind: "roadmap",
    eyebrow: "路线图",
    title: "从模拟走向真实通道",
    bullets: [
      { head: "真实通道接入", body: "对接持牌机构(银行 / PSP;数字资产结算由境外持牌机构完成)。纯软件定位:不持牌、不经手资金、不做加密货币转账。" },
      { head: "更深对账", body: "只读接入 ERP/财务系统,打通付款 → 对账 → 入账闭环。资金结算始终由持牌机构完成。" },
      { head: "多币种", body: "扩展走廊与币种覆盖。" },
      { head: "企业级 RBAC", body: "为大型团队提供细粒度角色与审批策略。" },
    ],
  },
  {
    id: "cta",
    kind: "cta",
    title: "别再盲发。",
    subtitle: "FlowGuard 在每笔跨境付款离账前都先核查。",
    footnote: "欢迎联系 —— 现场演示随时可看。",
  },
];

export const DECK_EN: DeckSlide[] = [
  {
    id: "cover",
    kind: "cover",
    eyebrow: "Cross-border payout console",
    title: "FlowGuard",
    subtitle: "Dual-route, risk-first cross-border payments — check before you send.",
    footnote: "Investor pitch · 2026",
  },
  {
    id: "problem",
    kind: "problem",
    eyebrow: "The problem",
    title: "Cross-border B2B payouts are sent blind",
    bullets: [
      { head: "Send-and-pray wires", body: "You only learn a payment will bounce after it leaves — funds frozen for days while returns settle." },
      { head: "Dirty beneficiary data", body: "Wrong company name, bad IBAN, dormant accounts. Banks silently return the wire; reconciliation is manual." },
      { head: "No dual control", body: "A single cashier can push a large payout alone — real compliance and fraud exposure." },
      { head: "Wrong rail = wasted money", body: "Licensed Overseas Settlement vs local fiat picked by gut feel means higher fees and higher failure rates." },
    ],
  },
  {
    id: "solution",
    kind: "solution",
    eyebrow: "The solution",
    title: "One console that de-risks the payout before it leaves",
    bullets: [
      { head: "AI + amount-tier precheck", body: "DeepSeek AI and a deterministic engine score return probability; amount tiers escalate scrutiny, and payouts ≥ $1M are forced into the high-risk lane." },
      { head: "Verify-first with the supplier", body: "Data-quality problems (name / IBAN / SWIFT / account) must be synced to the payee as a Case first — approval is gated until verified or explicitly overridden." },
      { head: "Maker-checker, enforced", body: "Submit as Maker, approve as Checker; self-approval is hard-blocked front-end and server-side. Shown here in single-account demo mode; production uses two separate accounts." },
      { head: "Dual-route + dual currency", body: "Licensed Overseas Settlement vs Local Fiat auto-ranked by risk and cost; each payout shows settlement currency → payee's local currency." },
    ],
  },
  {
    id: "mvp",
    kind: "mvp",
    eyebrow: "What's built today",
    title: "A working MVP — live, not slideware",
    bullets: [
      { head: "Full control loop", body: "Precheck → verify-with-supplier → dual approve → generate settlement instruction for the licensed institution → payee arrival receipt → auto-reconcile, fully wired." },
      { head: "Verified risk clears itself", body: "When a supplier confirms a flagged detail, the case resolves and the risk score / blocker recompute automatically — no manual fudging." },
      { head: "Real backend", body: "PostgreSQL with multi-tenant isolation, auth guards, a server-enforced state machine, and an audit trail on every payment and case." },
      { head: "Login-free proof of arrival", body: "The payee confirms receipt via an unguessable token link; it's stored as real settlement evidence and auto-matched in reconciliation." },
    ],
  },
  {
    id: "diff",
    kind: "diff",
    eyebrow: "Why us",
    title: "Risk control before the send — not after",
    subtitle: "Pre-send risk + verify-first + enforced dual control, in one console.",
    bullets: [
      { head: "Pre-send, not post-hoc", body: "Competitors reconcile after failure. We block it first — and clear it by verifying with the supplier." },
      { head: "Two rails, one decision", body: "Licensed overseas settlement and local fiat compared in the same flow, with dual settlement / payee currency." },
      { head: "Compliance is native", body: "Amount-tier lanes, enforced maker-checker, and a full audit trail are core — not a bolt-on." },
    ],
  },
  {
    id: "business",
    kind: "business",
    eyebrow: "Business model",
    title: "Three aligned revenue lines",
    bullets: [
      { head: "Per-payout fee", body: "A small take rate on each successfully de-risked payout." },
      { head: "SaaS subscription", body: "Seat + tier pricing for teams needing dual control and audit." },
      { head: "Rail rebates", body: "Share of savings from routing volume to the optimal rail." },
    ],
  },
  {
    id: "roadmap",
    kind: "roadmap",
    eyebrow: "Roadmap",
    title: "From simulation to real rails",
    bullets: [
      { head: "Live rail integrations", body: "Route to licensed institutions (banks / PSPs; digital-asset settlement via an overseas licensed institution). Software-only: no payment licence, no fund custody, no crypto transfer." },
      { head: "Deeper reconciliation", body: "Read-only ERP/finance integrations to close the payment → reconciliation → bookkeeping loop. Settlement stays with licensed institutions." },
      { head: "Multi-currency", body: "Expand corridor and currency coverage." },
      { head: "Enterprise RBAC", body: "Granular roles and approval policies for larger teams." },
    ],
  },
  {
    id: "cta",
    kind: "cta",
    title: "Stop sending blind.",
    subtitle: "FlowGuard checks every cross-border payout before the money moves.",
    footnote: "Let's talk — live demo available now.",
  },
];

export const DECKS: Record<DeckLang, DeckSlide[]> = { zh: DECK_ZH, en: DECK_EN };

/** Backwards-compatible default (Chinese). */
export const DECK = DECK_ZH;
