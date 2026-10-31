/* Bulk add / remove deliveries by date range. */
/* ---------- bulk add by date range ---------- */
const BULK_MAX = 366;
const bulk = { qty:0.5, amt:60, step:"1" };
const parseLocal = v => { if(!v) return null; const [y,m,d]=v.split("-").map(Number); return new Date(y,m-1,d); };
function bulkDates(){
  const f = parseLocal($("bFrom").value), t = parseLocal($("bTo").value);
  if(!f || !t || t<f) return [];
  const out = [], inc = (bulk.step==="weekdays" || bulk.step==="twice") ? 1 : Number(bulk.step);
  for(let d=new Date(f); d<=t && out.length<=BULK_MAX; d.setDate(d.getDate()+inc)){
    if(bulk.step==="weekdays" && (d.getDay()===0 || d.getDay()===6)) continue;
    out.push(new Date(d));
  }
  return out;
}
function syncChips(){ document.querySelectorAll("#chips .chip").forEach(c=>c.setAttribute("aria-pressed", String(c.dataset.step===bulk.step))); }
function bulkPlan(){
  const all = bulkDates();
  const q = Math.max(0, Number(bulk.qty)||0), a = Math.max(0, Number(bulk.amt)||0);
  const ds = bulk.step==="twice" ? all.flatMap(d=>[new Date(d), new Date(d)]) : all;
  return { all, ds, q, a };
}
function rangeRemovable(){
  const f = parseLocal($("bFrom").value), toD = parseLocal($("bTo").value);
  if(!f || !toD || toD<f) return { hit:[], paid:0 };
  const a = fmtDateInput(f), b = fmtDateInput(toD), c = curCust();
  const inR = entries.filter(e=>{ const k = fmtDateInput(e.date); return k>=a && k<=b; });
  const hit = inR.filter(e=>!(c && dayPaid(c,fmtDateInput(e.date))));
  return { hit, paid: inR.length-hit.length };
}
function renderRemoveBtn(){
  const rb = $("bRemove"); if(!rb) return;
  const { hit, paid } = rangeRemovable(), n = hit.length;
  rb.disabled = n===0;
  rb.title = n ? t("rmNRange",{n,word:nounDelivery(n)}) + (paid ? t("rmSkipPaid",{p:paid}) : "") : t("rmRange");
  const rs = $("bRemSub"); if(rs) rs.textContent = n ? rb.title : "";
}
function renderBulkSummary(){
  renderRemoveBtn();
  const box = $("bSummary"), btn = $("bAdd");
  const f = parseLocal($("bFrom").value), toD = parseLocal($("bTo").value);
  const bad = msg => { box.innerHTML = `<span class="bad">${msg}</span>`; btn.disabled = true };
  if(!f || !toD) return bad(t("pickDates"));
  if(toD<f) return bad(t("endBeforeStart"));
  const { all, ds, q, a } = bulkPlan();
  if(all.length>BULK_MAX) return bad(t("tooMany",{max:BULK_MAX}));
  if(!all.length) return bad(t("noMatchDates"));
  const n = ds.length;
  let html = n
    ? `<div class="bs-main"><strong>${n}</strong> ${nounDelivery(n)}</div><div class="bs-sub">${t("deliveryTotal",{l:fmtNum(q*n),amt:fmtMoney(q*a*n)})}</div>`
    : `<div class="bs-main">${t("nothingToAdd")}</div>`;
  box.innerHTML = html;
  btn.disabled = n===0;
}
function openBulk(){
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const pre = autoEntry(start);
  bulk.qty = pre.quantity; bulk.amt = pre.amount; bulk.step = "1";
  $("bFrom").value = fmtDateInput(start); $("bTo").value = fmtDateInput(end);
  $("bQty").value = bulk.qty; $("bAmt").value = bulk.amt;
  syncChips(); renderBulkSummary(); rcSync();
  openOverlay("sheet","sheetBox");
}
function closeBulk(){ closeOverlay("sheet"); }
$("bFrom").addEventListener("change", ()=>{
  const f=$("bFrom").value; if(!f) return;
  if(!$("bTo").value || $("bTo").value < f) $("bTo").value = f;
  renderBulkSummary();
  setTimeout(()=>{ try{ $("bTo").focus(); if($("bTo").showPicker) $("bTo").showPicker(); }catch(e){} }, 120);
});
["input","change"].forEach(n=>{ $("bFrom").addEventListener(n, renderBulkSummary); $("bTo").addEventListener(n, renderBulkSummary); });
["bQty","bAmt"].forEach(id=>{
  $(id).addEventListener("input", ()=>{ bulk[id==="bQty"?"qty":"amt"] = Math.max(0, Number($(id).value)||0); renderBulkSummary(); });
  $(id).addEventListener("focus", ()=>$(id).select());
});
$("sheet").addEventListener("click", ev=>{
  if(ev.target===$("sheet")) return closeBulk();
  const chip = ev.target.closest(".chip");
  if(chip){ bulk.step = chip.dataset.step; syncChips(); renderBulkSummary(); return; }
  const st = ev.target.closest(".b-step");
  if(st){
    const inp = $(st.dataset.t), v = Math.max(0, round1((Number(inp.value)||0) + Number(st.dataset.dir)*0.5));
    inp.value = v; bulk[st.dataset.t==="bQty"?"qty":"amt"] = v; renderBulkSummary();
  }
});
$("sheetClose").onclick = closeBulk;
$("bCancel").onclick = closeBulk;
$("bRemove").onclick = () => {
  const { hit } = rangeRemovable(); if(!hit.length) return;
  const ids = new Set(hit.map(e=>e._id)), gone = entries.filter(e=>ids.has(e._id));
  entries = entries.filter(e=>!ids.has(e._id));
  closeBulk(); renderAll();
  showToast(t("nRemoved",{n:gone.length,word:nounDelivery(gone.length)}), ()=>{ entries.push(...gone); renderAll(); });
};
document.addEventListener("keydown", ev=>{ if(ev.key==="Escape"){ const o = document.querySelector(".sheet-overlay.show"); if(o) closeOverlay(o.id); } });
$("bAdd").onclick = () => {
  const { ds, q, a } = bulkPlan(); if(!ds.length || ds.length>BULK_MAX) return;
  const added = ds.map(d=>({ _id:newId(), date:d, quantity:q, amount:a, locked:true, ...(unit==="kg" ? {unit:"kg"} : {}) }));   // range entries start locked
  entries.push(...added);
  const ids = new Set(added.map(e=>e._id));
  month = ds[0].getMonth()+1; year = ds[0].getFullYear();   // jump to the first added month
  closeBulk(); renderAll();
  showToast(t("nAdded",{n:added.length,word:nounDelivery(added.length)}), ()=>{ entries = entries.filter(e=>!ids.has(e._id)); renderAll(); });
};
