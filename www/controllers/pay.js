/* Pay via UPI. */
/* ---------- pay via UPI ---------- */
const UPI_KEY = "milk-ledger-upi";
const UPI_RE = /^[A-Za-z0-9._-]{2,}@[A-Za-z][A-Za-z0-9.-]{1,}$/;
function amountDue(){
  const all = entriesForMonth();
  const list = focusDate ? all.filter(e=>fmtDateInput(e.date)===focusDate) : all;
  return Math.round(list.reduce((s,e)=>s+lineTotal(e),0)*100)/100;
}
function openPay(){
  let sv = {}; try{ sv = JSON.parse(localStorage.getItem(UPI_KEY)||"{}"); }catch(err){}
  $("payId").value = sv.pa || ""; $("payName").value = sv.pn || "";
  $("payAmt").value = amountDue() || "";
  $("paySub").textContent = focusDate
    ? t("paySubDay",{date:dayMonthLong(parseLocal(focusDate))})
    : t("paySubMonth",{month:monthLong(year,month)+" "+year});
  $("payMsg").textContent = "";
  openOverlay("paySheet","payBox");
}
function payValid(){
  const pa = $("payId").value.trim(), am = Number($("payAmt").value);
  if(!UPI_RE.test(pa)){ $("payMsg").textContent = t("payBadId"); return null; }
  if(!(am>0)){ $("payMsg").textContent = t("payNoAmt"); return null; }
  $("payMsg").textContent = "";
  try{ localStorage.setItem(UPI_KEY, JSON.stringify({ pa, pn:$("payName").value.trim() })); }catch(err){}
  return { pa, pn:$("payName").value.trim(), am:am.toFixed(2) };
}
function payWith(app){
  const v = payValid(); if(!v) return;
  const q = `pa=${encodeURIComponent(v.pa)}` + (v.pn ? `&pn=${encodeURIComponent(v.pn)}` : "") + `&am=${v.am}&cu=INR&tn=${encodeURIComponent(t("payNote",{month:monthLong(year,month)+" "+year}))}`;
  const base = { upi:"upi://pay?", gpay:"tez://upi/pay?", phonepe:"phonepe://pay?", paytm:"paytmmp://pay?" }[app] || "upi://pay?";
  const a = document.createElement("a"); a.href = base + q; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
}
/* minimal QR encoder: byte mode, error correction M, versions 1-10 */
const makeQR = (() => {
  const EXP = new Array(512), LOG = new Array(256);
  (function(){ let x = 1; for(let i=0;i<255;i++){ EXP[i]=x; LOG[x]=i; x<<=1; if(x&256) x^=0x11D; } for(let i=255;i<512;i++) EXP[i]=EXP[i-255]; })();
  const gmul = (a,b) => (a&&b) ? EXP[LOG[a]+LOG[b]] : 0;
  const rsGen = n => { let g=[1]; for(let i=0;i<n;i++){ const ng=new Array(g.length+1).fill(0); for(let j=0;j<g.length;j++){ ng[j]^=g[j]; ng[j+1]^=gmul(g[j],EXP[i]); } g=ng; } return g; };
  const rsEcc = (data,n) => { const g=rsGen(n), r=new Array(n).fill(0); for(const d of data){ const f=d^r.shift(); r.push(0); for(let i=0;i<n;i++) r[i]^=gmul(g[i+1],f); } return r; };
  const T = [null,[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],[16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]];
  const ALIGN = [null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  const bch = (v,poly,len) => { let r=v<<len; const pl=Math.floor(Math.log2(poly)); for(let i=Math.floor(Math.log2(r||1));i>=pl;i--) if((r>>i)&1) r^=poly<<(i-pl); return r; };
  return function(text){
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 0;
    for(let v=1;v<=10;v++){ const t=T[v], cap=t[1]*t[2]+t[3]*t[4]; if(4+(v<10?8:16)+8*bytes.length <= cap*8){ ver=v; break; } }
    if(!ver) return null;
    const t=T[ver], dataCw=t[1]*t[2]+t[3]*t[4];
    const bits=[]; const put=(val,n)=>{ for(let i=n-1;i>=0;i--) bits.push((val>>i)&1); };
    put(4,4); put(bytes.length, ver<10?8:16); bytes.forEach(b=>put(b,8));
    for(let i=0;i<4&&bits.length<dataCw*8;i++) bits.push(0);
    while(bits.length%8) bits.push(0);
    const cw=[]; for(let i=0;i<bits.length;i+=8) cw.push(parseInt(bits.slice(i,i+8).join(""),2));
    for(let p=0xEC; cw.length<dataCw; p^=0xEC^0x11) cw.push(p);
    const blocks=[]; let pos=0;
    for(let i=0;i<t[1];i++){ blocks.push(cw.slice(pos,pos+t[2])); pos+=t[2]; }
    for(let i=0;i<t[3];i++){ blocks.push(cw.slice(pos,pos+t[4])); pos+=t[4]; }
    const ecs=blocks.map(b=>rsEcc(b,t[0]));
    const out=[]; const maxd=Math.max(t[2],t[4]);
    for(let i=0;i<maxd;i++) blocks.forEach(b=>{ if(i<b.length) out.push(b[i]); });
    for(let i=0;i<t[0];i++) ecs.forEach(e=>out.push(e[i]));
    const N=17+4*ver, M=[], F=[];
    for(let i=0;i<N;i++){ M.push(new Array(N).fill(false)); F.push(new Array(N).fill(false)); }
    const setF=(r,c,v)=>{ if(r>=0&&c>=0&&r<N&&c<N){ M[r][c]=v; F[r][c]=true; } };
    const finder=(r,c)=>{ for(let dy=-1;dy<=7;dy++) for(let dx=-1;dx<=7;dx++){ const on = dy>=0&&dy<=6&&dx>=0&&dx<=6&&(dy==0||dy==6||dx==0||dx==6||(dy>=2&&dy<=4&&dx>=2&&dx<=4)); setF(r+dy,c+dx,on); } };
    finder(0,0); finder(0,N-7); finder(N-7,0);
    for(let i=8;i<N-8;i++){ setF(6,i,i%2==0); setF(i,6,i%2==0); }
    const al=ALIGN[ver];
    al.forEach((r,i)=>al.forEach((c,j)=>{ if((i==0&&j==0)||(i==0&&j==al.length-1)||(i==al.length-1&&j==0)) return; for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) setF(r+dy,c+dx,Math.max(Math.abs(dy),Math.abs(dx))!=1); }));
    setF(N-8,8,true);
    for(let i=0;i<9;i++){ if(!F[8][i]) setF(8,i,false); if(!F[i][8]) setF(i,8,false); }
    for(let i=0;i<8;i++){ setF(8,N-1-i,false); setF(N-1-i,8,false); }
    setF(N-8,8,true);
    if(ver>=7){ const vi=(ver<<12)|bch(ver,0x1F25,12); for(let i=0;i<18;i++){ const b=((vi>>i)&1)==1, a=Math.floor(i/3), c=N-11+i%3; setF(a,c,b); setF(c,a,b); } }
    const dbits=[]; out.forEach(b=>put2(b)); function put2(b){ for(let i=7;i>=0;i--) dbits.push((b>>i)&1); }
    let k=0, up=true;
    for(let c=N-1;c>0;c-=2){ if(c==6) c--; for(let i=0;i<N;i++){ const r=up?N-1-i:i; for(let d=0;d<2;d++){ const cc=c-d; if(!F[r][cc]){ M[r][cc]= k<dbits.length ? dbits[k]==1 : false; k++; } } } up=!up; }
    const masks=[(r,c)=>(r+c)%2==0,(r,c)=>r%2==0,(r,c)=>c%3==0,(r,c)=>(r+c)%3==0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2==0,(r,c)=>(r*c)%2+(r*c)%3==0,(r,c)=>((r*c)%2+(r*c)%3)%2==0,(r,c)=>((r+c)%2+(r*c)%3)%2==0];
    const build=m=>{ const G=M.map(row=>row.slice());
      for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(!F[r][c] && masks[m](r,c)) G[r][c]=!G[r][c];
      const fd=((0<<3)|m), fmt=((fd<<10)|bch(fd,0x537,10))^0x5412;
      const bit=i=>((fmt>>i)&1)==1;
      for(let i=0;i<=5;i++) G[i][8]=bit(i); G[7][8]=bit(6); G[8][8]=bit(7); G[8][7]=bit(8);
      for(let i=9;i<15;i++) G[8][14-i]=bit(i);
      for(let i=0;i<8;i++) G[8][N-1-i]=bit(i);
      for(let i=8;i<15;i++) G[N-15+i][8]=bit(i);
      G[N-8][8]=true;
      return G; };
    const pen=G=>{ let p=0;
      for(let r=0;r<N;r++){ let run=1; for(let c=1;c<N;c++){ if(G[r][c]==G[r][c-1]) run++; else { if(run>=5) p+=run-2; run=1; } } if(run>=5) p+=run-2; }
      for(let c=0;c<N;c++){ let run=1; for(let r=1;r<N;r++){ if(G[r][c]==G[r-1][c]) run++; else { if(run>=5) p+=run-2; run=1; } } if(run>=5) p+=run-2; }
      for(let r=0;r<N-1;r++) for(let c=0;c<N-1;c++) if(G[r][c]==G[r][c+1]&&G[r][c]==G[r+1][c]&&G[r][c]==G[r+1][c+1]) p+=3;
      let dark=0; G.forEach(row=>row.forEach(v=>{ if(v) dark++; })); p+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10; return p; };
    let best=null, bp=1e9;
    for(let m=0;m<8;m++){ const G=build(m), p=pen(G); if(p<bp){ bp=p; best=G; } }
    return best;
  };
})();
const qrSvg = (text, px) => {
  const g = makeQR(text); if(!g) return "";
  const n = g.length, q = 4; let d = "";
  g.forEach((row,r)=>row.forEach((v,c)=>{ if(v) d += `M${c+q},${r+q}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+2*q} ${n+2*q}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
};
