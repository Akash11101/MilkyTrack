/* Cross-cutting: vibration/haptic feedback. */
/* ===== haptics: native (Capacitor Haptics) with navigator.vibrate fallback ===== */
const HAP_KEY = "milk-haptics";
let hapOn = true; try{ hapOn = localStorage.getItem(HAP_KEY) !== "off"; }catch(e){}
const haptic = (() => {
  const H = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) || null;
  let last = 0;
  const vib = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };
  return kind => {
    if(!hapOn) return;
    const now = Date.now(); if(kind==="tick" && now-last < 40) return; last = now;
    const h = H();
    try{
      if(h){
        if(kind==="tick") h.impact({style:"LIGHT"});
        else if(kind==="tap" || kind==="success") h.impact({style:"LIGHT"});
        else if(kind==="heavy" || kind==="warn") h.impact({style:"MEDIUM"});
        return;
      }
    }catch(e){}
    vib(kind==="tick"?4:kind==="tap"?7:kind==="heavy"?14:kind==="success"?6:kind==="warn"?[8,40,8]:5);
  };
})();
document.addEventListener("pointerdown", ev => {
  const b = ev.target.closest && ev.target.closest("button,.day-chip,.today-card,[data-app],.icon-btn,.quick-add-btn");
  if(!b || b.disabled) return;
  if(b.id==="quickAddBtn" || b.id==="todayCard") haptic("tap");
  else if(b.classList.contains("del") || b.classList.contains("danger")) haptic("warn");
  else haptic("tick");
}, {passive:true});
