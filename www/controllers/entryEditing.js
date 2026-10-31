/* Editing a card: steppers, inputs, notes. */
function stepField(btn){
  const entry = rowEntry(btn); if(!entry) return;
  const isQty = btn.classList.contains("qty-minus") || btn.classList.contains("qty-plus");
  const field = isQty ? "quantity" : "amount";
  const dir = btn.classList.contains("qty-minus") || btn.classList.contains("amt-minus") ? -1 : 1;
  entry[field] = Math.min(field==="quantity"?MAX_QTY:MAX_AMT, Math.max(0, round1((Number(entry[field])||0) + dir*0.5)));
  btn.parentElement.querySelector("input").value = entry[field];
  renderHero();
}
let holdTimer = null, holdInt = null;
const stopHold = () => { clearTimeout(holdTimer); clearInterval(holdInt); };
listEl.addEventListener("pointerdown", ev=>{      // press and hold a − or + to keep stepping
  const btn = ev.target.closest(".stepper"); if(!btn) return;
  ev.preventDefault(); stepField(btn);
  holdTimer = setTimeout(()=>{ holdInt = setInterval(()=>stepField(btn), 90); }, 420);
});
["pointerup","pointercancel"].forEach(n=>document.addEventListener(n, stopHold));
listEl.addEventListener("click", ev=>{
  const tgt = ev.target;
  if(tgt.id==="focusClear"){ focusDate = null; renderAll(); return; }
  if(tgt.id==="resetBtn"){
    if(tgt.dataset.armed){
      const inMonth = e => { const d = new Date(e.date); return d.getFullYear()===year && d.getMonth()+1===month; };
      const backup = entries, c = curCust(), pk = year+"-"+String(month).padStart(2,"0"), oldPaid = c && c.paid ? JSON.parse(JSON.stringify(c.paid)) : null;
      entries = entries.filter(e=>!inMonth(e));
      if(c && c.paid){ Object.keys(c.paid).forEach(k=>{ if(k.slice(0,7)===pk) delete c.paid[k]; }); saveCustomers(); }
      focusDate = null; renderAll(); if(typeof renderCustomers==="function") renderCustomers();
      showToast(t("allCleared"), ()=>{ entries = backup; if(c && oldPaid){ c.paid = oldPaid; saveCustomers(); } renderAll(); if(typeof renderCustomers==="function") renderCustomers(); }); return; }
    tgt.dataset.armed = "1"; tgt.textContent = t("tapAgainErase");
    setTimeout(()=>{ if(tgt.isConnected){ delete tgt.dataset.armed; tgt.textContent = t("clearAll"); } }, 3000);
    return;
  }
  const entry = rowEntry(tgt); if(!entry) return;
  if(tgt.closest(".del")){ deleteRow(entry._id); return; }
  const it = tgt.closest(".it-btn");
  if(it){ const nx = ITEM_ORDER[(ITEM_ORDER.indexOf(itemOf(entry))+1)%ITEM_ORDER.length]; entry.item = nx; if(nx==="milk") delete entry.unit; else entry.unit = "kg"; { const dp = defaultPrice(nx); if(dp) entry.amount = dp; } save(); renderAll(); return; }
  const ru = tgt.closest(".ru-btn");
  if(ru){ const u = ru.dataset.u==="kg" ? "kg" : "L"; if((entry.unit==="kg"?"kg":"L")===u) return; if(u==="kg") entry.unit = "kg"; else delete entry.unit; save(); renderAll(); return; }
  const btn = tgt.closest(".stepper");
  if(btn && ev.detail===0) stepField(btn);        // keyboard activation only; pointer handled above
});
listEl.addEventListener("input", ev=>{
  const t = ev.target, entry = rowEntry(t); if(!entry) return;
  if(t.classList.contains("f-note")){ noteSync(t); entry.note = t.value; save(); }
  if(t.classList.contains("f-qty")){ entry.quantity = Math.min(MAX_QTY, Math.max(0, Number(t.value)||0)); if(Number(t.value)>MAX_QTY) t.value = entry.quantity; renderHero(); }
  if(t.classList.contains("f-amt")){ entry.amount = Math.min(MAX_AMT, Math.max(0, Number(t.value)||0)); if(Number(t.value)>MAX_AMT) t.value = entry.amount; renderHero(); }
});
["pointerdown","click"].forEach(n=>listEl.addEventListener(n, ev=>{
  const r = ev.target.closest && ev.target.closest(".row.rowlocked,.row.paidrow"); if(!r || (ev.target.closest(".rlock") && !r.classList.contains("paidrow"))) return;
  if(n==="click" && !ev.target.closest(".note-pill")) showToast(t(r.classList.contains("paidrow") ? "paidLockedMsg" : "entryLockedMsg"));
}, true));
listEl.addEventListener("click", ev=>{
  const b = ev.target.closest && ev.target.closest(".rlock"); if(!b || b.disabled) return;
  const row = b.closest(".row"), e = entries.find(x=>x._id===row.dataset.id); if(!e) return;
  e.locked = !e.locked; if(!e.locked) delete e.locked;
  if(e.locked){ clearTimeout(autoLockT[e._id]); autoLockT[e._id] = 0; } else armAutoLock(e._id, true);
  save(); renderAll(); showToast(t(e.locked?"entryLocked":"entryUnlocked"));
});
