/* Data model: saving/loading deliveries (localStorage or Android Preferences), entry helpers, CSV. */
/*STORE-START*/
const STORE_KEY = "fuel-ledger-v1";
const isNative = !!(window.Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform());
const nativePrefs = () => (isNative && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) || null;
let storeReady = true;   // false only while a wiped-storage restore is pending
const serialize = list => JSON.stringify(list.map(e=>({ ...e, date:fmtDateInput(e.date) })));
const parseStored = raw => JSON.parse(raw).map(e=>{ const [y,m,d]=e.date.split("-").map(Number); return { ...e, date:new Date(y,m-1,d) }; });
const nextUid = list => list.reduce((m,e)=>Math.max(m,parseInt(e._id.slice(1))||0), 0) + 1;
function load(){
  try{ const raw = localStorage.getItem(STORE_KEY); return raw ? parseStored(raw) : null; }catch(err){ return null; }
}
let saveWarned = false;
/* ---------- production safety net: never leave the user with a dead screen ---------- */
(()=>{ let last = 0;
  const report = () => { const n = Date.now(); if(n-last < 4000) return; last = n; try{ if(typeof showToast==="function") showToast(t("oopsRetry")); }catch(e){} };
  window.addEventListener("error", ev => { if(ev && ev.message && /ResizeObserver|Script error/i.test(ev.message)) return; report(); });
  window.addEventListener("unhandledrejection", ev => { try{ ev.preventDefault(); }catch(e){} report(); });
})();
const SCHEMA_KEY = "milk-schema", SCHEMA_VER = 2;
try{ if(localStorage.getItem(SCHEMA_KEY) !== String(SCHEMA_VER)) localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VER)); }catch(e){}
function save(){
  if(!storeReady) return;   // never overwrite the native copy before its restore has finished
  if(activeCust) entries.forEach(e=>{ if(!e.cust) e.cust = activeCust; });
  const json = serialize(fullList());
  try{ localStorage.setItem(STORE_KEY, json); saveWarned = false; }catch(err){ if(!saveWarned){ saveWarned = true; if(typeof showToast==="function") showToast(t("saveFailed")); } }
  const np = nativePrefs();
  if(np){ try{ Promise.resolve(np.set({ key:STORE_KEY, value:json })).catch(()=>{}); }catch(err){} }
}
const loaded = load();
let entries = loaded || [];
if(loaded) uid = nextUid(loaded);
if(!loaded && nativePrefs()) storeReady = false;
/*STORE-END*/
function defaultEntry(date){ return { date, quantity:0.5, amount:(typeof defaultPrice==="function" && defaultPrice("milk")) || 60 }; }
function autoEntry(date){
  if(!entries.length){ const c = customers.find(x=>x.id===activeCust); const d = defaultEntry(date); if(c && Number(c.price)>0) d.amount = Number(c.price); return d; }
  const last = [...entries.filter(isMilkL)].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  if(!last) return defaultEntry(date);
  return { date, quantity:last.quantity, amount:last.amount };   // a new date always starts in litres
}
/*PURE-START*/
const sortedAsc = list => [...list].sort((a,b)=>new Date(a.date)-new Date(b.date));
function toCSV(list){
  const rows = ["date,item,quantity,unit,price_per_unit,total"];
  list.forEach(e=>{
    const q = Number(e.quantity)||0, a = Number(e.amount)||0;
    rows.push([fmtDateInput(e.date), itemOf(e), q, e.unit==="kg"?"kg":"L", a, (q*a).toFixed(2)].join(","));
  });
  return rows.join("\n");
}
/*PURE-END*/
