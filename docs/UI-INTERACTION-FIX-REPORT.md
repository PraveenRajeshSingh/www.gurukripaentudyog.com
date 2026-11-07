# UI / Responsive / Interaction Fix Report

**Date:** 2026-11-07  
**Constraint:** No brand/theme redesign; root-cause fixes only.

## Changes

| Area | Fix |
|------|-----|
| Overlay scroll | `overlayLock` / unlock pin `body` with `position: fixed` + restore `scrollY` (stops background rubber-band under sheets) |
| Account sheet | Same pin when `account-popup-open` without a modal already locking |
| Maps | Host min-height, Maps JS resize after sheet animation, reuse instance, greedy gestures, embed fills container |
| Tracker | Reflow map ~280ms after open |
| Buttons | Busy/disabled states + capture-phase double-submit guard on primary form actions |
| CSS cascade | `interaction-fixes.css` last — overflow, map sizing, breakpoints 320→1440+, landscape short height, safe-area FABs |
| Build | `npm run build` regenerates `index.html` with new CSS/JS |

## Files

- `src/styles/interaction-fixes.css` (new)
- `src/js/interaction-guard.js` (new)
- `src/js/ui.js` — scroll lock
- `src/services/maps-service.js` — resize / host size
- `src/js/tracker.js` — map invalidate
- `src/pages/partials/head.html`, `javascript-modules.html`

## Manual verification checklist

- [ ] 320 / 375 / 414 / 768 / 1024 / 1440 — no horizontal page scroll
- [ ] Open cart, auth, profile, tracker, checkout — body does not scroll behind; Escape / backdrop / X close
- [ ] Tracker map visible (embed or Maps JS); not clipped
- [ ] Contact map iframe loads; Get Directions works
- [ ] Double-tap Place Order / Contact submit does not fire twice within ~2.5s
- [ ] Account menu sheet on phone scrolls inside panel
- [ ] Landscape phone — modal still scrollable

## Follow-up from UI audit (P0/P1)

| Bug | Fix |
|-----|-----|
| Drawer → auth/profile unlock race | `openAuthFromDrawer` / `openProfileFromDrawer` / `closeDrawerIfOpen` |
| Double `overlayLock` | Idempotent `openOverlay` / `closeOverlay` on auth, profile, product, tracker |
| Mobile z-index 1000 | Token z-index restored in `interaction-fixes.css` |
| COD double-tap | Busy guard at start of `placeOrder` |
| Auth double-submit | Early return when submit already busy |
| Chatbot ESC | `chatbotBox` on `OVERLAY_STACK`; toggle no longer double-locks |
| Maps JS failure | try/catch → embed fallback |

## Known limits (honest)

- Live trolley GPS is intentionally not claimed; yard embed/JS map only.
- Full device matrix (Safari iOS / Firefox / Edge) should be smoke-tested on hardware after deploy.
- Android/iOS Capacitor shells pick up the same `www`/`index.html` after `npm run www`.
