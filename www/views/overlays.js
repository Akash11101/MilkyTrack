/* Sheets/overlays and the slide-out menu. */
function openOverlay(id, boxId){ $(id).classList.add("show"); document.body.style.overflow = "hidden"; $(boxId).focus(); }
function closeOverlay(id){ $(id).classList.remove("show"); if(!document.querySelector(".sheet-overlay.show")) document.body.style.overflow = ""; }
/* single slide-out menu: everything that used to sit in the bottom dock
   (month nav, add delivery, mark range, statement tools, language) now
   lives in here, opened by the one 3-bar button. Tapping an action inside
   closes the drawer so the result is visible right away; the nav arrows
   are the one exception, since browsing months stays inside the drawer. */
function openDrawer(){ openOverlay("drawerOverlay","drawer"); $("menuBtn").setAttribute("aria-expanded","true"); }
function closeDrawer(){ closeOverlay("drawerOverlay"); $("menuBtn").setAttribute("aria-expanded","false"); }
const runAndClose = fn => () => { closeDrawer(); fn(); };
$("menuBtn").onclick = openDrawer;
$("drawerClose").onclick = closeDrawer;
$("drawerOverlay").addEventListener("click", ev=>{ if(ev.target===$("drawerOverlay")) closeDrawer(); });
