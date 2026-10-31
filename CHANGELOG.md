# Changelog

## 1.5.1
- Cards are always in date order; a new or duplicated card goes at the end of its own date.
- Mark range: a calendar to pick the first and last day (the range is highlighted). The From and To fields still work and stay in sync.

## 1.5.0
- Default prices: menu > Default prices sets a price for milk, dahi, paneer and ghee. New deliveries use the milk price, and switching a card to another item fills that item's price.
- The day list on the right edge and the month switcher in the customer card are back as before (the full-month calendar grid was tried and reverted).
- Customer card: address, phone and rate share one style; the card background is white.
- Original green colour scheme kept (a black-and-white version was tried and reverted).

## 1.4.1
- Code is organised by responsibility (config, models, views, controllers, middleware, services, utils, i18n, styles) so teams can work in separate folders. See docs/ARCHITECTURE.md.
- Styles are split into base, entries, customers, sheets, report and motion; the rendered result is unchanged (checked element by element in 10 app states).
- Added `npm run check` (structure check) and a `.github/CODEOWNERS` template.

## 1.4.0
- Faster start-up: the app is split into separate files (page, styles, core script, language text). The page itself is about 120 KB smaller on first load.
- The bill/PDF code and the monthly report code now load only when you first open them.
- The web manifest and its icon are separate files instead of being embedded in the page.
- Removed: dark mode (menu switch and styles).
- Lock button moved to the bottom right of the card, with the item button (Milk/Dahi/Paneer) at the top right.

## 1.3.6
- Double-tap the date on a card to duplicate it (same date and values, with Undo).
- Dark mode: switch in the menu (follows the phone setting until you choose; remembered after that).
- Release build: all changes below.

## 1.3.5
- A card you just added stays at the very bottom of the list (until the app is reopened).
- Release build: all changes below.

## 1.3.4
- Double-tap (or double-click) a card to lock or unlock it.
- The date on a delivery card is display-only (no calendar picker, so it can no longer create or move entries).
- Text is no longer selectable by dragging anywhere in the app (inputs, notes and the privacy policy still are).
- Desktop: deleting a card slides it out and the gap closes smoothly (no spin); phones keep the springy fling.
- Report: removed all "vs last month" badges.
- Report: a month still in progress is compared with the same days of last month, not the whole month.
- Report: "By item" has a doughnut chart (share of billing per item).
- "Amount (Milk)" is a button like Deliveries and Other items: tap to see milk-only deliveries, grouped by price.
- Release build including grouped item lists, split-screen fit and the start-up screen fix.

## 1.3.3
- Item lists are also grouped by price (with quantity and total per price) when an item has more than one price.
- Customer card: "Amount" is now labelled "Amount (Milk)".
- Other items and Deliveries lists are grouped by item with a total for each group and a grand total.
- Fixed the stretched, blurry photo at app start: the system launch screen is plain again, and only the small bouncing logo shows while the app loads.
- Split-screen: header logo shrinks to fit narrow windows; Android activity explicitly resizeable.
- Release build with all fixes below.

## 1.3.2
- New app icon (milkman illustration): launcher icons, splash, web icon, bill logo.
- Report "By customer" is grouped into To remind and Paid.
- Report: new "Milk by customer" bar chart (tap a bar for name, litres and bill).
- With a mouse, a card can be dragged left or right straight away (no press-and-hold needed).
- Entries are locked by default: any unlocked entry locks itself 30 seconds after it appears, no matter what.
- Sharper PDFs: A4 at about 290 dpi, thermal at 4x, stored lossless (no JPEG blur), with JPEG fallback.
- New MilkyTrack wordmark logo in the header and on A4 and thermal bills.

## 1.3.1
- Swipe no longer pans the page sideways; no stray text selection when holding a card.
- Bills: consistent month names/dates in Hindi and English, light Hindi headings and item column, thermal Hindi month light.
- Report sheet keeps one height for every month.
- Public privacy page (docs/privacy.html) published by the Pages workflow.
- Smaller app file (comments stripped).

## 1.3.0
- Swipe-to-delete cards (press and hold, then swipe) with bouncy animation and Undo; richer motion across the app.
- Notes limited to 15 words; price-change badge removed; "Customers" back button removed.
- Month and Report sections switch independently.
- Menu: Privacy Policy link (English/Hindi) opens in-app.

## 1.2.0
- Items beyond milk (Dahi, Paneer, ghee…) with their own unit/price; "Other items" list, Report "By item".
- Bills: A4 and 80 mm Thermal receipt (with logo), full month names, one-day bills when a day is selected, light month text; WhatsApp message button (opens the customer's chat).
- Delivery cards: item chip, lock/unlock with 30-second auto-lock, date change moves the card.
- Menu: haptic feedback on/off switch. Extra motion: cascading cards, month slide, paid celebration, springy switches. Scroll bars hidden in sheets.
- Landscape layout and notch / cut-out safe areas (not doubled inside the Android app).
- Production: app file 550 KB -> 380 KB (duplicate images removed), dead code removed, Content-Security-Policy added, save-failure warnings for customers.

## 1.1.0
- Brand refresh: new logo, wordmark, icon and green/orange colour palette.
- Report screen: monthly KPIs, litres-per-day chart, per-customer dues, WhatsApp reminders, month flipping (buttons, keys).
- PDF bill and report download directly; 31-day bills fit one A4 page; QR code at the top; acknowledgment box.
- Backup now includes the customer list and UPI ID.
- Deleting a delivery needs a second tap to confirm.
- Production hardening: friendly handling of unexpected errors, data schema version, automated smoke tests in CI, optional private signing key.

## 1.0.0
- First release: daily ledger, customers, UPI pay, PDF bill, Hindi/English, backup/restore.
