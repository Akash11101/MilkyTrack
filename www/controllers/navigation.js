/* Language switch, month navigation, range button. */
/* ---------- language ---------- */
applyI18n();
$("langBtn").onclick = runAndClose(() => setLang(lang==="en" ? "hi" : "en"));
/* ---------- month navigation (buttons only: no swipe, so a touch never switches the month) ---------- */
$("prevMonth").onclick = () => { month--; if(month<1){month=12;year--;} focusDate=null; renderAll(); };
$("nextMonth").onclick = () => { month++; if(month>12){month=1;year++;} focusDate=null; renderAll(); };
$("rangeBtn").onclick = runAndClose(openBulk);
