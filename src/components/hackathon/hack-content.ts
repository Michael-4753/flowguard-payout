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
    title: "今天用 5 分钟讲清 9 件事",
    toc: [
      "真实问题：谁在痛、痛在哪",
      "产品介绍：FlowGuard 是什么",
      "核心功能 ①：付款前退回风险预检",
      "核心功能 ②：AI 补充风险信号 + 合规简报",
      "核心功能 ③：双人审批 + 生成付款指令",
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
    subtitle: "使用者：外贸企业出纳/财务、跨境电商、做海外供应商结算的中小企业。",
    bullets: [
      { head: "先发后祈祷", body: "钱汇出去才知道会被退回——资金冻结数日，等退汇结算，业务停摆、供应商催货。" },
      { head: "退回原因藏在细节", body: "收款人信息一个字段不符（SWIFT/IBAN/户名）、通道选错，就整笔退回，出纳无从预判。" },
      { head: "选错通道白花钱", body: "稳定币直连 vs 本地法币，凭感觉选，费用更高、失败率更高。" },
      { head: "缺少双人控制", body: "小团队一个人又发起又确认，一旦填错没有第二道拦截，直接造成损失。" },
    ],
    footnote: "真实、高频、可被验证的痛点——不是未来概念。",
  },
  {
    id: "product",
    kind: "product",
    eyebrow: "产品介绍 · 解决什么",
    title: "FlowGuard：付款前的「退回风险 + 合规」控制台",
    subtitle: "一句话：在把付款指令提交给持牌机构之前，先预检退回风险、比价选路、双人放行。",
    bullets: [
      { head: "全链路闭环", body: "预检 → 供应商核实 → 双人审批 → 生成付款指令(提交持牌机构) → 到账确认 → 自动对账。" },
      { head: "双通道比价", body: "稳定币直连 vs 本地法币，按费用/时效/退回率自动排序，给出可解释的推荐。" },
      { head: "面向真实用户", body: "为中小外贸出纳设计，移动端优先，几步走完一笔高风险付款的完整控制。" },
    ],
  },
  {
    id: "f1",
    kind: "feature",
    eyebrow: "核心功能 ① · AI 为何必要",
    title: "付款前退回风险预检",
    subtitle: "确定性规则引擎：给出退回概率、命中风险因子、最可能的卡点。",
    bullets: [
      { head: "先拦截，而不是先失败", body: "竞品都在失败后对账；我们在提交前就给出退回概率并指出卡点。" },
      { head: "可解释", body: "每个风险因子都能展开，告诉出纳「为什么会被退、该补什么」。" },
      { head: "一键转核实", body: "数据质量类因子可一键生成供应商核实工单，核实后自动清除/软化。" },
    ],
  },
  {
    id: "f2",
    kind: "feature",
    eyebrow: "核心功能 ② · AI 为何必要",
    title: "AI 补充风险信号 + 合规简报",
    subtitle: "确定性规则覆盖不了的语义与情境风险，交给 AI（DeepSeek）。",
    bullets: [
      { head: "AI 抓「规则抓不到的」", body: "语义矛盾、与历史失败案例的相似度、可能缺失的单据——AI 只加警示，绝不降低评分。" },
      { head: "合规简报", body: "把一堆检查项，翻译成出纳看得懂的通俗解释和修复步骤。" },
      { head: "AI 起草核实消息", body: "自动向供应商起草一条精准、具体的求证消息，省去反复沟通。" },
      { head: "为什么必须有 AI", body: "跨境退回原因高度非结构化、随通道与国家变化；规则是骨架，AI 是识别隐藏风险与生成沟通的关键。" },
    ],
  },
  {
    id: "f3",
    kind: "feature",
    eyebrow: "核心功能 ③ · 成果可演示",
    title: "双人审批 + 生成付款指令",
    subtitle: "Maker-Checker 职责分离，服务端硬性禁止自我批准。",
    bullets: [
      { head: "第二签才放行", body: "出纳(Maker)提交，复核人(Checker)第二签批准；高风险进第二签通道。" },
      { head: "全程审计留痕", body: "每次批准/退回都记录签批人与时间，写入历史。" },
      { head: "产出是「指令」", body: "批准 = 生成付款指令，交由持牌机构划付——平台不经手资金。" },
    ],
  },
  {
    id: "demo",
    kind: "demo",
    eyebrow: "现场可以看到什么",
    title: "现场 Demo：一笔高风险付款的完整拦截",
    subtitle: "扫码/现场操作即可跑通：新建付款 → 预检亮红 → AI 信号 → 核实清除 → 双人放行 → 生成指令。",
    shot: "/pitch-shots/demo.png",
    footnote: "现场可运行、可演示核心功能——不是 PPT 概念。",
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
      { head: "可继续", body: "接入更多真实持牌通道、只读 ERP/财务对账、退回案例库随使用增长而变强。" },
      { head: "一句话", body: "让每一笔跨境付款，在提交给持牌机构之前，先被 AI 与规则一起「看一眼」。" },
    ],
    footnote: "FlowGuard · 2026 创青春 AI 黑客松 · 自由创新赛道",
  },
];
