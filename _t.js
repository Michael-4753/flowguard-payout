const PDFDocument=require("pdfkit"),fs=require("fs");
const d=new PDFDocument({size:"A4",margins:{top:56,bottom:90,left:56,right:56},autoFirstPage:false});
d.registerFont("reg","/tmp/NotoSansSC.ttf");
let n=0,guard=false;
d.on("pageAdded",()=>{if(guard)return;guard=true;n++;d.font("reg").fontSize(8).fillColor("#888").text("footer "+n,56,d.page.height-64,{width:d.page.width-112,align:"center",lineBreak:false});d.x=56;d.y=56;guard=false;});
const s=fs.createWriteStream("/tmp/t.pdf");d.pipe(s);
d.addPage();
d.font("reg").fontSize(12).fillColor("#000");
for(let i=0;i<120;i++){d.text("line "+i+" 测试内容中文",{width:480});}
d.end();
s.on("finish",()=>{const b=fs.readFileSync("/tmp/t.pdf");console.log("pageNo",n,"/Count",(b.toString('latin1').match(/\/Count (\d+)/)||[])[1]);});
