/* Lazy service: A4/thermal bill HTML, PDF rendering and download. Loaded on first export. */
function buildPdfHtml(){
  const items = sortedAsc(billEntries()); unit = monthUnit(items);
  const nf = new Intl.NumberFormat("en-IN",{maximumFractionDigits:2});
  const rs = n => "₹" + nf.format(n);
  const rs2 = n => "₹" + new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const esc2 = v => String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const n = items.length;
  const total = items.reduce((s,e)=>s+lineTotal(e),0);
  const litres = litSum(items);
  const days = new Set(items.map(e=>fmtDateInput(e.date))).size;
  const plain = items.every(isMilkL), otherAmt = total - milkTotal(items);
  const same = plain && n>0 && items.every(e=>Number(e.quantity)===Number(items[0].quantity) && Number(e.amount)===Number(items[0].amount));
  const q = n ? Number(items[0].quantity)||0 : 0, a = n ? Number(items[0].amount)||0 : 0;
  const rate = same ? a : (litres ? milkTotal(items)/litres : 0);
  const dayLbl = e => { const d = new Date(e.date); return String(d.getDate()).padStart(2,"0") + " " + monthLong(d.getFullYear(), d.getMonth()+1); };
  const longDay = dayLbl;
  const yr = e => new Date(e.date).getFullYear();
  const range = n ? `${longDay(items[0])}${yr(items[0])!==yr(items[n-1]) ? " "+yr(items[0]) : ""} – ${longDay(items[n-1])} ${yr(items[n-1])}` : `${monthLong(year,month)} ${year}`;
  const pc0 = billCust(); const isDayPaid = e => !!(pc0 && dayPaid(pc0, fmtDateInput(e.date)));
  const dense = n>16;   // long months: two side-by-side columns so 31 days fit one A4 page
  const rowFn = e=>`<tr class="${isDayPaid(e)?"pd":""}"><td><span class="mo">${dayLbl(e)}</span>${plain && lang!=="hi" ? "" : ` <b class="itm">${itemName(e)}</b>`}${e.note && (plain || guessItem(e.note)==="milk" || e.item) ? ` <span class="note">${esc2(e.note)}</span>` : ""}${isDayPaid(e) ? ` <span class="ptag">${t("prPaidTag")}</span>` : ""}</td><td>${nf.format(Number(e.quantity)||0)}${plain ? "" : " " + unitWord(e,lang==="hi")}</td>${dense?"":`<td>${rs(Number(e.amount)||0)}</td>`}<td>${rs(lineTotal(e))}</td></tr>`;
  const headRow = `<tr><th>${t("dateLabel")}</th><th>${plain ? t("litres") : t("prQty")}</th>${dense?"":`<th>${t("prRateCol")}</th>`}<th>${t("prAmount")}</th></tr>`;
  const half = Math.ceil(n/2);
  const tbl = list => `<table><thead>${headRow}</thead><tbody>${list.map(rowFn).join("")}</tbody></table>`;
  const tableHtml = !n ? `<table><thead>${headRow}</thead><tbody><tr><td colspan="4">${t("noDeliveries")}</td></tr></tbody></table>`
    : dense ? `<div class="twocol">${tbl(items.slice(0,half))}${tbl(items.slice(half))}</div><div class="totrow"><span>${plain ? t("prTotalMilk") : t("repTotal")}</span><span>${plain ? nf.format(litres)+" "+UL() : ""}</span><b>${rs(total)}</b></div>`
    : `<table><thead>${headRow}</thead><tbody>${items.map(rowFn).join("")}</tbody><tfoot><tr><td>${plain ? t("prTotalMilk") : t("repTotal")}</td><td>${plain ? nf.format(litres) : ""}</td><td></td><td>${rs(total)}</td></tr></tfoot></table>`;
  const paidAmt = items.filter(isDayPaid).reduce((s,e)=>s+lineTotal(e),0);
  const balance = Math.max(0, total - paidAmt);
  const billDate = (()=>{ const d = new Date(); return String(d.getDate()).padStart(2,"0") + " " + monthLong(d.getFullYear(), d.getMonth()+1) + " " + d.getFullYear(); })();
  const calc = [[t("prDays"), String(n===days ? days : n)]];
  if(same){
    calc.push([t("prTotalMilk"), `${n} × ${nf.format(q)} = ${nf.format(litres)} ${UL()}`]);
    calc.push([t("prDailyCost"), `${nf.format(q)} × ${rs(a)} = ${rs(q*a)}`]);
    calc.push([(focusDate ? t("repTotal") : t("prMonthlyCost")), `${n} × ${rs(q*a)} = ${rs(total)}`]);
  } else {
    calc.push([t("prTotalMilk"), `${nf.format(litres)} ${UL()}`]);
    if(!plain && otherAmt>0) calc.push([t("prOther"), rs(otherAmt)]);
    calc.push([(focusDate ? t("repTotal") : t("prMonthlyCost")), rs(total)]);
  }
  if(paidAmt>0){ calc.push([t("prLessPaid"), "− " + rs(paidAmt)]); }
  const calcHtml = calc.map(([k,v])=>`<div class="k">${k}</div><div class="v">${v}</div>`).join("");
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8">
<title>${t("prTitle")} — ${focusDate ? focusDate : monthLong(year,month)+" "+year}</title>
<link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{font-family:"Mukta","Noto Sans Devanagari",-apple-system,Roboto,"Segoe UI",Arial,sans-serif;color:#10281B;padding:0;max-width:720px;margin:0 auto;line-height:1.45;font-size:15px}
  .band{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;background:#EEF6F0;color:#117D44;border-radius:0 0 18px 18px}
  .brand{display:flex;align-items:center;gap:12px}
  .brand img{border-radius:10px;background:#fff;padding:3px}
  .brand b{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-size:1.25rem;font-weight:700;letter-spacing:-.01em}
  .doc{text-align:right}
  .doc .t{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-size:1.5rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
  .doc .m{font-size:.95rem;opacity:.85}
  .wrap{padding:22px 26px 28px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  .box{border:1px solid #E4F1E8;border-radius:14px;padding:12px 16px}
  .box .h{font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5A6B60;margin-bottom:4px}
  .box b{font-size:1.1rem;display:block}
  .box span{display:block;color:#41544A}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:6px}
  .stat{background:#EEF6F0;border-radius:14px;padding:12px 14px}
  .stat .l{font-size:.78rem;color:#5A6B60}
  .stat .big{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-size:1.35rem;font-weight:700;letter-spacing:-.02em;line-height:1.25}
  h2{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-size:1rem;font-weight:600;margin:22px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:.95rem;font-variant-numeric:tabular-nums}
  th,td{text-align:left;padding:8px 10px}
  th{color:#117D44;background:#EEF6F0;font-weight:600;font-size:.8rem;letter-spacing:.04em}
  th:first-child{border-radius:10px 0 0 10px}th:last-child{border-radius:0 10px 10px 0}
  tbody tr:nth-child(even) td{background:#F3F9F5}
  td{border-bottom:1px solid #E4F1E8}
  td:nth-child(n+2),th:nth-child(n+2){text-align:right}
  tfoot td{font-weight:700;border-top:2px solid #117D44;border-bottom:0;background:none!important}
  .note{color:#5A6B60;font-size:.8rem;margin-left:6px}
  .itm{font-weight:300;color:#7A4E00;margin-left:0;font-size:.9em;display:inline-block;min-width:3.4em;line-height:1.3;vertical-align:baseline}
  td:first-child .mo{display:inline-block;min-width:7.6em;margin-right:6px}
  body.dense td:first-child .mo{min-width:6.6em;margin-right:4px}
  .calc{display:grid;grid-template-columns:auto 1fr;gap:6px 24px;font-variant-numeric:tabular-nums}
  .calc .k{color:#5A6B60}.calc .v{text-align:right;font-weight:600}
  .due{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;padding:16px 20px;border-radius:16px;background:#EEF6F0}
  .due .lbl{font-weight:700;letter-spacing:.06em;font-size:.82rem;text-transform:uppercase}
  .due .big{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-size:2rem;font-weight:700;letter-spacing:-.02em;line-height:1.2}
  .badge{display:inline-block;padding:3px 12px;border-radius:999px;font-weight:700;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase}
  .badge.paid{background:#DDF3E4;color:#17663A}.badge.unpaid{background:#FBE3DE;color:#A3361F}
  .pay{margin-top:14px;padding:12px 16px;border:1px dashed #117D44;border-radius:14px;font-size:.95rem}
  .ptag{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:#DDF3E4;color:#17663A;font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
  .badge.part{background:#FFF1D6;color:#8A5A00}
  tr.pd td{color:#5A6B60}
  th,td{padding:9px 10px}
  thead{display:table-header-group}
  .payqr{display:flex;align-items:center;gap:20px;margin:0 0 16px;padding:16px 20px;border:1.5px dashed #117D44;border-radius:16px;page-break-inside:avoid}
  .payqr .qr{flex:0 0 150px;width:150px;height:150px;background:#fff}
  .payqr .qr svg{width:150px;height:150px;display:block}
  .payqr .scan{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-size:1.05rem;font-weight:600;margin-bottom:6px}
  .payqr .upi{color:#41544A;font-size:.92rem}
  .payqr .amt{margin-top:8px;font-family:"Poppins",sans-serif;font-size:1.4rem;font-weight:700}
  .thanks{margin-top:26px;text-align:center;color:#5A6B60;font-size:.9rem}
  .brand img.wm,body.dense .brand img.wm{width:auto!important;height:30px!important;padding:0!important;background:none!important;border-radius:0!important}
  @page{size:A4;margin:8mm}
  .twocol{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
  .totrow{display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding:8px 12px;border-top:2px solid #117D44;font-weight:700}
  body.dense{font-size:12.5px;line-height:1.3}
  body.dense .band{padding:8px 22px}
  body.dense .brand img{width:34px;height:34px}
  body.dense .doc .t{font-size:1.25rem}
  body.dense .wrap{padding:8px 22px 0}
  body.dense .meta{margin-bottom:8px;gap:12px}
  body.dense .box{padding:8px 12px}
  body.dense .stats{gap:8px}
  body.dense .stat{padding:5px 12px}
  body.dense .stat .big{font-size:1.1rem}
  body.dense h2{margin:8px 0 4px;font-size:.9rem}
  body.dense table{font-size:.8rem;line-height:1.2}
  body.dense th,body.dense td{padding:1.5px 8px}
  body.dense .ptag{margin-left:4px;padding:0 5px;font-size:.58rem}
  body.dense .note{font-size:.68rem;margin-left:3px}
  body.dense .calc{grid-template-columns:auto 1fr auto 1fr;gap:1px 14px;font-size:.8rem}
  body.dense .due{margin-top:8px;padding:8px 16px}
  body.dense .due .big{font-size:1.5rem}
  body.dense .payqr{margin:0 0 8px;padding:8px 14px;gap:14px}
  body.dense .payqr .qr,body.dense .payqr .qr svg{width:74px;height:74px;flex-basis:74px}
  body.dense .thanks{margin-top:4px;font-size:.8rem}
  .ack{margin-top:18px;padding:12px 16px;border:1px solid #d9d2d2;border-radius:12px;page-break-inside:avoid}
  .ack .ackh{font-family:"Poppins","Noto Sans Devanagari",sans-serif;font-weight:600;font-size:.9rem}
  .ack .ackt{font-size:.8rem;color:#41544A;margin-top:2px}
  .sigs{display:grid;grid-template-columns:1.2fr 1.2fr .8fr;gap:22px;margin-top:26px;font-size:.7rem;color:#41544A}
  .sigs span{display:block;border-top:1px solid #117D44;margin-bottom:3px}
  body.dense .ack{margin-top:6px;padding:5px 14px}
  body.dense .sigs{margin-top:14px}
  @media print{ body{padding:0} .band,.due,th,.stat,.badge{-webkit-print-color-adjust:exact;print-color-adjust:exact} tr{page-break-inside:avoid} }
  .mo{font-weight:500}
  .doc .m{font-weight:500}
  body.hi h2,body.hi .doc .t,body.hi .stat .big,body.hi .due .lbl,body.hi .calc .v,body.hi th,body.hi .itm{font-weight:300!important}
  body.hi .stat .big,body.hi .due .big{font-weight:400!important}
  body.hi .mo,body.hi .doc .m{font-weight:500!important}
</style></head><body class="${n>5?"dense":""}${lang==="hi"?" hi":""}">
${(()=>{ const c = billCust(); const paidAll = !!(c && n && items.every(e=>dayPaid(c,fmtDateInput(e.date))));
  const cust = c ? `<div class="box"><div class="h">${t("billTo")}</div><b>${esc2(c.name)}</b>${c.phone ? `<span>${esc2(c.phone)}</span>` : ""}${c.addr ? `<span>${esc2(c.addr)}</span>` : ""}</div>` : `<div class="box"></div>`;
  return `<div class="band"><div class="brand"><img src="${LOGO_URI}" alt="" width="42" height="42"><img class="wm" src="${WORDMARK_URI}" alt="MilkyTrack" height="30"></div><div class="doc"><div class="t">${t("prTitle")}</div><div class="m">${focusDate ? (()=>{ const d = parseLocal(focusDate); return d.getDate()+" "+monthLong(d.getFullYear(), d.getMonth()+1)+" "+d.getFullYear(); })() : monthLong(year,month)+" "+year}</div><div class="m">${t("prBillDate")}: ${billDate}</div></div></div>
<div class="wrap">
${(()=>{ let sv = {}; try{ sv = JSON.parse(localStorage.getItem(UPI_KEY)||"{}"); }catch(err){}
  const pa = (sv.pa||"").trim(); if(!pa || !UPI_RE.test(pa)) return "";
  const ascii = x => String(x||"").replace(/[^\x20-\x7E]/g,"").replace(/\s+/g," ").trim();
  const pn = ascii(sv.pn), cn = pc0 ? ascii(pc0.name) : "";
  const note = ascii("Milk bill " + new Date(year,month-1,1).toLocaleString("en-US",{month:"long"}) + " " + year + (cn ? " - " + cn : "")).slice(0,50);
  const link = "upi://pay?pa=" + encodeURIComponent(pa).replace(/%40/g,"@") + (pn ? "&pn=" + encodeURIComponent(pn) : "") + (balance>0 ? "&am=" + balance.toFixed(2) : "") + "&cu=INR&tn=" + encodeURIComponent(note);
  const qr = qrSvg(link, 150); if(!qr) return "";
  return `<div class="payqr"><div class="qr">${qr}</div><div class="pt"><div class="scan">${t("prScanPay")}</div><div class="upi">${t("prPayTo")}: <b>${esc2(pa)}</b>${pn ? `<br>${esc2(pn)}` : ""}</div>${balance>0 ? `<div class="amt">${rs2(balance)}</div>` : ""}</div></div>`; })()}
<div class="meta">${cust}<div class="box"><div class="h">${t("billPeriod")}</div><b class="mo">${range}</b><span><span class="badge ${paidAll?"paid":(paidAmt>0?"part":"unpaid")}">${t(paidAll?"custPaid":(paidAmt>0?"prPartly":"custUnpaid"))}</span></span></div></div>
<div class="stats"><div class="stat"><div class="l">${t("prTotalQty")}</div><div class="big">${nf.format(litres)} ${t("cpLitres")}</div></div>
<div class="stat"><div class="l">${t("cpRate")}${same ? "" : " (" + t("prAvg") + ")"}</div><div class="big">${rs(rate)}</div></div>
<div class="stat"><div class="l">${t("prDays")}</div><div class="big">${n===days ? days : n}</div></div></div>`; })()}
<h2>${t("prRecord")}</h2>
${tableHtml}
<h2>${t("prCalc")}</h2>
<div class="calc">${calcHtml}</div>
<div class="due"><div class="lbl">${t(paidAmt>0 ? "prBalance" : "prDue")}</div><div class="big">${rs2(balance)}</div></div>
<div class="ack"><div class="ackh">${t("prAck")}</div><div class="ackt">${t("prAckText")}</div><div class="sigs"><div><span></span>${t("prSignCust")}</div><div><span></span>${t("prSignSeller")}</div><div><span></span>${t("prAckDate")}</div></div></div>
<div class="thanks">${t("prThanks")}</div>
</div>
</body></html>`;
}
/* ---------- direct PDF download (no print dialog): render the document to an image per A4 page and wrap the images in a PDF ---------- */
async function htmlToPdfBlob(html, opts){
  const thermal = !!(opts && opts.thermal);
  const W = thermal ? 302 : 794, PH = thermal ? 100000 : 1123, SC0 = thermal ? 4 : 3;
  const fr = document.createElement("iframe");
  fr.style.cssText = "position:fixed;left:-10000px;top:0;width:"+W+"px;height:"+(thermal?600:PH)+"px;border:0;visibility:hidden";
  document.body.appendChild(fr);
  try{
    const prep = html.replace(/<link[^>]*>/g,"");
    await new Promise(res=>{ fr.onload = res; fr.srcdoc = thermal ? prep : prep.replace("</head>","<style>body{padding:24px 26px 0!important}</style></head>"); });
    const d = fr.contentDocument; await new Promise(r=>setTimeout(r,150));
    const CH = Math.ceil(d.documentElement.scrollHeight);
    const H = thermal ? Math.ceil(d.documentElement.scrollHeight) : Math.max(PH, Math.ceil(d.documentElement.scrollHeight));
    d.documentElement.style.background = "#fff";
    const xml = new XMLSerializer().serializeToString(d.documentElement);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xml}</foreignObject></svg>`;
    const img = new Image();
    await new Promise((res,rej)=>{ img.onload = res; img.onerror = () => rej(new Error("render")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const one = thermal || !!(opts && opts.images), pages = one ? 1 : Math.ceil(H/PH), jpgs = [];
    for(let p=0;p<pages;p++){
      const ph = thermal ? H : (opts && opts.images ? CH + 24 : PH);
      const SC = Math.max(2, Math.min(SC0, Math.sqrt(14e6/(W*ph)))); const c = document.createElement("canvas"); c.width = Math.round(W*SC); c.height = Math.round(ph*SC);
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0,0,c.width,c.height);
      x.imageSmoothingQuality = "high"; x.drawImage(img, 0, thermal ? 0 : p*PH, W, ph, 0, 0, c.width, c.height);
      let u = null, flate = false;
      if(!(opts && opts.images) && typeof CompressionStream === "function"){   // lossless: no JPEG blur around small text
        try{
          const px = x.getImageData(0,0,c.width,c.height).data, n = c.width*c.height, rgb = new Uint8Array(n*3);
          for(let i=0,j=0;i<n;i++,j+=3){ const k = i*4; rgb[j]=px[k]; rgb[j+1]=px[k+1]; rgb[j+2]=px[k+2]; }
          const z = await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer();
          u = new Uint8Array(z); flate = true;
        }catch(err){ u = null; flate = false; }
      }
      if(!u){
        const b64 = c.toDataURL("image/jpeg",0.96).split(",")[1], bin = atob(b64); u = new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
      }
      jpgs.push({ data:u, flate, w:c.width, h:c.height, pw: thermal ? 226.77 : 595.28, ph: thermal ? Math.round(H*226.77/W*100)/100 : 841.89 });
    }
    if(opts && opts.images) return jpgs.map(j=>new Blob([j.data],{type:"image/jpeg"}));
    return buildPdf(jpgs);
  } finally { fr.remove(); }
}
function buildPdf(jpgs){
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const push = b => { if(typeof b === "string") b = enc.encode(b); parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; push(n+" 0 obj\n"); push(body); push("\nendobj\n"); };
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const n = jpgs.length, kids = jpgs.map((_,i)=>(4+i*3)+" 0 R").join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids ["+kids+"] /Count "+n+" >>");
  obj(3, "<< /Producer (MilkyTrack) >>");
  jpgs.forEach((j,i)=>{
    const pg = 4+i*3, im = pg+1, ct = pg+2, PW = j.pw||595.28, PHt = j.ph||841.89, cs = "q "+PW+" 0 0 "+PHt+" 0 0 cm /Im0 Do Q";
    obj(pg, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+PW+" "+PHt+"] /Resources << /XObject << /Im0 "+im+" 0 R >> >> /Contents "+ct+" 0 R >>");
    offs[im] = len; push(im+" 0 obj\n<< /Type /XObject /Subtype /Image /Width "+j.w+" /Height "+j.h+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /"+(j.flate?"FlateDecode":"DCTDecode")+" /Length "+j.data.length+" >>\nstream\n"); push(j.data); push("\nendstream\nendobj\n");
    obj(ct, "<< /Length "+cs.length+" >>\nstream\n"+cs+"\nendstream");
  });
  const total = 4+n*3, xr = len;
  let x = "xref\n0 "+total+"\n0000000000 65535 f \n";
  for(let i=1;i<total;i++) x += String(offs[i]).padStart(10,"0")+" 00000 n \n";
  push(x+"trailer\n<< /Size "+total+" /Root 1 0 R /Info 3 0 R >>\nstartxref\n"+xr+"\n%%EOF");
  return new Blob(parts,{type:"application/pdf"});
}
async function downloadPdf(html, name, opts){
  if(window.AndroidPrint && typeof window.AndroidPrint.print === "function"){ try{ window.AndroidPrint.print(html, name); return; }catch(err){} }
  showToast(t("pdfMaking"));
  try{
    const blob = await htmlToPdfBlob(html, opts);
    let dl = null; try{ dl = (window.claude && claude.use) ? await claude.use("downloads") : null; }catch(e){}
    if(dl){   // inside the Claude artifact viewer: the viewer confirms and saves the file
      try{ await dl.save({ filename: name + ".pdf", data: blob }); showToast(t("pdfDone")); }
      catch(err){ if(!err || err.code!=="declined") showToast(t("popupBlocked")); }
      return;
    }
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name + ".pdf"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 8000); showToast(t("pdfDone"));
  }catch(err){
    const w = window.open("", "_blank"); if(!w){ showToast(t("popupBlocked")); return; }
    w.document.open(); w.document.write(html); w.document.close(); const go = () => { try{ w.focus(); w.print(); }catch(e){} }; w.onload = go; setTimeout(go, 400);
  }
}
function buildThermalHtml(){
  const items = sortedAsc(billEntries()); unit = monthUnit(items);
  const hi = lang==="hi", c = billCust();
  const nf = new Intl.NumberFormat("en-IN",{maximumFractionDigits:2});
  const rs = n => "₹" + new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const esc2 = v => String(v).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  const total = items.reduce((s,e)=>s+lineTotal(e),0), litres = litSum(items), other = total - milkTotal(items);
  const plain = items.every(isMilkL);
  const pc0 = billCust(), isPd = e => !!(pc0 && dayPaid(pc0, fmtDateInput(e.date)));
  const paidAmt = items.filter(isPd).reduce((s,e)=>s+lineTotal(e),0), balance = Math.max(0,total-paidAmt);
  const dl = e => { const d = new Date(e.date); const dd = String(d.getDate()).padStart(2,"0"); return hi ? dd + ` <span class="hm">${HI_MONTHS[d.getMonth()]}</span>` : dd + " " + d.toLocaleString("en-US",{month:"long"}); };
  const rows = items.map(e=>`<div class="r"><span class="d">${dl(e)}</span><span class="q">${plain ? "" : itemName(e)+" "}${nf.format(Number(e.quantity)||0)} ${unitWord(e,hi)} × ${nf.format(Number(e.amount)||0)}</span><span class="a">${rs(lineTotal(e))}</span></div>${e.note && (plain || e.item || guessItem(e.note)==="milk") ? `<div class="n">${esc2(e.note)}</div>` : ""}`).join("");
  const qrHtml = (()=>{ let sv = {}; try{ sv = JSON.parse(localStorage.getItem(UPI_KEY)||"{}"); }catch(err){}
    const pa = (sv.pa||"").trim(); if(!pa || !UPI_RE.test(pa)) return "";
    const ascii = x => String(x||"").replace(/[^\x20-\x7E]/g,"").replace(/\s+/g," ").trim();
    const pn = ascii(sv.pn);
    const link = "upi://pay?pa=" + encodeURIComponent(pa).replace(/%40/g,"@") + (pn ? "&pn=" + encodeURIComponent(pn) : "") + (balance>0 ? "&am=" + balance.toFixed(2) : "") + "&cu=INR";
    const qr = qrSvg(link, 130); if(!qr) return "";
    return `<div class="qr">${qr}<div>${t("prScanPay")}</div><b>${esc2(pa)}</b></div>`; })();
  const wmBlack = (()=>{ try{ return "data:image/svg+xml;base64," + btoa(atob(WORDMARK_URI.split(",")[1]).replace(/#117d44|#eaa222|#137e44|#eaa324/gi,"#000")); }catch(err){ return ""; } })();   // one-colour copy of the wordmark for thermal paper
  const per = items.length ? `${dl(items[0])} – ${dl(items[items.length-1])} ${year}` : `${monthLong(year,month)} ${year}`;
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><title>${t("prTitle")}</title>
<style>
@page{size:80mm auto;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#fff}
body{width:302px;padding:10px 12px 14px;font-family:"Courier New",Courier,"Noto Sans Devanagari",monospace;font-size:12.5px;line-height:1.35;color:#000}
.c{text-align:center}.b{font-weight:700}.big{font-size:17px;font-weight:700}
.hr{border-top:1px dashed #000;margin:7px 0}
.r{display:flex;gap:6px;justify-content:space-between}
.r{flex-wrap:wrap}.r .d{flex:0 0 100%;font-weight:700}.hm{font-weight:300}.r .q{flex:1}.r .a{flex:0 0 auto;text-align:right}
.n{font-size:11px;padding-left:0;font-style:italic}
.t{display:flex;justify-content:space-between}
.qr{text-align:center;margin-top:6px;font-size:11px}.qr svg{width:130px;height:130px}
</style></head><body>
<div class="c">${wmBlack ? `<img src="${wmBlack}" alt="MilkyTrack" height="34" style="height:34px;width:auto">` : `<span class="b" style="font-size:16px">MILKYTRACK</span>`}</div>
<div class="c b">${t("prTitle")}</div>
<div class="c">${per}</div>
<div class="hr"></div>
${c ? `<div class="b">${esc2(c.name)}</div>${c.phone ? `<div>${esc2(c.phone)}</div>` : ""}${c.addr ? `<div>${esc2(c.addr)}</div>` : ""}<div class="hr"></div>` : ""}
${rows || `<div class="c">${t("noDeliveries")}</div>`}
<div class="hr"></div>
<div class="t"><span>${t("prTotalMilk")}</span><span>${nf.format(litres)} ${UL()}</span></div>
${!plain && other>0.004 ? `<div class="t"><span>${t("prOther")}</span><span>${rs(other)}</span></div>` : ""}
<div class="t b"><span>${t("repTotal")}</span><span>${rs(total)}</span></div>
${paidAmt>0 ? `<div class="t"><span>${t("prLessPaid")}</span><span>- ${rs(paidAmt)}</span></div>` : ""}
<div class="hr"></div>
<div class="c b">${t("prDue")}</div>
<div class="c big" style="font-size:22px;margin-top:2px">${rs(balance)}</div>
${qrHtml}
<div class="hr"></div>
<div class="c">${t("prThanks")}</div>
<div class="c" style="font-size:10.5px">${t("prBillDate")}: ${new Date().toLocaleDateString(hi?"hi-IN":"en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
</body></html>`;
}
