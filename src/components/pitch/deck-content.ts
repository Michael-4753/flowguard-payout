// Single source of truth for the FlowGuard pitch deck content.
// Consumed by both the web deck (/pitch) and the .pptx export script.
// Chinese for on-stage presentation; the "FlowGuard" brand name stays Latin.

export interface DeckSlide {
  id: string;
  kind: "cover" | "problem" | "solution" | "mvp" | "diff" | "business" | "roadmap" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bullets?: { head: string; body: string }[];
  footnote?: string;
}

export const DECK: DeckSlide[] = [
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
      {
        head: "先发后祈祷",
        body: "钱打出去才知道会被退回 —— 资金冻结数日,等退汇结算,业务停摆。",
      },
      {
        head: "收款人信息脏数据",
        body: "公司名不符、IBAN 错误、账户休眠。银行静默退汇,对账全靠人工。",
      },
      {
        head: "缺少双人复核",
        body: "一名出纳就能单独推送大额付款 —— 真实的合规与欺诈敞口。",
      },
      {
        head: "选错通道 = 白花钱",
        body: "稳定币直付与本地法币凭感觉二选一,费用更高、失败率更高。",
      },
    ],
  },
  {
    id: "solution",
    kind: "solution",
    eyebrow: "解决方案",
    title: "一个控制台,在付款离账前先降风险",
    bullets: [
      {
        head: "AI + 金额分档预检",
        body: "DeepSeek AI 与确定性引擎评估退回概率;金额分档升级审查,≥ 100 万美元强制进入高风险车道。",
      },
      {
        head: "先向供应商核查",
        body: "数据质量问题(公司名 / IBAN / SWIFT / 账户)必须先作为 Case 同步给收款人 —— 未核实或未显式豁免前,审批被拦截。",
      },
      {
        head: "强制经办—审批分离",
        body: "以「经办」提交,以「审批」批准,自审在前后端双重硬拦截。当前为单账户演示(切换身份展示机制),生产环境为两个独立账户。",
      },
      {
        head: "双通道 + 双币种",
        body: "稳定币直付与本地法币按风险和成本自动排序;每笔付款展示 结算币种 → 收款人本地币种。",
      },
    ],
  },
  {
    id: "mvp",
    kind: "mvp",
    eyebrow: "已交付",
    title: "可运行的 MVP —— 真跑通,不是幻灯片",
    bullets: [
      {
        head: "完整控制闭环",
        body: "预检 → 供应商核查 → 双人审批 → 执行(MT103 / 钱包)→ 收款方到账回执 → 自动对账,全链路打通。",
      },
      {
        head: "核实即自动清风险",
        body: "供应商确认被标问题后,Case 关闭,风险分 / 阻断自动复算 —— 无需人工硬改。",
      },
      {
        head: "真后端",
        body: "PostgreSQL 多租户隔离、鉴权守卫、服务端强制状态机,每笔付款与 Case 均有审计轨迹。",
      },
      {
        head: "免登录到账证明",
        body: "收款人通过不可猜测的 token 链接确认收款;确认作为真实结算凭据存证,并在对账中自动匹配。",
      },
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
      { head: "两条通道,一次决策", body: "稳定币与本地法币在同一流程中比较,并带结算 / 到账双币种。" },
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
      { head: "真实通道接入", body: "接入真实的稳定币与本地法币付款服务商。" },
      { head: "链上托管", body: "把托管持久化到后端,并在真实链上结算。" },
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
