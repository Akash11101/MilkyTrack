/* Language runtime: t(), applyI18n(), setLang(). Text lives in i18n/strings.js. */
/*I18N-START*/
const LANG_KEY = "milk-ledger-lang";
let lang = "en"; try{ const sv = localStorage.getItem(LANG_KEY); if(sv==="hi"||sv==="en") lang = sv; }catch(err){}
const UNIT_KEY = "milk-unit";
let unit = "L";   // derived per view from the entries (each delivery card has its own L/kg switch)
const UL = () => unit==="kg" ? (lang==="hi" ? "किग्रा" : "kg") : (lang==="hi" ? "ली" : "L");
const KG = {
  en:{ litres:"Kilograms", priceL:"Price/kg", pricePerLitre:"Price per kg", decLitres:"Decrease kg", incLitres:"Increase kg", decPrice:"Decrease price per kg", incPrice:"Increase price per kg",
       litresStat:"Kilograms", avgPrice:"Avg price/kg", repLitres:"Milk delivered", repDaily:"Kilograms per day", custLitres:"Kilograms", custPrice:"Price/kg",
       deliveryTotal:"{l} kg · {amt} total", cpRate:"Rate per kg", cpAvgRate:"Average rate per kg", cpLitres:"kg", cpLitre:"kg", prRateCol:"Rate/kg" },
  hi:{ litres:"किलो", priceL:"भाव/किग्रा", pricePerLitre:"प्रति किग्रा भाव", decLitres:"किलो घटाएँ", incLitres:"किलो बढ़ाएँ", decPrice:"भाव घटाएँ", incPrice:"भाव बढ़ाएँ",
       litresStat:"किलो", avgPrice:"औसत भाव/किग्रा", repDaily:"प्रतिदिन किलो", custLitres:"किलो", custPrice:"भाव/किग्रा",
       deliveryTotal:"{l} किग्रा · कुल {amt}", cpRate:"प्रति किग्रा दर", cpAvgRate:"औसत दर प्रति किग्रा", cpLitres:"किग्रा", cpLitre:"किग्रा", prRateCol:"दर/किग्रा" }
};
function t(key, vars){
  let s = (unit==="kg" && KG[lang] && KG[lang][key]) || (STR[lang] && STR[lang][key]) || STR.en[key] || key;
  if(vars) for(const k in vars) s = s.split("{"+k+"}").join(vars[k]);
  return s;
}
const tr = (k,v) => t(k,v);
const nounDelivery = n => t(n===1 ? "delivery_one" : "delivery_other");
const locale = () => STR[lang].locale;
function applyI18n(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>{ el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-title]").forEach(el=>{ el.setAttribute("title", t(el.dataset.i18nTitle)); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ el.setAttribute("placeholder", t(el.dataset.i18nPh)); });
}
function setLang(l){
  lang = l; try{ localStorage.setItem(LANG_KEY, lang); }catch(err){}
  applyI18n(); if(typeof renderAll==="function") renderAll();
}
/*I18N-END*/
