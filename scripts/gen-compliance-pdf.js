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

const M = 56;              // page margin
const FOOTER_H = 34;       // reserved footer band
const doc = new PDFDocument({ size: "A4", margins: { top: M, bottom: M + FOOTER_H, left: M, right: M }, bufferPages: true, autoFirstPage: true });
doc.registerFont("reg", REG);
doc.registerFont("bold", BOLD);
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const ACCENT = "#0f766e";
const MUTED = "#64748b";
const RULE = "#e2e8f0";
const CONTENT_W = () => doc.page.width - M * 2;
const BOTTOM = () => doc.page.height - M - FOOTER_H;

function inline(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\*(.+?)\*/g, "$1");
}
// ensure `need` vertical px available; else new page. Never rely on pdfkit auto-page.
function ensure(need) {
  if (doc.y + need > BOTTOM()) doc.addPage();
}
function para(txt, opts) {
  const o = Object.assign({ font: "reg", size: 10, color: "#111827", width: CONTENT_W(), indent: 0, gap: 3 }, opts);
  doc.font(o.font).fontSize(o.size);
  const w = o.width - o.indent;
  const h = doc.heightOfString(txt, { width: w });
  ensure(h);
  doc.fillColor(o.color).text(txt, M + o.indent, doc.y, { width: w });
  doc.y += o.gap;
}
function rule(gapTop = 4, gapBot = 8) {
  doc.y += gapTop;
  ensure(2);
  doc.strokeColor(RULE).lineWidth(1).moveTo(M, doc.y).lineTo(doc.page.width - M, doc.y).stroke();
  doc.y += gapBot;
}

function drawTable(parsed) {
  const cols = parsed[0].length;
  const usable = CONTENT_W();
  // give first column a bit more room when 2 cols
  const cw = new Array(cols).fill(usable / cols);
  const pad = 6;

  function rowHeight(cells, font) {
    let mh = 0;
    cells.forEach((c, ci) => {
      const h = doc.font(font).fontSize(9).heightOfString(c, { width: cw[ci] - pad * 2 });
      if (h > mh) mh = h;
    });
    return mh + pad * 1.5;
  }
  function drawRow(cells, isHead) {
    const font = isHead ? "bold" : "reg";
    const rh = rowHeight(cells, font);
    ensure(rh);
    const y0 = doc.y;
    if (isHead) doc.rect(M, y0, usable, rh).fill("#f1f5f9");
    let x = M;
    cells.forEach((c, ci) => {
      doc.fillColor(isHead ? ACCENT : "#111827").font(font).fontSize(9)
        .text(c, x + pad, y0 + pad * 0.75, { width: cw[ci] - pad * 2 });
      x += cw[ci];
    });
    doc.y = y0 + rh;
    doc.strokeColor(RULE).lineWidth(0.5).moveTo(M, doc.y).lineTo(doc.page.width - M, doc.y).stroke();
  }

  const header = parsed[0];
  drawRow(header, true);
  for (let r = 1; r < parsed.length; r++) {
    // if next row won't fit, page break then redraw header
    const rh = rowHeight(parsed[r], "reg");
    if (doc.y + rh > BOTTOM()) { doc.addPage(); drawRow(header, true); }
    drawRow(parsed[r], false);
  }
  doc.y += 8;
}

const lines = md.split("\n");
let i = 0;
while (i < lines.length) {
  const ln = lines[i];

  // table
  if (ln.trim().startsWith("|") && lines[i + 1] && /^\s*\|[-\s|:]+\|/.test(lines[i + 1])) {
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i]); i++; }
    const parsed = rows.filter(r => !/^\s*\|[-\s|:]+\|/.test(r))
      .map(r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => inline(c.trim())));
    if (parsed.length) drawTable(parsed);
    continue;
  }

  if (ln.startsWith("# ")) {
    ensure(30);
    doc.fillColor(ACCENT).font("bold").fontSize(20).text(inline(ln.slice(2)), M, doc.y, { width: CONTENT_W() });
    doc.y += 6;
  } else if (ln.startsWith("## ")) {
    doc.y += 6; ensure(22);
    doc.fillColor("#0f172a").font("bold").fontSize(14).text(inline(ln.slice(3)), M, doc.y, { width: CONTENT_W() });
    rule();
  } else if (ln.startsWith("### ")) {
    doc.y += 4; ensure(18);
    doc.fillColor("#0f172a").font("bold").fontSize(11).text(inline(ln.slice(4)), M, doc.y, { width: CONTENT_W() });
    doc.y += 3;
  } else if (ln.startsWith("> ")) {
    const txt = inline(ln.slice(2));
    const w = CONTENT_W() - 14;
    doc.font("reg").fontSize(9.5);
    const h = doc.heightOfString(txt, { width: w });
    ensure(h + 6);
    const y0 = doc.y;
    doc.rect(M, y0, 3, h).fill(ACCENT);
    doc.fillColor("#334155").font("reg").fontSize(9.5).text(txt, M + 14, y0, { width: w });
    doc.y = y0 + h + 5;
  } else if (/^[-*] /.test(ln.trim())) {
    para("•  " + inline(ln.trim().slice(2)), { indent: 8, gap: 2 });
  } else if (ln.trim() === "---") {
    rule();
  } else if (ln.trim() === "") {
    doc.y += 5;
  } else if (/^_.*_$/.test(ln.trim())) {
    para(inline(ln.trim().replace(/^_|_$/g, "")), { size: 8, color: MUTED, gap: 1 });
  } else {
    para(inline(ln), { gap: 3 });
  }
  i++;
}

doc.end();
stream.on("finish", () => console.log("PDF written:", OUT, fs.statSync(OUT).size, "bytes", "| pages:", pageNo));
