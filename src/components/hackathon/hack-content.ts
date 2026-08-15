// Hackathon pitch content — 2026 创青春 AI 黑客松 · 顺德行 · 自由创新赛道
// Single-person team; 5-minute pitch. Chinese-first (on-site language).
// Shared by the in-app deck (/hackathon) and the .pptx export script.
// Brand name "FlowGuard" stays Latin.

export type HackSlideKind =
  | "cover" | "toc" | "case" | "problem" | "product"
  | "feature" | "aitable" | "demo" | "architecture" | "compliance" | "summary";

export interface HackSlide {
  id: string;
  kind: HackSlideKind;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bullets?: { head: string; body: string }[];
  toc?: string[];
  shot?: string;        // screenshot path for demo slide
  video?: string;       // pre-recorded demo video path (feature slide right column)
  aiRows?: { pain: string; entry: string; call: string; does: string }[];
  /** case slide: left-column one-week timeline (when → what). */
  timeline?: { when: string; what: string }[];
  /** case slide: right-column four pits, each previewing a pain point. */
  pits?: { head: string; body: string }[];
  footnote?: string;
}

export const HACK_DECK: HackSlide[] = [
  {
    id: "cover",
    kind: "cover",
    eyebrow: "2026 创青春 AI 黑客松 · 顺德行 · 自由创新赛道",
    title: "FlowGuard",
    subtitle: "把 AI 带进真实场景：跨境付款「先核查，再付款」的风控控制台",
    footnote: "一人团队 · 负责 App 全部内容 · 5 分钟路演",
  },
  {
    id: "toc",
    kind: "toc",
    eyebrow: "目录",
    title: "今天用 5 分钟讲清这几件事",
    toc: [
      "真实案例：一笔货款怎么踩坑",
      "真实问题：谁在痛、痛在哪",
      "产品介绍：FlowGuard 是什么",
      "三大核心功能：预检 · 智能路由 · 对账看板",
      "AI 覆盖一览：四痛点 → 四能力",
      "Demo 视频：你能看到什么",
      "技术架构：怎么实现的",
      "合规边界：我们不碰什么（关键）",
      "总结与可继续方向",
    ],
  },
  {
    id: "case",
    kind: "case",
    eyebrow: "先看一笔真实的付款",
    title: "一笔 $48,000 越南货款，是怎么踩进坑里的",
    subtitle: "周一，出纳给越南供应商汇一笔货款。看似普通的一笔电汇，一周内连踩四个坑——每个坑，正是下一页要讲的痛点。",
    timeline: [
      { when: "周一", what: "出纳发起 $48,000 电汇，钱汇出，开始等待。" },
      { when: "第 3 天", what: "供应商说没收到。问银行，只答「在途」，卡在哪家中间行没人说得清。" },
      { when: "第 6 天", what: "银行退回：收款公司名与账户不符（一个字母之差）。$133 手续费打水漂、货期延误。" },
      { when: "第 7 天", what: "想改走别的通道，却不清楚越南走廊要哪些材料；对账时退回款/手续费/二次汇款三笔对不上。" },
    ],
    pits: [
      { head: "看不到钱卡在哪", body: "全程黑箱，只能干等 → 痛点①" },
      { head: "发出后才知会被退", body: "收款信息问题事后才暴露 → 痛点②" },
      { head: "走廊规则要重新摸", body: "每国每行要求都不同 → 痛点③" },
      { head: "三笔款对不上账", body: "退回/手续费/重汇难核销 → 痛点④" },
    ],
    footnote: "这不是虚构极端案例，而是外贸出纳每周都在经历的常态。下一页，把它拆成四个可被验证的痛点。",
  },
  {
    id: "problem",
    kind: "problem",
    eyebrow: "真实问题 · 谁会使用",
    title: "跨境 B2B 付款，至今仍是「盲发」",
    subtitle: "使用者：外贸企业出纳/财务、跨境电商、做海外供应商结算的中小企业。下面四痛点，正好对应后面四个 AI 能力。",
    bullets: [
      { head: "① 中间行黑箱，钱卡哪看不见", body: "作为付款方，你根本看不到钱走了哪条路、卡在哪个中间行，只能干等——对应「AI: where is my money?」。" },
      { head: "② 莫名被退，发起时才知道", body: "被退回的以转账（尤其打款给个人收款人）最为常见；退回多是收款信息/合规校验问题，却在发起后才发现。传统核实还要银行→出纳→业务→供应商层层传话，拖几天甚至一周——对应「AI: draft the follow-up」。" },
      { head: "③ 多国供应商，重复适应银行", body: "多个国家的多个供应商，每次结算都要重新适应不同银行的要求，效率极低——对应「AI: what this corridor requires」。" },
      { head: "④ 财务对账，凭证对不上", body: "对账时链上/链下凭证对不上，多笔跨国付款时尤其头疼——对应「AI: why don't these match?」。" },
    ],
    footnote: "真实、高频、可被验证的痛点——不是未来概念；每一条都在后续被一个 AI 能力接住。",
  },
  {
    id: "product",
    kind: "product",
    eyebrow: "产品介绍 · 解决什么",
    title: "付款前的「退回风险 + 合规」控制台",
    subtitle: "一句话：在把付款指令提交给持牌机构之前，先预检退回风险、比价选路、双人放行（大额可升级为多级/多签）。",
    bullets: [
      { head: "全链路闭环", body: "预检→供应商核实→双人审批（大额可升级多级/多签）→生成付款指令(提交持牌机构)→到账确认→自动对账。" },
      { head: "多通道比价", body: "统一池管理多类持牌结算通道，按费用/时效/退回率自动排序，给出可解释的最优路径推荐。" },
      { head: "面向真实用户", body: "为中小外贸出纳设计，移动端优先，几步走完一笔高风险付款的完整控制。" },
      { head: "产出是指令", body: "批准即生成付款指令，交由持牌机构划付——平台不经手资金。" },
    ],
  },
  {
    id: "f1",
    kind: "feature",
    eyebrow: "核心功能① · AI 为何必要",
    title: "收款方信息预检-AI Agent",
    subtitle: "收款账户信息智能校验、国别规则适配、退回风险评分、合规风险提示报告。",
    bullets: [
      { head: "账户信息智能校验", body: "收款名/SWIFT/IBAN 一致性与账户状态校验，先拦截而非先失败。" },
      { head: "国别规则适配", body: "按收款人国家/币种自动适配该走廊的结算要求，省去每次重新摸规则。" },
      { head: "退回风险评分", body: "确定性规则引擎给出退回概率与命中因子；AI 补充语义/情境风险，只加警示、不降评分。" },
      { head: "合规风险提示报告", body: "把检查项翻译成通俗解释与修复步骤，并可一键生成供应商核实工单。" },
    ],
    shot: "/pitch-shots/feat-precheck.png",
    video: "/eazo-assets/att_0oyps7645nfy4jjj-dac41ff6e4-feat-precheck-demo.mp4",
  },
  {
    id: "f2",
    kind: "feature",
    eyebrow: "核心功能② · AI 为何必要",
    title: "多路径智能路由推荐引擎",
    subtitle: "统一池管理多类持牌结算通道，输出最优路径对比建议——平台不执行付款。",
    bullets: [
      { head: "统一通道池", body: "传统电汇、跨境人民币、第三方跨境支付通道；境外主体可选通道含境外持牌结算服务商方案。" },
      { head: "多维度比价", body: "按费用、时效、退回率对各持牌通道自动排序，给出可解释的最优路径。" },
      { head: "只建议、不执行", body: "平台仅输出最优路径对比建议，实际付款由持牌机构执行——平台不经手资金。" },
      { head: "为什么要 AI", body: "通道规则随国别/币种/额度多变，AI 帮助在多变约束下给出可解释的路径推荐。" },
    ],
    shot: "/pitch-shots/feat-route.png",
    video: "/eazo-assets/att_385lhafcz161fcq3-190894a7b5-feat-route-demo.mp4",
  },
  {
    id: "f3",
    kind: "feature",
    eyebrow: "核心功能③ · 成果可演示",
    title: "统一结算状态与对账看板",
    subtitle: "聚合各通道汇款进度、中转链路信息、交易凭证，实现多笔跨国付款台账可视化与自动对账核销。",
    bullets: [
      { head: "多通道进度聚合", body: "汇总各持牌通道的汇款进度与中转链路信息，钱走到哪一目了然。" },
      { head: "凭证与台账可视化", body: "聚合交易凭证，多笔跨国付款台账集中可视化管理。" },
      { head: "自动对账核销", body: "应收 vs 实收、费用与汇兑损失自动匹配核销，并可导出对账单。" },
      { head: "结算链路透明", body: "结算全程可追踪；平台只做透明化追踪，不经手资金。" },
    ],
    shot: "/pitch-shots/feat-reconcile.png",
    video: "/eazo-assets/att_3qmrjx5a4911h6it-3fb6d329d4-feat-reconcile-demo.mp4",
  },
  {
    id: "aitable",
    kind: "aitable",
    eyebrow: "AI 为何必要 · 四处真实痛点 → 四个 AI 能力",
    title: "AI 覆盖一览：不是装饰，是每个卡点的解法",
    subtitle: "每个 AI 能力都绑定一个真实痛点、一个具体入口、一件明确的事。",
    aiRows: [
      { pain: "① 看不到钱卡哪", entry: "历史里进行中付款的资金流链路图下方",
        call: "AI: where is my money?", does: "用自然语言说清钱现在卡在哪家中间行、为何被卡、大概还要多久、你能做什么。" },
      { pain: "② 退回事后才知道", entry: "核验 Case（open 状态）",
        call: "AI: draft the follow-up", does: "基于命中因子直接起草给供应商的核实邮件/话术，出纳一键直触供应商、砍掉银行→出纳→业务→供应商的中间层层传话（补齐闭环，原来只有解释层）。" },
      { pain: "③ 多国重复适应银行", entry: "添加收款人表单（填了国家+银行后出现）",
        call: "AI: what this corridor requires", does: "生成该国家/币种的结算要求清单（收款名匹配、SWIFT/IBAN、FX 管制文件等），省去每次重新摸规则。" },
      { pain: "④ 对账对不上", entry: "对账卡片（有差异或凭证未匹配时）",
        call: "AI: why don't these match?", does: "指出金额/凭证对不上的最可能原因 + 下一步。" },
    ],
    footnote: "AI 只加价值、只加警示——绝不降低确定性引擎评分；输出均需提交指令前人工核实。",
  },
  {
    id: "demo",
    kind: "demo",
    eyebrow: "预录 Demo 视频 · 逐页展示",
    title: "Demo 视频：逐页看每个页面在做什么",
    subtitle: "依次走过每个页面：首页概览 → 退回风险预检 → 多通道比价选路 → 结算对账看板 → 双人放行审批 → AI 核实工单。",
    shot: "/pitch-shots/demo.png",
    footnote: "预录 Demo 视频、逐页展示各功能页面——不是 PPT 概念。可扫码访问在线应用实测。",
  },
  {
    id: "arch",
    kind: "architecture",
    eyebrow: "过程可说明 · 技术架构",
    title: "怎么实现的",
    subtitle: "Next.js(App Router) + TypeScript + Tailwind；确定性规则引擎 + DeepSeek AI；双语 i18n。",
    bullets: [
      { head: "前端 / 应用", body: "Next.js 15 + React + Tailwind，移动端优先；react-i18next 中英双语。" },
      { head: "风控内核", body: "确定性退回风险规则引擎(可解释、可复现) + DeepSeek 作为补充语义信号层。" },
      { head: "数据与流转", body: "付款指令 / 收款人台账 / 工单 / 到账确认 / 对账 全链路数据模型。" },
      { head: "工程质量", body: "全站 TypeScript 0 error、双语键 415/415 对齐、关键路由端到端可跑。" },
    ],
  },
  {
    id: "compliance",
    kind: "compliance",
    eyebrow: "合规边界 · 打消最大顾虑",
    title: "我们「不碰」什么",
    subtitle: "FlowGuard 是纯软件决策支持工具——这是产品的底线，也是可持续的前提。",
    bullets: [
      { head: "不持牌", body: "不持有任何支付/金融牌照，不以金融机构身份展业。" },
      { head: "不经手资金", body: "不收款、不放款、不托管资金；平台任何环节都不流经资金。" },
      { head: "不做加密兑换/转账", body: "不提供稳定币/加密货币的兑换、托管或转账服务。" },
      { head: "由持牌机构结算", body: "所有资金结算均由持牌金融机构完成；平台只做风控、比价选路、生成指令与透明追踪。" },
    ],
    footnote: "全站措辞已按此口径统一，并附双语《合规审查报告》PDF。",
  },
  {
    id: "summary",
    kind: "summary",
    eyebrow: "总结 · 方向可继续",
    title: "真实问题 · AI 必要 · 现场可演示 · 边界清晰",
    subtitle: "一人团队，独立完成 App 全部内容：产品、风控逻辑、AI 集成、双语、合规措辞与文档。",
    bullets: [
      { head: "已验证", body: "完整闭环可现场跑通；工程质量与合规口径均已落地。" },
      { head: "可继续", body: "接入更多真实持牌通道、只读 ERP 对账、案例库随使用增长。" },
      { head: "一句话", body: "让每一笔跨境付款，在提交给持牌机构之前，先被 AI 与规则一起看一眼。" },
    ],
    footnote: "FlowGuard · 2026 创青春 AI 黑客松 · 自由创新赛道",
  },
];
