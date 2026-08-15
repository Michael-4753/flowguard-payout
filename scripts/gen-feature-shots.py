#!/usr/bin/env python3
# Renders on-brand product-UI illustrations (phone frames) for each core feature,
# used as "screenshots" on the pitch feature slides. PIL + Noto Sans CJK.
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/home/user/flowguard-payout/public/pitch-shots"
os.makedirs(OUT, exist_ok=True)
REG = "/tmp/NotoSansSC.ttf"; BOLD = "/tmp/NotoSansSC-Bold.ttf"

TEAL=(15,118,110); INK=(15,23,42); MUT=(100,116,139); BG=(248,250,252)
RED=(220,38,38); AMBER=(217,119,6); GREEN=(22,163,74); SKY=(2,132,199); WHITE=(255,255,255)
CARD=(248,250,252); LINE=(226,232,240)

def F(sz,b=False): return ImageFont.truetype(BOLD if b else REG, sz)

# portrait phone canvas
W,H = 760, 1000
def new():
    img=Image.new("RGB",(W,H),WHITE); return img, ImageDraw.Draw(img)
def rr(d,box,r,fill,outline=None,w=1):
    d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=w)

def header(d,title):
    d.text((36,34),"FlowGuard",font=F(26,True),fill=TEAL)
    d.text((W-96,36),"9:41",font=F(20),fill=MUT)
    d.text((36,84),title,font=F(30,True),fill=INK)
    d.line((36,132,W-36,132),fill=LINE,width=2)

def badge(d,x,y,text,color):
    w=d.textlength(text,font=F(19,True))+36
    rr(d,(x,y,x+w,y+44),22,color)
    d.text((x+18,y+10),text,font=F(19,True),fill=WHITE)
    return w

def rowcard(d,y,head,body,dot,h=118):
    rr(d,(36,y,W-36,y+h),18,CARD,outline=LINE,w=1)
    d.ellipse((56,y+24,74,y+42),fill=dot)
    d.text((88,y+20),head,font=F(21,True),fill=INK)
    # wrap body
    d.text((56,y+58),body,font=F(16),fill=MUT)
    return y+h+16

def cta(d,y,text,color):
    rr(d,(36,y,W-36,y+64),18,color)
    tw=d.textlength(text,font=F(21,True))
    d.text(((W-tw)/2,y+18),text,font=F(21,True),fill=WHITE)

# ---------- 1) precheck ----------
img,d=new(); header(d,"退回风险预检")
badge(d,36,150,"退回概率 68% · 高风险",RED)
d.text((300,158),"命中 3 项风险因子",font=F(17),fill=MUT)
y=214
y=rowcard(d,y,"户名与开户行不符","SWIFT 指向的银行与收款人不一致",RED)
y=rowcard(d,y,"通道选择偏高风险","本地法币通道退回率更低，建议切换",AMBER)
y=rowcard(d,y,"可能缺少发票号","该走廊常因缺单被中间行卡住",AMBER)
d.text((36,y+6),"可能的卡点：Standard Chartered（中转行）",font=F(16),fill=MUT)
cta(d,H-96,"暂缓提交 · 一键生成核实工单",RED)
img.save(f"{OUT}/feat-precheck.png")

# ---------- 2) ai signals ----------
img,d=new(); header(d,"AI 补充风险信号")
badge(d,36,150,"AI 补充 · 仅加警示，不降评分",TEAL)
y=214
y=rowcard(d,y,"语义矛盾","付款金额与合同条款约定不一致",AMBER)
y=rowcard(d,y,"相似历史失败","与 3 笔被退案例高度相似（同走廊）",AMBER)
y=rowcard(d,y,"可能缺失单据","建议补充：形式发票、合规声明",SKY)
rr(d,(36,y,W-36,y+112),18,(240,253,250),outline=(167,243,208),w=1)
d.text((56,y+18),"AI 合规简报",font=F(20,True),fill=GREEN)
d.text((56,y+52),"通俗解释 + 修复步骤，出纳照着补齐即可。",font=F(16),fill=MUT)
cta(d,H-96,"让 AI 起草核实消息",TEAL)
img.save(f"{OUT}/feat-ai.png")

# ---------- 3) dual approval ----------
img,d=new(); header(d,"双人审批队列")
badge(d,36,150,"当前角色：复核人 Checker",TEAL)
y=214
rr(d,(36,y,W-36,y+150),18,CARD,outline=LINE,w=1)
d.text((56,y+18),"LUMEN VIET · 首件试模",font=F(21,True),fill=INK)
d.text((56,y+54),"9,800 USD 结算 → 以 VND 入账",font=F(16),fill=MUT)
badge(d,56,y+86,"高风险 · 需第二签",RED)
y+=166
rr(d,(36,y,W-36,y+120),18,(255,247,237),outline=(253,215,170),w=1)
d.text((56,y+18),"职责分离（SoD）",font=F(20,True),fill=AMBER)
d.text((56,y+52),"Maker 已提交；禁止自我批准，需 Checker 放行。",font=F(16),fill=MUT)
y+=136
d.text((36,y),"批准 = 生成付款指令，交由持牌机构划付。",font=F(16),fill=MUT)
rr(d,(36,H-96,368,H-32),18,(226,232,240))
d.text((116,H-78),"退回出纳",font=F(21,True),fill=INK)
rr(d,(392,H-96,W-36,H-32),18,GREEN)
d.text((444,H-78),"批准并生成指令",font=F(21,True),fill=WHITE)
img.save(f"{OUT}/feat-review.png")

# ---------- 4) milestones ----------
img,d=new(); header(d,"里程碑工作台")
rr(d,(36,148,W-36,196),12,(240,253,250),outline=(167,243,208),w=1)
d.text((52,158),"仅做条件结算管理 · 不托管、不放款 · 由持牌机构结算",font=F(15),fill=(4,120,87))
d.text((36,214),"越南工厂 · 模具外包项目",font=F(22,True),fill=INK)
d.text((36,248),"Lumen Viet · Vietnam　已校验 1/3",font=F(15),fill=MUT)
rr(d,(36,278,W-36,290),6,(226,232,240)); rr(d,(36,278,286,290),6,TEAL)
y=310
def ms(d,y,title,cond,amt,label,lc,lb):
    rr(d,(36,y,W-36,y+126),16,CARD,outline=LINE,w=1)
    d.text((56,y+16),title,font=F(20,True),fill=INK)
    d.text((56,y+50),cond,font=F(15),fill=MUT)
    d.text((56,y+84),amt,font=F(17,True),fill=INK)
    w=d.textlength(label,font=F(14,True))+24
    rr(d,(W-56-w,y+16,W-56,y+44),14,lb)
    d.text((W-56-w+12,y+22),label,font=F(14,True),fill=lc)
    return y+142
y=ms(d,y,"设计定稿","3D 图纸经双方签字确认","4,200 USD","已校验",(5,150,105),(209,250,229))
y=ms(d,y,"首件试模","样品验收通过并上传验收单","9,800 USD","待校验",(180,83,9),(254,243,199))
# reminder card for verified
rr(d,(36,y,W-36,y+120),16,(240,253,250),outline=(153,246,228),w=1)
d.text((56,y+16),"放款提醒 · 条件已校验",font=F(19,True),fill=TEAL)
d.text((56,y+50),"生成付款指令 → 跳转付款流程，由持牌机构划付。",font=F(15),fill=MUT)
cta(d,H-96,"生成付款指令",TEAL)
img.save(f"{OUT}/feat-milestones.png")

print("saved 4 feature shots to", OUT)
