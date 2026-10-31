/* Locking cards: auto-lock, double-tap lock/duplicate, field guards. */
/* an entry you unlock locks itself again 30 seconds later, no matter what (editing does not extend it) */
const AUTO_LOCK_MS = 30000, autoLockT = {};
function armAutoLock(id, force){
  if(autoLockT[id] && !force) return;   // already counting down: do not extend
  clearTimeout(autoLockT[id]);
  autoLockT[id] = setTimeout(function fire(){
    autoLockT[id] = 0;
    const e = fullList().find(x=>x._id===id); if(!e || e.locked) return;
    const row = document.querySelector('.row[data-id="'+id+'"]');
    try{ if(row && row.contains(document.activeElement)) document.activeElement.blur(); }catch(err){}
    e.locked = true; save(); renderAll(); showToast(t("entryAutoLocked"));
  }, AUTO_LOCK_MS);
}
/* default is locked: every unlocked entry in view locks itself 30 seconds after it appears (never extended) */
function armAllAutoLocks(){ try{ if(typeof autoLockT==="undefined") return; fullList().forEach(e=>{ if(!e.locked) armAutoLock(e._id); }); }catch(err){} }
const touchAutoLock = ev => { const r = ev.target.closest && ev.target.closest(".row"); if(!r || r.classList.contains("rowlocked") || r.classList.contains("paidrow")) return; if(ev.target.closest(".rlock")) return; armAutoLock(r.dataset.id); };
listEl.addEventListener("input", touchAutoLock);
listEl.addEventListener("click", touchAutoLock);
/* double-tap (or double-click) a card to lock / unlock it; double-tap the DATE to duplicate the card (same date, same values) */
(function(){
  let last = null, down = null;
  const skip = "input,textarea,select,button,a,.num-ctl,.rlock,.note-pill";
  const dupe = row => {
    const src = entries.find(x=>x._id===row.dataset.id); if(!src || row.classList.contains("paidrow")) return;
    const e = { ...src, _id:newId() }; delete e.locked;
    entries.push(e); freshId = e._id; lastAddedId = e._id; save(); renderAll();
    showToast(t("cardDuplicated"), ()=>{ entries = entries.filter(x=>x._id!==e._id); save(); renderAll(); });
  };
  listEl.addEventListener("pointerdown", ev=>{ const tg = ev.target, row = tg.closest && tg.closest(".row"); down = { x:ev.clientX, y:ev.clientY, t:Date.now(), row, date:!!(tg.closest && tg.closest(".date-wrap")), bad:!!(tg.closest && tg.closest(skip)) }; }, true);
  listEl.addEventListener("pointerup", ev=>{
    const d = down; down = null; if(!d || !d.row || d.bad) { last = null; return; }
    if(Math.abs(ev.clientX-d.x) > 8 || Math.abs(ev.clientY-d.y) > 8 || Date.now()-d.t > 350){ last = null; return; }
    const now = Date.now();
    if(last && last.row === d.row && last.date === d.date && now-last.t < 320 && Math.hypot(ev.clientX-last.x, ev.clientY-last.y) < 30){
      last = null;
      try{ getSelection().removeAllRanges(); }catch(e){}
      if(d.date){ dupe(d.row); return; }
      const b = d.row.querySelector(".rlock"); if(b && !b.disabled && !d.row.classList.contains("paidrow")) b.click();
    } else last = { row:d.row, date:d.date, t:now, x:ev.clientX, y:ev.clientY };
  }, true);
})();
/* the card date is display-only: no calendar picker (changing it used to create a new entry) */
const lockDates = () => document.querySelectorAll("#listView .f-date").forEach(i=>{ i.tabIndex = -1; i.readOnly = true; i.setAttribute("aria-readonly","true"); });
listEl.addEventListener("keydown", ev=>{ if(ev.target.classList && ev.target.classList.contains("f-date")) ev.preventDefault(); }, true);
new MutationObserver(lockDates).observe(listEl,{childList:true});
lockDates();
listEl.addEventListener("focusout", ev=>{ const t = ev.target; if(t.classList && t.classList.contains("f-note")){ t.scrollLeft = 0; t.scrollTop = 0; } });
listEl.addEventListener("focusin", ev=>{ const t = ev.target; if(t.classList && t.classList.contains("f-note")) noteSync(t); });
listEl.addEventListener("change", ev=>{
  const t = ev.target, entry = rowEntry(t); if(!entry || !t.classList.contains("f-date") || !t.value) return;
  const [y,m,d] = t.value.split("-").map(Number); entry.date = new Date(y,m-1,d);
  const moved = y!==year || m!==month;
  if(moved){ year = y; month = m; }          // follow the delivery to its new month so the customer card, totals and day strip show it
  if(focusDate) focusDate = t.value;
  save(); renderAll();
  const row = document.querySelector('.row[data-id="'+entry._id+'"]'); if(row) row.scrollIntoView({block:"center",behavior:"smooth"});
  showToast(tr("movedTo",{date:fmtDateNice(entry.date)}));
});
listEl.addEventListener("focusin", ev=>{ if(ev.target.type==="number") ev.target.select(); });
listEl.addEventListener("keydown", ev=>{            // Enter: litres -> price -> next row (or a new row)
  if(ev.key!=="Enter") return;
  const t = ev.target, row = t.closest(".row"); if(!row) return;
  if(t.classList.contains("f-note")){ ev.preventDefault(); t.blur(); return; }
  if(t.classList.contains("f-qty")){ ev.preventDefault(); row.querySelector(".f-amt").focus(); }
  else if(t.classList.contains("f-amt")){
    ev.preventDefault();
    const next = row.nextElementSibling;
    if(next && next.classList.contains("row")) next.querySelector(".f-qty").focus(); else addRow();
  }
});
