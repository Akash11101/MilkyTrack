// Smoke tests: node tests/smoke.mjs   (needs: npm i -D playwright && npx playwright install chromium)
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";

const URL_ = pathToFileURL(path.resolve("www/index.html")).href;
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };

import fs from "node:fs";
for (const dir of ["android-overrides/xml", "android-overrides/drawable"]) {
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith(".xml"))) {
    const x = fs.readFileSync(path.join(dir, f), "utf8");
    ok(x.trim().startsWith("<") && x.trim().endsWith(">"), `Android resource ${f} is well-formed`);
  }
}
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 390, height: 800 } });
const errs = [];
pg.on("pageerror", e => errs.push(String(e)));
await pg.goto(URL_); await pg.waitForTimeout(1500);

const now = new Date(), y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, "0");
const seed = async (days, lang = "en") => {
  await pg.evaluate(([days, y, m, lang]) => {
    const ents = []; for (let d = 1; d <= days; d++) ents.push({ _id: "e" + d, date: `${y}-${m}-${String(d).padStart(2, "0")}`, quantity: 0.5, amount: 44, cust: "c1" });
    localStorage.setItem("milk-ledger-upi", JSON.stringify({ pa: "test@okaxis", pn: "Test" }));
    localStorage.setItem("milk-customers-v1", JSON.stringify([{ id: "c1", name: "Ram ji", phone: "9876543210", addr: "Town", price: 44, paid: { [`${y}-${m}-01`]: true } }]));
    localStorage.setItem("fuel-ledger-v1", JSON.stringify(ents)); localStorage.setItem("milk-lang", lang);
  }, [days, y, m, lang]);
  await pg.reload(); await pg.waitForTimeout(1500);
};

// 1. boots with an empty store
ok((await pg.title()).includes("MilkyTrack"), "boots and has a title");

// 2. totals + paid math
await seed(10);
const due = await pg.evaluate(() => monthDue("c1", 0, customers[0]));
ok(Math.abs(due - 9 * 22) < 0.001, "month due excludes paid day (198)");

// 3. bill fits one A4 page for 31 days (en + hi)
for (const lang of ["en", "hi"]) {
  await seed(31, lang);
  await pg.click("text=" + "Ram ji"); await pg.waitForTimeout(400);
  const html = await pg.evaluate(async () => { await loadJs("bill"); return buildPdfHtml(); });
  const p2 = await b.newPage(); await p2.setContent(html); await p2.waitForTimeout(300);
  const pdf = await p2.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok(pages === 1, `31-day bill is 1 A4 page (${lang})`); await p2.close();
}

// 4. backup -> wipe -> restore round trip keeps customers, entries and UPI
await seed(5);
await pg.evaluate(() => { window.__c = null; navigator.clipboard.writeText = async t => { window.__c = t; }; });
await pg.evaluate(() => backupData()); await pg.waitForTimeout(200);
const backup = await pg.evaluate(() => window.__c);
ok(!!backup && backup.includes("_customers") && backup.includes("_upi"), "backup includes customers and UPI");
await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(1200);
const restored = await pg.evaluate(t => restoreFrom(t), backup);
const after = await pg.evaluate(() => [customers.length, fullList().length, localStorage.getItem("milk-ledger-upi")]);
ok(restored === true && after[0] === 1 && after[1] === 5 && /test@okaxis/.test(after[2]), "restore brings everything back");
ok((await pg.evaluate(() => restoreFrom("not json"))) === false, "restore rejects garbage");

// 5. delete: press-and-hold a card, swipe it away (with Undo); paid rows are protected
await seed(3); await pg.click("text=Ram ji"); await pg.waitForTimeout(500);
ok((await pg.locator(".row .del").count()) === 0, "no ✕ button on delivery cards (swipe to delete)");
const swipe = async (sel, dx) => { const r = pg.locator(sel).first(); await r.scrollIntoViewIfNeeded(); const bb = await r.boundingBox(); const gx = bb.x + bb.width / 2, gy = bb.y + 6;
  await pg.mouse.move(gx, gy); await pg.mouse.down(); await pg.waitForTimeout(520); await pg.mouse.move(gx + dx, gy, { steps: 8 }); await pg.mouse.up(); await pg.waitForTimeout(1300); };
await pg.evaluate(() => { document.getElementById("toast").classList.remove("show"); });
const n0 = await pg.evaluate(() => entries.length);
await swipe(".row.paidrow", -200);
ok((await pg.evaluate(() => entries.length)) === n0, "paid row cannot be swiped away");
await pg.evaluate(() => { entries.forEach(e => { delete e.locked; }); renderAll(); });
await pg.waitForTimeout(300);
await swipe(".row:not(.paidrow):not(.rowlocked)", -200);
ok((await pg.evaluate(() => entries.length)) === n0 - 1, "hold + swipe deletes the delivery");
await pg.click("#toastUndo"); await pg.waitForTimeout(300);
ok((await pg.evaluate(() => entries.length)) === n0, "Undo brings the delivery back");
const tops = await pg.evaluate(() => [...document.querySelectorAll(".row-top")].map(r => { const cs = [...r.children].map(c => { const b = c.getBoundingClientRect(); return b.top + b.height / 2; }); return Math.max(...cs) - Math.min(...cs); }));
ok(tops.every(d => d < 12), "card header elements stay on one line");

// 6. report renders KPIs
await seed(12); await pg.click("#menuBtn"); await pg.waitForTimeout(300); await pg.click("#reportBtn"); await pg.waitForTimeout(400);
ok((await pg.locator(".rep-kpi").count()) >= 6, "report shows KPI cards");

// 7. i18n parity
const missing = await pg.evaluate(() => Object.keys(STR.en).filter(k => !(k in STR.hi)));
ok(missing.length === 0, "every English string has a Hindi translation" + (missing.length ? " (missing: " + missing.slice(0, 5) + ")" : ""));

ok(errs.length === 0, "no uncaught page errors" + (errs.length ? ": " + errs[0] : ""));
await b.close();
process.exit(failed ? 1 : 0);
