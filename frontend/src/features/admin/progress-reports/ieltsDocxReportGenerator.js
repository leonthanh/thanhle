import JSZip from "jszip";
import templateUrl from "./assets/star-edu-progress-report-template.docx?url";

const DOCX = (()=>{
const NAVY="153A80", RED="D7242E", LINE="C5D3E8", SOFT="EEF4FB", PALE="F7FAFD", MUTED="5B6B85", INK="1A2433";
const W=10205;
const esc=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function r(text,o={}){
  let p="";
  const F=o.font||"Times New Roman"; p+=`<w:rFonts w:ascii="${F}" w:hAnsi="${F}" w:eastAsia="${F}" w:cs="${F}"/>`;
  if(o.b) p+="<w:b/><w:bCs/>"; if(o.i) p+="<w:i/><w:iCs/>";
  if(o.color) p+=`<w:color w:val="${o.color}"/>`;
  if(o.spc) p+=`<w:spacing w:val="${o.spc}"/>`;
  const sz=(o.sz||19)+(o.font?0:3); p+=`<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
  return `<w:r><w:rPr>${p}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}
function p(runs,o={}){
  let pp="";
  if(o.keepNext) pp+="<w:keepNext/>";
  if(o.border) pp+=`<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="3" w:color="${o.border}"/></w:pBdr>`;
  pp+=`<w:spacing w:before="${o.before??0}" w:after="${o.after??0}" w:line="${o.line??264}" w:lineRule="auto"/>`;
  if(o.ind) pp+=`<w:ind w:left="${o.ind}" w:hanging="${o.hang||0}"/>`;
  if(o.align) pp+=`<w:jc w:val="${o.align}"/>`;
  return `<w:p><w:pPr>${pp}</w:pPr>${Array.isArray(runs)?runs.join(""):runs}</w:p>`;
}
const bd=(c=LINE,sz=4)=>`<w:top w:val="single" w:sz="${sz}" w:space="0" w:color="${c}"/><w:left w:val="single" w:sz="${sz}" w:space="0" w:color="${c}"/><w:bottom w:val="single" w:sz="${sz}" w:space="0" w:color="${c}"/><w:right w:val="single" w:sz="${sz}" w:space="0" w:color="${c}"/>`;
const nob=`<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/>`;
function c(content,w,o={}){
  let pr=`<w:tcW w:w="${w}" w:type="dxa"/>`;
  if(o.span) pr+=`<w:gridSpan w:val="${o.span}"/>`;
  pr+=`<w:tcBorders>${o.borders??bd()}</w:tcBorders>`;
  if(o.fill) pr+=`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`;
  pr+=`<w:tcMar><w:top w:w="${o.padV??70}" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="${o.padV??70}" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar>`;
  pr+=`<w:vAlign w:val="${o.v||"center"}"/>`;
  return `<w:tc><w:tcPr>${pr}</w:tcPr>${content||p("")}</w:tc>`;
}
function tbl(widths,rows,o={}){
  const grid=widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("");
  const sum=widths.reduce((a,b)=>a+b,0);
  if(o.together) rows=rows.map((rw,i)=>i<rows.length-1?{...rw,cells:rw.cells.map(x=>x.replace(/<w:pPr>/g,"<w:pPr><w:keepNext/>"))}:rw);
  return `<w:tbl><w:tblPr><w:tblW w:w="${sum}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows.map(rw=>`<w:tr><w:trPr>${o.split?"":"<w:cantSplit/>"}${rw.header?"<w:tblHeader/>":""}</w:trPr>${rw.cells.join("")}</w:tr>`).join("")}</w:tbl>`;
}
const gap=(after=120)=>p("",{after,line:240});
const heading=(n,text)=>p([r(n+". ",{b:true,color:RED,sz:22}),r(text,{b:true,color:NAVY,sz:22})],{before:220,after:110,border:RED,keepNext:true});
const sub=t=>p(r(t,{b:true,color:NAVY,sz:18}),{before:100,after:50,keepNext:true});
const th=(t,w,align="left")=>c(p(r(t,{b:true,color:"FFFFFF",sz:17}),{align}),w,{fill:NAVY,borders:bd(NAVY)});
const HEAD=/^(Điểm mạnh|Ghi nhận|Cần cải thiện|Gợi ý luyện tập|Gợi ý học từ|Gợi ý làm bài tập về nhà):?$/;
/* Đoạn nhận xét: dòng tiêu đề in đậm, dòng "- " thụt lề */
function lines(text,sz=18){
  return String(text||"").split(/\n+/).map(s=>s.trim()).filter(Boolean).map(l=>{
    if(HEAD.test(l)) return p(r(l,{b:true,color:NAVY,sz}),{before:40,after:20,line:264});
    if(/^[-•]\s*/.test(l)) return p(r("• "+l.replace(/^[-•]\s*/,""),{sz,color:INK}),{ind:240,hang:160,after:20,line:264});
    return p(r(l,{sz,color:INK}),{after:40,line:264});
  }).join("");
}
function textBox(text,placeholder,keep=false){
  const has=String(text||"").trim();
  const inner=has?lines(text,19):p(r(placeholder,{i:true,color:"9AAAC0",sz:18}),{line:276})+p("",{line:276})+p("",{line:276});
  const t=tbl([W],[{cells:[c(inner,W,{fill:PALE,borders:bd(LINE),padV:110,v:"top"})]}]);
  return keep?t.replace(/<w:pPr>/g,"<w:pPr><w:keepNext/>"):t;
}
const TITLES={dauvao:["BÁO CÁO KẾT QUẢ THI ĐẦU VÀO","Chương trình luyện thi IELTS · Placement Test Report"],thang:["BÁO CÁO KẾT QUẢ KIỂM TRA ĐỊNH KỲ","Chương trình luyện thi IELTS"],giua:["BÁO CÁO KẾT QUẢ THI GIỮA KHÓA","Chương trình luyện thi IELTS · Mock Test Report"],cuoi:["BÁO CÁO KẾT QUẢ THI CUỐI KHÓA","Chương trình luyện thi IELTS · Mock Test Report"]};

function build(d){
  const T=TITLES[d.type], I=d.info||{}, INC=d.inc, out=[];
  out.push(p(r(T[0],{b:true,color:NAVY,sz:30,spc:8}),{align:"center",after:40}));
  out.push(p(r(T[1],{i:true,color:MUTED,sz:19}),{align:"center",after:200}));
  const iw=[2050,3050,2050,3055], infoRows=[];
  const ib=`<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="${LINE}"/><w:right w:val="nil"/>`;
  const pairs=d.pairs;
  for(let i=0;i<pairs.length;i+=2){
    const cell=(k,v,j)=>[c(p(r(k,{b:true,color:NAVY,sz:17})),iw[j],{fill:SOFT,borders:ib}),c(p(r(v||"",{sz:19,color:INK})),iw[j+1],{borders:ib})];
    infoRows.push({cells:[...cell(...pairs[i],0),...cell(...(pairs[i+1]||["",""]),2)]});
  }
  out.push(tbl(iw,infoRows)); out.push(gap(40));
  let n=0;
  /* 1. Kết quả tổng quát */
  out.push(heading(++n,"Kết quả tổng quát"));
  const ow=[2205,1600,1600,1600,1600,1600];
  const sk=[["L","Listening"],["R","Reading"],["W","Writing"],["Sp","Speaking"]];
  const val=k=>INC[k]?(d[k].band||"—"):"—";
  out.push(tbl(ow,[
    {header:true,cells:[th("",ow[0]),...sk.map(([k,nm])=>th(nm,1600,"center")),c(p(r("OVERALL",{b:true,color:"FFFFFF",sz:17}),{align:"center"}),1600,{fill:RED,borders:bd(RED)})]},
    {cells:[c(p(r("Band điểm",{b:true,color:NAVY,sz:18})),ow[0],{fill:SOFT}),...sk.map(([k])=>c(p(r(val(k),{b:true,color:NAVY,sz:28}),{align:"center"}),1600)),c(p(r(d.overall||"—",{b:true,color:RED,sz:30}),{align:"center"}),1600,{fill:"FDECEC"})]},
  ],{together:true}));
  out.push(p(r("Band Overall là trung bình 4 kỹ năng, làm tròn theo quy tắc của IELTS (.25 → .5; .75 → điểm nguyên kế tiếp).",{i:true,sz:15,color:MUTED}),{before:40,after:0}));
  /* 2. Listening & Reading */
  if(INC.L||INC.R){
    out.push(heading(++n,INC.L&&INC.R?"Listening & Reading":INC.L?"Listening":"Reading"));
    const lw=[2005,1300,1300,1300,1300,1500,1500];
    const rows=[{header:true,cells:[th("Kỹ năng",lw[0]),th("Phần 1",1300,"center"),th("Phần 2",1300,"center"),th("Phần 3",1300,"center"),th("Phần 4",1300,"center"),th("Số câu đúng",1500,"center"),th("Band",1500,"center")]}];
    [["L","Listening","Part"],["R","Reading","Passage"]].forEach(([k,nm,pn])=>{ if(!INC[k]||!d.detail[k])return; const s=d[k];
      rows.push({cells:[c(p(r(nm,{b:true,color:INK,sz:19}))+p(r(pn+" 1–"+s.max.length,{i:true,color:MUTED,sz:15})),lw[0]),
        ...[0,1,2,3].map(i=>c(p(r(i<s.max.length&&s.mode!=="total"?((s.parts[i]===""?"…":s.parts[i])+"/"+s.max[i]):"—",{sz:18,color:i<s.max.length&&s.mode!=="total"?INK:MUTED}),{align:"center"}),1300)),
        c(p(r(s.total!=null?s.total+"/40":"…/40",{b:true,sz:19,color:NAVY}),{align:"center"}),1500),
        c(p(r(s.band||"",{b:true,sz:22,color:RED}),{align:"center"}),1500,{fill:"FDECEC"})]});});
    if(rows.length>1)out.push(tbl(lw,rows,{together:true}));
    const cw=[2005,8200];
    const crow=[{header:true,cells:[th("Kỹ năng",cw[0]),th("Nhận xét của giáo viên",cw[1])]}];
    [["L","Listening"],["R","Reading"]].forEach(([k,nm])=>{ if(!INC[k])return;
      crow.push({cells:[c(p(r(nm,{b:true,color:INK,sz:19})),cw[0],{v:"top"}),c(String(d[k].comment||"").trim()?lines(d[k].comment):p(r("…",{color:MUTED})),cw[1],{v:"top"})]});});
    if(rows.length>1)out.push(gap(60)); out.push(tbl(cw,crow));
  }
  /* 3. Writing */
  if(INC.W){
    out.push(heading(++n,"Writing"));
    const ww=[4605,2800,2800], w=d.W;
    const rows=[{header:true,cells:[th("Tiêu chí chấm (IDP)",ww[0]),th("Task 1",ww[1],"center"),th("Task 2",ww[2],"center")]}];
    w.rows.forEach(([lab,a,b],i)=>rows.push({cells:[c(p(r(lab,{sz:18,color:INK})),ww[0],{fill:i%2?PALE:"FFFFFF"}),c(p(r(a||"",{b:true,sz:19,color:NAVY}),{align:"center"}),ww[1],{fill:i%2?PALE:"FFFFFF"}),c(p(r(b||"",{b:true,sz:19,color:NAVY}),{align:"center"}),ww[2],{fill:i%2?PALE:"FFFFFF"})]}));
    rows.push({cells:[c(p(r("Band từng bài",{b:true,color:NAVY,sz:18})),ww[0],{fill:SOFT}),c(p(r(w.t1||"",{b:true,sz:21,color:NAVY}),{align:"center"}),ww[1],{fill:SOFT}),c(p(r(w.t2||"",{b:true,sz:21,color:NAVY}),{align:"center"}),ww[2],{fill:SOFT})]});
    rows.push({cells:[c(p([r("Band Writing",{b:true,color:RED,sz:19}),r("  (Task 2 tính hệ số 2)",{i:true,color:MUTED,sz:15})]),ww[0],{fill:"FDECEC"}),c(p(r(w.band||"",{b:true,sz:24,color:RED}),{align:"center"}),ww[1]+ww[2],{span:2,fill:"FDECEC"})]});
    if(d.detail.W)out.push(tbl(ww,rows,{together:true}));
    out.push(sub("Nhận xét của giáo viên")); out.push(textBox(w.comment,"Nhận xét bài viết…"));
  }
  /* 4. Speaking */
  if(INC.Sp){
    out.push(heading(++n,"Speaking"));
    const sw=[6205,4000], s=d.Sp;
    const rows=[{header:true,cells:[th("Tiêu chí chấm (IDP)",sw[0]),th("Band",sw[1],"center")]}];
    s.rows.forEach(([lab,v],i)=>rows.push({cells:[c(p(r(lab,{sz:18,color:INK})),sw[0],{fill:i%2?PALE:"FFFFFF"}),c(p(r(v||"",{b:true,sz:19,color:NAVY}),{align:"center"}),sw[1],{fill:i%2?PALE:"FFFFFF"})]}));
    rows.push({cells:[c(p(r("Band Speaking",{b:true,color:RED,sz:19})),sw[0],{fill:"FDECEC"}),c(p(r(s.band||"",{b:true,sz:24,color:RED}),{align:"center"}),sw[1],{fill:"FDECEC"})]});
    if(d.detail.Sp)out.push(tbl(sw,rows,{together:true}));
    out.push(sub("Nhận xét của giáo viên")); out.push(textBox(s.comment,"Nhận xét phần thi nói…"));
  }
  const assessments=(d.assessments||[]).filter(a=>[a.score,a.comment].some(v=>String(v||"").trim()));
  if(assessments.length){
    out.push(heading(++n,"Từ vựng và bài tập về nhà"));
    assessments.forEach(a=>{
      out.push(sub(`${a.name||a.label}${a.score?` · ${a.score}`:""}`));
      if(String(a.comment||"").trim())out.push(textBox(a.comment,""));
    });
  }
  /* Chuyên cần */
  if(INC.att&&d.type!=="dauvao"){
    const A=d.att||{};
    out.push(heading(++n,d.type==="thang"?"Tình hình chuyên cần":d.type==="giua"?"Tình hình chuyên cần (tính đến giữa khóa)":"Tình hình chuyên cần (cả khóa học)"));
    const aw=[5000,1700,3505];
    const arows=[{header:true,cells:[th("Hạng mục chuyên cần",aw[0]),th("Số buổi / lần",aw[1],"center"),th("Ghi chú",aw[2])]}];
    [[d.type==="thang"?"Tổng số buổi học trong tháng":d.type==="giua"?"Tổng số buổi học đến giữa khóa":"Tổng số buổi học của cả khóa","tong"],["Số buổi học viên tham dự","thamdu"],["Vắng có phép","cophep"],["Vắng không phép","khongphep"],["Số lần đi trễ","tre"]]
     .forEach(([k,key],i)=>{const f=i%2?PALE:"FFFFFF";arows.push({cells:[c(p(r(k,{sz:19,color:INK})),aw[0],{fill:f}),c(p(r(A[key]??"",{b:true,sz:19,color:NAVY}),{align:"center"}),aw[1],{fill:f}),c(p(""),aw[2],{fill:f})]});});
    out.push(tbl(aw,arows,{together:true}));
  }
  /* Mức độ tham gia */
  if(INC.part&&d.type!=="dauvao"){
    out.push(heading(++n,"Đánh giá mức độ tham gia học tập"));
    const pw=[4555,520,520,520,520,520,3050];
    const prows=[{header:true,cells:[th("Tiêu chí đánh giá",pw[0]),...[1,2,3,4,5].map((k,j)=>th(String(k),pw[j+1],"center")),th("Ghi chú",pw[6])]}];
    d.partCrit.forEach((t,i)=>{const f=i%2?PALE:"FFFFFF",v=(d.part||[])[i]||0;
      prows.push({cells:[c(p(r(t,{sz:18,color:INK})),pw[0],{fill:f}),...[1,2,3,4,5].map((k,j)=>c(p(r(v===k?"☒":"☐",{font:"MS Gothic",sz:20,color:v===k?NAVY:"8A9AB0"}),{align:"center"}),pw[j+1],{fill:f})),c(p(r(((d.partNotes||[])[i])||"",{sz:17,color:INK})),pw[6],{fill:f})]});});
    prows.push({cells:[c(p([r("Mức đánh giá: ",{b:true,sz:16,color:MUTED}),r("1 = Chưa đạt · 2 = Cần cải thiện · 3 = Đạt · 4 = Khá · 5 = Xuất sắc",{i:true,sz:16,color:MUTED})]),W,{span:7,fill:SOFT})]});
    out.push(tbl(pw,prows,{together:true}));
  }
  const X=d.texts||{};
  out.push(heading(++n,"Nhận xét chung và lời nhắn của giáo viên"));
  const blocks=[["Điểm mạnh nổi bật",X.uudiem],["Điểm cần cải thiện",X.hanche],[d.planTitle,X.kehoach],[d.type==="dauvao"?"Nhận xét & tư vấn":"Lời nhắn đến học viên / phụ huynh",X.loinhan]].filter(x=>String(x[1]||"").trim());
  const inner=blocks.length?blocks.map(([t,v],i)=>p(r(t+":",{b:true,color:NAVY,sz:19}),{before:i?120:0,after:30,keepNext:true})+lines(v,19)).join(""):p(r("Nhận xét chung và lời nhắn của giáo viên…",{i:true,color:"9AAAC0",sz:18}),{line:276})+p("",{line:276})+p("",{line:276});
  out.push(tbl([W],[{cells:[c(inner,W,{fill:PALE,borders:bd(LINE),padV:120,v:"top"})]}],{split:true}));
  out.push(p("",{after:80,line:240,keepNext:true}));
  const gw=[5100,5105];
  const left=p(r("Xác nhận của phụ huynh / học viên",{b:true,color:NAVY,sz:19}),{align:"center"})+p(r("(Ký và ghi rõ họ tên)",{i:true,color:MUTED,sz:16}),{align:"center"});
  const right=p(r(I.ngaylap?`Ngày lập báo cáo: ${I.ngaylap}`:"Ngày lập báo cáo: ……/……/………",{i:true,color:MUTED,sz:17}),{align:"center",after:40})+p(r("Giáo viên phụ trách",{b:true,color:NAVY,sz:19}),{align:"center"})+p(r("(Ký và ghi rõ họ tên)",{i:true,color:MUTED,sz:16}),{align:"center"})+p("",{line:240})+p("",{line:240})+p(r(I.gv||"",{b:true,sz:19,color:INK}),{align:"center"});
  out.push(tbl(gw,[{cells:[c(left,gw[0],{borders:nob,v:"top"}),c(right,gw[1],{borders:nob,v:"top"})]}]));
  return out.join("");
}
async function make(JSZip, templateBytes, data, type="blob"){
  const zip=await JSZip.loadAsync(templateBytes);
  let docXml=await zip.file("word/document.xml").async("string");
  docXml=docXml.replace(/<w:body>[\s\S]*?(<w:sectPr)/, `<w:body>${build(data)}$1`);
  zip.file("word/document.xml",docXml);
  const sty=zip.file("word/styles.xml");
  if(sty){let x=await sty.async("string");x=x.replace(/w:(ascii|hAnsi|cs|eastAsia)="Verdana"/g,'w:$1="Times New Roman"').replace(/w:asciiTheme="[^"]*"|w:hAnsiTheme="[^"]*"|w:eastAsiaTheme="[^"]*"|w:cstheme="[^"]*"/g,"");zip.file("word/styles.xml",x.replace(/<w:rFonts\s+\/>/g,'<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>'));}
  let ct=await zip.file("[Content_Types].xml").async("string");
  zip.file("[Content_Types].xml",ct.replace("wordprocessingml.template.main+xml","wordprocessingml.document.main+xml"));
  const core=zip.file("docProps/core.xml");
  if(core){let x=await core.async("string");
    const title=esc(TITLES[data.type][0].toLowerCase().replace(/^./,m=>m.toUpperCase())+(data.student?" – "+data.student:""));
    x=/<dc:title>/.test(x)?x.replace(/<dc:title>[\s\S]*?<\/dc:title>/,`<dc:title>${title}</dc:title>`):x.replace("</cp:coreProperties>",`<dc:title>${title}</dc:title></cp:coreProperties>`);
    zip.file("docProps/core.xml",x);}
  return zip.generateAsync({type,mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",compression:"DEFLATE"});
}
return {build,make,TITLES};
})();

export async function generateIeltsReport(data) {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Could not load Word template (HTTP ${response.status}).`);
  }
  const templateBytes = new Uint8Array(await response.arrayBuffer());
  return DOCX.make(JSZip, templateBytes, data);
}
