/* Item catalogue (milk, dahi, paneer, ghee) and unit helpers. */
/* ---------- unit switch: litres <-> kg (labels only; numbers are not converted) ---------- */
const ITEMS = { milk:{en:"Milk",hi:"दूध"}, dahi:{en:"Dahi",hi:"दही"}, paneer:{en:"Paneer",hi:"पनीर"}, ghee:{en:"Ghee",hi:"घी"} };
const ITEM_ORDER = ["milk","dahi","paneer","ghee"];
const guessItem = n => { n = String(n||"").toLowerCase(); return /dahi|curd|yogh?urt|दही/.test(n) ? "dahi" : /pan+e{1,2}r|पनीर/.test(n) ? "paneer" : /ghee|घी/.test(n) ? "ghee" : "milk"; };
const itemOf = e => ITEMS[e.item] ? e.item : guessItem(e.note);   // older entries: infer the item from the note ("Dahi", "panner"...)
const itemName = e => ITEMS[itemOf(e)][lang==="hi" ? "hi" : "en"];
const isMilkL = e => itemOf(e)==="milk" && e.unit!=="kg";
const litSum = items => items.reduce((s,e)=>s+(isMilkL(e) ? (Number(e.quantity)||0) : 0),0);   // litre totals count milk sold by the litre only
const milkTotal = items => items.filter(isMilkL).reduce((s,e)=>s+lineTotal(e),0);
const unitWord = (e,hi) => e.unit==="kg" ? (hi?"किग्रा":"kg") : (hi?"ली":"L");
const monthUnit = () => "L";
const withUnit = (u,fn) => { const o = unit; unit = u; try{ return fn(); } finally{ unit = o; } };

/* ---------- default prices: used for new deliveries and when a card switches to another item ---------- */
const PRICE_KEY = "milk-default-prices";
const FACTORY_PRICES = { milk:60 };                       // others stay empty until you set them
const getDefaultPrices = () => { let p = {}; try{ p = JSON.parse(localStorage.getItem(PRICE_KEY)||"{}") || {}; }catch(e){} return { ...FACTORY_PRICES, ...p }; };
const defaultPrice = item => { const v = Number(getDefaultPrices()[item]); return v > 0 ? v : null; };
function setDefaultPrices(map){ const out = {}; ITEM_ORDER.forEach(k=>{ const v = Number(map[k]); if(v > 0) out[k] = Math.min(v, MAX_AMT); }); try{ localStorage.setItem(PRICE_KEY, JSON.stringify(out)); }catch(e){} }
