// Fails if www/index.html points at a missing file, or a source file is not loaded by it
// (lazy services/ files are loaded from code, so they are exempt).
import fs from "fs"; import path from "path";
const root = "www", html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const refs = [...html.matchAll(/(?:src|href)="((?:i18n|config|utils|models|views|controllers|middleware|styles)\/[^"]+)"/g)].map(m=>m[1]);
let bad = 0;
for(const r of refs) if(!fs.existsSync(path.join(root,r))){ console.error("MISSING:", r); bad++; }
const dirs = ["i18n","config","utils","models","views","controllers","middleware","styles"];
for(const d of dirs) for(const f of fs.readdirSync(path.join(root,d))){ const p = d+"/"+f; if(!refs.includes(p)){ console.error("NOT LOADED:", p); bad++; } }
for(const f of ["bill","report"]) if(!fs.existsSync(path.join(root,"services",f+".js"))){ console.error("MISSING: services/"+f+".js"); bad++; }
console.log(bad ? bad+" problem(s)" : "structure OK ("+refs.length+" files loaded at start, 2 lazy services)");
process.exit(bad?1:0);
