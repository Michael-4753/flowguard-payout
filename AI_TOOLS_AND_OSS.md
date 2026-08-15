# AI 工具、模型、第三方素材与开源组件说明

_2026 创青春 AI 黑客松 · 顺德行 · 自由创新赛道 · 参赛作品：FlowGuard_

本说明如实披露 FlowGuard 在开发与运行过程中使用的 AI 工具与模型、第三方素材，以及所依赖的开源框架与组件，并标注其用途与许可（License）情况。所有第三方成果均在其各自许可允许范围内合法使用；本作品整体为本人独立原创。

---

## 一、使用的 AI 模型（应用运行时）

| 项目 | 说明 |
| --- | --- |
| 模型 | DeepSeek（默认 deepseek.v3.1；含 reasoner 类推理模型的兼容处理） |
| 接入方式 | 通过 Eazo 平台 App AI 计费代理调用，按能力路由；模型密钥不落客户端 |
| 调用位置 | 付款前风险信号补充、合规简报解释、供应商核实消息起草、选路解释、资金流解读、对账差异归因 |
| 使用边界 | AI 为按需触发的补充信号层——只加警示、绝不降低确定性规则引擎评分；AI 不可用时确定性报告不受影响 |
| 数据说明 | 演示所用供应商 / 金额 / 案例均为虚构样例数据，仅用于演示 |

> 说明：AI 仅用于对确定性规则引擎结果的补充解释与信号提示，最终结论均需在提交指令前由人工核实。

## 二、开发过程中使用的 AI 辅助工具

| 工具 | 用途 |
| --- | --- |
| Eazo Creator（AI 结对开发） | 在本人主导下辅助进行界面搭建、代码编写、文档与素材生成 |

> 作品的产品构思、风控逻辑、架构决策与最终内容均由本人独立负责并审校；AI 辅助工具的产出经本人核对后采用。

## 三、核心开源框架与运行时

| 组件 | 用途 | 许可 |
| --- | --- | --- |
| Next.js 16（App Router） | 全栈框架：页面路由 + 服务端 API | MIT |
| React 19 / React DOM | UI 运行时 | MIT |
| TypeScript 5 | 静态类型语言 | Apache-2.0 |
| Tailwind CSS 4 + @tailwindcss/postcss | 原子化样式 | MIT |
| tw-animate-css | 动画工具类 | MIT |

## 四、UI、动效与交互组件

| 组件 | 用途 | 许可 |
| --- | --- | --- |
| @base-ui/react | 无样式交互基元 | MIT |
| shadcn | 组件脚手架 / 样式约定 | MIT |
| framer-motion | 步骤切换与卡片动效 | MIT |
| lucide-react | 图标库 | ISC |
| next-themes | 主题（明暗）切换 | MIT |
| sonner | 轻量 Toast 通知 | MIT |
| clsx / tailwind-merge / class-variance-authority | 类名合并与变体管理 | MIT |
| qrcode / @types/qrcode | 收据 / 核实二维码生成 | MIT |

## 五、国际化、校验与后端 / 数据

| 组件 | 用途 | 许可 |
| --- | --- | --- |
| i18next / react-i18next | 中英双语国际化 | MIT |
| zod | 入参与结构校验 | MIT |
| drizzle-orm / drizzle-kit | 类型化 ORM 与迁移工具 | Apache-2.0 |
| postgres | PostgreSQL 客户端驱动 | Unlicense |
| dotenv | 环境变量加载 | BSD-2-Clause |
| @eazo/sdk | Eazo 平台能力：鉴权、App AI、对象存储、托管数据库 | 平台官方 SDK |
| @modelcontextprotocol/sdk | 暴露 MCP 服务端，供外部 AI Agent 调用 | MIT |

## 六、文档与素材生成工具链（离线构建脚本）

| 工具 | 用途 | 许可 |
| --- | --- | --- |
| pdfkit | 生成合规审查报告 / 用户指南 / 技术架构 / 承诺书等 PDF | MIT |
| python-pptx | 生成黑客松路演 PPTX | MIT |
| Playwright（Chromium） | 无头浏览器驱动真实页面截图 | Apache-2.0 |
| Pillow（PIL） | 绘制演示示意图（demo 图） | HPND / PIL License |
| fontTools | 提取 CJK 字体子集供 PDF 渲染 | MIT |

## 七、字体

| 字体 | 用途 | 许可 |
| --- | --- | --- |
| Noto Sans CJK SC（思源黑体） | PDF / PPTX / 演示图中的简体中文渲染 | SIL Open Font License 1.1 |

## 八、第三方素材说明

- 本作品**未使用**任何外部图库照片、商用图标包或受版权保护的第三方图片 / 音视频素材。
- 路演与文档中的功能截图，均取自本作品**真实运行的页面**；演示示意图由本人使用上述开源工具（Pillow）绘制。
- 产品名称「FlowGuard」为本作品自拟名称；界面文案与图标组合均为本人原创设计。

---

_以上披露均真实、完整。如涉及的开源组件版本或许可有更新，以其官方仓库标注为准。_

_FlowGuard · AI 工具、模型、第三方素材与开源组件说明 · 2026 创青春 AI 黑客松 · 自由创新赛道_
