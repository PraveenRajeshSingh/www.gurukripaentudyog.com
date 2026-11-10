# Performance comparison — Phase 5

**Branch:** `design-responsive-pass-2026-11-10`  
**Date:** 2026-11-10  
**Surface:** static PWA @ `http://127.0.0.1:4173/`

## Changes aimed at the budget

| Lever | Action |
|---|---|
| SW install list | Trimmed to offline shell only (`CACHE_VER = v14-perf`) |
| Runtime warm | Remaining CSS/JS/images via `WARM_CACHE` after load |
| Save-Data | Existing `warmShellCache` skip + `idle-loader.js` skip |
| Render-blocking CSS | `ops-console`, `nearby-bhatta`, `daily-prices` deferred (`media=print` → `all`) |
| Idle warm | `idle-loader.js` prefetches product thumbs after first paint |

## Targets vs measured (local static host)

Targets from the upgrade plan (not assumed results):

| Metric | Target | Measured (local, cold, no SW) | Notes |
|---|---|---|---|
| First-load requests | &lt; 40 | Still high (many CSS/JS modules) | Structural; deferred CSS reduces *blocking*, not total count |
| Transfer | &lt; 400 KB | Not met on full catalogue page | Requires image CDN / further bundling (out of scope) |
| DOMContentLoaded | &lt; 2 s | Typically &lt; 2 s on localhost | Record in QA after deploy |
| Repeat LCP | &lt; 2.5 s | Depends on SW warm | Verify on GitHub Pages with `v14-perf` |
| CLS | &lt; 0.1 | Hero/sizes already capped in Phase 2 | Re-check Slow 4G |
| INP | &lt; 200 ms | Commerce path fixed earlier | Overlay manager should not add handlers on critical path |

## Offline preserved

Shell still precaches: `index.html`, `offline.html`, fonts alias, hero-480, core JS (i18n/state/commerce/ui/products/cart/main), `pwa-offline.css`.

## Remaining gaps (honest)

- No JS bundler — request count remains multi-file by design.
- Full Slow-4G GitHub Pages A/B not run from this machine in Phase 5.
- Unique daylight product photography still External (`SHOT_LIST.md`).
