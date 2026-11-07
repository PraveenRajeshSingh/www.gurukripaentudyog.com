# UI / Responsive / Interaction Fix Report

**Date:** 2026-11-07  
**Constraint:** No brand/theme redesign; root-cause production fixes only.

## Root causes (master pass)

| Cause | Effect | Permanent fix |
|------|--------|----------------|
| `body.overlay-open { touch-action: none }` | Sheet taps swallowed on iOS/Android | `touch-action: manipulation` + pane `pan-y` |
| Closed full-screen chatbot at z-index 10000 forced visible under overlays | Blocked every modal/map control | Closed wrap `pointer-events: none`; open uses `--z-chat: 1150` |
| Same z-index for stacked modals + leftover open sheets | Legal content covered tracker map CTAs | Dynamic z-index on `openOverlay`; `closeAllModalOverlays` before tracker |
| Tracker map fixed height + `overflow: hidden` | Directions / Open Maps clipped | Host grows; action row outside canvas clip |
| Dual scroll on modal box + body | Nested scroll fights / bg chaining | Box `overflow: hidden`; body sole scroll owner (`max-height: none` under flex) |
| Hardcoded mobile `z-index: 1000` | Sheets under header | Token `--z-modal` / `--z-drawer` |
| Inactive tabs still in layout/hit path | Wrong panel intercepts taps | `hidden` + `display:none` + `pointer-events:none` on inactive panes |
| Non-idempotent legal/lightbox locks | Scroll unlock races | Routed through `openOverlay` / `closeOverlay` |
| Maps not resized after sheet/keyboard/orientation | Blank or 0×0 canvas | `gb:overlay-layout` + VV/orientation → `GurukripaMaps.invalidateAll` |

## Scroll contract

1. Opening any overlay pins `html`/`body` (`position: fixed`, restore `scrollY` on unlock).  
2. Modal **box** does not scroll; **`.modal-body`** (and cart/profile equivalents) is the only vertical scroller.  
3. Head stays at top of flex column; foot stays accessible (`flex-shrink: 0` / sticky).  
4. `overscroll-behavior: contain` prevents scroll chaining to the page.

## Files

- `src/styles/interaction-fixes.css`, `mobile-fixes.css`, `popup-polish.css`, `refinements.css`, `app.css`, `ux-responsive.css`, `tokens.css`
- `src/js/ui.js`, `tracker.js`, `auth-modal.js`, `checkout.js`, `cart.js`, `wishlist-drawer.js`, `profile-modal.js`, `calculator.js`, `interaction-guard.js`
- `src/services/maps-service.js`

## Verified (CDP device metrics)

| Viewport | Result |
|----------|--------|
| 320×568 | Pass — stack clear, map CTA + close hittable, auth |
| 375×812 | Pass — legal→tracker stack, map CTA, tabs, cart, body scroll owner |
| 768×1024 | Pass — tracker/map/cart/auth |
| 1024×768 | Pass — modal z-index ≥ 1100, tabs, map |
| 1920×1080 | Pass — full suite including calc tabs, legal tabs, contact map |

## Known limits

- Live trolley GPS is not claimed; yard embed / Maps JS only.  
- Physical Safari iOS / Android matrix still recommended post-deploy.  
- Capacitor shells need `npm run www` to pick up the same assets.
