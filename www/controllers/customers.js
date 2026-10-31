/* Customers: home list, selecting a customer, paid state, WhatsApp bill text. */
/* ---------- customers = home screen; each customer has their own tracker ---------- */
const CUST_KEY = "milk-customers-v1";
let customers = [];
try{ customers = JSON.parse(localStorage.getItem(CUST_KEY) || "[]"); if(!Array.isArray(customers)) customers = []; }catch(e){ customers = []; }
let activeCust = null, rest = [];
const fullList = () => activeCust ? entries.concat(rest) : entries;
function setAll(list){
  if(activeCust){ entries = list.filter(e=>e.cust===activeCust); rest = list.filter(e=>e.cust!==activeCust); }
  else { entries = list; rest = []; }
}
function saveCustomers(){
  const json = JSON.stringify(customers);
  try{ localStorage.setItem(CUST_KEY, json); }catch(e){ if(typeof showToast==="function") showToast(t("saveFailed")); }
  const np = nativePrefs(); if(np){ try{ Promise.resolve(np.set({ key:CUST_KEY, value:json })).catch(()=>{}); }catch(e){} }
}
function migrateLegacy(){
  const all = fullList(), orphan = all.filter(e=>!e.cust);
  if(!orphan.length) return;
  let g = customers.find(c=>c.id==="c_general");
  if(!g){ g = { id:"c_general", name: lang==="hi" ? "सामान्य" : "General", phone:"", price:"", addr:"" }; customers.push(g); saveCustomers(); }
  orphan.forEach(e=>{ e.cust = g.id; });
  save();
}
function monthDue(id, back, c){
  const ref = new Date(today.getFullYear(), today.getMonth()-(back||0), 1);
  return fullList().filter(e=>e.cust===id && new Date(e.date).getFullYear()===ref.getFullYear() && new Date(e.date).getMonth()===ref.getMonth() && !(c && c.paid && c.paid[fmtDateInput(e.date)])).reduce((s,e)=>s+lineTotal(e),0);
}
function custMeta(c){
  const ref = new Date(today.getFullYear(), today.getMonth()-1, 1);
  const pk = ref.getFullYear()+"-"+String(ref.getMonth()+1).padStart(2,"0");
  const last = monthDue(c.id,1), lastPaid = isPaid(c,pk);
  const tk = fmtDateInput(today), td = fullList().filter(e=>e.cust===c.id && fmtDateInput(e.date)===tk);
  const lit = litSum(td);
  const lastChip = last>0 ? `<span class="cm ${lastPaid?"ok":"warn"}">${t("lastMonth")}: ${lastPaid ? t("custPaid")+" "+fmtMoney(last) : fmtMoney(last)}</span>` : "";
  const todayChip = td.length ? `<span class="cm ok">${t("todayDone")} · ${lit} ${UL()}</span>` : `<span class="cm">${t("todayPending")}</span>`;
  return `<div class="cust-meta">${lastChip}${todayChip}</div>`;
}
function renderCustomers(){
  const q = ($("cSearch").value||"").trim().toLowerCase();
  const list = customers.filter(c=>!q || (c.name+" "+(c.phone||"")+" "+(c.addr||"")).toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  $("custCount").textContent = t("custCount",{n:customers.length});
  $("custList").innerHTML = list.length ? list.map(c=>`
    <div class="cust-item" data-id="${esc(c.id)}">
      <div class="cust-av">${esc(c.name.trim().charAt(0).toUpperCase()||"?")}</div>
      <div class="cust-main"><div class="cust-name">${esc(c.name)}</div>
        <div class="cust-sub">${c.phone ? `<span>${esc(c.phone)}</span>` : ""}${c.phone && (c.price||c.addr) ? " · " : ""}${c.price ? "₹"+esc(c.price)+"/"+UL() : ""}${c.price && c.addr ? " · " : ""}${esc(c.addr||"")}</div>${custMeta(c)}</div>
      ${(()=>{ const k = today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0"), due = monthDue(c.id,0,c), paid = isPaid(c,k); return `<div class="cust-due"><b>${fmtMoney(paid ? 0 : due)}</b><span class="${paid ? "ok" : ""}">${paid ? t("custPaid") + " " + fmtMoney(due) : t("custDueMonth")}</span></div>`; })()}
      <button type="button" class="cust-del" data-del="${esc(c.id)}" aria-label="${t("custDel")}">✕</button>
    </div>`).join("") : `<div class="cust-empty">${t("custEmpty")}</div>`;
}
function goHome(){
  const all = fullList(); activeCust = null; rest = []; entries = all; focusDate = null;
  document.body.classList.add("home"); const tt = $("toast"); if(tt) tt.classList.remove("show"); renderCustomers(); window.scrollTo(0,0);
}
function selectCustomer(id){
  const c = customers.find(x=>x.id===id); if(!c) return;
  const all = fullList(); activeCust = id; entries = all.filter(e=>e.cust===id); rest = all.filter(e=>e.cust!==id);
  focusDate = null; year = today.getFullYear(); month = today.getMonth()+1;
  document.body.classList.remove("home");
  $("custBarName").textContent = c.name;
  $("custBarSub").innerHTML =
    (c.addr ? `<span class="cb-addr">${esc(c.addr)}</span>` : "") +
    (c.phone || c.price ? `<span class="cb-row">${(c.phone ? `<span class="cb-ph"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>${esc(c.phone)}</span>` : "")}${(c.price ? `<span class="cb-rate">₹${esc(c.price)}/${UL()}</span>` : "")}</span>` : "");
  renderAll(); window.scrollTo(0,0);
}
$("custBtn").onclick = () => { closeDrawer(); goHome(); };
if($("backHome")) $("backHome").onclick = goHome;
const monthKey = () => year + "-" + String(month).padStart(2,"0");
const isPaid = (c,k) => !!(c && c.paid && c.paid[k||monthKey()]);
const dayPaid = (c,key) => !!(c && c.paid && (c.paid[key] || c.paid[key.slice(0,7)]));
const curCust = () => (typeof customers!=="undefined" && activeCust) ? customers.find(x=>x.id===activeCust) : null;
const scopePaid = c => focusDate ? dayPaid(c,focusDate) : isPaid(c);
function updatePaidBtn(){
  const c = customers.find(x=>x.id===activeCust), b = $("cbPaid"); if(!b) return;
  const p = scopePaid(c); b.classList.toggle("paid", p); b.classList.toggle("unpaid", !p); b.setAttribute("aria-pressed", p?"true":"false");
  $("cbPaidTxt").textContent = t(p ? "custPaid" : "custUnpaid");
}
$("cbPaid").onclick = () => {
  const c = customers.find(x=>x.id===activeCust); if(!c) return;
  c.paid = c.paid || {};
  if(focusDate){
    if(c.paid[monthKey()]){ showToast(t("paidMonthCovers")); return; }
    if(c.paid[focusDate]) delete c.paid[focusDate]; else c.paid[focusDate] = true;
  } else {
    const k = monthKey(); if(c.paid[k]) delete c.paid[k]; else c.paid[k] = true;
  }
  saveCustomers(); updatePaidBtn(); renderAll(); haptic("success");
  if(scopePaid(c)) burstAt($("cbPaid"));
};
$("cbCopy").onclick = () => copyClipboard();
$("cbRecv").onclick = () => openRecv();
$("cbRange").onclick = () => openBulk();
$("cbPdf").onclick = () => exportPdf();
$("fmtA4").onclick = () => exportBill("a4");
$("fmtThermal").onclick = () => exportBill("thermal");
function waBillText(custId, y, m){
  const hi = lang==="hi", c = customers.find(x=>x.id===custId);
  const list = fullList().filter(e=>e.cust===custId && (d=>d.getFullYear()===y && d.getMonth()+1===m)(new Date(e.date))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!list.length) return "";
  const nf = new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}), nm = new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
  const rs = n => "₹"+nm.format(n), month = (hi ? HI_MONTHS[m-1] : monthLong(y,m)), bar = "━━━━━━━━━━━━━━━━━━";
  const first = new Date(list[0].date).getDate(), last = new Date(list[list.length-1].date).getDate();
  const span = first===last ? `${first} ${month} ${y}` : `${first}–${last} ${month} ${y}`;
  const groups = {};
  list.forEach(e=>{ const k = itemOf(e)+"|"+(e.unit==="kg"?"kg":"L")+"|"+(Number(e.amount)||0); const g = groups[k] || (groups[k] = { e, q:0, a:Number(e.amount)||0 }); g.q += Number(e.quantity)||0; });
  const uw = (e,q) => e.unit==="kg" ? (hi?"किग्रा":"kg") : (hi?"लीटर":(q===1?"litre":"litres"));
  const lines = Object.values(groups).map(g=>{ const milk = itemOf(g.e)==="milk"; return `${milk?"🥛 ":""}${ITEMS[itemOf(g.e)][hi?"hi":"en"]}: ${nf.format(g.q)} ${uw(g.e,g.q)} × ${rs(g.a).replace(/\.00$/,"")} = ${rs(g.q*g.a)}`; });
  const total = list.reduce((x,e)=>x+lineTotal(e),0), paid = list.filter(e=>c && dayPaid(c, fmtDateInput(e.date))).reduce((x,e)=>x+lineTotal(e),0), due = Math.max(0,total-paid);
  const first1 = String(c ? c.name : "").trim().split(/\s+/)[0] || "";
  const upi = (typeof savedUpi==="function" && savedUpi()) || "";
  const out = hi ? [
    `*दूध का बिल — ${month} ${y}*`, "", `नमस्ते ${first1} जी,`, "", `${span} के आपके दूध बिल का विवरण नीचे दिया गया है।`, "", bar, "*बिल विवरण*", bar,
    lines.join("\n\n"), "", bar, `*कुल राशि: ${rs(total)}*`] : [
    `*MILK BILL — ${month.toUpperCase()} ${y}*`, "", `Namaste ${first1} Ji,`, "", `Please find below your milk bill details for ${span}.`, "", bar, "*BILL DETAILS*", bar,
    lines.join("\n\n"), "", bar, `*TOTAL AMOUNT: ${rs(total)}*`];
  if(paid>0) out.push(hi ? `भुगतान प्राप्त: ${rs(paid)}` : `Already paid: ${rs(paid)}`, hi ? `*बकाया: ${rs(due)}*` : `*BALANCE DUE: ${rs(due)}*`);
  out.push(bar);
  if(upi && due>0) out.push("", hi ? `UPI भुगतान: ${upi}` : `UPI Payment: ${upi}`, "", hi ? `कृपया ${rs(due).replace(/\.00$/,"")} UPI से भेज दें।` : `Kindly pay the ${paid>0?"balance":"total"} amount of ${rs(due).replace(/\.00$/,"")} via UPI.`);
  out.push("", hi ? "धन्यवाद! 🙏" : "Dhanyavaad! 🙏");
  return out.join("\n");
}
const waLink = (ph, text) => { const n = ph ? (ph.length===10 ? "91"+ph : ph) : ""; const q = (n ? "phone="+n+"&" : "") + "text=" + encodeURIComponent(text); const mob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent||""); return mob ? "https://wa.me/" + n + "?text=" + encodeURIComponent(text) : "https://web.whatsapp.com/send?" + q; };   // phones: the universal wa.me link opens the app (custom schemes are blocked inside sandboxed pages)
const openWa = (ph, text) => { try{ navigator.clipboard && navigator.clipboard.writeText(text).catch(()=>{}); }catch(e){}
  const a = document.createElement("a"); a.href = waLink(ph, text); a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); showToast(t("waCopied")); };
async function sendBillWa(kind, custId, msg, withPdf){
  closeOverlay("fmtSheet");
  const saved = { a:activeCust, e:entries, r:rest, f:focusDate };
  if(custId){ const all = fullList(); activeCust = custId; entries = all.filter(e=>e.cust===custId); rest = all.filter(e=>e.cust!==custId); focusDate = null; }
  let c, name, text, html;
  try{
    c = billCust();
    const base = (c ? c.name.replace(/[^\w\u0900-\u097F]+/g,"-")+"-" : "") + year + "-" + String(month).padStart(2,"0");
    name = (kind==="thermal" ? "MilkyTrack-Receipt-" : "MilkyTrack-Bill-") + base;
    text = msg || buildCopyText(sortedAsc(billEntries()));
    await loadJs("bill");
    html = kind==="thermal" ? buildThermalHtml() : buildPdfHtml();
  } finally { if(custId){ activeCust = saved.a; entries = saved.e; rest = saved.r; focusDate = saved.f; } }
  const ph = c && c.phone ? String(c.phone).replace(/\D/g,"") : "";
  const openChat = () => openWa(ph, text);
  if(ph){   // short bill message (like the Remind one)
    const r = (repStats(year,month).rows||[]).find(x=>String(x.id)===String(activeCust||custId));
    const wt = waBillText(activeCust||custId, year, month); if(wt) text = wt; else if(r) text = t("waBillMsg",{name:r.name,amt:fmtMoney(r.bill),due:r.due>0?fmtMoney(r.due):t("custPaid"),m:monthLong(year,month)+" "+year});
  }
  if(ph && !withPdf){ openChat(); return; }   // message only: just open their chat, no PDF
  showToast(t("waSending"));
  try{
    if(withPdf){   // send the bill as a picture (JPG) instead of a PDF
      const imgs = await htmlToPdfBlob(html, { thermal: kind==="thermal", images:true });
      const files = imgs.map((b,i)=>new File([b], name + (imgs.length>1 ? "-"+(i+1) : "") + ".jpg", { type:"image/jpeg" }));
      if(navigator.canShare && navigator.canShare({ files })){ await navigator.share({ files, text:text }); return; }
      files.forEach(f=>{ const u = URL.createObjectURL(f), a = document.createElement("a"); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u), 8000); });
      showToast(t("waAttach")); setTimeout(openChat, 900); return;
    }
    const blob = await htmlToPdfBlob(html, kind==="thermal" ? { thermal:true } : undefined);
    const file = new File([blob], name + ".pdf", { type:"application/pdf" });
    if(navigator.canShare && navigator.canShare({ files:[file] })){ await navigator.share({ files:[file], text:text }); return; }   // phone: pick WhatsApp, then the customer; PDF + message go together
    if(ph){   // no file sharing here: save the PDF, then open the customer's chat to attach it
      const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name + ".pdf"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u), 8000);
      showToast(t("waAttach")); setTimeout(openChat, 900); return;
    }
  }catch(err){ if(err && err.name==="AbortError") return; }
  openChat();
}
$("fmtClose").onclick = () => closeOverlay("fmtSheet");
$("privLink").addEventListener("click", ev=>{ ev.preventDefault(); $("privBody").innerHTML = t("privBody"); openOverlay("privSheet","privBox"); });
$("privClose").onclick = () => closeOverlay("privSheet");
$("privSheet").addEventListener("click", ev=>{ if(ev.target===$("privSheet")) closeOverlay("privSheet"); });
$("fmtSheet").addEventListener("click", ev=>{ if(ev.target===$("fmtSheet")) closeOverlay("fmtSheet"); });
$("cbPrev").onclick = () => $("prevMonth").click();
$("cbNext").onclick = () => $("nextMonth").click();
$("addCustBtn").onclick = () => { openOverlay("custSheet","custBox"); setTimeout(()=>$("cName").focus(),60); };
$("custClose").onclick = () => closeOverlay("custSheet");
$("custSheet").addEventListener("click", ev=>{ if(ev.target===$("custSheet")) closeOverlay("custSheet"); });
$("cSearch").addEventListener("input", renderCustomers);
const savedUpi = () => { try{ return (JSON.parse(localStorage.getItem(UPI_KEY)||"{}").pa)||""; }catch(err){ return ""; } };
function saveUpiId(pa){ pa=(pa||"").trim(); if(!pa) return; let sv={}; try{ sv=JSON.parse(localStorage.getItem(UPI_KEY)||"{}"); }catch(err){} sv.pa=pa; try{ localStorage.setItem(UPI_KEY, JSON.stringify(sv)); }catch(err){} }
const phoneDigits = v => { v = String(v||"").trim(); if(v.startsWith("+91")) v = v.slice(3); let d = v.replace(/\D/g,""); if(d.length>10 && d.startsWith("91")) d = d.slice(2); return d.slice(0,10); };
const fmtPhone = d => d ? "+91 " + d.slice(0,5) + (d.length>5 ? " " + d.slice(5) : "") : "";
$("cPhone").addEventListener("focus", () => { if(!$("cPhone").value) $("cPhone").value = "+91 "; });
$("cPhone").addEventListener("input", () => { $("cPhone").value = fmtPhone(phoneDigits($("cPhone").value)) || ($("cPhone").value.trim() ? "+91 " : ""); });
$("cPhone").addEventListener("blur", () => { if($("cPhone").value.trim()==="+91") $("cPhone").value = ""; });
$("cAdd").onclick = () => {
  const name = $("cName").value.trim();
  if(!name){ showToast(t("custNeedName")); $("cName").focus(); return; }
  const pd = phoneDigits($("cPhone").value); if(pd && pd.length!==10){ showToast(t("custBadPhone")); return; }
  const c = { id:"c"+Date.now().toString(36)+Math.floor(Math.random()*1e3), name, phone:fmtPhone(pd), price:$("cPrice").value.trim(), addr:$("cAddr").value.trim() };
  customers.push(c); saveCustomers(); ["cName","cPhone","cPrice","cAddr"].forEach(i=>$(i).value=""); closeOverlay("custSheet"); renderCustomers(); showToast(t("custAdded"));
};
$("custList").addEventListener("click", ev=>{
  const b = ev.target.closest("[data-del]");
  if(b){
    if(!b.classList.contains("armed")){ b.classList.add("armed"); b.textContent = t("custSure"); setTimeout(()=>{ if(b.isConnected){ b.classList.remove("armed"); b.textContent = "✕"; } }, 2500); return; }
    const id = b.dataset.del, removed = customers.find(c=>c.id===id), gone = entries.filter(e=>e.cust===id);
    customers = customers.filter(c=>c.id!==id); entries = entries.filter(e=>e.cust!==id); saveCustomers(); save(); renderCustomers();
    showToast(t("custDeleted"), ()=>{ customers.push(removed); entries.push(...gone); saveCustomers(); save(); renderCustomers(); });
    return;
  }
  const it = ev.target.closest(".cust-item"); if(it) selectCustomer(it.dataset.id);
});
