/* Backup and restore of all data. */
/* ---------- backup / restore ---------- */
async function backupData(){
  if(!fullList().length && !customers.length){ showToast(t("nothingToExport")); return; }
  try{ const arr = JSON.parse(serialize(fullList())); let upi = null; try{ upi = JSON.parse(localStorage.getItem(UPI_KEY)||"null"); }catch(e){} arr.push({ _customers: customers, _upi: upi, _app:"MilkyTrack", _saved:new Date().toISOString() }); await navigator.clipboard.writeText(JSON.stringify(arr)); showToast(t("backupDone")); }
  catch(err){ showToast(t("clipFailed")); }
}
function restoreFrom(text){
  let list, custFromBackup = null, upiFromBackup = null;
  try{
    let raw = JSON.parse(text);
    if(!Array.isArray(raw) || raw.length>5000) throw new Error("bad");
    raw = raw.filter(r=>{ if(r && Array.isArray(r._customers)){ custFromBackup = r._customers.filter(c=>c && c.id && c.name); if(r._upi && typeof r._upi.pa==="string") upiFromBackup = { pa:String(r._upi.pa).slice(0,80), pn:String(r._upi.pn||"").slice(0,60) }; return false; } return true; });
    list = raw.map(r=>{
      if(!r || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) throw new Error("bad");
      const [y,m,d] = r.date.split("-").map(Number);
      const q = Number(r.quantity), a = Number(r.amount);
      if(!isFinite(q) || !isFinite(a) || q<0 || a<0) throw new Error("bad");
      const e = { _id:newId(), date:new Date(y,m-1,d), quantity:Math.min(q,MAX_QTY), amount:Math.min(a,MAX_AMT) };
      if(r.note) e.note = String(r.note).slice(0,2500);
      if(r.cust) e.cust = String(r.cust).slice(0,40);
      if(r.locked) e.locked = true;
      if(r.unit==="kg") e.unit = "kg";
      return e;
    });
  }catch(err){ return false; }
  const backup = fullList(), custBackup = customers;
  if(custFromBackup){ customers = custFromBackup; saveCustomers(); }
  if(upiFromBackup){ try{ localStorage.setItem(UPI_KEY, JSON.stringify(upiFromBackup)); }catch(e){} }
  setAll(list); focusDate = null; migrateLegacy(); if(activeCust && !customers.find(c=>c.id===activeCust)) goHome();
  renderAll(); renderCustomers();
  showToast(t("restoreOk",{n:list.length}), ()=>{ customers = custBackup; saveCustomers(); setAll(backup); save(); renderAll(); renderCustomers(); });
  return true;
}
$("backupBtn").onclick = runAndClose(backupData);
$("restoreBtn").onclick = () => { closeDrawer(); if(isLocked()){ showToast(t("lockedMsg")); return; } $("restoreText").value = ""; $("restoreMsg").textContent = ""; openOverlay("restoreSheet","restoreBox"); };
