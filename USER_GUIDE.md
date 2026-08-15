# FlowGuard — 用户手册 / User Guide

> FlowGuard 是一款**纯软件决策支持工具**：付款前合规与退回风险筛查、多持牌通道智能比价选路、结算链路透明追踪。它**不持牌、不经手/托管资金、不做任何加密货币兑换或转账**；所有资金结算由**持牌金融机构**完成。
>
> FlowGuard is a **software-only decision-support tool**: pre-payment compliance & return-risk screening, multi-rail routing across licensed institutions, and transparent settlement tracking. It **holds no licence, never touches or custodies funds, and performs no crypto exchange or transfer** — all settlement is done by **licensed financial institutions**.

版本 / Version: 1.0 · 语言 / Locales: 简体中文 · English

---

## 1. 快速开始 / Getting started

1. 打开应用，进入**首页(付款控制台)**。/ Open the app to the **Home (payment console)**.
2. 顶部/底部导航：**首页、付款、收款人、审批、工单、历史**。/ Navigation: **Home · Pay · Payees · Review · Cases · History**.
3. 语言：应用支持**英文与中文**，首选语言为英文，可随时切换。/ The app supports **English and 中文**, English-first, switchable anytime.
4. 每笔业务的最终动作是**生成一条付款指令**并提交给持牌机构——平台本身不划付资金。/ Every flow ends by **generating a payment instruction** submitted to a licensed institution — the platform never moves funds itself.

---

## 2. 核心流程 / Core workflow

完整闭环 / Full loop：
**发起草稿 → 退回风险预检 → 供应商核实(可选) → 双人审批 → 生成付款指令(提交持牌机构) → 记录结算凭证 → 收款方到账确认 → 对账**

### 2.1 新建付款指令 / New payment instruction
- 首页点击「**新建付款指令 / New payment instruction**」。/ Tap **New payment instruction** on Home.
- 选择**收款人**、填写**金额**与**结算币种**；可设**通道偏好**(自动推荐 / 稳定币直连 / 本地法币)。/ Pick a **payee**, enter **amount** and **settlement currency**; optionally set a **channel preference** (Auto / Stablecoin Direct / Local Fiat).
- 点击「**运行预检 / Run pre-check**」。/ Tap **Run pre-check**.

### 2.2 退回风险预检 / Return-risk pre-check
- 系统给出**退回概率、命中的风险因子、可能的卡点**。/ You get a **return probability**, hit **risk factors**, and the **likely chokepoint**.
- 若出现严重阻断项，会提示「**暂缓提交 / Do not submit yet**」——建议先解决或走供应商核实。/ Critical blockers show **Do not submit yet** — resolve them or verify with the supplier first.
- 数据质量类风险因子可一键「**生成核实请求**」，进入工单。/ Data-quality factors can be turned into a **verification request** (a Case) in one click.

### 2.3 选路 / Route
- 对比**稳定币直连 vs 本地法币**两条通道的费用、时效与退回率，选择结算路径。/ Compare **Stablecoin Direct vs Local Fiat** on fees, ETA and return rate, then choose the route.
- 数字资产结算由**境外持牌机构**完成并为收款人入账；平台仅比价与选路。/ Digital-asset settlement is completed by an **overseas licensed institution**; the platform only compares and routes.
- 确认后提交审批。/ Submit for approval.

### 2.4 双人审批(Maker-Checker) / Dual approval
- 出纳(Maker)提交的每笔指令，须由**复核人(Checker)** 第二签批准，**不能自我批准**(服务端强制)。/ Every instruction a Maker submits needs a second-signature approval from a **Checker** — **self-approval is hard-blocked** on the server.
- 高风险指令进入第二签通道；退回需填**必填理由**。/ High-risk items go to the second-signature lane; returning requires a **mandatory reason**.
- 批准 = 「**批准并生成指令 / Approve & generate instruction**」，全程写入审计记录。/ Approve = **Approve & generate instruction**, fully recorded in the audit trail.

### 2.5 执行(提交给持牌机构) / Execute (submit to institution)
- 面板显示：「将此指令提交给持牌机构，然后记录其**结算凭证号**」。/ The panel says: submit the instruction to the licensed institution, then record its **settlement reference**.
- 记录**银行确认 / MT103 / 机构结算凭证号**，可上传回单。/ Record the **bank confirmation / MT103 / institution settlement reference**; attach a slip.
- 点击「**标记为已提交 / Mark as submitted**」。**持牌机构完成结算——本平台不经手资金。**/ Tap **Mark as submitted**. **The licensed institution completes settlement — the platform does not move funds.**

### 2.6 收款方到账确认 / Payee arrival confirmation
- 在历史中生成「**收款人到账确认链接**」(免登录)，发送给收款人。/ From History, generate the login-free **arrival-confirmation link** and send it to the payee.
- 收款人到账后点击确认，回执记录到指令中。/ The payee confirms once funds arrive; the confirmation is recorded against the instruction.

### 2.7 对账 / Reconciliation
- 「对账」页比对**应收 vs 实收、费用、汇兑损失**，匹配到账凭证并可导出对账单。/ The Reconciliation screen compares **expected vs received, fees, FX loss**, matches arrival proofs, and exports a statement.
- 状态：未结 / 待对账 / 已对账。/ Statuses: Outstanding / To reconcile / Reconciled.

---

## 3. 各页面速查 / Screen reference

| 页面 / Screen | 用途 / Purpose |
|---|---|
| 首页 / Home | 概览、统计、国家敞口、最近付款、新建付款指令 |
| 付款 / Pay | 草稿 → 预检 → 选路，三步向导 |
| 收款人 / Payees | 收款人台账(SWIFT/IBAN、通道、退回率、失败历史) |
| 审批 / Review | Maker-Checker 双人复核队列 |
| 工单 / Cases | 供应商核实请求 + 失败案例库 |
| 历史 / History | 只读付款指令台账、到账确认链接 |
| 对账 / Reconcile | 应收/实收比对与对账单导出 |

---

## 4. AI 助手 / AI assistant

- **风险信号 / Risk signals**：捕捉语义矛盾、相似历史失败、可能缺失单据；**只加警示，绝不降低评分**。/ Catches semantic contradictions, similar past failures, likely-missing docs; **only adds caution, never lowers the score**.
- **合规简报 / Compliance briefing**：通俗解释与修复步骤。/ Plain-language explanation and fix steps.
- **核实消息起草 / Draft verification message**：向供应商起草求证消息。/ Drafts a request to the supplier.
- AI 输出**仅供参考**，提交指令前请核实。/ AI output is **advisory** — verify before submitting the instruction.

---

## 5. 常见问题 / FAQ

**Q: FlowGuard 会帮我付款/打款吗？/ Does FlowGuard pay or send money for me?**
不会。平台只做风控、比价选路与生成付款指令；资金由持牌机构划付。/ No. It only screens risk, routes, and generates the instruction; funds are disbursed by licensed institutions.

**Q: 为什么不能批准自己提交的付款？/ Why can't I approve my own submission?**
职责分离(Maker-Checker)要求由不同角色批准，服务端已强制禁止自我批准。/ Segregation of duties requires a different role; self-approval is hard-blocked.

**Q: 到账确认链接需要收款人登录吗？/ Does the arrival-confirmation link require login?**
不需要，是免登录的不可猜测链接。/ No — it's a login-free, unguessable link.

**Q: 演示数据可以重置吗？/ Can I reset the demo data?**
可以，在历史页点「重置演示数据」，种子收款人会自动恢复。/ Yes — Reset demo data on History; seed payees restore automatically.

---

_本手册描述软件操作，不构成法律或财务意见。资金结算以持牌机构执行结果为准。_
_This guide describes software usage and is not legal or financial advice. Settlement is governed by the licensed institution's execution._
