# BUTTON_MAP — Phases 0 / 3 (2026-11-15)

## Before (static inventory)
See `qa/phase0-audit.json`: **265** buttons, **285** `onclick`, **1** `data-action`, **121** unique handlers.

## After Phase 3
| Change | Detail |
|--------|--------|
| Registry | `window.GBI.Actions` in `action-delegate.js` |
| New actions | `open-cart`, `open-wishlist`, `open-auth`, `open-checkout`, `open-profile`, `set-lang`, `toggle-lang`, `open-search`, `close-search`, `clear-search`, `voice-search`, `toggle-theme`, `set-theme`, `open-alerts`, `back-to-top`, `open-tracker`, `wa-cart`, … |
| Self-check | `GBI.selfCheckActions()` logs unmapped `data-action`; banner with `?action-debug=1` |
| Wired in markup | Header lang, search, theme menu; drawer lang/theme |
| Preserved | Existing `onclick` handlers and cart/wishlist stores unchanged |

## Not fully migrated
Most popup buttons still use `onclick=` (working). Live click pass / Playwright not run this turn — do not claim 100% button coverage.

## JSON
Regenerate with `node scripts/phase0-audit.js` after `npm run build` → `qa/phase0-audit.json`. Full `BUTTON_MAP.json` executable matrix is Phase 6.
