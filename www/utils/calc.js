/* Money and quantity helpers. */
const MAX_QTY = 1000, MAX_AMT = 100000;
const lineTotal = e => (Number(e.quantity)||0) * (Number(e.amount)||0);
const round1 = n => Math.round(n*10)/10;
const fmtMoney = n => "₹" + n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtNum = n => n.toLocaleString(undefined,{maximumFractionDigits:2});
const entriesForMonth = () => entries.filter(e=>{ const d=new Date(e.date); return d.getFullYear()===year && d.getMonth()+1===month; }).sort((a,b)=>new Date(a.date)-new Date(b.date));
const monthDay = () => new Date(year, month-1, Math.min(today.getDate(), new Date(year,month,0).getDate()));
