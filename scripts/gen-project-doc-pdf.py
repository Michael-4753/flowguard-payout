# -*- coding: utf-8 -*-
"""Generate the Chinese project description PDF for FlowGuard.
Uses reportlab with Noto CJK fonts. Output: public/FlowGuard-项目说明.pdf
Content is kept factually aligned with the app (routes, stack, AI, compliance).
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT

ROOT = "/home/user/flowguard-payout"
OUT = os.path.join(ROOT, "public", "FlowGuard-项目说明.pdf")

# ---- Fonts: use reportlab's built-in Adobe CJK CID font (no external file). ----
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
# STSong-Light has no separate bold face; reuse it and rely on size/color for emphasis.
_CJK = "STSong-Light"

TEAL = colors.HexColor("#0F766E")
INK = colors.HexColor("#0F172A")
MUT = colors.HexColor("#475569")
SOFT = colors.HexColor("#F1F5F9")

def ps(name, **kw):
    kw.setdefault("fontName", "CJK")
    kw.setdefault("textColor", INK)
    kw.setdefault("alignment", TA_LEFT)
    return ParagraphStyle(name, **kw)

H1 = ps("H1", fontName="CJK-B", fontSize=22, leading=28, textColor=TEAL, spaceAfter=2)
SUB = ps("SUB", fontSize=11, leading=16, textColor=MUT, spaceAfter=10)
H2 = ps("H2", fontName="CJK-B", fontSize=14, leading=20, textColor=INK, spaceBefore=12, spaceAfter=6)
BODY = ps("BODY", fontSize=10.5, leading=17, textColor=INK, spaceAfter=5)
SMALL = ps("SMALL", fontSize=9, leading=14, textColor=MUT)
CARD_H = ps("CARD_H", fontName="CJK-B", fontSize=10.5, leading=15, textColor=INK)
CARD_B = ps("CARD_B", fontSize=9.5, leading=14, textColor=MUT)

story = []

# ---- Title ----
story.append(Paragraph("FlowGuard 项目说明", H1))
story.append(Paragraph("事前防退回 · 事中破黑箱 · 事后好对账　|　2026 创青春 AI 黑客松 · 自由创新赛道", SUB))
story.append(HRFlowable(width="100%", thickness=1.2, color=TEAL, spaceAfter=10))

# ---- 一、产品概述 ----
story.append(Paragraph("一、产品概述", H2))
story.append(Paragraph(
    "FlowGuard 是一款面向外贸工贸企业与跨境服务商的 AI 驱动跨境结算决策辅助平台，"
    "专注于付款前合规风险预检、多持牌通道智能路由、结算链路透明化追踪与全流程凭证智能对账，"
    "帮助企业降低汇款退回风险、消除中间行信息黑箱、提升跨国结算与财务对账效率。", BODY))
story.append(Paragraph(
    "产品定位为<b>纯软件决策支持工具</b>：不持牌、不经手资金、不做加密兑换/转账，"
    "所有资金结算均由持牌金融机构完成，平台只提供风险预检、比价选路、指令生成与透明追踪。", BODY))

# ---- 二、目标用户与痛点 ----
story.append(Paragraph("二、目标用户与核心痛点", H2))
story.append(Paragraph(
    "目标用户：外贸企业出纳 / 财务、跨境电商、以及为海外供应商做结算的中小企业。", BODY))
pain_rows = [
    [Paragraph("盲发付款", CARD_H), Paragraph("付款前无法预知退回风险与合规问题，常常“先失败、再返工”。", CARD_B)],
    [Paragraph("选路靠感觉", CARD_H), Paragraph("境外持牌通道与本地法币二选一，费用更高、失败率更高。", CARD_B)],
    [Paragraph("资金黑箱", CARD_H), Paragraph("钱经过多层中间行，卡在哪家、为何被卡、还要多久，全都看不见。", CARD_B)],
    [Paragraph("对账繁琐", CARD_H), Paragraph("多通道、多币种、多笔付款的进度、凭证与核销分散、易错。", CARD_B)],
]
t = Table(pain_rows, colWidths=[34*mm, 130*mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), SOFT),
    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)

# ---- 三、三大核心功能 ----
story.append(Paragraph("三、三大核心功能（事前 / 事中 / 事后）", H2))
feats = [
    ("① 事前防退回 · 收款方信息预检", "付款前对收款账户智能校验、按国别规则适配、给出退回概率与命中因子，"
        "并生成合规风险提示报告与供应商核实工单——先拦截，而非先失败。"),
    ("② 事中破黑箱 · 结算链路透明化追踪", "逐跳看清资金流经的每一层中间行，标注透明度（清晰/部分/黑箱）与滞留卡点；"
        "并在多类持牌通道间按费用/时效/退回率比价选路，AI 解释为什么推荐这条路径。"),
    ("③ 事后好对账 · 统一结算状态与对账看板", "聚合各通道汇款进度、中转链路信息与交易凭证，实现多笔跨国付款台账可视化，"
        "并自动完成应收 vs 实收的对账核销与导出。"),
]
for h, b in feats:
    story.append(Paragraph(h, CARD_H))
    story.append(Paragraph(b, BODY))

# ---- 四、AI 的作用 ----
story.append(Paragraph("四、AI 在产品中的作用", H2))
story.append(Paragraph(
    "风控决策由<b>确定性规则引擎</b>负责（可解释、可复现）；<b>DeepSeek AI</b> 作为补充信号与解释层：", BODY))
for line in [
    "· 预检阶段：补充语义/情境风险，只加警示、不降低规则分，并把检查项翻译成通俗解释与修复步骤；",
    "· 选路阶段：用自然语言解释“为什么推荐这条路径、它比其他通道好在哪”，可解释、可复核；",
    "· 追踪阶段：用自然语言说明资金当前所处链路节点与状态。",
]:
    story.append(Paragraph(line, BODY))

# ---- 五、应用页面 ----
story.append(Paragraph("五、应用页面（对应底部导航）", H2))
pages = [
    ("首页 · 付款控制台 (/)", "待办付款、进行中笔数与整体退回风险一屏概览，是进入各流程的入口。"),
    ("付款 · 新建付款向导 (/pay)", "录入收款方 → 退回预检 → 多通道比价选路 → 双人放行，生成付款指令。"),
    ("收款人 · 收款人台账 (/suppliers)", "按国家分组的收款人，含 SWIFT/IBAN、可用通道与历史失败记录。"),
    ("审批 · 审批队列 (/review)", "Maker-Checker：出纳提交的每笔指令在此等第二签批准，通过后才放行。"),
    ("工单 · 核实与退回案例 (/cases)", "跟踪收款人核实请求，并研究真实退回案例，沉淀为可复用经验。"),
    ("历史 · 付款历史 (/history)", "每一笔已选路付款及其预检快照与所选通道，全程可回溯。"),
]
prows = [[Paragraph(f"<b>{n}</b>", CARD_B), Paragraph(b, CARD_B)] for n, b in pages]
pt = Table(prows, colWidths=[62*mm, 102*mm])
pt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#EDF2F7")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(pt)

# ---- 六、技术架构 ----
story.append(Paragraph("六、技术架构", H2))
for line in [
    "· 前端/应用：Next.js 15（App Router）+ React + TypeScript + Tailwind，移动端优先；react-i18next 中英双语。",
    "· 风控内核：确定性退回风险规则引擎（可解释、可复现）+ DeepSeek 补充语义信号层。",
    "· 数据模型：付款指令 / 收款人台账 / 工单 / 到账确认 / 对账，全链路数据流转。",
    "· 工程质量：全站 TypeScript 0 error、中英双语键对齐、关键路由端到端可跑。",
]:
    story.append(Paragraph(line, BODY))

# ---- 七、合规边界 ----
story.append(Paragraph("七、合规边界（产品底线）", H2))
comp = [
    ("不持牌", "不持有任何支付/金融牌照，不以金融机构身份展业。"),
    ("不经手资金", "不收款、不放款、不托管资金；平台任何环节都不流经资金。"),
    ("不做加密兑换/转账", "不提供稳定币/加密货币的兑换、托管或转账服务。"),
    ("由持牌机构结算", "所有资金结算均由持牌金融机构完成；平台只做风控、比价选路、生成指令与透明追踪。"),
]
crows = [[Paragraph(f"<b>{h}</b>", CARD_B), Paragraph(b, CARD_B)] for h, b in comp]
ct = Table(crows, colWidths=[34*mm, 130*mm])
ct.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#FCA5A5")),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(ct)

story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#E2E8F0"), spaceAfter=6))
story.append(Paragraph(
    "在线演示：/hackathon　|　路演材料：FlowGuard-Hackathon-Pitch.pptx　|　一人团队，独立完成 App 全部内容。", SMALL))

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=14*mm,
    title="FlowGuard 项目说明", author="FlowGuard",
)
doc.build(story)
print("PDF written:", OUT)
