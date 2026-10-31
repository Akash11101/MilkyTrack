/* First-run storage checks and start-up. */
/*RESTORE-START*/
try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(err){}
if(!storeReady){
  const finish = () => { if(storeReady) return; storeReady = true; renderAll(); };
  const safety = setTimeout(finish, 2500);   // never block saving forever
  Promise.resolve(nativePrefs().get({ key:STORE_KEY })).then(r=>{
    if(storeReady) return;
    if(r && r.value){ try{ entries = parseStored(r.value); uid = nextUid(entries); }catch(err){} }
  }).catch(()=>{}).then(()=>{ clearTimeout(safety); finish(); });
}
try{
  const np = nativePrefs();
  if(np && !customers.length){
    Promise.resolve(np.get({ key:CUST_KEY })).then(r=>{
      if(customers.length || !(r && r.value)) return;
      const arr = JSON.parse(r.value);
      if(Array.isArray(arr) && arr.length){ customers = arr; try{ localStorage.setItem(CUST_KEY, r.value); }catch(e){} if(document.body.classList.contains("home")) renderCustomers(); }
    }).catch(()=>{});
  }
}catch(err){}
/*RESTORE-END*/
migrateLegacy();
renderAll();
goHome();
/* boot screen: keep the logo animation for at least ~1.1s, then fade out */
(function(){
  const boot = document.getElementById("boot"); if(!boot) return;
  const t0 = performance.now();
  const done = () => { boot.classList.add("hide"); setTimeout(()=>boot.remove(), 450); };
  const go = () => setTimeout(done, Math.max(0, 600 - (performance.now()-t0)));
  if(document.readyState==="complete") go(); else window.addEventListener("load", go);
  setTimeout(done, 2000);   // never get stuck
})();
