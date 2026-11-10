# ROOT_CAUSES — Add to Cart / Wishlist / button failures

**Branch:** `design-responsive-pass-2026-11-10`  
**Reproduced:** 2026-11-10 against `http://localhost:4173/` (static serve, no SW required for this bug)

## RC-1 — Add to Cart never runs (CRITICAL) — CONFIRMED

### Symptom
Clicking “Add to Cart” leaves cart empty; badge stays `0`.

### Evidence (Runtime.evaluate)
1. Direct call works: `addToCart(8, 1)` → `cart.length === 1`, `localStorage.gb_cart` contains product id 8.
2. Button click path fails:
   - `typeof handleAddToCart === 'function'`, `typeof addToCart === 'function'`
   - After `btn.click()`: `cartLen === 0`, `trace === []` (neither `handleAddToCart` nor `addToCart` invoked)
   - Button ends with `dataset.gbBusy === '1'` and class `is-busy`
3. Computed style after failed click: `pointer-events: none` (from `.catalog-add.is-busy`)

### Root cause
`src/js/interaction-guard.js` registers a **capture-phase** click listener that matches:

```text
button.product-add-btn, button[data-action="add-to-cart"], button[data-busy-guard], …
```

On every click it immediately sets `dataset.gbBusy = '1'` **before** bubble listeners run.

`src/js/action-delegate.js` (bubble) then does:

```js
if (mutating && el.dataset.gbBusy === '1') { e.preventDefault(); e.stopPropagation(); return; }
```

So the **same click** that set the busy flag is treated as a duplicate and **never calls** `handleAddToCart` / `addToCart`.

Load order (`javascript-modules.html`): `action-delegate.js` then later `interaction-guard.js` — both use `document` click; capture always runs before bubble regardless of registration order.

### Fix
- Stop guarding delegated commerce actions in `interaction-guard` (forms/checkout primary still guarded).
- Keep a **per-product** in-flight lock inside `action-delegate` / commerce store that releases in `finally` + short timeout.
- Do not set `pointer-events: none` on `.catalog-add.is-busy` (blocks recovery taps); use opacity / `aria-busy` only.

### Status
Fixed in this pass (see CHANGELOG).

---

## RC-2 — Wishlist heart double-handler (net no-op) — CONFIRMED by code path

### Symptom
Wishlist add/remove inconsistent; heart may appear to do nothing.

### Evidence
- Markup: `data-action="toggle-wishlist"` + class `wishlist-btn[data-wish-id]` (`products.js` card template).
- Handler A: `action-delegate.js` → `ACTIONS['toggle-wishlist']` → `toggleWishlist(id)`.
- Handler B: `products.js` document click on `.wishlist-btn[data-wish-id]` → `stopPropagation` + `toggleWishlist(id, btn)`.
- Both are bubble-phase. A runs first (registered earlier), toggles ON; B runs second, toggles OFF → **net zero**. Badge/storage stay empty.

### Fix
Remove the duplicate `products.js` wishlist click listener; keep a single delegated path via `data-action="toggle-wishlist"`.

### Status
Fixed in this pass.

---

## RC-3 — Busy state leaves buttons untappable

### Evidence
`.catalog-add.is-busy { pointer-events: none }` in `catalog-premium.css`. After RC-1 sets `is-busy` for 2500ms, further taps miss the button (`elementFromPoint` / pe:none).

### Fix
Remove `pointer-events: none` from busy styling for catalog add; rely on aria-busy + short lock.

### Status
Fixed in this pass.

---

## RC-4 — Covering overlays / FAB (hit-test)

### Evidence this session
- At some scroll positions add button was below the fold (`elementFromPoint` → `null`); not a permanent cover for the first card when scrolled into view.
- FAB stack already uses `pointer-events: none` on the stack with `auto` on buttons (`fab-stack.css`) — not the cause of RC-1.
- Closed drawers use translate3d off-canvas (prior fix); not re-opened during this repro.

### Status
Not primary cause of empty cart. Hit-test suite expanded in Step 7 script; remaining cover issues tracked if found.

---

## RC-5 — Product ids / storage

### Evidence
- `PRODUCTS` ids are unique integers `1–8` (`data.js`).
- Markup `data-id` / `data-product-id` match.
- Storage keys in use: `gb_cart`, `gb_wishlist` (JSON arrays). Direct writes succeed.
- Corrupt / full storage: existing `getSafeStorage` / `setSafeStorage` warn; Step 2 adds versioned keys + migration + in-memory fallback notice.

### Status
No duplicate-id bug found. Persistence hardened in Step 2.

---

## RC-6 — Service worker stale mix

### Evidence this session
Repro used `localhost:4173` static files without requiring SW. Stale SW remains a **risk** on GitHub Pages if HTML updates without cache bump.

### Fix
Bump `CACHE_VER`, add build meta + `?v=` on critical scripts, network-first for `index.html`, matched shell set.

### Status
Addressed in Step 5 of this pass.

---

## Ruled out (for empty-cart primary symptom)

| Hypothesis | Result |
|---|---|
| Missing `addToCart` / `handleAddToCart` | Present; direct call works |
| Invalid product id | id `8` resolves in `PRODUCTS` |
| Storage blocked | Direct write to `gb_cart` succeeds |
| Covering FAB permanently | Not required to explain RC-1; pe:none on busy button is secondary |
| Pull-to-refresh preventDefault on button | PTR skips drawers; not firing on this click path |

---

## Could not fully automate in Step 1

- Playwright not installed (`npx -p playwright` failed module resolve). Browser CDP + Cursor browser used instead.
- Full SW-active vs bypassed A/B on GitHub Pages deploy not run from this machine; local static host used.
