# FlowGuard — 合规措辞审查报告 / Compliance Wording Review

> 定位声明 / Positioning: FlowGuard 是一款**纯软件决策支持工具**。它**不持有牌照、不经手/托管资金、不做任何加密货币兑换、托管或转账**。所有资金结算均由**持牌金融机构**完成。
>
> FlowGuard is a **software-only decision-support tool**. It **holds no licence, never touches or custodies funds, and performs no stablecoin exchange, custody or transfer**. All settlement is performed by **licensed financial institutions**.

审查日期 / Date: 2026-08-15 · 语言 / Locales: `en-US`, `zh-CN`(键对齐 411/411)

---

## 1. 审查目标 / Objective

确保所有面向客户、访客、投资人的文案统一在"纯软件、不经手资金、由持牌机构划付"的合规口径，消除任何暗示本平台"发送/打款/汇出资金"的表述。

Ensure every customer-, guest-, and investor-facing string aligns to the software-only, no-fund-handling, settlement-by-licensed-institution stance, and remove any wording implying the platform itself sends, disburses, or moves funds.

---

## 2. 全链路结论 / Per-screen results

| 页面 / Screen | 结论 / Result | 说明 / Notes |
|---|---|---|
| 发起 · 草稿 / Draft | ✅ 合规 | CTA「新建付款指令 / New payment instruction」；数字资产提示已声明"由境外持牌机构完成、不经手资金" |
| 预检 / Pre-check | ✅ 已修 | 「暂缓发送」→「暂缓提交」/ "Do not send yet" → "Do not submit yet" |
| 审批 / Reviewer queue | ✅ 已修 | 三处「发送至银行」→「放行、生成付款指令(提交给持牌机构)」；批准 = 生成指令；双人复核、禁自批、审计留痕 |
| 工单 / Cases | ✅ 已统一 | 数据核实与失败库，不涉资金；「付款」→「付款指令」 |
| 执行面板 / Execution | ✅ 已修 | 主说明已声明"持牌机构完成结算、本平台不经手资金"；按钮=「标记为已提交」；AI 卡片「发送前」→「提交(指令)前」 |
| 历史 / History | ✅ 已统一 | 只读指令台账；「确认收款」→「确认到账」，「收据链接」→「到账确认链接」 |
| 对账 / Reconciliation | ✅ 已修 | 「累计发出/发出/尚未发出」→「累计已提交/已提交/尚未提交」；「收款人确认」→「收款人到账确认」 |
| 收款(公开链接) / Public receipt | ✅ 已修 | 标题「到账确认」；「来款方」→「付款方(付款发起人)」；新增合规脚注(平台不经手资金，款项由持牌机构划付，此页仅供确认到账) |
| 仪表盘 / Dashboard | ✅ 合规 | 副标题「在把付款指令提交给持牌机构之前……」；无经手资金表述 |
| 投资人 Pitch Deck | ✅ 合规 | 已显式声明"纯软件、不持牌、不经手资金、不做加密货币兑换/托管/转账；结算由持牌机构完成" |

---

## 3. 保留的正常用词 / Intentionally retained wording

以下"send / 发送 / 发出"经审查属正常且合规，**予以保留**：

- **发送链接 / 消息**：`发送给收款人`、`发送方`、`发送内部备注` — 指发送链接或消息，与资金无关。
- **风控时点表达**：Pitch Deck 中 `check before you send` / `before the money moves` — 指"付款发起前"介入的核心卖点。
- **行业痛点比喻**：Pitch Deck 中 `Send-and-pray wires` / `先发后祈祷` — 描述传统电汇痛点，非本平台动作。

---

## 4. 代码级保障 / Code-level guardrails

- `src/lib/payout-instruction.ts`：类型注释显式声明 "does NOT move funds, hold funds"；已剥离 `walletAddress` / `amountLabel` 等易引起资金收集误解的遗留字段。
- `payout-execution-panel.tsx` 导出脚注："FlowGuard does not hold or move funds; settlement is performed by the licensed institution."
- `/escrow` 路由已移出导航并重定向至仪表盘(307)。

---

## 5. 验证 / Verification

- 双语键对齐 / Locale parity: **411 / 411**，零缺失。
- 类型检查 / `tsc --noEmit`: **0 error**。
- 关键路由 / Routes: `/`, `/review`, `/history`, `/reconcile`, `/cases`, `/receipt/:token`, `/pitch` 均 **HTTP 200**；`/escrow` **307** 重定向。

---

_本报告由全站逐页措辞审查生成，仅描述软件文案的合规口径，不构成法律意见。_
_This report documents software-copy compliance wording only and is not legal advice._
