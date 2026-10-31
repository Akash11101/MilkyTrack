/* Bill/PDF export, copy to clipboard, and the loader for lazy services (services/bill.js, services/report.js). */
/* ---------- lazy chunks: bill/PDF code and the monthly report load only when first used ---------- */
const _chunks = {};
function loadJs(n){ return _chunks[n] || (_chunks[n] = new Promise((ok,bad)=>{ const el = document.createElement("script"); el.src = "services/"+n+".js"; el.onload = ok; el.onerror = () => { delete _chunks[n]; bad(new Error("could not load "+n)); }; document.head.appendChild(el); })); }
async function downloadPdf(...a){ await loadJs("bill"); return downloadPdf(...a); }
async function renderReport(){ await loadJs("report"); return renderReport(); }
const billEntries = () => focusDate ? entriesForMonth().filter(e=>fmtDateInput(e.date)===focusDate) : entriesForMonth();
function exportPdf(){
  if(!billEntries().length){ showToast(t("nothingToExport")); return; }
  openOverlay("fmtSheet","fmtBox");
}
async function exportBill(kind){
  closeOverlay("fmtSheet");
  await loadJs("bill");
  const c = billCust(), base = (c ? c.name.replace(/[^\w\u0900-\u097F]+/g,"-")+"-" : "") + year + "-" + String(month).padStart(2,"0") + (focusDate ? "-" + focusDate.slice(8,10) : "");
  if(kind==="thermal") downloadPdf(buildThermalHtml(), "MilkyTrack-Receipt-" + base, { thermal:true });
  else downloadPdf(buildPdfHtml(), "MilkyTrack-Bill-" + base);
}
const billCust = () => (typeof customers!=="undefined" && activeCust) ? customers.find(c=>c.id===activeCust) : null;
function buildCopyText(items){
  unit = monthUnit(items);
  const nf = new Intl.NumberFormat("en-IN",{maximumFractionDigits:2});
  const nf2 = new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
  const rs = n => "₹" + nf.format(n), rs2 = n => "₹" + nf2.format(n);
  const hi = lang==="hi";
  const L = hi ? { title:"दूध का बिल", name:"नाम", addr:"पता", daily:"दैनिक दूध का हिसाब", sum:"बिल सारांश", deliv:"कुल डिलीवरी", per:"हर डिलीवरी में दूध", perAvg:"औसत दूध हर डिलीवरी में", tot:"कुल दूध", rate:(unit==="kg"?"प्रति किग्रा दर":"प्रति लीटर दर"), rateAvg:(unit==="kg"?"औसत दर प्रति किग्रा":"औसत दर प्रति लीटर"), due:"कुल देय राशि", thanks:"आपके सहयोग के लिए धन्यवाद!", lit:"लीटर" }
                  : { title:"MILK BILL", name:"NAME", addr:"ADDRESS", daily:"DAILY MILK RECORD", sum:"BILL SUMMARY", deliv:"Total Deliveries", per:"Milk per Delivery", perAvg:"Average Milk per Delivery", tot:"Total Milk Supplied", rate:(unit==="kg"?"Rate per kg":"Rate per Litre"), rateAvg:(unit==="kg"?"Average Rate per kg":"Average Rate per Litre"), due:"TOTAL AMOUNT DUE", thanks:"Thank you for your business!", lit:"litres" };
  const U = x => unit==="kg" ? (hi ? "किग्रा" : "kg") : (hi ? L.lit : (x===1 ? "litre" : "litres"));
  const bar = "━━━━━━━━━━━━━━━━━━";
  const monthName = monthLong(year,month);
  const head = (focusDate ? parseLocal(focusDate).getDate() + " " : "") + monthName + " " + year;
  const c = billCust(), blank = "__________________";
  const sorted = [...items].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const lines = sorted.map(e=>{
    const d = new Date(e.date), q = Number(e.quantity)||0, a = Number(e.amount)||0;
    const day = String(d.getDate()).padStart(2,"0") + " " + (hi ? HI_MONTHS[d.getMonth()] : d.toLocaleString("en-US",{month:"long"}));
    return `${day} — ${itemOf(e)!=="milk" ? itemName(e)+" " : ""}${nf.format(q)} ${unitWord(e,hi)} × ${rs(a)} = ${rs2(q*a)}` + (e.note && guessItem(e.note)==="milk" || (e.note && e.item) ? ` (${e.note})` : "");
  });
  const n = items.length;
  const litres = litSum(items);
  const total = items.reduce((s,e)=>s+lineTotal(e),0);
  const plain = items.every(isMilkL), otherAmt = total - milkTotal(items);
  const same = plain && n>0 && items.every(e=>Number(e.quantity)===Number(items[0].quantity) && Number(e.amount)===Number(items[0].amount));
  const nMilk = items.filter(isMilkL).length;
  const perDel = same ? Number(items[0].quantity)||0 : (nMilk ? litres/nMilk : 0);
  const rate = same ? Number(items[0].amount)||0 : (litres ? milkTotal(items)/litres : 0);
  const out = [];
  out.push(`*${L.title} — ${hi ? head : head.toUpperCase()}*`, "");
  out.push(bar, `*${L.name}:* ${c && c.name ? c.name : blank}`, `*${L.addr}:* ${c && c.addr ? c.addr : blank}`);
  if(c && c.phone) out.push(`*${hi ? "फ़ोन" : "PHONE"}:* ${c.phone}`);
  out.push(bar, "", `*${L.daily}*`, "", bar, "");
  lines.forEach(l=>out.push(l, ""));
  out.push(bar, "", `*${L.sum}*`, "", bar, "");
  out.push(`*${L.deliv}:* ${n}`, "");
  out.push(`*${same ? L.per : L.perAvg}:* ${nf.format(perDel)} ${U(perDel)}`, "");
  out.push(`*${L.tot}:* ${nf.format(litres)} ${U(litres)}`, "");
  out.push(`*${same ? L.rate : L.rateAvg}:* ${rs(rate)}`, "");
  if(!plain && otherAmt>0) out.push(`*${t("prOther")}:* ${rs2(otherAmt)}`, "");
  out.push(bar, "", `*${L.due}: ${rs2(total)}*`, "", bar, "");
  const upi = savedUpi();
  if(upi) out.push(`*${hi ? "UPI से भुगतान" : "PAY VIA UPI"}:* ${upi}`, "", bar, "");
  out.push(`*${L.thanks}*`);
  return out.join("\n");
}
async function copyClipboard(){
  const items = sortedAsc(focusDate ? entriesForMonth().filter(e=>fmtDateInput(e.date)===focusDate) : entriesForMonth());
  if(!items.length){ showToast(t("nothingToExport")); return; }
  const text = buildCopyText(items);
  try{
    await navigator.clipboard.writeText(text);
    showToast(t("copied"));
  }catch(err){ showToast(t("clipFailed")); }
}
$("settingsExport").onclick = runAndClose(exportPdf);
$("settingsCopy").onclick = runAndClose(copyClipboard);
{ const hb = $("hapBtn"); const paint = () => hb.setAttribute("aria-checked", String(hapOn)); paint();
  hb.onclick = () => { hapOn = !hapOn; try{ localStorage.setItem(HAP_KEY, hapOn ? "on" : "off"); }catch(e){} paint(); if(hapOn) haptic("success"); showToast(t(hapOn ? "hapOn" : "hapOff")); }; }
