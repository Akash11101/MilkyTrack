/* Default prices for milk, dahi, paneer, ghee: edited from the menu, used for new deliveries and item switches. */
function openPrices(){
  const cur = getDefaultPrices();
  $("priceFields").innerHTML = ITEM_ORDER.map(k=>`<div class="field"><label class="flabel" for="price_${k}">${ITEMS[k][lang==="hi"?"hi":"en"]} (₹ ${t(k==="milk" ? "pricePerL" : "pricePerKg")})</label><input type="number" inputmode="decimal" step="0.5" min="0" id="price_${k}" class="date-field" value="${cur[k] ? esc(cur[k]) : ""}"></div>`).join("");
  openOverlay("priceSheet","priceBox");
}
$("priceBtn").onclick = runAndClose(openPrices);
$("priceClose").onclick = $("priceCancel").onclick = () => closeOverlay("priceSheet");
$("priceSheet").addEventListener("click", ev=>{ if(ev.target===$("priceSheet")) closeOverlay("priceSheet"); });
$("priceSave").onclick = () => {
  const map = {}; ITEM_ORDER.forEach(k=>{ map[k] = $("price_"+k).value; });
  setDefaultPrices(map); closeOverlay("priceSheet"); showToast(t("priceSaved"));
};
