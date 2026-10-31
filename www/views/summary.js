/* Header totals and the customer summary card. */
/* ---------- header + totals ---------- */
function renderTop(){ if(typeof updatePaidBtn==="function") updatePaidBtn(); if($("cbMonth")) $("cbMonth").textContent = monthLong(year,month)+" "+year; $("monthLabel").textContent = new Date(year,month-1,1).toLocaleString(locale(),{month:"long"})+" "+year; }
let otherOpen = false, delivOpen = false, milkOpen = false;
function groupedItemsHtml(list, emptyKey){
  const hi = lang==="hi";
  if(!list.length) return `<div class="oi-empty">${t(emptyKey)}</div>`;
  const groups = {}; list.forEach(e=>{ const k = itemOf(e)+"|"+(e.unit==="kg"?"kg":"L"); (groups[k] = groups[k] || []).push(e); });
  const nfq = new Intl.NumberFormat(hi?"hi-IN":"en-IN",{maximumFractionDigits:2});
  let grand = 0;
  const html = Object.values(groups).sort((a,b)=>b.reduce((x,e)=>x+lineTotal(e),0)-a.reduce((x,e)=>x+lineTotal(e),0)).map(g=>{
    const tot = g.reduce((x,e)=>x+lineTotal(e),0), qty = g.reduce((x,e)=>x+(Number(e.quantity)||0),0); grand += tot;
    const byP = {}; g.forEach(e=>{ const a = Number(e.amount)||0; (byP[a] = byP[a] || []).push(e); });
    const prices = Object.keys(byP).map(Number).sort((a,b)=>a-b), multi = prices.length>1;
    const rowH = (e,showRate) => { const d = new Date(e.date), q = Number(e.quantity)||0, a = Number(e.amount)||0;
      return `<div class="oi-row"><span class="oi-d">${String(d.getDate()).padStart(2,"0")} ${monthLong(d.getFullYear(), d.getMonth()+1)}</span><span class="oi-n">${nfq.format(q)} ${unitWord(e,hi)}${showRate ? " × "+fmtMoney(a) : ""}</span><span class="oi-a">${fmtMoney(lineTotal(e))}</span></div>`; };
    const rows = multi ? prices.map(pr=>{ const lst = byP[pr], q2 = lst.reduce((x,e)=>x+(Number(e.quantity)||0),0), t2 = lst.reduce((x,e)=>x+lineTotal(e),0);
      return `<div class="oi-ph"><span>${fmtMoney(pr)} / ${unitWord(lst[0],hi)}</span><span class="oi-gq">${nfq.format(q2)} ${unitWord(lst[0],hi)}</span><span class="oi-a">${fmtMoney(t2)}</span></div>` + lst.map(e=>rowH(e,false)).join(""); }).join("") : g.map(e=>rowH(e,true)).join("");
    return `<div class="oi-grp"><div class="oi-gh"><b>${esc(itemName(g[0]))}</b><span class="oi-gq">${nfq.format(qty)} ${unitWord(g[0],hi)}</span><span class="oi-a">${fmtMoney(tot)}</span></div>${rows}</div>`;
  }).join("");
  return html + (Object.keys(groups).length>1 ? `<div class="oi-gt"><span>${t("repTotal")}</span><span>${fmtMoney(grand)}</span></div>` : "");
}
function otherItemsHtml(items){
  return groupedItemsHtml(items.filter(e=>!isMilkL(e)).sort((a,b)=>new Date(a.date)-new Date(b.date)), "otherNone");
}
function deliveriesHtml(items){
  return groupedItemsHtml([...items].sort((a,b)=>new Date(a.date)-new Date(b.date)), "noDeliveries");
}
function renderHero(){
  save(); // every data change flows through here
  const monthItems = entriesForMonth();
  const items = focusDate ? monthItems.filter(e=>fmtDateInput(e.date)===focusDate) : monthItems;
  const total = items.reduce((s,e)=>s+lineTotal(e),0);
  const litres = litSum(items);
  const avg = litres ? milkTotal(items)/litres : 0;
  const pm = month===1 ? 12 : month-1, py = month===1 ? year-1 : year;
  const prevTotal = entries.filter(e=>{ const d=new Date(e.date); return d.getFullYear()===py && d.getMonth()+1===pm; }).reduce((s,e)=>s+lineTotal(e),0);
  const cc = curCust(), monthTotal = monthItems.reduce((s,e)=>s+lineTotal(e),0);
  const paidAmt = monthItems.filter(e=>cc && dayPaid(cc,fmtDateInput(e.date))).reduce((s,e)=>s+lineTotal(e),0);
  const unpaidAmt = Math.max(0, monthTotal-paidAmt), pct = monthTotal>0 ? Math.round(paidAmt/monthTotal*100) : 0;
  let mom = "";
  if(monthTotal>0 && !focusDate){   // month-level bar: hidden while a single day is selected
    mom = `<div class="pbar" role="img" aria-label="${t("paidShort")} ${fmtMoney(paidAmt)}, ${t("unpaidShort")} ${fmtMoney(unpaidAmt)}">
      <div class="pbar-track"><div class="pbar-fill" style="width:${pct}%"></div></div>
      <div class="pbar-row"><span class="pp">${t("paidShort")} ${fmtMoney(paidAmt)}</span><span class="pu">${t("unpaidShort")} ${fmtMoney(unpaidAmt)}</span></div></div>`;
  }
  $("hero").innerHTML = `
    <div class="hero-top">
      <div>
        <div class="hero-total">${fmtMoney(total)}</div>
        <div class="hero-label hero-label-b">${focusDate ? t("totalDueDay",{date:dayMonthLong(parseLocal(focusDate))}) : t("totalDue")}</div>${mom}
      </div>
    </div>
    <div class="stats stats-eq" aria-label="${t("rcAmount")} = ${t("qtyW")} × ${t("rateW")}">
      <button type="button" class="stat stat-btn" id="statMilk" aria-expanded="${milkOpen}"><div class="stat-label">${t("amtMilk")} <span class="oi-car">▾</span></div><div class="stat-value">${fmtMoney(milkTotal(items))}</div></button>
      <div class="stat"><div class="stat-label">${t("qtyW")} (${UL()})</div><div class="stat-value">${fmtNum(litres)}</div></div>
      <div class="stat"><div class="stat-label">${t("rateW")} (₹/${UL()})</div><div class="stat-value">${fmtMoney(avg)}</div></div>
      <button type="button" class="stat stat-btn" id="statDeliv" aria-expanded="${delivOpen}"><div class="stat-label">${t("deliveriesStat")} <span class="oi-car">▾</span></div><div class="stat-value">${items.length}</div></button>
      <div class="oi-panel" id="delivPanel"${delivOpen?"":" hidden"}>${deliveriesHtml(items)}</div>
      <button type="button" class="stat stat-btn" id="statOther" aria-expanded="${otherOpen}"><div class="stat-label">${t("prOther")} <span class="oi-car">▾</span></div><div class="stat-value">${fmtMoney(Math.max(0,total-milkTotal(items)))}</div></button>
      <div class="stat"><div class="stat-label">${t("repTotal")}</div><div class="stat-value">${fmtMoney(total)}</div></div>
      <div class="oi-panel" id="milkPanel"${milkOpen?"":" hidden"}>${groupedItemsHtml(items.filter(isMilkL).sort((a,b)=>new Date(a.date)-new Date(b.date)),"noDeliveries")}</div>
      <div class="oi-panel" id="otherPanel"${otherOpen?"":" hidden"}>${otherItemsHtml(items)}</div>
    </div>`;
  const so = $("statOther"), sd = $("statDeliv"), sm = $("statMilk");
  const sync = () => { [[so,"otherPanel",otherOpen],[sd,"delivPanel",delivOpen],[sm,"milkPanel",milkOpen]].forEach(([b,id,o])=>{ if(b){ b.setAttribute("aria-expanded", o); $(id).hidden = !o; } }); };
  const open = which => { const v = which==="o" ? !otherOpen : which==="d" ? !delivOpen : !milkOpen; otherOpen = delivOpen = milkOpen = false; if(which==="o") otherOpen = v; else if(which==="d") delivOpen = v; else milkOpen = v; sync(); };
  if(so) so.onclick = () => open("o");
  if(sd) sd.onclick = () => open("d");
  if(sm) sm.onclick = () => open("m");
  try{ countUpHero(total); }catch(e){}
  renderDeltas();
  updateRowTotals(); renderTodayCard();   // keep the pinned "Delivered today" bar live as values change
}
function renderDeltas(){
  const sorted = [...entries].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const prev = {}, lastBy = {}; sorted.forEach(e=>{ const k = itemOf(e)+"|"+(e.unit==="kg"?"kg":"L"); prev[e._id] = lastBy[k] || null; lastBy[k] = e; });   // compare a price with the previous one of the same item
  document.querySelectorAll(".delta").forEach(el=>{
    const e = entries.find(x=>x._id===el.dataset.for), p = e && prev[e._id];
    const diff = p ? Math.round(((Number(e.amount)||0)-(Number(p.amount)||0))*100)/100 : 0;
    if(!p || diff===0){ el.textContent=""; el.className="delta"; return; }
    el.className = "delta " + (diff>0 ? "up" : "down");
    el.textContent = `${diff>0?"▲":"▼"} ${Math.abs(diff).toFixed(2)} ${t("vsLast")}`;
  });
}
