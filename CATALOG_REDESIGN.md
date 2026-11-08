# Products section redesign — what changed

## Files (complete sources)

| File | Role |
|---|---|
| `src/pages/partials/products.html` | Sticky toolbar, chip scroller, filter sheet, sort sheet, mini-cart, skeletons, end CTA |
| `src/styles/catalog-premium.css` | Mobile-first premium catalog styles (tokens, cards, sheets, fab offset) |
| `src/js/products.js` | New card template (grid/list), catalog UI (search/sort/filters/mini-cart/fab hide) |
| `src/js/catalog-discovery.js` | Count sync + empty state + indexed `renderProductCard` |
| `src/pages/partials/head.html` | Links `catalog-premium.css` |
| `sw.js` | Cache **v7** + catalog CSS in shell |
| `SHOT_LIST.md` | Real photos still needed (1200×900) |
| Built `index.html` | Via `node scripts/build.js` |

Prices, product data, filter/sort/cart logic and storage formats were **not** changed.

## Problems fixed (vs 314px “before” screenshot)

1. **Controls height** — Sticky band (toolbar + horizontal chips) measured **~92px** (target ≤100px). Before: ~190px wrapped chips + full-width sort.
2. **Hindi chip clipping** — Chips use `Noto Sans Devanagari`, `line-height: 1.5`, single-row scroller; “Awwal ईंट (Heavy Duty)” not clipped (`chipNotClipped: true`).
3. **List/grid crowding** — Price + Add always in card template; list view keeps Add/WA visible (`listPriceAddVisible` previously PASS).
4. **Navy image clash** — Warm `#F3ECE4` radial backdrop; `object-fit: contain`; no brick recolor.
5. **Wishlist straddle** — Heart is absolutely positioned **inside** `.catalog-card-media`.
6. **FAB / bottom nav overlap** — Product padding for nav+stack; fab auto-hide on scroll-down; mini-cart lifts stack; intersection check: fab vs Add / nav vs first card = **no overlap**.

## Console / reliability

| Issue | Status |
|---|---|
| Invalid selector `img[data-fallback!="bound"]` crashing reliability boot | **Fixed earlier** (`:not(...)`) |
| `GBI.Reliability` errors during catalog smoke | **0** |
| User-reported “2 errors / 2 warnings / 20 issues” on attached Slow-4G capture | Not reproducible as those exact DevTools Issues in this Chrome session; Lighthouse “issues” panel was **not** re-run here |

## Test checklist (honest)

| Check | Result |
|---|---|
| Sticky controls ≤ ~100px (stickyH) | **PASS** (~92px) |
| Chips one scrolling row + Hindi OK | **PASS** |
| Price + Add present on cards | **PASS** (a11y tree + prior measures) |
| No h-scroll | **PASS** |
| Wish inside media | **PASS** |
| FAB/nav overlap first Add/card | **PASS** (no intersection) |
| Filter combos: awwal→1, max₹8→3, low-stock→1, price-asc first ₹6.25, all→8 | **PASS** |
| Grid/list toggle + localStorage | **PASS** (code path + smoke) |
| Mini-cart when cart has items | **PASS** (visible in snapshot) |
| EN/HI | **PASS** (chip text check) |
| Screenshots 314 vs 1366 saved as files | **Partial** — live a11y/metrics used; DevTools screenshot canvas unreliable under Emulation |
| Lighthouse LCP/INP/CLS Slow 4G | **Not measured** |
| Android Chrome / iOS Safari / PWA / offline catalog | **Not run** |
| AVIF/WebP encodes | **Open** — JPEG optimized set only |

## Comments in code

Marked sections: sticky toolbar, category chip scroller, filter bottom sheet, sort sheet, grid/list card template, floating stack / mini-cart offset, skeleton/empty, image pipeline.
