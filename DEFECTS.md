# DEFECTS.md — GURUKRIPA SERVICES

**Branch:** `design-responsive-pass-2026-11-10`  
**Phase:** 0 inventory (documentation only)  
**Sources:** live `localhost:4173` measurements, `SCREEN_INVENTORY.md`, `ROOT_CAUSES.md`, user-reported defects.

Status values: **Open** | **Mitigated** | **Fixed** | **External** (needs real assets / keys)

---

## Layout / responsive

| ID | Defect | Evidence | Suspected root | Target phase | Status |
|---|---|---|---|---|---|
| D1 | Hero ~770–890px uses ~300–350px width; blank right; blurry image; glass wrap; CTAs stack; Est. pill oval | 770: copy/media ≈302px; img `hero-768.jpg` natural ≈369; `qa/before/770-home.png` | Hero grid breakpoints; missing/incorrect `srcset`/`sizes`; pill `border-radius` | 2–3 | Open |
| D2 | ~350px header clips brand behind language toggle; Est. badge truncated | `qa/before/350-home.png` | Navbar flex without `min-width:0`; no shortened badge text | 2 | Open |
| D3 | Duplicate language toggle (topbar + header); bottom nav visible ~890px | 890: topbar EN/HI + header EN/HI; `.mobile-nav` `display:block` | Dual `setLang` UI; bottom-nav media query | 2 | Open |
| D4 | FAB overlaps hero badge / product cards | `qa/before/360-home.png` | Fixed FAB offsets; no collision avoid | 2 | Open |
| D5 | Products: Filters wide; count shown 3×; card rows misaligned; shared images; stock row clips | 1366: `#productsCount`, `#catalogSheetCount`, `#productsCountDesktop` all visible; `qa/before/1366-products.png` | Triplicate count nodes; no subgrid; shared `product-*-480.jpg` | 3 | Open |
| D6 | Navy/neon product renders vs warm theme | Product cards / SHOT_LIST | Studio PNGs; theme tokens | 1, 3 | Open / External |

---

## Brand / content

| ID | Defect | Evidence | Target phase | Status |
|---|---|---|---|---|
| D8 | Display name “Gurukripa Services” vs legal “Gurukripa Bricks Industry” in title/meta/invoices | Document title vs header | 2 | Open |

---

## Performance / PWA

| ID | Defect | Evidence | Target phase | Status |
|---|---|---|---|---|
| D7 | Slow 4G: ~200 requests / ~7.7 MB; SW precaches many CSS/JS/images | User report; `sw.js` SHELL + RUNTIME_WARM; 27 CSS ≈695 KB | 1, 5 | Open |
| D7b | Patch CSS override wars (`!important` heavy) | `mobile-fixes` 499 `!important`; `interaction-fixes` 101 | 1 | Open |

---

## Commerce / interactions

| ID | Defect | Evidence | Target phase | Status |
|---|---|---|---|---|
| RC-1 | Add to Cart did nothing | Capture busy lock blocked delegation — see `ROOT_CAUSES.md` | (commerce) | **Fixed** `0bdfac2` |
| RC-2 | Wishlist heart net no-op | Double listeners | (commerce) | **Fixed** `0bdfac2` |
| RC-3 | Busy Add button `pointer-events:none` | catalog-premium.css | (commerce) | **Fixed** `0bdfac2` |
| D9 | Drawers auto-open on load | `translateZ(0)` wiped off-canvas transforms | 4 | **Mitigated** prior pass; re-verify Phase 4/7 |
| D10 | Filters open inline without proper backdrop on desktop | Products `#catalogSidebar` | 3–4 | Open |

---

## Accessibility / i18n (seed for Phase 6)

| ID | Defect | Notes | Status |
|---|---|---|---|
| A1 | Hindi clipping risk in chips/badges | Needs full EN/HI pass | Open |
| A2 | Icon buttons / focus rings incomplete | Partial | Open |
| A3 | Duplicate lang controls confuse SR users | Same as D3 | Open |

---

## Gaps in Phase 0 screenshot set

Captured: home @ 350/360/768/770/890/1024/1366; products @ 1024/1366.  
**Not yet captured as files:** calculator, nearby, contact, footer, every popup — deferred to Phase 7 sweep (`SCREEN_INVENTORY` §I).

---

## External dependencies (do not fabricate)

| Item | Notes |
|---|---|
| Unique daylight product photos | `SHOT_LIST.md` |
| Google Maps / Razorpay / reCAPTCHA live keys | Scaffold when unset |
| Genuine social URLs | Footer — verify before changing |

---

## Phase mapping

| Phase | Defects primarily addressed |
|---|---|
| 1 | D6 tokens, D7b CSS consolidation |
| 2 | D1–D4, D8 shell |
| 3 | D5, D10 page/product |
| 4 | D9, popup defaults |
| 5 | D7 perf/SW |
| 6 | A1–A3 bilingual/a11y |
| 7 | Full re-verify + remaining gaps |
