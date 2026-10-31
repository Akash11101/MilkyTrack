/* The delivery cards (renderList), day strip and today button. */
/* ---------- list ---------- */
const svgI = (p,sz=22,sw=1.8) => `<svg class="ico" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC_CAL = svgI('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" stroke-width="2.4"/>',26);
const IC_NOTE = svgI('<path d="M7 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M8.5 11h7M8.5 14.5h7"/>',20);
const IC_DROP = '<svg class="ico drop" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5c3.6 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.100 2.400-6.300 6-10.500z"/></svg>';
const IC_RUPEE = '<span class="ico rupee" aria-hidden="true">₹</span>';
const IC_LOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const IC_UNLOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>';
const IC_OK = '<svg class="ico ok" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 12.500l3.200 3.200L17 8.800" fill="none" stroke="#fff" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const qtyLbl = () => `${t("qtyW")} (${UL()})`, rateLbl = () => `${t("rateW")} (₹/${UL()})`;
const amtText = e => fmtMoney(lineTotal(e));
const calcText = e => `${t("rcAmount")} ${fmtMoney(lineTotal(e))} = ${fmtNum(Number(e.quantity)||0)} ${unitWord(e,lang==="hi")} × ${fmtMoney(Number(e.amount)||0).replace(/\.00$/,"")}`;
function updateRowTotals(){
  document.querySelectorAll("#listView .row").forEach(r=>{
    const e = entries.find(x=>x._id===r.dataset.id), el = r.querySelector(".rf-total");
    if(e && el) el.textContent = amtText(e);
  });
}
const stepperGroup = (cls, label, val, ariaLabel, extra="") => `
  <div class="field"><span class="flabel">${label}</span>
    <div class="num-ctl">
      <button type="button" class="stepper ${cls}-minus" aria-label="${t("decLabel",{label:ariaLabel})}">−</button>
      <input type="number" inputmode="decimal" step="0.5" min="0" class="f-${cls}" aria-label="${ariaLabel}" value="${val}">
      <button type="button" class="stepper ${cls}-plus" aria-label="${t("incLabel",{label:ariaLabel})}">+</button>
    </div>${extra}
  </div>`;
const footerHtml = () => entries.length
  ? `<div class="foot">${t("savedDevice")} · <button type="button" class="reset-btn" id="resetBtn">${t("clearAll")}</button></div>` : "";
let lastAddedId = null;
function renderList(){
  const el = $("listView");
  const all = entriesForMonth();
  let items = focusDate ? all.filter(e=>fmtDateInput(e.date)===focusDate) : all;
  items = items.map((e,i)=>[e,i]).sort((a,b)=>(fmtDateInput(a[0].date)<fmtDateInput(b[0].date)?-1:fmtDateInput(a[0].date)>fmtDateInput(b[0].date)?1:a[1]-b[1])).map(x=>x[0]);   // oldest date first; on the same date, the order you added them (a new card goes last within its day)
  const banner = focusDate
    ? `<div class="focus-banner"><span>${t("focusedOn",{date:dayMonthLong(parseLocal(focusDate))})}</span><button type="button" id="focusClear">${t("showAllDays")}</button></div>`
    : "";
  if(!items.length){
    el.innerHTML = banner + `<div class="empty-state"><strong>${t(focusDate?"noDeliveriesDay":"noDeliveries")}</strong>${focusDate?"":t("tapFirst")}</div>`;
    return;
  }
  el.innerHTML = banner + items.map(e=>`
    <div class="row ${e._id===freshId?"new":""}${e.locked?" rowlocked":""}${(()=>{ const c = curCust(); return c && dayPaid(c,fmtDateInput(e.date)) ? " paidrow" : ""; })()}" data-id="${e._id}" data-date="${fmtDateInput(e.date)}" data-del="${t("swipeDel")}">
      <div class="row-top">
        <label class="date-wrap">${IC_CAL}<span class="date-text">${fmtDateNice(e.date)}</span>${(()=>{ const c = e.cust && customers.find(x=>x.id===e.cust); return c ? `<span class="cust-tag">${esc(c.name)}</span>` : ""; })()}<input type="date" class="f-date" aria-label="${t("dateLabel")}" value="${fmtDateInput(e.date)}"></label>
        <button type="button" class="it-btn it-${itemOf(e)}" aria-label="${t("itemLabel")}" title="${t("itemLabel")}">${itemName(e)}</button>
      </div>
      <div class="note-line">
<label class="note-pill">${IC_NOTE}<textarea class="f-note" rows="1" placeholder="${t("notePh")}" aria-label="${t("noteLabel")}">${esc(e.note||"")}</textarea><span class="note-count">${noteWords(e.note)}/${NOTE_WORDS}</span></label>
      </div>
      <div class="row-fields">
        ${withUnit(e.unit==="kg"?"kg":"L",()=>stepperGroup("qty",IC_DROP+qtyLbl(),e.quantity,qtyLbl())+stepperGroup("amt",IC_RUPEE+rateLbl(),e.amount,rateLbl(),`<span class="delta" data-for="${e._id}"></span>`))}
      </div>
      <div class="row-foot"><span class="rf-ok">${IC_OK}${t("rowDelivered")}</span><span class="rf-dot">•</span><span class="rf-total">${amtText(e)}</span><button type="button" class="icon-btn rlock" aria-pressed="${!!e.locked}" aria-label="${t(e.locked?"unlockEntry":"lockEntry")}" title="${t(e.locked?"unlockEntry":"lockEntry")}">${e.locked?IC_LOCK:IC_UNLOCK}</button></div>
    </div>`).join("") + footerHtml();
  renderDeltas();
  el.querySelectorAll(".f-note").forEach(noteSync);
  if(freshId){
    const row = el.querySelector(`.row[data-id="${freshId}"]`);
    if(row){ const inp = row.querySelector(".f-qty"); inp.focus(); inp.select(); row.scrollIntoView({block:"center",behavior:"smooth"}); }
    freshId = null;
  }
}
const isCurrentMonthView = () => month===today.getMonth()+1 && year===today.getFullYear();
function renderTodayCard(){
  const el = $("todayCard");
  if(!isCurrentMonthView()){ el.innerHTML = ""; return; }
  const key = fmtDateInput(today), mineAll = entries.filter(e=>fmtDateInput(e.date)===key), mine = mineAll[0];
  const dayL = litSum(mineAll), dayTotal = mineAll.reduce((s,e)=>s+lineTotal(e),0);
  el.innerHTML = mine
    ? `<button type="button" class="today-card done" id="todayGo"><span class="tc-lbl"><svg class="tc-ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>${t("deliveredToday").replace(/^✓\s*/,"")}</span><span class="today-meta">${fmtNum(dayL)} ${UL()} · ${fmtMoney(dayTotal)}</span></button>`
    : `<button type="button" class="today-card" id="todayMark"><svg class="tc-ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg><span>${t("markToday")}</span></button>`;
}
$("todayCard").addEventListener("click", ev=>{
  if(ev.target.closest("#todayMark")){
    const e = { _id:newId(), ...autoEntry(today) };
    const br = ev.target.closest("#todayMark").getBoundingClientRect();
    entries.push(e); freshId = e._id; lastAddedId = e._id; renderAll(); burst(br.left + br.width/2, br.top + br.height/2);
    showToast(t("todayLogged"), ()=>{ entries = entries.filter(x=>x._id!==e._id); renderAll(); });
    return;
  }
  if(ev.target.closest("#todayGo")){
    const key = fmtDateInput(today), mine = entries.find(e=>fmtDateInput(e.date)===key);
    const row = mine && document.querySelector(`.row[data-id="${mine._id}"]`);
    if(row){ row.scrollIntoView({block:"center",behavior:"smooth"}); row.classList.add("new"); setTimeout(()=>row.classList.remove("new"),900); }
  }
});
function shortDow(dt){
  const s = dt.toLocaleString(locale(),{weekday:"short"});
  if(lang!=="hi") return s.slice(0,2);
  try{ return [...new Intl.Segmenter("hi",{granularity:"grapheme"}).segment(s)].slice(0,3).map(x=>x.segment).join(""); }
  catch(err){ return s; }
}
function renderDayStrip(){
  const el = $("dayStrip"), n = new Date(year,month,0).getDate();
  const todayKey = fmtDateInput(today);
  let html = "";
  for(let d=1; d<=n; d++){
    const dt = new Date(year,month-1,d), key = fmtDateInput(dt);
    const count = entries.filter(e=>fmtDateInput(e.date)===key).length;
    const dow = shortDow(dt);
    const cls = ["day-chip", count>1?"multi":count?"has":"", key===todayKey?"today":"", key===focusDate?"focused":""].filter(Boolean).join(" ");
    html += `<button type="button" class="${cls}" data-date="${key}" aria-pressed="${key===focusDate}" aria-label="${dt.toLocaleDateString(locale())}${count?`, ${count} ${nounDelivery(count)} logged`:", no delivery logged yet"}">
      <span class="dow">${dow}</span><span class="dnum">${d}</span><span class="dot">${count>1?count:""}</span></button>`;
  }
  el.innerHTML = html;
  const mine = el.querySelector(focusDate ? `.day-chip.focused` : `.day-chip.today`);
  if(mine) mine.scrollIntoView({block:"center",inline:"nearest"});
}
$("dayStrip").addEventListener("click", ev=>{
  const chip = ev.target.closest(".day-chip"); if(!chip) return;
  const key = chip.dataset.date;
  const mine = entries.find(e=>fmtDateInput(e.date)===key);
  if(focusDate===key){ focusDate = null; renderAll(); return; }
  focusDate = key; renderAll();
  if(mine){
    const row = document.querySelector(`.row[data-id="${mine._id}"]`);
    if(row){ row.classList.add("new"); setTimeout(()=>row.classList.remove("new"),900); }
  }
});
$("quickAddBtn").onclick = () => {
  const useFocus = !!focusDate;
  let dt;
  if(useFocus){ const [y,m,d] = focusDate.split("-").map(Number); dt = new Date(y,m-1,d); }
  else dt = monthDay();
  const e = { _id:newId(), ...autoEntry(dt) };
  entries.push(e); freshId = e._id; lastAddedId = e._id; renderAll();
  const msg = useFocus ? t("loggedFor",{date:dayMonthLong(dt)}) : t("todayLogged");
  showToast(msg, ()=>{ entries = entries.filter(x=>x._id!==e._id); renderAll(); });
};
function renderAll(){ unit = monthUnit(entriesForMonth()); renderTop(); renderHero(); renderList(); renderTodayCard(); renderDayStrip(); applyLock(); armAllAutoLocks(); }
/* entry lock: when on, nothing that changes data can be tapped, so a stray
   touch can't edit, delete or add an entry. Browsing (day strip, month) still works. */
const LOCK_KEY = "milk-ledger-locked";
let locked = false; try{ localStorage.setItem(LOCK_KEY,"0"); }catch(err){}   // master lock button removed; clear any old saved state
function paidLocked(){ try{ const c = (typeof customers!=="undefined" && activeCust) ? customers.find(x=>x.id===activeCust) : null; return !!(c && !document.body.classList.contains("home") && isPaid(c)); }catch(err){ return false; } }
const isLocked = () => locked || paidLocked();
function applyLock(){
  const L = isLocked();
  document.body.classList.toggle("locked", L);
  document.body.classList.toggle("paidlock", paidLocked());
  document.querySelectorAll("#listView .row input,#listView .row button,#resetBtn").forEach(el=>{ el.disabled = L; });
  document.querySelectorAll("#listView .row.paidrow").forEach(r=>r.querySelectorAll("input,textarea,button").forEach(el=>{ el.disabled = true; }));
  document.querySelectorAll("#listView .row.rowlocked").forEach(r=>r.querySelectorAll("input,textarea,button").forEach(el=>{ if(!el.classList.contains("rlock")) el.disabled = true; }));
  const b = $("lockBtn"); if(!b) return;
  b.setAttribute("aria-pressed", String(locked));
  const l = t(locked ? "unlockEntries" : "lockEntries");
  b.setAttribute("aria-label", l); b.setAttribute("title", l);
}
function setLocked(v){
  locked = v; try{ localStorage.setItem(LOCK_KEY, v?"1":"0"); }catch(err){}
  applyLock(); showToast(t(v?"lockOn":"lockOff"));
}
$("lockBtn").onclick = () => setLocked(!locked);
const LOCK_GUARD = "#listView .row,#todayMark,#quickAddBtn,#bAdd,#bRemove,#rangeBtn,#cbRange,#resetBtn,#restoreGo";
["pointerdown","click"].forEach(n=>document.addEventListener(n, ev=>{
  if(!isLocked() || !ev.target.closest) return;
  if(!ev.target.closest(LOCK_GUARD)) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  if(n==="click") showToast(t(paidLocked() && !locked ? "paidLockedMsg" : "lockedMsg"));
}, true));
function addRow(){
  const e = { _id:newId(), ...autoEntry(monthDay()) };
  entries.push(e); freshId = e._id; lastAddedId = e._id; renderAll();
}
function showToast(msg, fn){ try{ haptic("success"); }catch(e){}
  undoFn = fn || null;
  $("toastMsg").textContent = msg; $("toastUndo").style.display = fn ? "" : "none";
  $("toast").classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>$("toast").classList.remove("show"), 5000);
}
function deleteRow(id){
  const idx = entries.findIndex(e=>e._id===id); if(idx<0) return;
  const removed = entries[idx];
  entries.splice(idx,1); renderAll();
  showToast(t("deliveryDeleted"), ()=>{ entries.splice(idx,0,removed); renderAll(); });
}
$("toastUndo").onclick = () => { if(undoFn){ const f = undoFn; undoFn = null; f(); } $("toast").classList.remove("show"); };
/* delegated list events: typing never re-renders, so focus is never lost */
const listEl = $("listView");
const rowEntry = t => { const r = t.closest(".row"); const e = r ? entries.find(e=>e._id===r.dataset.id) : null; return e && (e.locked || (()=>{ const c = curCust(); return c && dayPaid(c,fmtDateInput(e.date)); })()) ? null : e; };   // locked entries are read-only
