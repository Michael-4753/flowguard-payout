#!/usr/bin/env python3
# Renders an on-brand product-UI illustration (phone mock) for the demo slide.
# Uses Noto Sans CJK; output PNG under public/pitch-shots/.
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = "/home/user/flowguard-payout/public/pitch-shots"
os.makedirs(OUT_DIR, exist_ok=True)
REG = "/tmp/NotoSansSC.ttf"
BOLD = "/tmp/NotoSansSC-Bold.ttf"

def font(sz, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, sz)

W, H = 1600, 900
TEAL = (15, 118, 110)
INK = (15, 23, 42)
MUT = (100, 116, 139)
BG = (241, 245, 249)
RED = (220, 38, 38)
AMBER = (217, 119, 6)
GREEN = (22, 163, 74)
CARD = (255, 255, 255)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def rr(box, r, fill, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

# ---- three phone frames showing the flow ----
def phone(x, title, badge_text, badge_color, rows, cta_text, cta_color):
    pw, ph = 360, 700
    y = 110
    rr((x, y, x+pw, y+ph), 34, (255,255,255), outline=(226,232,240), width=2)
    # status bar
    d.text((x+28, y+22), "FlowGuard", font=font(20, True), fill=TEAL)
    d.text((x+pw-70, y+22), "9:41", font=font(16), fill=MUT)
    # screen title
    d.text((x+28, y+64), title, font=font(24, True), fill=INK)
    # risk badge
    bw = d.textlength(badge_text, font=font(18, True)) + 32
    rr((x+28, y+108, x+28+bw, y+150), 21, badge_color)
    d.text((x+44, y+117), badge_text, font=font(18, True), fill=(255,255,255))
    # rows
    ry = y+180
    for head, body, dot in rows:
        rr((x+24, ry, x+pw-24, ry+96), 16, (248,250,252), outline=(226,232,240), width=1)
        d.ellipse((x+40, ry+20, x+56, ry+36), fill=dot)
        d.text((x+68, ry+16), head, font=font(18, True), fill=INK)
        d.text((x+40, ry+50), body, font=font(15), fill=MUT)
        ry += 112
    # cta
    rr((x+24, y+ph-84, x+pw-24, y+ph-28), 16, cta_color)
    tw = d.textlength(cta_text, font=font(19, True))
    d.text((x+(pw-tw)/2, y+ph-72), cta_text, font=font(19, True), fill=(255,255,255))

# header
d.text((80, 40), "现场 Demo · 一笔高风险付款的完整拦截", font=font(34, True), fill=INK)

phone(120, "预检结果", "退回概率 68% · 高风险", RED,
      [("户名与开户行不符", "SWIFT 指向的银行与收款人不一致", RED),
       ("通道选择偏高风险", "本地法币通道退回率更低", AMBER),
       ("可能缺少发票号", "该走廊常因缺单被卡", AMBER)],
      "暂缓提交 · 生成核实工单", RED)

phone(620, "AI 风险信号 + 核实", "AI 补充 · 仅加警示", TEAL,
      [("语义矛盾", "金额与合同条款不一致", AMBER),
       ("相似历史失败", "与 3 笔被退案例高度相似", AMBER),
       ("已向供应商核实", "户名已确认 · 因子清除", GREEN)],
      "AI 已起草核实消息", TEAL)

phone(1120, "双人审批", "复核人第二签", GREEN,
      [("Maker 已提交", "出纳发起 · 待复核", MUT),
       ("职责分离", "禁止自我批准", TEAL),
       ("批准并生成指令", "提交持牌机构划付", GREEN)],
      "批准并生成付款指令", GREEN)

# footer note
d.text((80, H-46), "平台不经手资金 · 由持牌机构完成结算 · 全程审计留痕",
       font=font(20), fill=MUT)

img.save(os.path.join(OUT_DIR, "demo.png"))
print("saved", os.path.join(OUT_DIR, "demo.png"))
