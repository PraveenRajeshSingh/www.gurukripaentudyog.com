# CHANGELOG — Phase 2 Header / Nav / Hero / Footer Shell

Date: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Scope: application shell chrome only. Business prices / cart logic unchanged.

## What changed
- One visible language control (header); topbar lang hidden but IDs kept for `setLang` sync
- Full nav ≥1024px; hamburger <1024; bottom nav only <768px
- Header brand ellipsis / no clip at ~350px; sticky premium header
- Hero two-column only ≥1024; single column below; wrapping chips; badge clearance from FAB
- Footer 4 / 2 / 1 columns with accordion under 768px
- Brand copy aligned to **Gurukripa Bricks Industry** (EN/HI)
- FAB suppresses on account popup / overlay; hero badge clearance
- `shell-phase2.css` + updated `chrome-premium.css`; SW `v12-shell`

## Verification
- Live CDP at 360 / 890 / 1024 / 1366 (run after commit)
- `npm test`

---

# CHANGELOG — Phase 1 Centralized Design System

Date: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Scope: CSS cascade only. No JS business-logic changes. No new runtime dependencies.

## What changed
- Added `src/styles/layers.css` — explicit `@layer` order: reset → tokens → base → layout → components → pages → utilities → features → patches
- Reworked `tokens.css` into `@layer tokens` + `@layer reset`; added breakpoints, `--touch-min: 44px`, fluid grid tokens, Hindi line-height tokens
- Added `design-system.css` — reusable layout grids, buttons, inputs, badges, cards, tabs, tables, notices; Hindi clip-safe utilities
- Wrapped existing stylesheets into cascade layers (pages / features / patches) so patches win without extra `!important` escalation
- Removed duplicate global reset from `base.css` (canonical reset now in tokens)
- Wired `layers.css` + `design-system.css` in `index.html`, `head.html`, `404.html`, `500.html`
- `sw.js` → `CACHE_VER = v11-design-system`; shell precaches new CSS

## Verification
- CSS brace balance: all style files balanced
- `npm test` (run after commit prep)
- Live smoke: home + products render; drawers stay closed on load

## Deferred to later phases
- Header/hero/footer redesign (Phase 2)
- Product page filter rail / card alignment (Phase 3)
- Popup manager (Phase 4)
- Request-count / transfer budget (Phase 5)

---

# CHANGELOG — Cart / Wishlist / Button fix pass

Date: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Scope: static PWA. No new runtime dependencies. Prices / trolley / GST formulas unchanged.

## Root causes (see ROOT_CAUSES.md)

| ID | Bug | Root cause | Fix | Test |
|---|---|---|---|---|
| RC-1 | Add to Cart did nothing; badge stayed 0 | `interaction-guard.js` capture set `data-gb-busy` before `action-delegate` bubble, which then skipped the handler | Stop guarding delegated commerce buttons in interaction-guard; per-action locks in action-delegate | Live: `handleAddToCart` → badge/mini-cart update; smoke 7/7 |
| RC-2 | Wishlist heart appeared dead | Duplicate listeners (delegate + `products.js`) toggled twice | Removed duplicate wishlist click listener | Live: `aria-pressed` + badge 1 |
| RC-3 | Buttons untappable after failed add | `.catalog-add.is-busy { pointer-events: none }` | Opacity/cursor only | pe=`auto` after busy |
| RC-sync | Store could not see `let cart` | Top-level `let` is not `window.cart` | `var cart` / `var wishlist` in `state.js` | window.cart length matches |
| RC-mem | `GBI.Commerce.get()` ignored session mem | get() always re-read storage | Prefer `memCart` / `memWish` | smoke persist |

## Deliverables
- `src/js/commerce-store.js` — `GBI.Commerce` (add/setQty/remove/clear/toggle/subscribe, `gbi.*.v2` + v1 mirror, BroadcastChannel, memory fallback notice)
- `src/js/action-delegate.js` — rebuilt locks + keyboard path
- `src/js/interaction-guard.js` — forms only
- `src/js/cart.js` / `products.js` / `pull-to-refresh.js` / `reliability.js` diagnostics
- `sw.js` → `CACHE_VER = v10-commerce`
- `ROOT_CAUSES.md`, updated `BUTTON_MAP.md`, `scripts/qa-commerce-smoke.mjs`

## Verification run
- `npm test` → **164/164 pass**
- `node scripts/qa-commerce-smoke.mjs` → **7/7 pass**
- Browser CDP on `localhost:4173`: add + wishlist entry points update badges/UI
- **Not run:** Playwright full BUTTON_MAP matrix, Slow 4G SW A/B on GitHub Pages, storage-full injection, multi-tab BroadcastChannel (code present; not instrumented live)

---

# CHANGELOG — Reliability, Performance & Visual Polish Pass

Date: 2026-11-08  
Scope: static site (HTML/CSS/JS, GitHub Pages, PWA). No new npm dependencies. Business formulas / rates / saved-data shapes preserved.

---

## Bugs found and fixed

| Bug | Root cause | Fix |
|---|---|---|
| Reliability layer never booted (`window.GBI` undefined) | `querySelectorAll('img[data-fallback!="bound"]')` is an invalid selector; threw on boot and aborted the IIFE | Use `img:not([data-fallback="bound"])` in `reliability.js` |
| Product / cart dynamic buttons relied only on inline `onclick` | Re-renders required rebinding; easy to miss handlers | `data-action` + `action-delegate.js` for add-to-cart, open-product, wishlist, qty, remove |
| Double-tap risk on cart / checkout / RFQ | Partial busy-guard only on some submit buttons | Extended `interaction-guard.js` to product-add, place-order, bulk RFQ, estimate save |
| No diagnostics for support | Errors only hit `console.error` | Ring buffer (50) + Account Settings → **Diagnostics (copy for support)** |
| Favicon / manifest used large JPEG logo repeatedly | Duplicate requests + wrong sizes declared | SVG favicon + PNG 180/192/512 (+ maskable) + manifest update |
| Hero / products shipped megabyte PNG/JPEG | Unoptimized originals (hero ~850KB–1MB, products ~620KB+) | `scripts/optimize-images.ps1` → `optimized/*` JPEG srcset; hero mobile ≈24KB |
| SW install competed with first paint | Large SHELL_ASSETS list | Cache `v6`: critical shell only at install; `WARM_CACHE` after load (skip Save-Data) |
| No branded first-paint loader | Nothing prevented blank flash / failed load UX | Inline SVG loader (`page-loader.html`): 300ms delay, DCL+hero/2.5s dismiss, 6s failsafe |
| Logo sources split (`logo-new.svg` + `gurukripaLogo.jpg`) | Duplicate identity | Master `logo.svg` (+ horizontal / mono / on-dark); header/drawer/SW/manifest aligned |

---

## Deliverables added / updated

### New
- `src/js/reliability.js` — error ring, safe storage/JSON/fetch, feature detect, clipboard/share, diagnostics, image fallbacks
- `src/js/action-delegate.js` — delegated `data-action` map + namespace aliases
- `src/pages/partials/page-loader.html` — branded loader
- `src/styles/polish-pass.css` — skeletons, content-visibility, 44px taps, busy/pressed, reduced-motion
- `src/assets/images/logo.svg`, `logo-horizontal.svg`, `logo-mono.svg`, `logo-on-dark.svg`, `favicon.svg`
- `src/assets/images/optimized/**` — hero/product/gallery/OG/icons
- `src/assets/images/icon-180.png`, `favicon-32.png`
- `scripts/optimize-images.ps1`, `scripts/build-button-map.js`, `scripts/audit-interactives.js`
- `BUTTON_MAP.md`, `SHOT_LIST.md`, this `CHANGELOG.md`

### Updated
- `src/pages/index.src.html`, `head.html`, `hero.html`, `navbar.html`, `mobile-drawer.html`, `profile-modal.html`, `javascript-modules.html`
- `src/js/products.js`, `cart.js`, `main.js`, `interaction-guard.js`, `pwa.js`, `data.js`
- `sw.js` (CACHE_VER **v6**), `manifest.json`
- Built `index.html` via `node scripts/build.js`

---

## Performance — measured vs not measured

### Measured (Chrome browser tool @ `http://127.0.0.1:8765/?v=2`, mid session)

| Metric | After (this pass) | Notes |
|---|---|---|
| Loader removed from DOM | **Yes** | `loaderGone: true` after ready |
| Reliability boot | **OK** | `GBI.Reliability` present; `errors: 0` |
| Add to cart (direct) | **PASS** | cart 0 → 1 |
| data-action add-to-cart | **PASS** | merges same SKU (stays 1) |
| Cart/profile open·close ×5 | **PASS** | `openCloseOk: true` |
| Language switch EN | **PASS** | `lang: en` |
| DOM nodes | **~3304** | after products rendered |
| Resource entries | **~90** | includes fonts/CSS/JS; over “&lt;40 requests” target |
| Hero file (mobile) | **~24 KB** (`hero-480.jpg`) | was ~850KB–1MB source |
| Product 480w | **~16–32 KB** | was ~620–687 KB PNG |
| OG image | **~87 KB** (`og-1200x630.jpg`) | real `redbricks.jpg` + brand panel |

### Not measured in this environment (do not treat as pass)

| Item | Status |
|---|---|
| Lighthouse / INP / LCP / CLS / TBT with 4× CPU + Slow 4G | **Not run** (no Lighthouse CLI in session) |
| Heap growth after 20 cart/account cycles | Partial (5 cycles smoke only) |
| Full BUTTON_MAP live trigger × 6 widths × EN/HI × touch/keyboard | Static audit + Chrome smoke only |
| Firefox / Edge / Android Chrome / iOS Safari / installed PWA | **Not run** |
| Console/Network “zero warnings” full session DevTools panels | CDP smoke only; not a full DevTools panel export |
| AVIF / WebP encodes | **Not produced** (System.Drawing JPEG only) |

**Honest before numbers:** prior hero/product byte sizes are from filesystem (`Get-ChildItem` / Node stat). Prior INP/LCP/CLS were **not** captured with DevTools before edits, so no fabricated “before” Core Web Vitals table.

---

## Test matrix (honest checklist)

| Scenario | Result |
|---|---|
| Page loads; loader dismisses | **PASS** (Chrome local) |
| Reliability + Diagnostics present | **PASS** |
| Add to cart via `data-action` | **PASS** |
| EN/HI switch while page open | **PASS** (EN verified) |
| Online cart/profile open-close | **PASS** (5×) |
| Offline / offline→online mid-action | **Not run this pass** |
| Slow 4G + 4× CPU | **Not run** |
| localStorage disabled / full / corrupt | Helpers added; **not runtime-proven** |
| Private/incognito | **Not run** |
| Injected JS error in one feature | Ring buffer wired; **not injected in test** |
| Pop-up blocked / clipboard denied / notifications denied | Fallbacks coded; **not permission-tested** |
| SW update mid-session | v6 + update toast path unchanged; **not force-updated in test** |
| Two tabs storage sync | `BroadcastChannel` + `storage` listeners added; **not dual-tab tested** |
| Double-tap debounce | Guard extended; **not rapid-fire timed** |
| Back button with modal | Existing hash/modal stack; **not re-verified** |
| Refresh at every checkout step | **Not run** |
| Empty / huge cart / Hindi digits / zero totals | Parsers added (`parseSafeNumber`); **not data-fuzzed** |
| Failed hero / failed script → loader gone | Failsafe coded (6s); failed-hero `onerror` fallback present; **failed-script path not injected** |
| Keyboard-only / AA contrast / SR labels | Tap min 44px CSS; full a11y audit **not run** |
| Images within budgets | **PASS** for optimized set (filesystem sizes) |

---

## Still open

1. Full static `onclick` → `data-action` migration for ~260 chrome controls (dynamic lists done; static kept wired to same function names).
2. AVIF/WebP + true multi-width `<picture>` for gallery; LQIP base64 under 1KB per image.
3. True `.ico` multi-size favicon (currently SVG + PNG 32 + existing `favicon.ico`).
4. Lighthouse evidence table (INP/LCP/CLS/TBT) on Slow 4G / mid-range Android.
5. Dual-tab cart reconciliation end-to-end test.
6. Physical device + installed PWA matrix.
7. First-load request count still above 40 (many CSS modules + deferred JS) — further code-split / CSS merge needed for that target.
8. Gallery lightbox keyboard/swipe/pinch — existing lightbox not fully re-audited this pass.
9. Photo gaps in `SHOT_LIST.md` (kiln close, hand-scale, yard entrance).

---

## How to rebuild

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/optimize-images.ps1
node scripts/build.js
node scripts/build-button-map.js
```

Bump `CACHE_VER` in `sw.js` on every production deploy (currently `v6`).
