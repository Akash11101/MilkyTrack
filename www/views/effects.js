/* Small visual effects: confetti, count-up totals. */
/* ===== little delights: confetti burst, count-up totals, number bumps ===== */
const calmMotion = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
function burst(x, y, n){
  if(calmMotion()) return;
  const cols = ["#117D44","#EAA222","#25D366","#FFD36B","#7BC99B"], layer = document.createElement("div");
  layer.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;z-index:60;pointer-events:none";
  document.body.appendChild(layer);
  for(let i=0;i<(n||18);i++){
    const d = document.createElement("i"), a = Math.random()*Math.PI*2, r = 50 + Math.random()*90, sz = 5 + Math.random()*6;
    d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${sz}px;height:${sz*(Math.random()>.5?1:.45)}px;border-radius:${Math.random()>.5?"50%":"2px"};background:${cols[i%cols.length]}`;
    layer.appendChild(d);
    try{ d.animate([{transform:"translate(-50%,-50%) scale(.3) rotate(0)",opacity:1},{transform:`translate(${Math.cos(a)*r}px,${Math.sin(a)*r-30}px) scale(1) rotate(${Math.random()*360}deg)`,opacity:1,offset:.55},{transform:`translate(${Math.cos(a)*r*1.1}px,${Math.sin(a)*r+50}px) scale(.8) rotate(${Math.random()*540}deg)`,opacity:0}],{duration:760+Math.random()*320,easing:"cubic-bezier(.2,.7,.3,1)",fill:"forwards"}); }catch(e){}
  }
  setTimeout(()=>layer.remove(), 1400);
}
const burstAt = el => { try{ const b = el.getBoundingClientRect(); burst(b.left + b.width/2, b.top + b.height/2); }catch(e){} };
let lastHeroTotal = null, lastHeroCust = null;
function countUpHero(total){
  const el = document.querySelector("#hero .hero-total"); if(!el) return;
  const same = lastHeroCust === activeCust;
  if(same && lastHeroTotal !== null && lastHeroTotal !== total && !calmMotion()){
    const from = lastHeroTotal, t0 = performance.now(), dur = 520;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    const step = now => { const k = Math.min(1, (now-t0)/dur), e = 1 - Math.pow(1-k,3); el.textContent = fmtMoney(from + (total-from)*e); if(k<1 && el.isConnected) requestAnimationFrame(step); else if(el.isConnected) el.textContent = fmtMoney(total); };
    requestAnimationFrame(step);
  }
  lastHeroTotal = total; lastHeroCust = activeCust;
}
document.addEventListener("click", ev=>{   // stepper numbers bump when you tap − or +
  const b = ev.target.closest && ev.target.closest(".num-ctl button"); if(!b || calmMotion()) return;
  const inp = b.parentElement.querySelector("input"); if(!inp) return;
  inp.classList.remove("bump"); void inp.offsetWidth; inp.classList.add("bump");
});
