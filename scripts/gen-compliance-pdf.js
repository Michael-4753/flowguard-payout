const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const ROOT = "/home/user/flowguard-payout";
const md = fs.readFileSync(path.join(ROOT, "COMPLIANCE_REVIEW.md"), "utf8");
const OUT_DIR = path.join(ROOT, "public");
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT = path.join(OUT_DIR, "FlowGuard-Compliance-Review.pdf");

const REG = "/tmp/NotoSansSC.ttf";
const BOLD = "/tmp/NotoSansSC-Bold.ttf";

const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 56, right: 56 }, bufferPages: true });
doc.registerFont("reg", REG);
doc.registerFont("bold", BOLD);
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const ACCENT = "#0f766e";
const MUTED = "#64748b";
const RULE = "#e2e8f0";

function inline(text) {
  // strip md emphasis/backticks, keep text
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\*(.+?)\*/g, "$1");
}
function hr() {
  doc.moveDown(0.3);
  const y = doc.y;
  doc.strokeColor(RULE).lineWidth(1).moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  doc.moveDown(0.5);
}

const lines = md.split("\n");
let i = 0;
while (i < lines.length) {
  let ln = lines[i];

  // table block
  if (ln.trim().startsWith("|") && lines[i + 1] && /^\s*\|[-\s|:]+\|/.test(lines[i + 1])) {
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i]); i++; }
    const parsed = rows.filter(r => !/^\s*\|[-\s|:]+\|/.test(r)).map(r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => inline(c.trim())));
    const cols = parsed[0].length;
    const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const cw = usable / cols;
    parsed.forEach((cells, ri) => {
      const startY = doc.y;
      let maxH = 0;
      cells.forEach((c, ci) => {
        const h = doc.font(ri === 0 ? "bold" : "reg").fontSize(9).heightOfString(c, { width: cw - 10 });
        if (h > maxH) maxH = h;
      });
      if (startY + maxH + 8 > doc.page.height - doc.page.margins.bottom) { doc.addPage(); }
      const rowY = doc.y;
      if (ri === 0) doc.rect(doc.page.margins.left, rowY - 2, usable, maxH + 6).fill("#f1f5f9");
      cells.forEach((c, ci) => {
        doc.fillColor(ri === 0 ? ACCENT : "#111827").font(ri === 0 ? "bold" : "reg").fontSize(9)
          .text(c, doc.page.margins.left + ci * cw + 5, rowY + 1, { width: cw - 10 });
      });
      doc.y = rowY + maxH + 6;
      doc.strokeColor(RULE).lineWidth(0.5).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    });
    doc.moveDown(0.6);
    continue;
  }

  if (ln.startsWith("# ")) {
    doc.moveDown(0.2).fillColor(ACCENT).font("bold").fontSize(20).text(inline(ln.slice(2)));
    doc.moveDown(0.3);
  } else if (ln.startsWith("## ")) {
    doc.moveDown(0.5).fillColor("#0f172a").font("bold").fontSize(14).text(inline(ln.slice(3)));
    hr();
  } else if (ln.startsWith("### ")) {
    doc.moveDown(0.3).fillColor("#0f172a").font("bold").fontSize(11).text(inline(ln.slice(4)));
    doc.moveDown(0.2);
  } else if (ln.startsWith("> ")) {
    const txt = inline(ln.slice(2));
    const x = doc.page.margins.left;
    const startY = doc.y;
    const w = doc.page.width - doc.page.margins.right - x - 12;
    const h = doc.font("reg").fontSize(9.5).heightOfString(txt, { width: w });
    doc.rect(x, startY - 2, 3, h + 6).fill(ACCENT);
    doc.fillColor("#334155").font("reg").fontSize(9.5).text(txt, x + 12, startY, { width: w });
    doc.moveDown(0.4);
  } else if (/^[-*] /.test(ln.trim())) {
    const txt = inline(ln.trim().slice(2));
    doc.fillColor("#111827").font("reg").fontSize(10);
    doc.text("•  " + txt, doc.page.margins.left + 6, doc.y, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 6 });
    doc.moveDown(0.15);
  } else if (ln.trim() === "---") {
    hr();
  } else if (ln.trim() === "") {
    doc.moveDown(0.35);
  } else if (/^_.*_$/.test(ln.trim())) {
    doc.fillColor(MUTED).font("reg").fontSize(8).text(inline(ln.trim().replace(/^_|_$/g, "")));
    doc.moveDown(0.1);
  } else {
    doc.fillColor("#111827").font("reg").fontSize(10).text(inline(ln), { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
    doc.moveDown(0.15);
  }
  i++;
}

// footer page numbers
const range = doc.bufferedPageRange();
for (let p = 0; p < range.count; p++) {
  doc.switchToPage(p);
  doc.fillColor(MUTED).font("reg").fontSize(8)
    .text(`FlowGuard · Compliance Review · ${p + 1} / ${range.count}`,
      doc.page.margins.left, doc.page.height - 40,
      { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "center" });
}

doc.end();
stream.on("finish", () => console.log("PDF written:", OUT, fs.statSync(OUT).size, "bytes"));
