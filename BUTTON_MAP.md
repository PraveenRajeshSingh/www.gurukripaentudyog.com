# BUTTON_MAP — Gurukripa Services (commerce fix pass)

Updated: 2026-11-10  
Branch: `design-responsive-pass-2026-11-10`  
Delegation: `src/js/action-delegate.js` (`data-action`) + `GBI.Commerce` store.

## Status legend
- **OK** — exercised after fix (live browser or smoke script)
- **WIRED** — handler present; not every viewport/popup re-clicked in this pass
- **N/A** — requires backend / credentials (honest disabled or existing fallback)

## Product cards (`#products`)

| Element | data-action / handler | Before | After | Evidence |
|---|---|---|---|---|
| Add to Cart | `add-to-cart` → `handleAddToCart` / `GBI.Commerce.add` | Dead (RC-1) | **OK** | Badge → 1, mini-cart “1 item · ₹6.25”, `has-qty` stepper |
| Qty − / + | `change-qty` → `changeQty` | Broken when add failed | **OK** | Wired; uses store `setQty` |
| Wishlist heart | `toggle-wishlist` → `toggleWishlist` | Double-toggle no-op (RC-2) | **OK** | `aria-pressed=true`, badge 1 |
| Quick view / name | `open-product` | WIRED | **WIRED** | |
| WhatsApp | `data-action=wa` link | WIRED | **WIRED** | Native navigate |
| Compare | `toggle-compare` | WIRED | **WIRED** | |
| Filters / sort / chips / view toggle | `toggleFilterSheet`, sort sheet, `filterProducts`, `setProductsView` | WIRED | **WIRED** | |

## Drawers / commerce popups

| UI | Handler | Before | After |
|---|---|---|---|
| Cart open/close | `openCart` / `closeCart` | WIRED | **WIRED** |
| Cart qty / remove | `change-qty` / `remove-from-cart` | Dead when cart empty from RC-1 | **OK** path fixed |
| Wishlist drawer | `openWishlistDrawer` / `closeWishlistDrawer` | WIRED | **WIRED** |
| Checkout | `openCheckout` / steps | WIRED | **WIRED** |
| Product detail Add / Wish | inline `onclick` + `toggleWishlist` | Wish OK if not double; Add OK | **WIRED** (inline still present; works) |

## Chrome

| Element | Handler | Status |
|---|---|---|
| Cart icon | `openCart` | **WIRED** |
| Wishlist icon | `openWishlistDrawer` | **WIRED** |
| Lang EN\|HI | `setLang` | **WIRED** |
| Nav / drawer links | hash + `toggleDrawer` | **WIRED** |
| Bottom nav cart | `openCart` | **WIRED** |
| FAB WhatsApp / help | `fab-stack.js` | **WIRED** |
| Diagnostics copy | `data-action=copy-diagnostics` | **WIRED** (enhanced payload) |

## Auth / account / admin / estimator / RFQ / tracker / legal

Existing `BUTTON_MAP` from 2026-11-08 remains accurate for wiring. This pass did **not** remove any of those controls. Full every-popup Playwright matrix is **not run** (Playwright not installed); see CHANGELOG “Not run”.

## Smoke script

`node scripts/qa-commerce-smoke.mjs` → **7/7 pass** (add, OOS reject, wish on/off, setQty, remove, persist keys).

## Live browser (CDP) after fix

```
build: 2026-11-10-commerce-v10
handleAddToCart → badge 1, mobile 1, hasQty true, mini "1 item · ₹6.25"
toggleWishlist → pressed true, active true, wishlist badge 1
npm test → 164/164 pass
```
