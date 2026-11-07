# Popup / Modal / Dialog UX Pass — Report

**Date:** 2026-11-07  
**Approach:** Audit existing overlay stack → fix cascade conflicts → add final `popup-polish.css` (no new framework).

## Inventory (covered)

| Surface | Partial / module | Treatment |
|---------|------------------|-----------|
| Auth (login / register / forgot) | `auth-modal.html` | Sheet on ≤639px, 16px inputs, sticky close |
| Profile / account hub | `profile-modal.html` | Close clear of Edit; tabs wrap; scroll body |
| Account menu | `account-menu.html` | Existing sheet + safe-area |
| Product details | `product-detail-modal.html` | Responsive 1→2 col grid |
| Compare | `compare-modal.html` | Head/subtitle + sticky actions |
| Cart / wishlist | drawers | Bottom sheet mobile (reinforced) |
| Checkout | `checkout-modal.html` | Sheet height + safe area |
| Bulk RFQ | `bulk-quotation-modal.html` | Shared shell |
| Tracker / invoices / legal / pincode / GST / company / notifications | respective modals | Max-width + scroll |
| Admin portal | `admin-dashboard-modal.html` | Full-viewport on tablet/phone |
| GBDialogs confirm/alert/prompt | `dialogs.js` + popups.css | Unchanged behaviour, polished foot |
| Search suggestions | navbar panel | Fixed under nav on mobile |
| Filter sheet | catalog sidebar | Sheet radius + safe area |
| Lightbox | `whatsapp-float.html` `#lb` | Contain + safe padding |
| Toasts | global | Above bottom nav / home indicator |

Estimator studio is an **in-page section**, not a modal — left as-is (already responsive).

## Root cause fixed

`ecommerce.css` forced `border-radius: … !important` on every `.modal-box`, flattening mobile bottom-sheet corners from `popups.css` / `ux-responsive.css`. Radius is now desktop-only in ecommerce; **`popup-polish.css`** is the last cascade layer and restores sheets, flex scroll shells, 44px closes, and safe areas.

## Role access

Unchanged from `RoleAccess` — customer popups remain available; ops portal staff-only. Backend JWT guards unchanged.

## Verification

- `node scripts/build.js`
- `tests/dialogs.test.js` asserts `popup-polish.css` linked + sheet rules
- Full suite after rebuild

## Manual checklist (viewports)

320 / 360 / 375 / 390 / 414 / 430 / 768 / 1024 / 1366 / 1920 — open auth, profile, product, cart, compare, checkout, GBDialog confirm; confirm no clipped buttons, Escape closes, overlay scroll lock holds.
