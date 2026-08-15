# -*- coding: utf-8 -*-
"""Generate the Chinese compliance statement PDF for FlowGuard.
Uses reportlab's built-in Adobe CJK CID font. Output: public/FlowGuard-合规说明.pdf
Wording is kept factually aligned with the app's in-product disclaimer
(src/i18n/locales/zh.json -> compliance.body) and the repo docs.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT

ROOT = "/home/user/flowguard-payout"
OUT = os.path.join(ROOT, "public", "FlowGuard-合规说明.pdf")

from reportlab.pdfbase.cidfonts import UnicodeCIDFont
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
_CJK = "STSong-Light"

TEAL = colors.HexColor("#0F766E")
INK = colors.HexColor("#0F172A")
MUT = colors.HexColor("#475569")
SOFT = colors.HexColor("#F1F5F9")
REDBG = colors.HexColor("#FEF2F2")
REDLINE = colors.HexColor("#FCA5A5")

def ps(name, **kw):
    kw.setdefault("fontName", _CJK)
    kw.setdefault("textColor", INK)
    kw.setdefault("alignment", TA_LEFT)
    return ParagraphStyle(name, **kw)

H1 = ps("H1", fontSize=22, leading=28, textColor=TEAL, spaceAfter=2)
SUB = ps("SUB", fontSize=11, leading=16, textColor=MUT, spaceAfter=10)
H2 = ps("H2", fontSize=14, leading=20, textColor=INK, spaceBefore=12, spaceAfter=6)
BODY = ps("BODY", fontSize=10.5, leading=17, textColor=INK, spaceAfter=5)
SMALL = ps("SMALL", fontSize=9, leading=14, textColor=MUT)
CARD_H = ps("CARD_H", fontSize=10.5, leading=15, textColor=INK)
CARD_B = ps("CARD_B", fontSize=9.5, leading=14, textColor=MUT)
QUOTE = ps("QUOTE", fontSize=10, leading=17, textColor=INK, leftIndent=8, rightIndent=8)

def card_table(rows, key_w=34, box=REDLINE, bg=REDBG, inner=colors.white):
    crows = [[Paragraph(f"<b>{h}</b>", CARD_B), Paragraph(b, CARD_B)] for h, b in rows]
    t = Table(crows, colWidths=[key_w*mm, (164-key_w)*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.6, box),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, inner),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t

story = []

# ---- Title ----
story.append(Paragraph("FlowGuard 合规说明", H1))
story.append(Paragraph("纯软件决策辅助工具 · 不持牌 · 不经手资金　|　2026 创青春 AI 黑客松 · 自由创新赛道", SUB))
story.append(HRFlowable(width="100%", thickness=1.2, color=TEAL, spaceAfter=10))

# ---- 一、产品法律定性 ----
story.append(Paragraph("一、产品法律定性", H2))
story.append(Paragraph(
    "FlowGuard 是一款面向外贸工贸企业与跨境服务商的 <b>AI 驱动跨境结算决策辅助工具</b>，"
    "专注于付款前合规与退回风险预检、多持牌通道智能比价选路、结算链路透明化追踪与全流程凭证智能对账。", BODY))
story.append(Paragraph(
    "本平台<b>不是金融机构，不以金融机构身份展业</b>，不提供支付、结算、汇兑、放贷、资金托管等任何持牌金融服务；"
    "仅面向企业内部提供信息筛查、风险提示、路径对比与指令生成等<b>软件层面的决策辅助</b>。", BODY))

# ---- 二、合规四不碰（核心底线）----
story.append(Paragraph("二、合规底线：四不碰", H2))
story.append(Paragraph("这是产品不可逾越的红线，也是其可持续、可合规运营的前提：", BODY))
story.append(card_table([
    ("不持牌", "不持有任何支付 / 结算 / 汇兑 / 金融牌照，不以金融机构身份对外展业。"),
    ("不经手资金", "不收款、不放款、不托管、不划付；平台任何环节都不流经、不占有资金。"),
    ("不做加密兑换/转账", "不提供稳定币 / 加密货币的兑换、托管、转账或任何形式的价值转移服务。"),
    ("由持牌机构结算", "所有资金结算环节均由持牌金融机构完成；平台只做风控、比价选路、生成指令与透明追踪。"),
]))

# ---- 三、资金流向与角色边界 ----
story.append(Paragraph("三、资金流向与角色边界", H2))
story.append(Paragraph(
    "平台在整条链路中<b>只处理信息，不处理资金</b>。资金的实际收付、汇兑与清算，全部由用户与持牌金融机构在平台之外完成：", BODY))
for line in [
    "· <b>平台角色</b>：信息筛查者、风险提示者、路径对比者、指令生成者、状态追踪者。",
    "· <b>用户角色</b>：付款决策与执行的唯一主体，负责向持牌机构提交并执行付款。",
    "· <b>持牌机构角色</b>：资金收付、汇兑与结算的唯一执行方，最终以其执行结果为准。",
    "· 平台生成的“付款指令”仅为<b>可交由持牌机构执行的指令文件</b>，其本身不产生任何资金划转。",
]:
    story.append(Paragraph(line, BODY))

# ---- 四、AI 使用边界 ----
story.append(Paragraph("四、AI 使用边界", H2))
story.append(Paragraph(
    "风控决策由<b>确定性规则引擎</b>负责（可解释、可复现）；AI 仅作为<b>补充信号与解释层</b>，"
    "不替代人工审批，也不单独作出任何具有约束力的付款或合规结论：", BODY))
for line in [
    "· AI 输出仅供参考，只增加警示、不降低规则分，不作为放行 / 拒付的唯一依据；",
    "· 所有大额与关键操作均保留人工双人审批（Maker-Checker），由人对结果负责；",
    "· AI 采用用户自备密钥（BYOK）方式接入外部大模型，平台不代持、不代管用户模型密钥。",
]:
    story.append(Paragraph(line, BODY))

# ---- 五、措辞与展示规范 ----
story.append(Paragraph("五、措辞与展示规范", H2))
story.append(Paragraph(
    "为避免对用户造成“平台即付款方”的误解，全站措辞统一遵循以下口径：", BODY))
story.append(card_table([
    ("使用", "“提交指令 / 生成付款指令 / 到账确认 / 透明化追踪 / 决策辅助 / 建议”。"),
    ("避免", "“为您付款 / 代付 / 汇款 / 兑换 / 托管资金 / 结算通道由本平台完成”等易致误解的表述。"),
], key_w=26, box=colors.HexColor("#E2E8F0"), bg=SOFT))

# ---- 六、数据与用户责任 ----
story.append(Paragraph("六、数据与用户责任", H2))
for line in [
    "· 用户对其录入的收款人、金额、币种等业务数据的真实性、合法性负责。",
    "· 平台提供的风险评分、比价排序与链路信息为辅助参考，不构成对任何交易结果的保证或承诺。",
    "· 是否付款、向谁付款、走哪条通道，最终决策权与执行权始终在用户；平台不介入用户的资金决策后果。",
]:
    story.append(Paragraph(line, BODY))

# ---- 七、免责声明（App 内权威口径）----
story.append(Paragraph("七、免责声明", H2))
story.append(Paragraph("以下为应用内展示的权威合规声明原文：", BODY))
q = Table([[Paragraph(
    "“本平台为纯软件决策辅助工具，专注于付款前合规风险筛查、多持牌通道智能比价选路与结算链路透明化追踪。"
    "本平台不持有任何支付牌照、不经手或托管资金，不提供任何形式的加密货币 / 稳定币兑换、托管或转账服务；"
    "所有资金结算环节均由持牌金融机构完成。平台生成的信息与建议仅供参考，最终以持牌机构的执行结果为准。”",
    QUOTE)]], colWidths=[164*mm])
q.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), SOFT),
    ("LINEBEFORE", (0, 0), (0, -1), 3, TEAL),
    ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(q)

story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#E2E8F0"), spaceAfter=6))
story.append(Paragraph(
    "本说明与应用内合规声明、《项目说明》《技术说明》口径一致。在线演示：/hackathon。", SMALL))

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=14*mm,
    title="FlowGuard 合规说明", author="FlowGuard",
)
doc.build(story)
print("PDF written:", OUT)
