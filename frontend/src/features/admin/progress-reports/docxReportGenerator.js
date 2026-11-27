import JSZip from "jszip";
import templateUrl from "./assets/star-edu-progress-report-template.docx?url";

const DOCX = (()=>{
const NAVY="153A80", RED="D7242E", LINE="C5D3E8", SOFT="EEF4FB", PALE="F7FAFD", MUTED="5B6B85", INK="1A2433";
const W=10205; // text width in dxa (A4, margins 851)
const esc=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function r(text,o={}){
  let p="";
  const F=o.font||"Times New Roman"; p+=`<w:rFonts w:ascii="${F}" w:hAnsi="${F}" w:eastAsia="${F}" w:cs="${F}"/>`;
  if(o.b) p+="<w:b/><w:bCs/>"; if(o.i) p+="<w:i/><w:iCs/>";
  if(o.caps) p+="<w:caps/>";
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
  if(o.ind) pp+=`<w:ind w:left="${o.ind}"/>`;
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
  return `<w:tbl><w:tblPr><w:tblW w:w="${sum}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows.map(rw=>`<w:tr><w:trPr><w:cantSplit/>${rw.h?`<w:trHeight w:val="${rw.h}"/>`:""}${rw.header?"<w:tblHeader/>":""}</w:trPr>${rw.cells.join("")}</w:tr>`).join("")}</w:tbl>`;
}
const gap=(after=120)=>p("",{after,line:240});
function heading(n,text){
  return p([r(n+". ",{b:true,color:RED,sz:22}),r(text,{b:true,color:NAVY,sz:22})],{before:220,after:110,border:RED,keepNext:true});
}
const th=(t,w,align="left")=>c(p(r(t,{b:true,color:"FFFFFF",sz:18}),{align}),w,{fill:NAVY,borders:bd(NAVY)});
function textBox(text,placeholder,minLines=3,keep=false){
  const lines=String(text||"").split(/\n+/).map(s=>s.trim()).filter(Boolean);
  let inner;
  if(lines.length) inner=lines.map((l,i)=>p(r(l,{sz:19,color:INK}),{after:i<lines.length-1?80:0,line:276})).join("");
  else inner=p(r(placeholder,{i:true,color:"9AAAC0",sz:18}),{line:276})+Array.from({length:minLines-1},()=>p("",{line:276})).join("");
  const t=tbl([W],[{cells:[c(inner,W,{fill:PALE,borders:bd(LINE),padV:110,v:"top"})]}]);
  return keep?t.replace(/<w:pPr>/g,"<w:pPr><w:keepNext/>"):t;
}

function multiBox(parts,placeholder){
  const seg=parts.filter(([h,t])=>String(t||"").trim());
  if(!seg.length) return textBox("",placeholder,3,true);
  const inner=seg.map(([h,t],k)=>{const ls=String(t).split(/\n+/).map(x=>x.trim()).filter(Boolean);
    return (h?p(r(h,{b:true,color:NAVY,sz:19}),{before:k?140:0,after:50,keepNext:true}):"")+ls.map((l,i)=>p(r(l,{sz:19,color:INK}),{after:i<ls.length-1?80:0,line:276})).join("");}).join("");
  return tbl([W],[{cells:[c(inner,W,{fill:PALE,borders:bd(LINE),padV:110,v:"top"})]}]);
}
const MSG_T="Lời nhắn đến học viên và phụ huynh";
const planT=t=>t==="giua"?"Kế hoạch học tập để khắc phục hạn chế (nửa khóa còn lại)":"Kế hoạch học tập & định hướng cho khóa tiếp theo";
function build(d){
  const T={thang:["BÁO CÁO TÌNH HÌNH HỌC TẬP","Cập nhật hàng tháng"],giua:["BÁO CÁO GIỮA KHÓA","Đánh giá định kỳ — giữa khóa học"],cuoi:["BÁO CÁO CUỐI KHÓA","Đánh giá tổng kết — kết thúc khóa học"]}[d.type];
  const I=d.info||{}, out=[];
  out.push(p(r(T[0],{b:true,color:NAVY,sz:32,spc:10}),{align:"center",after:40}));
  out.push(p(r(T[1],{i:true,color:MUTED,sz:19}),{align:"center",after:220}));
  // info table
  const pairs={
    thang:[["Họ và tên học viên",d.student],["Lớp học",I.lop],["Chương trình",I.prog],["Tháng / Năm",I.thang],["Giáo viên phụ trách",I.gv]],
    giua:[["Họ và tên học viên",d.student],["Lớp học",I.lop],["Chương trình",I.prog],["Giáo viên phụ trách",I.gv],["Ngày kiểm tra",I.ngaykt],["Tuần học / Giai đoạn",I.giaidoan]],
    cuoi:[["Họ và tên học viên",d.student],["Lớp học",I.lop],["Chương trình",I.prog],["Giáo viên phụ trách",I.gv],["Ngày kiểm tra cuối khóa",I.ngaykt],["Khóa học tiếp theo",I.capdo]]
  }[d.type];
  const iw=[2050,3050,2050,3055], infoRows=[];
  const ib=`<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="${LINE}"/><w:right w:val="nil"/>`;
  for(let i=0;i<pairs.length;i+=2){
    const cell=(k,v,j)=>[c(p(r(k,{b:true,color:NAVY,sz:17})),iw[j],{fill:SOFT,borders:ib}),c(p(r(v||"",{sz:19,color:INK})),iw[j+1],{borders:ib})];
    infoRows.push({cells:[...cell(...pairs[i],0),...cell(...(pairs[i+1]||["",""]),2)]});
  }
  out.push(tbl(iw,infoRows)); out.push(gap(60));
  let n=0;
  // skills
  const INC=d.inc||{skills:true,att:true,part:true};
  if(INC.skills){
    out.push(heading(++n,"Kết quả kiểm tra các kỹ năng"));
    const sw=[1800,1400,7005];
    const rows=[{header:true,cells:[th("Kỹ năng",sw[0]),th(d.scoreLabel||"Điểm",sw[1],"center"),th("Nhận xét của giáo viên",sw[2])]}];
    d.skills.forEach((s,i)=>{
      const f=i%2?PALE:"FFFFFF";
      const com=String(s.comment||"").split(/\n+/).filter(Boolean);
      rows.push({cells:[
        c(p(r(s.name,{b:true,color:INK,sz:20}))+p(r(s.en,{i:true,color:MUTED,sz:16})),sw[0],{fill:f}),
        c(p(r(s.score||"",{b:true,sz:21,color:NAVY}),{align:"center"}),sw[1],{fill:f}),
        c(com.length?com.map(t=>p(r(t,{sz:18,color:INK}),{line:264})).join(""):p(""),sw[2],{fill:f,v:"top"})]});
    });
    rows.push({cells:[c(p(r("Tổng điểm",{b:true,color:NAVY,sz:19})),sw[0],{fill:SOFT}),c(p(r(d.total?d.total+"/100":"",{b:true,sz:21,color:RED}),{align:"center"}),sw[1],{fill:SOFT}),c(p(r("Cộng điểm các kỹ năng (thang 100)",{i:true,sz:17,color:MUTED})),sw[2],{fill:SOFT})]});
    out.push(tbl(sw,rows));
  }
  (d.assessments||[]).forEach(a=>{
    const score=String(a.score||"").trim();
    const comment=String(a.comment||"").trim();
    if(!score&&!comment)return;
    out.push(heading(++n,a.name));
    const assessmentWidths=[2500,7705];
    const assessmentRows=[{header:true,cells:[th("Hạng mục",assessmentWidths[0]),th("Nội dung",assessmentWidths[1])]}];
    if(score)assessmentRows.push({cells:[
      c(p(r("Điểm",{b:true,color:NAVY,sz:19})),assessmentWidths[0],{fill:SOFT}),
      c(p(r(score,{b:true,color:NAVY,sz:21}),{align:"center"}),assessmentWidths[1],{fill:SOFT})
    ]});
    if(comment){
      const content=comment.split(/\n+/).filter(Boolean).map(line=>p(r(line,{sz:18,color:INK}),{line:264})).join("");
      assessmentRows.push({cells:[
        c(p(r("Nhận xét",{b:true,color:NAVY,sz:18})),assessmentWidths[0],{fill:"FFFFFF"}),
        c(content,assessmentWidths[1],{fill:"FFFFFF",v:"top"})
      ]});
    }
    out.push(tbl(assessmentWidths,assessmentRows));
  });
  // attendance
  if(INC.att){
  const A=d.att||{};
  out.push(heading(++n,d.type==="thang"?"Tình hình chuyên cần":d.type==="giua"?"Tình hình chuyên cần (tính đến giữa khóa)":"Tình hình chuyên cần (cả khóa học)"));
  const aw=[5000,1700,3505];
  const arows=[{header:true,cells:[th("Hạng mục chuyên cần",aw[0]),th("Số buổi / lần",aw[1],"center"),th("Ghi chú",aw[2])]}];
  [[d.type==="thang"?"Tổng số buổi học trong tháng":d.type==="giua"?"Tổng số buổi học đến giữa khóa":"Tổng số buổi học của cả khóa","tong"],["Số buổi học viên tham dự","thamdu"],["Vắng có phép","cophep"],["Vắng không phép","khongphep"],["Số lần đi trễ","tre"]]
   .forEach(([k,key],i)=>{const f=i%2?PALE:"FFFFFF";arows.push({cells:[c(p(r(k,{sz:19,color:INK})),aw[0],{fill:f}),c(p(r(A[key]??"",{b:true,sz:19,color:NAVY}),{align:"center"}),aw[1],{fill:f}),c(p(r((A.notes||{})[key]||"",{sz:18,color:INK})),aw[2],{fill:f})]});});
  out.push(tbl(aw,arows,{together:true}));
  }
  // participation
  if(INC.part){
  out.push(heading(++n,"Đánh giá mức độ tham gia học tập"));
  const crit=["Tích cực phát biểu, đặt câu hỏi trong giờ học","Hoàn thành bài tập về nhà đúng hạn","Hợp tác tốt trong hoạt động nhóm / cặp đôi","Thái độ học tập nghiêm túc, tập trung","Sử dụng tiếng Anh chủ động trong giờ học"];
  const pw=[4555,520,520,520,520,520,3050];
  const prows=[{header:true,cells:[th("Tiêu chí đánh giá",pw[0]),...[1,2,3,4,5].map((k,j)=>th(String(k),pw[j+1],"center")),th("Ghi chú",pw[6])]}];
  crit.forEach((t,i)=>{const f=i%2?PALE:"FFFFFF",v=(d.part||[])[i]||0;
    prows.push({cells:[c(p(r(t,{sz:18,color:INK})),pw[0],{fill:f}),...[1,2,3,4,5].map((k,j)=>c(p(r(v===k?"☒":"☐",{font:"MS Gothic",sz:20,color:v===k?NAVY:"8A9AB0"}),{align:"center"}),pw[j+1],{fill:f})),c(p(r(((d.partNotes||[])[i])||"",{sz:17,color:INK})),pw[6],{fill:f})]});});
  prows.push({cells:[c(p([r("Mức đánh giá: ",{b:true,sz:16,color:MUTED}),r("1 = Chưa đạt · 2 = Cần cải thiện · 3 = Đạt · 4 = Khá · 5 = Xuất sắc",{i:true,sz:16,color:MUTED})]),W,{span:7,fill:SOFT})]});
  out.push(tbl(pw,prows,{together:true}));
  }
  const X=d.texts||{};
  if(d.type==="thang"){
    out.push(heading(++n,"Ưu điểm trong tháng")); out.push(textBox(X.uudiem,"Ghi nhận những tiến bộ và điểm nổi bật của học viên trong tháng…"));
    out.push(heading(++n,"Hạn chế cần khắc phục")); out.push(textBox(X.hanche,"Nêu rõ những điểm học viên còn yếu hoặc cần chú ý thêm…"));
    out.push(heading(++n,MSG_T)); out.push(textBox(X.loinhan,"Nhắn nhủ riêng của giáo viên…",3,true));
  } else {
    out.push(heading(++n,"Ưu điểm nổi bật")); out.push(textBox(X.uudiem,"Ghi nhận những tiến bộ và kỹ năng học viên thể hiện tốt…"));
    out.push(heading(++n,"Hạn chế cần cải thiện")); out.push(textBox(X.hanche,"Nêu cụ thể những điểm yếu qua bài kiểm tra…"));
    out.push(heading(++n,MSG_T)); out.push(multiBox([[planT(d.type),X.kehoach],["Lời nhắn & nhắc nhở",X.loinhan]],"Kế hoạch học tập và lời nhắn riêng của giáo viên…"));
  }
  // signature
  out.push(p("",{after:80,line:240,keepNext:true}));
  const gw=[5100,5105];
  const left=p(r("Xác nhận của phụ huynh",{b:true,color:NAVY,sz:19}),{align:"center"})+p(r("(Ký và ghi rõ họ tên)",{i:true,color:MUTED,sz:16}),{align:"center"});
  const right=p(r(I.ngaylap?`Ngày lập báo cáo: ${I.ngaylap}`:"Ngày lập báo cáo: ……/……/………",{i:true,color:MUTED,sz:17}),{align:"center",after:40})+p(r("Giáo viên phụ trách",{b:true,color:NAVY,sz:19}),{align:"center"})+p(r("(Ký và ghi rõ họ tên)",{i:true,color:MUTED,sz:16}),{align:"center"})+p("",{line:240})+p("",{line:240})+p(r(I.gv||"",{b:true,sz:19,color:INK}),{align:"center"});
  out.push(tbl(gw,[{cells:[c(left,gw[0],{borders:nob,v:"top"}),c(right,gw[1],{borders:nob,v:"top"})]}]));
  return out.join("");
}

async function make(JSZip, templateBytes, data, type="blob"){
  const zip=await JSZip.loadAsync(templateBytes);
  let docXml=await zip.file("word/document.xml").async("string");
  const body=build(data);
  docXml=docXml.replace(/<w:body>[\s\S]*?(<w:sectPr)/, `<w:body>${body}$1`);
  zip.file("word/document.xml",docXml);
  const sty=zip.file("word/styles.xml");
  if(sty){let x=await sty.async("string");x=x.replace(/w:(ascii|hAnsi|cs|eastAsia)="Verdana"/g,'w:$1="Times New Roman"').replace(/w:asciiTheme="[^"]*"|w:hAnsiTheme="[^"]*"|w:eastAsiaTheme="[^"]*"|w:cstheme="[^"]*"/g,"");zip.file("word/styles.xml",x.replace(/<w:rFonts\s+\/>/g,'<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>'));}
  let ct=await zip.file("[Content_Types].xml").async("string");
  zip.file("[Content_Types].xml",ct.replace("wordprocessingml.template.main+xml","wordprocessingml.document.main+xml"));
  const core=zip.file("docProps/core.xml");
  if(core){let x=await core.async("string");
    const title=esc(({thang:"Báo cáo tình hình học tập",giua:"Báo cáo giữa khóa",cuoi:"Báo cáo cuối khóa"}[data.type])+(data.student?" – "+data.student:""));
    x=/<dc:title>/.test(x)?x.replace(/<dc:title>[\s\S]*?<\/dc:title>/,`<dc:title>${title}</dc:title>`):x.replace("</cp:coreProperties>",`<dc:title>${title}</dc:title></cp:coreProperties>`);
    zip.file("docProps/core.xml",x);}
  return zip.generateAsync({type,mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",compression:"DEFLATE"});
}
return {build,make,MSG_T,planT};
})();
export async function generateProgressReport(data) {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Could not load Word template (HTTP ${response.status}).`);
  }
  const templateBytes = new Uint8Array(await response.arrayBuffer());
  return DOCX.make(JSZip, templateBytes, data);
}