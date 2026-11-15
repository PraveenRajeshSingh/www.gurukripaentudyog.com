# Console errors — Phase 5 sweep (2026-11-15)

## Before (Phase 0 / known)
- Desktop language toggle missing (CSS) — not a console error; UI defect
- Theme toggle absent; `platform.js` forced light and cleared `gb_theme`
- Unmapped `data-action` nearly unused (1 attribute); heavy `onclick` surface
- Possible poisoned SW serving Offline as CSS/JS (addressed v21–v23)

## After Phases 2–5
| Area | Fix | Status |
|------|-----|--------|
| Lang toggle desktop | patches `.nav-lang{display:inline-flex!important}` | Fixed in code |
| Theme | Restored Light/Dark/System; head + Platform no longer pin light | Fixed in code |
| Actions | Expanded `GBI.Actions` + self-check (`?action-debug=1`) | Fixed in code |
| Mobile search | Overlay + chrome inert; Ctrl/Cmd+K | Fixed in code |
| SW | `v24-phases-2-5` precaches theme/search CSS+JS + i18n | Fixed in code |
| Loader stick | v23 hard dismiss (prior commit) | Fixed |

## Live browser console
Full DevTools session with SW active **not re-run in this agent turn** (no Playwright evidence attached). Zero-errors claim is **not** asserted. Re-check after deploy: hard refresh, open console, walk cart / auth / search.

## Remaining (honest)
- Many controls still use `onclick=` (compatible); gradual `data-action` migration ongoing
- Hardcoded hex outside tokens still numerous (Phase 0 count ~461) — dark theme uses tokens where present; some components may look uneven until a token pass
- Hindi: not every JS toast literal translated yet
