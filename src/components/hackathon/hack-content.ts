// Hackathon pitch content — 2026 创青春 AI 黑客松 · 顺德行 · 自由创新赛道
// Single-person team; 5-minute pitch. Chinese-first (on-site language).
// Shared by the in-app deck (/hackathon) and the .pptx export script.
// Brand name "FlowGuard" stays Latin.

export type HackSlideKind =
  | "cover" | "toc" | "problem" | "product"
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
  aiRows?: { pain: string; entry: string; call: string; does: string }[];
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
    title: "今天用 5 分钟讲清 10 件事",
    toc: [
      "真实问题：谁在痛、痛在哪",
      "产品介绍：FlowGuard 是什么",
      "核心功能①：付款前退回风险预检",
      "核心功能②：AI 补充风险信号 + 合规简报",
      "核心功能③：双人审批 + 生成付款指令",
      "AI 覆盖一览：四痛点 → 四能力",
      "现场 Demo：你能看到什么",
      "技术架构：怎么实现的",
      "合规边界：我们不碰什么（关键）",
      "总结与可继续方向",
    ],
  },
  {
    id: "problem",
    kind: "problem",
    eyebrow: "真实问题 · 谁会使用",
    title: "跨境 B2B 付款，至今仍是「盲发」",
    subtitle: "使用者：外贸企业出纳/财务、跨境电商、做海外供应商结算的中小企业。下面四痛点，正好对应后面四个 AI 能力。",
    bullets: [
      { head: "① 中间行黑箱，钱卡哪看不见", body: "作为付款方，你根本看不到钱走了哪条路、卡在哪个中间行，只能干等——对应「AI: where is my money?」。" },
      { head: "② 莫名被退，发起时才知道", body: "退回多是收款信息/合规校验问题，却在发起后才发现，代价是几天甚至一周——对应「AI: draft the follow-up」。" },
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
    subtitle: "一句话：在把付款指令提交给持牌机构之前，先预检退回风险、比价选路、双人放行。",
    bullets: [
      { head: "全链路闭环", body: "预检→供应商核实→双人审批→生成付款指令(提交持牌机构)→到账确认→自动对账。" },
      { head: "双通道比价", body: "稳定币直连 vs 本地法币，按费用/时效/退回率自动排序，给出可解释推荐。" },
      { head: "面向真实用户", body: "为中小外贸出纳设计，移动端优先，几步走完一笔高风险付款的完整控制。" },
      { head: "产出是指令", body: "批准即生成付款指令，交由持牌机构划付——平台不经手资金。" },
    ],
  },
  {
    id: "f1",
    kind: "feature",
    eyebrow: "核心功能① · AI 为何必要",
    title: "付款前退回风险预检",
    subtitle: "确定性规则引擎：给出退回概率、命中风险因子、最可能的卡点。",
    bullets: [
      { head: "先拦截，而非先失败", body: "竞品在失败后对账；我们在提交前给出退回概率并指出卡点。" },
      { head: "可解释", body: "每个风险因子都能展开，告诉出纳为什么会被退、该补什么。" },
      { head: "一键转核实", body: "数据质量类因子可一键生成供应商核实工单，核实后自动清除/软化。" },
      { head: "为高风险把关", body: "超大额、受限地区、休眠账户等自动进入高风险通道。" },
    ],
  },
  {
    id: "f2",
    kind: "feature",
    eyebrow: "核心功能② · AI 为何必要",
    title: "AI 补充风险信号 + 合规简报",
    subtitle: "规则覆盖不了的语义与情境风险，交给 AI（DeepSeek）。",
    bullets: [
      { head: "抓规则抓不到的", body: "语义矛盾、与历史失败的相似度、可能缺失的单据——只加警示，绝不降低评分。" },
      { head: "合规简报", body: "把一堆检查项，翻译成出纳看得懂的通俗解释与修复步骤。" },
      { head: "AI 起草核实消息", body: "自动向供应商起草精准、具体的求证消息，省去反复沟通。" },
      { head: "为什么必须有 AI", body: "退回原因高度非结构化、随通道与国家变化；规则是骨架，AI 是识别隐藏风险的关键。" },
    ],
  },
  {
    id: "f3",
    kind: "feature",
    eyebrow: "核心功能③ · 成果可演示",
    title: "双人审批 + 生成付款指令",
    subtitle: "Maker-Checker 职责分离，服务端硬性禁止自我批准。",
    bullets: [
      { head: "第二签才放行", body: "出纳(Maker)提交，复核人(Checker)第二签批准；高风险进第二签通道。" },
      { head: "全程审计留痕", body: "每次批准/退回都记录签批人与时间，写入历史。" },
      { head: "产出是指令", body: "批准=生成付款指令，交由持牌机构划付——平台不经手资金。" },
      { head: "防错防内控", body: "把关键控制点前置，减少人为疏漏造成的资金损失。" },
    ],
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
        call: "AI: draft the follow-up", does: "基于命中因子直接起草给供应商的核实话术，第一条就是可直接发送的消息（补齐闭环，原来只有解释层）。" },
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
    eyebrow: "现场可以看到什么",
    title: "现场 Demo：一笔高风险付款的完整拦截",
    subtitle: "现场可运行：新建付款→预检亮红→AI 信号→核实清除→双人放行→生成指令。",
    shot: "/pitch-shots/demo.png",
    footnote: "现场可运行、可演示核心功能——不是 PPT 概念。可扫码访问在线应用实测。",
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
      { head: "工程质量", body: "全站 TypeScript 0 error、双语键 386/386 对齐、关键路由端到端可跑。" },
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
