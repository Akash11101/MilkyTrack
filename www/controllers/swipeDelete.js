/* Press-and-hold then swipe a card to delete it. */
/* ===== press & hold a delivery card, then swipe left/right to delete it (springy) ===== */
(function(){
  const HOLD_MS = 380, MOVE_TOL = 9;
  let st = null;
  const clear = () => { if(st){ clearTimeout(st.timer); } st = null; document.body.classList.remove("swiping"); if(window.scrollX) window.scrollTo(0, window.scrollY); };
  const springBack = (row, dx) => {
    row.classList.remove("dragging");
    const dir = dx>0 ? 1 : -1;
    row.style.transform = ""; row.style.opacity = ""; row.style.setProperty("--dp","0");
    try{ row.animate([{transform:`translateX(${dx}px) rotate(${dx/40}deg)`},{transform:`translateX(${-dir*14}px) rotate(${-dir*0.5}deg)`,offset:.55},{transform:`translateX(${dir*5}px)`,offset:.8},{transform:"translateX(0)"}],{duration:560,easing:"cubic-bezier(.3,.9,.4,1)"}); }catch(e){}
  };
  const flyOut = (row, dx, id, viaMouse) => {
    const desktop = !!viaMouse || (window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches);
    const dir = dx>0 ? 1 : -1, w = row.offsetWidth, h = row.offsetHeight;
    const all = [...document.querySelectorAll("#listView .row")], idx = all.indexOf(row);
    row.classList.remove("dragging"); row.classList.add("flying");
    haptic("warn");
    if(desktop){   // calm desktop exit: slide out sideways, fade, then close the gap smoothly (no spin)
      const cs = getComputedStyle(row), mb = parseFloat(cs.marginBottom)||0;
      let a1 = null;
      try{ a1 = row.animate([{transform:`translateX(${dx}px)`,opacity:1},{transform:`translateX(${dir*Math.min(w*.7,520)}px)`,opacity:0}],{duration:280,easing:"cubic-bezier(.4,0,.8,.6)",fill:"forwards"}); }catch(e){ a1 = null; }
      const collapse = () => {
        row.style.overflow = "hidden"; row.style.pointerEvents = "none";
        let a2 = null;
        try{ a2 = row.animate([{height:h+"px",marginBottom:mb+"px",paddingTop:cs.paddingTop,paddingBottom:cs.paddingBottom,opacity:0},{height:"0px",marginBottom:"0px",paddingTop:"0px",paddingBottom:"0px",opacity:0}],{duration:240,easing:"cubic-bezier(.3,0,.2,1)",fill:"forwards"}); }catch(e){ a2 = null; }
        if(a2) a2.onfinish = () => deleteRow(id); else deleteRow(id);
      };
      if(a1) a1.onfinish = collapse; else collapse();
      return;
    }
    const finish = () => {
      deleteRow(id);   // re-renders the list and shows Undo
      try{ [...document.querySelectorAll("#listView .row")].slice(idx).forEach((r,i)=>{ r.animate([{transform:`translateY(${h+12}px)`},{transform:"translateY(0)"}],{duration:520+i*70,easing:"cubic-bezier(.34,1.7,.5,1)"}); }); }catch(e){}
    };
    let a;
    try{ a = row.animate([
      {transform:`translateX(${dx}px) rotate(${dx/40}deg) scale(1.05)`,opacity:1},
      {transform:`translateX(${dx-dir*34}px) rotate(${(dx-dir*34)/40 - dir*3}deg) scale(1.1)`,opacity:1,offset:.2},
      {transform:`translateX(${dir*(w*1.3)}px) translateY(-40px) rotate(${dir*28}deg) scale(.7)`,opacity:0}
    ],{duration:520,easing:"cubic-bezier(.5,-.3,.7,1)",fill:"forwards"}); }catch(e){ a = null; }
    if(a) a.onfinish = finish; else finish();
  };
  listEl.addEventListener("pointerdown", ev=>{
    if(ev.pointerType==="mouse" && ev.button!==0) return;
    const row = ev.target.closest && ev.target.closest(".row"); if(!row) return;
    if(ev.target.closest("input,textarea,select,button,a,label,.num-ctl,.rlock")) return;
    clear();
    st = { mouse: ev.pointerType==="mouse", row, id:row.dataset.id, x0:ev.clientX, y0:ev.clientY, dx:0, active:false, pid:ev.pointerId, t0:0, lastX:ev.clientX, lastT:Date.now(), v:0 };
    const arm = () => {
      if(!st || st.active) return; clearTimeout(st.timer); st.active = true; st.t0 = Date.now();
      row.classList.add("dragging"); document.body.classList.add("swiping"); haptic("tap");
      try{ row.setPointerCapture(st.pid); }catch(e){}
    };
    st.arm = arm;
    if(!st.mouse) st.timer = setTimeout(arm, HOLD_MS);
  });
  listEl.addEventListener("pointermove", ev=>{
    if(!st || ev.pointerId!==st.pid) return;
    const dx = ev.clientX - st.x0, dy = ev.clientY - st.y0;
    if(!st.active){
      if(st.mouse){ if(Math.abs(dx)>6 && Math.abs(dx)>Math.abs(dy)*1.2){ st.x0 = ev.clientX - Math.sign(dx)*2; st.arm(); } else if(Math.abs(dy)>14) clear(); else return; if(!st || !st.active) return; ev.preventDefault(); return; }
      if(Math.abs(dx)>MOVE_TOL || Math.abs(dy)>MOVE_TOL) clear(); return; }
    const now = Date.now(); st.v = (ev.clientX - st.lastX) / Math.max(1, now - st.lastT); st.lastX = ev.clientX; st.lastT = now;
    st.dx = dx; const row = st.row, w = row.offsetWidth;
    const lim = w*.5, ax = Math.abs(dx), eff = (ax<lim ? ax : lim + (ax-lim)*.35) * (dx<0 ? -1 : 1);   // rubber band past half width
    const tilt = st.mouse ? Math.max(-2, Math.min(2, eff/160)) : Math.max(-9, Math.min(9, eff/38 + st.v*2.2));
    row.style.transform = `translateX(${eff}px) rotate(${tilt}deg)`;
    const prog = Math.min(1, ax/(w*.38));
    row.style.setProperty("--dp", prog.toFixed(3)); row.dataset.dir = dx>0 ? "r" : "l";
    if(prog>=1 && !st.armed){ st.armed = true; row.classList.add("armed"); haptic("heavy"); try{ row.animate([{scale:"1.02"},{scale:"1.09"},{scale:"1.05"}],{duration:260,easing:"cubic-bezier(.3,1.6,.5,1)"}); }catch(e){} }
    else if(prog<1 && st.armed){ st.armed = false; row.classList.remove("armed"); haptic("tick"); }
    ev.preventDefault();
  });
  const end = ev => {
    if(!st || (ev && ev.pointerId!==st.pid)) return;
    const s2 = st, row = s2.row; clear(); row.classList.remove("armed");
    if(!s2.active){ return; }
    const w = row.offsetWidth, far = Math.abs(s2.dx) > w*.38 || (Math.abs(s2.v) > .9 && Math.abs(s2.dx) > 40);
    const e = entries.find(x=>x._id===s2.id);
    const locked = !e || e.locked || (()=>{ const c = curCust(); return c && dayPaid(c, fmtDateInput(e.date)); })();
    if(far && e && !locked) flyOut(row, s2.dx, s2.id, s2.mouse);
    else { if(far && locked){ showToast(t("entryLockedMsg")); } springBack(row, s2.dx); }
  };
  listEl.addEventListener("pointerup", end); listEl.addEventListener("pointercancel", end);
  listEl.addEventListener("touchmove", ev=>{ if(st && st.active) ev.preventDefault(); }, { passive:false });
  listEl.addEventListener("contextmenu", ev=>{ if(ev.target.closest(".row") && !ev.target.closest("textarea:not([disabled]):not([readonly])")) ev.preventDefault(); });
  listEl.addEventListener("selectstart", ev=>{ if(st && !ev.target.closest("textarea:not([disabled]):not([readonly])")) ev.preventDefault(); });
  document.addEventListener("scroll", ()=>{ if(st && !st.active) clear(); }, { passive:true });
})();
