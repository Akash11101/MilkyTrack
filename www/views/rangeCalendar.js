/* Range calendar inside "Mark range": tap a first day, then a last day. Keeps the From / To fields in sync. */
const rc = { y:0, m:0, phase:"start" };
function renderRangeCal(){
  const el = $("rangeCal"); if(!el) return;
  const f = $("bFrom").value, to = $("bTo").value;
  const n = new Date(rc.y, rc.m, 0).getDate(), lead = new Date(rc.y, rc.m-1, 1).getDay();
  const todayKey = fmtDateInput(today);
  let h = `<div class="rc-head"><button type="button" class="rc-nav" data-dir="-1" aria-label="${t("prevMonth")}">‹</button><b>${monthLong(rc.y,rc.m)} ${rc.y}</b><button type="button" class="rc-nav" data-dir="1" aria-label="${t("nextMonth")}">›</button></div><div class="rc-grid">`;
  for(let i=0;i<7;i++) h += `<span class="rc-dow" aria-hidden="true">${shortDow(new Date(2023,0,1+i))}</span>`;
  for(let i=0;i<lead;i++) h += `<span class="rc-cell"></span>`;
  for(let d=1; d<=n; d++){
    const key = fmtDateInput(new Date(rc.y, rc.m-1, d));
    const isS = key===f, isE = key===to, inR = f && to && key>f && key<to;
    const cls = ["rc-cell", inR?"in":"", isS&&isE?"single":isS?"start":isE?"end":"", key===todayKey?"today":""].filter(Boolean).join(" ");
    h += `<span class="${cls}"><button type="button" class="rc-day" data-key="${key}" aria-pressed="${isS||isE}">${d}</button></span>`;
  }
  el.innerHTML = h + `</div>`;
}
function rcSync(){ const f = parseLocal($("bFrom").value); if(f){ rc.y = f.getFullYear(); rc.m = f.getMonth()+1; } else { rc.y = today.getFullYear(); rc.m = today.getMonth()+1; } rc.phase = "start"; renderRangeCal(); }
$("rangeCal").addEventListener("click", ev=>{
  const nav = ev.target.closest(".rc-nav");
  if(nav){ rc.m += Number(nav.dataset.dir); if(rc.m<1){ rc.m = 12; rc.y--; } else if(rc.m>12){ rc.m = 1; rc.y++; } renderRangeCal(); return; }
  const b = ev.target.closest(".rc-day"); if(!b) return;
  const key = b.dataset.key, F = $("bFrom"), T = $("bTo");
  if(rc.phase==="start" || key < F.value){ F.value = key; T.value = key; rc.phase = "end"; }
  else { T.value = key; rc.phase = "start"; }
  F.dispatchEvent(new Event("input",{bubbles:true})); T.dispatchEvent(new Event("input",{bubbles:true}));
  renderRangeCal();
});
["input","change"].forEach(n=>{ $("bFrom").addEventListener(n, renderRangeCal); $("bTo").addEventListener(n, renderRangeCal); });
