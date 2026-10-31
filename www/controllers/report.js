/* Monthly report numbers (repStats) and the report screen wiring. The report view itself is services/report.js. */
/* ---------- report: month KPIs across all customers ---------- */
const nf1 = n => (Math.round(n*10)/10).toLocaleString(undefined,{maximumFractionDigits:1});
function repStats(y,m,maxDay){
  const list = fullList().filter(e=>{ const d=new Date(e.date); return d.getFullYear()===y && d.getMonth()+1===m && (!maxDay || d.getDate()<=maxDay); });
  const by = {}, byItem = {}, perDay = {}; let lit=0,billed=0,coll=0;
  list.forEach(e=>{
    const c = customers.find(x=>x.id===e.cust), q = isMilkL(e) ? (Number(e.quantity)||0) : 0, a = lineTotal(e), paid = dayPaid(c, fmtDateInput(e.date));
    const dn = new Date(e.date).getDate();
    lit+=q; billed+=a; if(paid) coll+=a; perDay[dn]=(perDay[dn]||0)+q;
    const ik = itemOf(e), ib = byItem[ik] || (byItem[ik] = { k:ik, qty:0, amt:0, n:0, kg:e.unit==="kg" }); ib.qty += Number(e.quantity)||0; ib.amt += a; ib.n++;
    const r = by[e.cust] || (by[e.cust] = { id:e.cust, name:c?c.name:"—", phone:c?c.phone:"", lit:0, bill:0, due:0 });
    r.lit+=q; r.bill+=a; if(!paid) r.due+=a;
  });
  return { n:list.length, lit, billed, coll, out:billed-coll, perDay, items:Object.values(byItem).sort((a,b)=>b.amt-a.amt), other:Math.max(0,billed - list.filter(isMilkL).reduce((x,e)=>x+lineTotal(e),0)), days:Object.keys(perDay).length, rows:Object.values(by).sort((a,b)=>b.bill-a.bill) };
}
const repDelta = (cur,prev,money) => {
  if(!prev) return ""; const d = cur-prev, p = Math.round(Math.abs(d)/prev*100);
  return `<span class="rep-d ${d>=0?"up":"dn"}">${d>=0?"▲":"▼"} ${p}% ${t("repVsLast")}${window.__repMtd ? " (1–"+window.__repMtd+")" : ""}</span>`;
};
$("reportBtn").onclick = async () => { closeDrawer(); await renderReport(); openOverlay("reportSheet","reportBox"); };
$("reportClose").onclick = () => closeOverlay("reportSheet");
$("reportSheet").addEventListener("click", ev=>{ if(ev.target===$("reportSheet")) closeOverlay("reportSheet"); });
let ry = new Date().getFullYear(), rm = new Date().getMonth()+1;
const repFlip = dir => {
  rm += dir; if(rm<1){ rm = 12; ry--; } else if(rm>12){ rm = 1; ry++; }
  const b = $("repBody"); b.classList.remove("flipL","flipR"); void b.offsetWidth; b.classList.add(dir<0?"flipR":"flipL");
  renderReport();
};
$("repPrev").onclick = () => repFlip(-1);
$("repNext").onclick = () => repFlip(1);
$("repMonth").onclick = () => { const n = new Date(), cy = n.getFullYear(), cm = n.getMonth()+1; if(ry===cy && rm===cm) return; const dir = (ry*12+rm) > (cy*12+cm) ? -1 : 1; ry = cy; rm = cm; const b=$("repBody"); b.classList.remove("flipL","flipR"); void b.offsetWidth; b.classList.add(dir<0?"flipR":"flipL"); renderReport(); };
(()=>{ let x0=null,y0=0; const box = $("reportBox");
  document.addEventListener("keydown", e=>{ if(!$("reportSheet").classList.contains("show")) return; if(e.key==="ArrowLeft") repFlip(-1); else if(e.key==="ArrowRight") repFlip(1); });
})();
$("restoreCancel").onclick = () => closeOverlay("restoreSheet");
$("restoreClose").onclick = () => closeOverlay("restoreSheet");
$("restoreSheet").addEventListener("click", ev=>{ if(ev.target===$("restoreSheet")) closeOverlay("restoreSheet"); });
$("restoreGo").onclick = () => {
  const txt = $("restoreText").value.trim();
  if(!txt){ $("restoreMsg").textContent = t("restoreEmpty"); return; }
  if(restoreFrom(txt)) closeOverlay("restoreSheet"); else $("restoreMsg").textContent = t("restoreBad");
};
$("restoreFile").onchange = ev => {
  const f = ev.target.files && ev.target.files[0]; ev.target.value = "";
  if(!f) return;
  if(f.size > 2*1024*1024){ $("restoreMsg").textContent = t("restoreBad"); return; }
  const r = new FileReader(); r.onload = () => { $("restoreText").value = String(r.result); }; r.readAsText(f);
};
