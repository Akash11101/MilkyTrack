/* Cross-cutting: screen-change motion hooks and the Android back button. */
/* ===== extra motion hooks ===== */
(function(){
  const body = document.body, cls = (c, ms) => { body.classList.remove(c); void body.offsetWidth; body.classList.add(c); setTimeout(()=>body.classList.remove(c), ms); };
  const _sel = selectCustomer, _home = goHome;
  selectCustomer = function(id){ const r = _sel.apply(this, arguments); cls("enter-cust", 1300); return r; };
  goHome = function(){ const r = _home.apply(this, arguments); cls("enter-list", 1100); return r; };
  const slide = dir => { body.classList.remove("slide-next","slide-prev"); void body.offsetWidth; body.classList.add(dir>0 ? "slide-next" : "slide-prev"); setTimeout(()=>body.classList.remove("slide-next","slide-prev"), 600); };
  ["prevMonth","nextMonth"].forEach((id,i)=>{ const b = $(id); if(b) b.addEventListener("click", ()=>slide(i ? 1 : -1)); });
  const cp = $("cbPaid"); if(cp) cp.addEventListener("click", ()=>setTimeout(()=>{ if(cp.classList.contains("paid")){ cp.classList.remove("cele"); void cp.offsetWidth; cp.classList.add("cele"); try{ burstAt(cp); }catch(e){} haptic("success"); } }, 80));
})();
/* Android hardware back: close the open sheet/menu first, exit only from the main screen. */
try{
  const AppPlugin = isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if(AppPlugin && AppPlugin.addListener){
    AppPlugin.addListener("backButton", () => {
      const open = document.querySelector(".sheet-overlay.show");
      if(open){ if(open.id==="drawerOverlay") closeDrawer(); else closeOverlay(open.id); return; }
      if(focusDate){ focusDate = null; renderAll(); return; }
      if(!document.body.classList.contains("home")){ goHome(); return; }
      AppPlugin.exitApp();
    });
  }
}catch(err){}
