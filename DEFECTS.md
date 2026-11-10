# DEFECTS.md — GURUKRIPA BRICKS INDUSTRY

**Branch:** `design-responsive-pass-2026-11-10`  
**Phase:** 7 delivery (Phases 0–7 complete on this branch)  
**Sources:** live `localhost:4173` measurements, `SCREEN_INVENTORY.md`, `ROOT_CAUSES.md`, user-reported defects.

Status values: **Open** | **Mitigated** | **Fixed** | **External** (needs real assets / keys)

---

## Layout / responsive

| ID | Defect | Evidence | Suspected root | Target phase | Status |
|---|---|---|---|---|---|
| D1 | Hero ~770–890px uses ~300–350px width; blank right; blurry image; glass wrap; CTAs stack; Est. pill oval | 770: copy/media ≈302px; img `hero-768.jpg` natural ≈369; `qa/before/770-home.png` | Hero grid breakpoints; missing/incorrect `srcset`/`sizes`; pill `border-radius` | 2–3 | **Fixed** (2-col ≥1024; sizes 100vw below) |
| D2 | ~350px header clips brand behind language toggle; Est. badge truncated | `qa/before/350-home.png` | Navbar flex without `min-width:0`; no shortened badge text | 2 | **Fixed** |
| D3 | Duplicate language toggle (topbar + header); bottom nav visible ~890px | 890: topbar EN/HI + header EN/HI; `.mobile-nav` `display:block` | Dual `setLang` UI; bottom-nav media query | 2 | **Fixed** |
| D4 | FAB overlaps hero badge / product cards | `qa/before/360-home.png` | Fixed FAB offsets; no collision avoid | 2 | **Mitigated** (badge max-width + FAB suppress on overlay) |
| D5 | Products: Filters wide; count shown 3×; card rows misaligned; shared images; stock row clips | 1366: triplicate counts; `qa/before/1366-products.png` | Triplicate count nodes; no subgrid; shared images | 3 | **Fixed** (one visible count/breakpoint; card flex align) |
| D6 | Navy/neon product renders vs warm theme | Product cards / SHOT_LIST | Studio PNGs; theme tokens | 1, 3 | **Mitigated** (tokens locked warm brick; imagery still External) |

---

## Brand / content

| ID | Defect | Evidence | Target phase | Status |
|---|---|---|---|---|
| D8 | Display name “Gurukripa Services” vs legal “Gurukripa Bricks Industry” in title/meta/invoices | Document title vs header | 2 | **Fixed** (brand.name → Bricks Industry EN/HI) |

---

## Performance / PWA

| ID | Defect | Evidence | Target phase | Status |
|---|---|---|---|---|
| D7 | Slow 4G: ~200 requests / ~7.7 MB; SW precaches many CSS/JS/images | User report; prior `SHELL_ASSETS` | 1, 5 | **Mitigated** (`v14-perf` shell-only install; deferred CSS; idle warm; request count still multi-file) |
| D7b | Patch CSS override wars (`!important` heavy) | `mobile-fixes` / `interaction-fixes` | 1 | **Mitigated** (cascade layers; residual `!important` remains in legacy patches) |

---

## Commerce / interactions

| ID | Defect | Evidence | Target phase | Status |
|---|---|---|---|---|
| RC-1 | Add to Cart did nothing | Capture busy lock blocked delegation — see `ROOT_CAUSES.md` | (commerce) | **Fixed** `0bdfac2` |
| RC-2 | Wishlist heart net no-op | Double listeners | (commerce) | **Fixed** `0bdfac2` |
| RC-3 | Busy Add button `pointer-events:none` | catalog-premium.css | (commerce) | **Fixed** `0bdfac2` |
| D9 | Drawers auto-open on load | `translateZ(0)` wiped off-canvas transforms | 4 | **Fixed** (boot closer expanded + `popup-manager.js` + closed CSS) |
| D10 | Filters open inline without proper backdrop on desktop | Products `#catalogSidebar` | 3–4 | **Fixed** (240px rail ≥1024; sheet+backdrop &lt;1024) |

---

## Accessibility / i18n

| ID | Defect | Notes | Status |
|---|---|---|---|
| A1 | Hindi clipping risk in chips/badges | Phase 6 wrap/line-height utilities | **Mitigated** |
| A2 | Icon buttons / focus rings incomplete | `a11y-phase6.css` focus-visible + 44px floors | **Mitigated** |
| A3 | Duplicate lang controls confuse SR users | Same as D3 | **Fixed** |

---

## Gaps in screenshot set

**Before:** `qa/before/` (Phase 0).  
**After:** `qa/after/` (Phase 7 samples).  
Full popup matrix still optional — inventory in `SCREEN_INVENTORY.md`.

---

## External dependencies (do not fabricate)

| Item | Notes |
|---|---|
| Unique daylight product photos | `SHOT_LIST.md` |
| Google Maps / Razorpay / reCAPTCHA live keys | Scaffold when unset |
| Genuine social URLs | Footer — verify before changing |

---

## Phase mapping

| Phase | Defects primarily addressed | Status |
|---|---|---|
| 0 | Inventory / before shots | Done |
| 1 | D6 tokens, D7b CSS consolidation | Done |
| 2 | D1–D4, D8 shell | Done |
| 3 | D5, D10 page/product | Done |
| 4 | D9, popup defaults | Done |
| 5 | D7 perf/SW | Done (mitigated) |
| 6 | A1–A3 bilingual/a11y | Done (mitigated) |
| 7 | Full re-verify + remaining gaps | Done |
