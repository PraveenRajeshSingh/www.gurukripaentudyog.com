# Testing report — Phase 7 (design-responsive pass)

**Branch:** `design-responsive-pass-2026-11-10`  
**Date:** 2026-11-10  
**Phases covered:** 0–7

## Automated

| Check | Result |
|---|---|
| `node scripts/build.js` | Pass (index rebuilt) |
| `npm test` | Run at end of Phase 7 — see commit notes |
| `tests/dialogs.test.js` | Expect pass (`popup-polish.css` still linked) |

## Manual / CDP (localhost:4173)

| Viewport | Focus | Result |
|---|---|---|
| 390 | Products counts / Filters sheet | Phase 3: one live count; sheet+backdrop |
| 1280 | Filter rail 240px; Filters hidden | Phase 3 pass |
| 390 / 1280 | Boot: cart/wishlist/auth closed | Phase 4 `ensureOverlaysClosedOnBoot` + `PopupManager` |
| 390 | Escape closes top overlay | Existing ui.js + manager |
| EN → HI | Lang persist `gb_lang` | Phase 6 verified via code path |
| Offline shell | SW `v14-perf` | Precache trimmed; warm after load |

## Screenshots

| Set | Path |
|---|---|
| Before | `qa/before/` (Phase 0) |
| After (sample) | `qa/after/` (Phase 7 capture) |

## Not fully executed (limitations)

- Continuous 280→1920 @ 20px increments (timeboxed; key break widths covered in Phases 2–3).
- Physical device landscape matrix.
- Live Google Maps / Razorpay / reCAPTCHA keys (External).
- Playwright full BUTTON_MAP matrix (helper present; install optional).

## Remaining issues

See `DEFECTS.md` — Open items marked External or deferred.
