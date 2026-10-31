/* Lazy service: the monthly report screen and its printable HTML. Loaded on first open. */
function buildReportHtml(S){
  unit = monthUnit(fullList().filter(e=>{ const d=new Date(e.date); return d.getFullYear()===ry && d.getMonth()+1===rm; }));
  const nf2 = new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
  const rs = n => "₹" + nf2.format(n);
  const dim = new Date(ry,rm,0).getDate(), maxL = Math.max(1e-9,...Object.values(S.perDay));
  const pct = S.billed ? Math.round(S.coll/S.billed*100) : 0;
  const peak = Object.entries(S.perDay).sort((a,b)=>b[1]-a[1])[0];
  const bars = Array.from({length:dim},(_,i)=>{ const v=S.perDay[i+1]||0; return `<div class="cb"><div class="bar ${v&&v===maxL?"pk":""}" style="height:${v?Math.max(3,Math.round(v/maxL*100)):0}%"></div></div>`; }).join("");
  const rows = S.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td class="r">${nf1(r.lit)} ${UL()}</td><td class="r">${rs(r.bill)}</td><td class="r">${rs(r.bill-r.due)}</td><td class="r ${r.due>0?"due":"ok"}">${r.due>0?rs(r.due):t("custPaid")}</td></tr>`).join("");
  const gen = new Date().toLocaleDateString(locale(),{day:"numeric",month:"long",year:"numeric"});
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t("report")} — ${monthLong(ry,rm)} ${ry}</title>
<link href="https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:10mm}
*{box-sizing:border-box}
.brand img.wm,body.dense .brand img.wm{width:auto!important;height:30px!important;padding:0!important;background:none!important;border-radius:0!important}
body{font-family:"Mukta","Noto Sans Devanagari",Arial,sans-serif;color:#10281B;margin:0;font-size:13px;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.band{display:flex;justify-content:space-between;align-items:center;background:#EEF6F0;color:#117D44;border-radius:14px;padding:14px 20px}
.brand{display:flex;align-items:center;gap:10px;font:700 1.25rem "Poppins","Noto Sans Devanagari",sans-serif}
.brand img{width:40px;height:40px;border-radius:9px}
.doc{text-align:right}.doc .t{font:700 1.15rem "Poppins","Noto Sans Devanagari",sans-serif;letter-spacing:.04em}.doc .m{font-size:.95rem}
h2{font:600 .85rem "Poppins","Noto Sans Devanagari",sans-serif;text-transform:uppercase;letter-spacing:.06em;margin:18px 0 8px;color:#117D44}
.hero{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:10px;margin-top:14px}
.card{background:#fff;border:1px solid #d9d4d4;border-radius:12px;padding:10px 14px}
.card small{display:block;font-size:.75rem;color:#41544A;font-weight:400}
.card b{display:block;font:500 1.25rem "Poppins",sans-serif;margin-top:2px}
.card.big b{font-size:1.6rem}
.kp{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.pb{height:9px;border-radius:99px;background:#e9e6e6;margin-top:8px;overflow:hidden}.pb i{display:block;height:100%;background:#117D44}
.chart{display:flex;align-items:flex-end;gap:2px;height:90px;border-bottom:1.5px solid #117D44;padding:0 2px}
.cb{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
.cb .bar{width:100%;background:#EAA222;border-radius:2px 2px 0 0}.cb .bar.pk{background:#117D44}
.labels{display:flex;gap:2px;padding:0 2px;font-size:.6rem;color:#41544A}.labels span{flex:1;text-align:center}
.note{font-size:.75rem;color:#41544A;margin-top:4px}
table{width:100%;border-collapse:collapse}
th{background:#EEF6F0;text-align:left;font-size:.78rem;padding:7px 8px}td{padding:7px 8px;border-bottom:1px solid #e6e1e1}
.r{text-align:right}th.r{text-align:right}
tr{page-break-inside:avoid}thead{display:table-header-group}
td.due{font-weight:700}td.ok{color:#2e7d4f;font-weight:700}
tfoot td{border-top:2px solid #117D44;border-bottom:0;font-weight:700;background:#EEF6F0}
.foot{margin-top:18px;display:flex;justify-content:space-between;font-size:.72rem;color:#5A6B60;border-top:1px solid #e6e1e1;padding-top:8px}
</style></head><body>
<div class="band"><div class="brand"><img src="${LOGO_URI}" alt="" width="40" height="40"><img class="wm" src="${WORDMARK_URI}" alt="MilkyTrack" height="28"></div><div class="doc"><div class="t">${t("report").toUpperCase()}</div><div class="m">${monthLong(ry,rm)} ${ry}</div></div></div>
<div class="hero"><div class="card big"><small>${t("repBilled")}</small><b>${rs(S.billed)}</b><div class="pb"><i style="width:${pct}%"></i></div></div><div class="card"><small>${t("repCollected")}</small><b>${rs(S.coll)}</b></div><div class="card"><small>${t("repOutstanding")}</small><b>${rs(S.out)}</b></div></div>
<div class="kp"><div class="card"><small>${t("repLitres")}</small><b>${nf1(S.lit)} ${UL()}</b></div><div class="card"><small>${t("repDays")}</small><b>${S.days} / ${dim}</b></div><div class="card"><small>${t("repAvg")}</small><b>${nf1(S.lit/S.days)} ${UL()}</b></div><div class="card"><small>${t("repCusts")}</small><b>${S.rows.length}</b></div></div>
<h2>${t("repDaily")}</h2><div class="chart">${bars}</div><div class="labels">${Array.from({length:dim},(_,i)=>`<span>${(i+1)%5===1||i+1===dim?i+1:""}</span>`).join("")}</div>
<div class="note">${t("repPeak")}: ${peak[0]} ${monthLong(ry,rm)} — ${nf1(peak[1])} ${UL()}</div>
${S.items.length>1 || (S.items[0] && S.items[0].k!=="milk") ? `<h2>${t("repByItem")}</h2><table><thead><tr><th>${t("repItemCol")}</th><th class="r">${t("qtyW")}</th><th class="r">${t("repBilled")}</th></tr></thead><tbody>${S.items.map(it=>`<tr><td>${ITEMS[it.k][lang==="hi"?"hi":"en"]}</td><td class="r">${nf1(it.qty)} ${it.k==="milk" ? UL() : unitWord({unit:it.kg?"kg":"L"},lang==="hi")}</td><td class="r">${rs(it.amt)}</td></tr>`).join("")}</tbody></table>` : ""}
<h2>${t("repByCust")}</h2>
<table><thead><tr><th>#</th><th>${t("custName")}</th><th class="r">${t("repLitres")}</th><th class="r">${t("repBilled")}</th><th class="r">${t("repCollected")}</th><th class="r">${t("repOutstanding")}</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td></td><td>${t("repTotal")}</td><td class="r">${nf1(S.lit)} ${UL()}</td><td class="r">${rs(S.billed)}</td><td class="r">${rs(S.coll)}</td><td class="r">${rs(S.out)}</td></tr></tfoot></table>
<div class="foot"><span>MilkyTrack</span><span>${gen}</span></div>
</body></html>`;
}
function renderReport(){
  $("repMonth").textContent = monthLong(ry,rm)+" "+ry;
  const S = repStats(ry,rm);
  if(!S.n){ $("repBody").innerHTML = `<p class="sheet-sub">${t("repNoData")}</p>`; window.__rep = null; return; }
  const pm = rm===1 ? [ry-1,12] : [ry,rm-1], now0 = new Date(), curMonth = (ry===now0.getFullYear() && rm===now0.getMonth()+1), P = repStats(pm[0],pm[1], curMonth ? now0.getDate() : 0); window.__repMtd = curMonth ? now0.getDate() : 0;   // a month still in progress is compared with the same days of last month
  const pct = S.billed ? Math.round(S.coll/S.billed*100) : 0;
  const dim = new Date(ry,rm,0).getDate(), maxL = Math.max(...Object.values(S.perDay));
  const peak = Object.entries(S.perDay).sort((a,b)=>b[1]-a[1])[0];
  const bars = Array.from({length:dim},(_,i)=>{ const v=S.perDay[i+1]||0, h=v? Math.max(4,Math.round(v/maxL*100)):0; return `<button type="button" class="rb ${v&&v===maxL?"pk":""} ${v?"":"zero"}" data-d="${i+1}" data-v="${v}" style="height:${h}%" aria-label="${i+1}: ${nf1(v)} ${UL()}"></button>`; }).join("");
  const top = S.rows[0];
  const cr = [...S.rows].sort((a,b)=>b.lit-a.lit), cMax = Math.max(1e-9, ...cr.map(r=>r.lit));
  const cInit = n => { const w = String(n||"?").trim().split(/\s+/); return esc((w[0]||"?").charAt(0).toUpperCase()); };
  const custChart = cr.length>1 && cMax>1e-9 ? `<div class="rep-h">${t("repCustChart")}</div>
    <div class="rep-readout" id="repCRead">${t("repTapCust")}</div>
    <div class="rep-plot"><div class="rep-y"><span>${nf1(cMax)} ${UL()}</span><span>${nf1(cMax/2)} ${UL()}</span><span>0</span></div><div class="rep-bars" id="repCBars">${cr.map((r,i)=>`<button type="button" class="rb ${i===0?"pk":""} ${r.lit?"":"zero"}" data-i="${i}" style="height:${r.lit?Math.max(4,Math.round(r.lit/cMax*100)):0}%" aria-label="${esc(r.name)}: ${nf1(r.lit)} ${UL()}"></button>`).join("")}</div></div>
    <div class="rep-axis rep-caxis">${cr.map(r=>`<span>${cInit(r.name)}</span>`).join("")}</div>` : "";
  const due = S.rows.filter(r=>r.due>0).sort((a,b)=>b.due-a.due);
  const DCOL = {milk:"#117D44",dahi:"#EAA222",paneer:"#2A9D8F",ghee:"#A3622B"};
  const donutHtml = (()=>{ const tot = S.items.reduce((x,it)=>x+it.amt,0); if(!(tot>0)) return ""; const R = 15.915, C = 2*Math.PI*R; let off = 25;
    const segs = S.items.filter(it=>it.amt>0).map(it=>{ const f = it.amt/tot, len = f*C, seg = `<circle class="dn-seg" data-k="${it.k}" cx="21" cy="21" r="${R}" fill="none" stroke="${DCOL[it.k]||"#888"}" stroke-width="6.5" stroke-dasharray="${Math.max(0,len-0.6).toFixed(3)} ${(C-len+0.6).toFixed(3)}" stroke-dashoffset="${off.toFixed(3)}"/>`; off -= len; return seg; }).join("");
    const leg = S.items.filter(it=>it.amt>0).map(it=>`<div class="dn-li"><i style="background:${DCOL[it.k]||"#888"}"></i><span class="n">${esc(ITEMS[it.k][lang==="hi"?"hi":"en"])}</span><span class="p">${Math.round(it.amt/tot*100)}%</span></div>`).join("");
    return `<div class="dn-wrap"><div class="dn"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="${R}" fill="none" stroke="#EEF4F0" stroke-width="6.5"/>${segs}</svg><div class="dn-c"><small>${t("repTotal")}</small><b>${fmtMoney(tot)}</b></div></div><div class="dn-leg">${leg}</div></div>`; })();
  const custRow = r => { const pend=r.due>0, ph=String(r.phone||"").replace(/[^\d]/g,"");
      const wa = pend && ph ? `<a class="rep-wa" target="_blank" rel="noopener" href="${waLink(ph, waBillText(r.id,ry,rm) || t("repRemind",{name:r.name,amt:fmtMoney(r.due),m:monthLong(ry,rm)+" "+ry}))}" aria-label="${t("repRemindBtn")}">${t("repRemindBtn")}</a>`:"";
      return `<div class="rep-row"><span class="n">${esc(r.name)}</span><span class="l">${nf1(r.lit)} ${UL()}</span><span class="d ${pend?"":"ok"}">${pend ? fmtMoney(r.due) : t("custPaid")}</span>${wa}</div>`; };
  const grpHtml = (lst,k) => lst.length ? `<div class="rep-sub-h">${t(k)} <em>${lst.length}</em></div>` + lst.map(custRow).join("") : "";
  window.__rep = S;
  $("repBody").innerHTML = `<div class="rep-hero"><small>${t("repBilled")}</small><b>${fmtMoney(S.billed)}</b>
      <div class="rep-bar"><i style="width:${pct}%"></i></div>
      <div class="rep-split"><span>${t("repCollected")} <b>${fmtMoney(S.coll)}</b></span><span>${t("repOutstanding")} <b>${fmtMoney(S.out)}</b></span></div></div>
    <div class="rep-grid">
      <div class="rep-kpi"><small>${t("repLitres")}</small><b>${nf1(S.lit)} ${UL()}</b></div>
      <div class="rep-kpi"><small>${t("repAvg")}</small><b>${nf1(S.lit/S.days)} ${UL()}</b></div>
      <div class="rep-kpi"><small>${t("repDays")}</small><b>${S.days}<em> / ${dim}</em></b></div>
      <div class="rep-kpi"><small>${t("repCusts")}</small><b>${S.rows.length}</b></div>
      <div class="rep-kpi"><small>${t("prOther")}</small><b>${fmtMoney(S.other)}</b></div>
      <div class="rep-kpi"><small>${t("repPeak")}</small><b class="rep-name">${peak[0]} ${monthLong(ry,rm)}</b><span class="rep-sub">${ry} · ${nf1(peak[1])} ${UL()}</span></div>
      <div class="rep-kpi"><small>${t("repTop")}</small><b class="rep-name">${esc(top.name)}</b><span class="rep-sub">${fmtMoney(top.bill)}</span></div>
    </div>
    <div class="rep-h">${t("repDaily")}</div>
    <div class="rep-readout" id="repRead">${t("repTapBar")}</div>
    <div class="rep-plot"><div class="rep-y"><span>${nf1(maxL)} ${UL()}</span><span>${nf1(maxL/2)} ${UL()}</span><span>0</span></div><div class="rep-bars" id="repBars">${bars}</div></div>
    <div class="rep-axis"><span>1</span><span>8</span><span>15</span><span>22</span><span>${dim}</span></div>
    <div class="rep-legend"><i class="pk"></i>${t("repPeak")} <i></i>${t("repOther")}</div>
    ${S.items.length>1 || (S.items[0] && S.items[0].k!=="milk") ? `<div class="rep-h">${t("repByItem")}</div>${donutHtml}${S.items.map(it=>`<div class="rep-row"><span class="n">${esc(ITEMS[it.k][lang==="hi"?"hi":"en"])}</span><span class="l">${nf1(it.qty)} ${it.k==="milk" ? UL() : unitWord({unit:it.kg?"kg":"L"},lang==="hi")}</span><span class="d ok">${fmtMoney(it.amt)}</span></div>`).join("")}` : ""}
    ${custChart}
    <div class="rep-h">${t("repByCust")}</div>
    ${grpHtml(S.rows.filter(r=>r.due>0),"repGrpRemind")}${grpHtml(S.rows.filter(r=>!(r.due>0)),"repGrpPaid")}
    <div class="sheet-actions"><button type="button" class="btn-ghost" id="repCopy">${t("repCopy")}</button><button type="button" class="add-btn" id="repPrint">${t("repPrint")}</button></div>`;
  $("repBars").onclick = ev => { const bt = ev.target.closest(".rb"); if(!bt) return; document.querySelectorAll("#repBars .rb.sel").forEach(x=>x.classList.remove("sel")); bt.classList.add("sel"); const v = Number(bt.dataset.v); $("repRead").innerHTML = `<b>${bt.dataset.d} ${monthLong(ry,rm)}</b> — ${v ? nf1(v)+" L" : t("repNone")}`; };
  if($("repCBars")) $("repCBars").onclick = ev => { const bt = ev.target.closest(".rb"); if(!bt) return; document.querySelectorAll("#repCBars .rb.sel").forEach(x=>x.classList.remove("sel")); bt.classList.add("sel"); const r = cr[Number(bt.dataset.i)]; $("repCRead").innerHTML = `<b>${esc(r.name)}</b> — ${nf1(r.lit)} ${UL()} · ${fmtMoney(r.bill)}`; };
  $("repCopy").onclick = async () => {
    const L = [`MilkyTrack — ${monthLong(ry,rm)} ${ry}`, `${t("repLitres")}: ${nf1(S.lit)} ${UL()}`, `${t("repBilled")}: ${fmtMoney(S.billed)}`, `${t("repCollected")}: ${fmtMoney(S.coll)}`, `${t("repOutstanding")}: ${fmtMoney(S.out)}`, ...(S.other>0 ? [`${t("prOther")}: ${fmtMoney(S.other)}`] : []), "", ...(S.items.length>1 ? S.items.map(it=>`${ITEMS[it.k][lang==="hi"?"hi":"en"]}: ${nf1(it.qty)} ${it.k==="milk" ? UL() : unitWord({unit:it.kg?"kg":"L"},lang==="hi")} · ${fmtMoney(it.amt)}`).concat([""]) : []), ...S.rows.map(r=>`${r.name}: ${nf1(r.lit)} ${UL()}, ${r.due>0?fmtMoney(r.due):t("custPaid")}`)];
    try{ await navigator.clipboard.writeText(L.join("\n")); showToast(t("repCopied")); }catch(e){ showToast(t("clipFailed")); }
  };
  $("repPrint").onclick = async () => { await loadJs("bill"); downloadPdf(buildReportHtml(S), "MilkyTrack-Report-" + ry + "-" + String(rm).padStart(2,"0")) };
}
