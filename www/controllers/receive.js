/* Receive via UPI: QR and payment link. */
/* ---------- receive via UPI: QR + link the customer can pay ---------- */
function rvData(){
  const pa = $("rvId").value.trim(), am = Number($("rvAmt").value), pn = $("rvName").value.trim();
  if(!UPI_RE.test(pa)){ $("rvMsg").textContent = t("payBadId"); return null; }
  if(!(am>0)){ $("rvMsg").textContent = t("payNoAmt"); return null; }
  $("rvMsg").textContent = "";
  const c = customers.find(x=>x.id===activeCust);
  const ascii = x => String(x||"").replace(/[^\x20-\x7E]/g,"").replace(/\s+/g," ").trim();
  const mon = new Date(year,month-1,1).toLocaleString("en-US",{month:"long"}) + " " + year;
  const note = ascii("Milk bill " + mon + (c && ascii(c.name) ? " - " + ascii(c.name) : "")).slice(0,50);
  const link = "upi://pay?pa=" + encodeURIComponent(pa).replace(/%40/g,"@") + (ascii(pn) ? "&pn="+encodeURIComponent(ascii(pn)) : "") + "&am=" + am.toFixed(2) + "&cu=INR&tn=" + encodeURIComponent(note);
  return { pa, pn, am:am.toFixed(2), link, note };
}
function rvRender(){
  const pa = $("rvId").value.trim(), am = Number($("rvAmt").value);
  const box = $("recvQr");
  if(!UPI_RE.test(pa) || !(am>0)){ box.innerHTML = `<div class="recv-ph">${t("recvFill")}</div>`; $("recvAmtShow").textContent = ""; return; }
  const v = rvData(); if(!v) return;
  box.innerHTML = qrSvg(v.link, 240);
  $("recvAmtShow").textContent = "₹" + v.am + (v.pn ? " · " + v.pn : "");
  try{ localStorage.setItem(UPI_KEY, JSON.stringify({ pa:v.pa, pn:v.pn })); }catch(err){}
}
function openRecv(){
  let sv = {}; try{ sv = JSON.parse(localStorage.getItem(UPI_KEY)||"{}"); }catch(err){}
  $("rvId").value = sv.pa || ""; $("rvName").value = sv.pn || "";
  $("rvAmt").value = (typeof amountDue==="function" && amountDue()) || "";
  const c = customers.find(x=>x.id===activeCust);
  $("recvSub").textContent = (c ? c.name + " · " : "") + monthLong(year,month) + " " + year;
  $("rvPaid").style.display = c ? "" : "none";
  $("rvMsg").textContent = ""; rvRender();
  openOverlay("recvSheet","recvBox");
}
$("recvBtn").onclick = runAndClose(openRecv);
$("recvClose").onclick = () => closeOverlay("recvSheet");
$("recvSheet").addEventListener("click", ev=>{ if(ev.target===$("recvSheet")) closeOverlay("recvSheet"); });
["rvId","rvAmt","rvName"].forEach(id=>$(id).addEventListener("input", rvRender));
$("rvCopyLink").onclick = async () => { const v = rvData(); if(!v) return; try{ await navigator.clipboard.writeText(v.link); showToast(t("recvCopied")); }catch(err){ showToast(t("clipFailed")); } };
$("rvCopyMsg").onclick = async () => {
  const v = rvData(); if(!v) return;
  const c = customers.find(x=>x.id===activeCust);
  const hi = lang==="hi", bar = "━━━━━━━━━━━━━━━━━━";
  const mon = monthLong(year,month)+" "+year;
  const amt = "₹" + new Intl.NumberFormat("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v.am));
  const msg = [
    hi ? `नमस्ते *${c?c.name:""}*,` : `Hello *${c?c.name:""}*,`, "",
    hi ? `आपके *${mon}* के दूध के बिल की जानकारी:` : `Here is your milk bill reminder for *${mon}*.`, "",
    bar, `*${hi?"कुल देय राशि":"AMOUNT DUE"}: ${amt}*`, bar, "",
    `*${hi?"UPI से भुगतान करें":"PAY VIA UPI"}*`, "",
    `*UPI ID:* ${v.pa}` + (v.pn ? ` (${v.pn})` : ""), "",
    `*${hi?"भुगतान लिंक":"Payment link"}:*`, v.link, "",
    bar, "", `*${hi?"आपके सहयोग के लिए धन्यवाद!":"Thank you for your business!"}*`
  ].join("\n");
  const esc = x => String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const label = hi ? "👉 अभी भुगतान करें" : "👉 Tap here to pay";
  const html = esc(msg).replace(esc(v.link), `<a href="${esc(v.link)}">${label}</a>`).replace(/\n/g,"<br>");
  try{
    if(window.ClipboardItem && navigator.clipboard.write){
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([msg],{type:"text/plain"}), "text/html": new Blob([html],{type:"text/html"}) })]);
    } else await navigator.clipboard.writeText(msg);
    showToast(t("recvCopied"));
  }catch(err){ try{ await navigator.clipboard.writeText(msg); showToast(t("recvCopied")); }catch(e2){ showToast(t("clipFailed")); } }
};
$("rvPaid").onclick = () => {
  const c = customers.find(x=>x.id===activeCust); if(!c) return;
  c.paid = c.paid || {}; c.paid[monthKey()] = true; saveCustomers(); updatePaidBtn(); showToast(t("custPaid")); closeOverlay("recvSheet");
};
$("payClose").onclick = () => closeOverlay("paySheet");
document.querySelectorAll("#paySheet [data-app]").forEach(b=>{ b.onclick = () => payWith(b.dataset.app); });
$("payCopy").onclick = async () => {
  const pa = $("payId").value.trim();
  if(!UPI_RE.test(pa)){ $("payMsg").textContent = t("payBadId"); return; }
  try{ await navigator.clipboard.writeText(pa); showToast(t("payCopied")); }catch(err){ showToast(t("clipFailed")); }
};
$("paySheet").addEventListener("click", ev=>{ if(ev.target===$("paySheet")) closeOverlay("paySheet"); });
