# MilkyTrack architecture

MilkyTrack is an offline-first app: all data stays on the phone (localStorage, or Android Preferences in the APK). There is no server, API or database, so the usual `routes/` and `.env` folders do not exist. The same layering is applied to the front end instead.

```
www/
├── index.html            # page markup and the ordered list of scripts and styles
├── manifest.webmanifest
├── assets/               # images (app icon)
├── config/               # constants and catalogues
│   └── items.js          #   milk / dahi / paneer / ghee and unit helpers
├── i18n/                 # language
│   ├── strings.js        #   English and Hindi text (every English key needs a Hindi key)
│   └── i18n.js           #   t(), applyI18n(), setLang()
├── models/               # data layer
│   ├── store.js          #   save/load deliveries, entry helpers, CSV
│   └── backup.js         #   backup and restore
├── controllers/          # what happens when the user acts
│   ├── customers.js      #   customers, home list, paid state, WhatsApp text
│   ├── entryEditing.js   #   steppers, inputs, notes
│   ├── entryLocking.js   #   auto-lock, double-tap lock / duplicate
│   ├── swipeDelete.js    #   hold + swipe to delete
│   ├── bulkAdd.js        #   add or remove a date range
│   ├── pay.js            #   pay via UPI
│   ├── receive.js        #   receive via UPI (QR)
│   ├── report.js         #   report numbers and wiring
│   ├── navigation.js     #   language switch, month navigation
│   ├── export.js         #   export, copy, and the lazy loader
│   └── startup.js        #   first-run checks
├── views/                # drawing the screen
│   ├── summary.js        #   header totals, customer summary card
│   ├── entryList.js      #   delivery cards, day strip, today button
│   ├── overlays.js       #   sheets and the slide-out menu
│   └── effects.js        #   confetti, count-up
├── middleware/           # cross-cutting behaviour
│   ├── haptics.js
│   └── platform.js       #   screen-change motion, Android back button
├── services/             # heavy code, loaded only when first used
│   ├── bill.js           #   A4 / thermal bills and PDF rendering
│   └── report.js         #   monthly report screen
├── utils/                # small pure helpers
│   ├── helpers.js
│   ├── calc.js
│   └── months.js
└── styles/               # base, entries, customers, sheets, report, motion
```

## Rules for working in parallel

- Scripts are plain browser scripts that share one global scope, loaded in the order listed in `index.html`. That order is the dependency order; keep it when adding files.
- Everything under `services/` loads on demand through `loadJs("bill")` / `loadJs("report")` (see `controllers/export.js`). Code that calls into a service must `await loadJs(...)` first.
- Add a new file: create it in the right folder, add its `<script>` line in `index.html`, then run `npm run check`.
- Style files are loaded in this order: base, entries, customers, sheets, report, motion. Later files win when two rules are equally specific.
- Run `npm test` (smoke tests) before every merge.
- Team ownership: fill in `.github/CODEOWNERS`.
