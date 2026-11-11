# Gurukripa Bricks Industry — Console Errors, Warnings & Messages Audit (CONSOLE_ERRORS.md)

> **Audit Scope**: Static PWA on GitHub Pages subfolder (`/www.gurukripaentudyog.com/`)
> **Engine**: Headless Chromium with DevTools Protocol, Service Worker lifecycle tracking, offline emulation

## 1. Executive Summary

In previous releases, console errors cascaded when offline, reloading under Service Worker control, or navigating with DevTools docked. Investigation revealed three interrelated root causes:
1. **Service Worker Fallback Syntax Errors**: When scripts or data were fetched offline, `sw.js` line 299 returned `new Response("Offline", { status: 503 })`. The browser attempted to execute this plain text as JavaScript, generating `Uncaught SyntaxError: Unexpected token 'O', "Offline"... is not valid JavaScript` and crashing downstream modules.
2. **Incomplete Precache Manifest**: `SHELL_ASSETS` in `sw.js` lacked newly added scripts (`daily-prices.js`, `nearby-bhatta.js`, `catalog-pricing-service.js`, ERP modules) and stylesheets (`viewport-adaptive.css`, `daily-prices.css`), forcing them to fall through to network fetches that failed offline.
3. **Web App Manifest Scope Violations**: `manifest.json` contained an external WhatsApp URL (`https://wa.me/...`) in its `shortcuts` list, triggering Chromium manifest parser warnings.

## 2. Comprehensive Inventory of Console Items

| # | Category | Message / Text | File & Line | Trigger / Precondition | Service Worker Dependent? | Root Cause | Permanent Resolution |
|---|---|---|---|---|---|---|---|
| 1 | **Warning** | `Manifest: property 'url' ignored, should be within scope of the manifest.` | `manifest.json:68` | Page Load / PWA install check | No | Shortcut 3 had `https://wa.me/919198923230` which is external to the app scope `./`. | Replace with in-scope URL `./?action=whatsapp` or `./#contact`. |
| 2 | **Warning** | `Manifest: property 'url' of 'shortcut' not present.` | `manifest.json:68` | Page Load | No | Caused directly by item #1 when Chromium ignored the invalid external URL. | Resolved automatically by fixing item #1. |
| 3 | **Error** | `Uncaught SyntaxError: Unexpected token 'O', "Offline"...` | `sw.js:299` → `<script>` | Offline navigation or cache miss | Yes | Service worker responded to `<script>` fetches with plain text `"Offline"`. | Respond with empty valid JS `/* offline fallback */` (`application/javascript`) on failed script requests. |
| 4 | **Error** | `Uncaught (in promise) SyntaxError: Unexpected token 'O', "Offline"...` | `sw.js:281` → `fetch().json()` | Offline data/pricing load | Yes | `isDataPath()` returned plain text `"Offline"` instead of valid JSON `{}`. | Ensure all data/json endpoints respond with `new Response("{}", { headers: { "Content-Type": "application/json" } })`. |
| 5 | **Error** | `net::ERR_INTERNET_DISCONNECTED` (unhandled) | `sw.js:292` | Network fetch while offline | Yes | `fetch(req)` threw an unhandled network error during fetch event handling. | Wrap `fetch(req)` in try/catch and return appropriate cached/empty response. |
| 6 | **Error** | `TypeError: Cannot read properties of undefined (reading 'snapshot')` | `daily-prices.js:7` | Load before pricing service init | No | `GurukripaCatalogPricing` was queried before service finished loading. | Added safety null-guards and direct fallback to `window.PRODUCTS`. |
| 7 | **Warning** | Deprecated `-webkit-backdrop-filter` without fallback | `chrome-premium.css` | Rendering glass cards | No | CSS syntax lacked standard `backdrop-filter` pairing. | Added paired standard `backdrop-filter` and `-webkit-backdrop-filter`. |
| 8 | **Message** | Service worker registration status / cache bump notifications | `pwa.js` | Service Worker install | Yes | Informational lifecycle messages. | Formatted and preserved under debug flags. |

## 3. Service Worker Hardening Plan (sw.js line 291 & nearby)

```javascript
// Robust shell asset strategy: never throw SyntaxError on offline script requests
if (isShellPath(url) || isSameOrigin(req.url)) {
    event.respondWith((async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
            const resp = await fetch(req);
            if (resp && resp.ok) {
                const dest = isDataPath(url) ? DATA : SHELL;
                caches.open(dest).then((c) => c.put(req, resp.clone())).catch(() => {});
            }
            return resp;
        } catch (_e) {
            if (/\.js$/i.test(url.pathname)) {
                return new Response("/* offline fallback */", { status: 200, headers: { "Content-Type": "application/javascript" } });
            }
            if (/\.css$/i.test(url.pathname)) {
                return new Response("/* offline css */", { status: 200, headers: { "Content-Type": "text/css" } });
            }
            return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
    })());
}
```

## 4. Diagnostics & Error Telemetry

A unified `window.__GBI_DIAGNOSTICS__` in-memory ring buffer (last 50 events) has been implemented in `reliability.js` to capture:
- Build and Service Worker cache version (`v16-fluid`)
- Window dimensions and orientation
- Unhandled window errors (`window.onerror`)
- Unhandled promise rejections (`window.onunhandledrejection`)
- Copyable diagnostic report export
