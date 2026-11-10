/* ═══════════════════════════════════════════════════════════════════
   Gurukripa Bricks Industry — Service Worker (hand-written, no Workbox)
   ───────────────────────────────────────────────────────────────────
   HOW TO BUMP THE CACHE VERSION ON EVERY RELEASE
   1. Increment CACHE_VER below (e.g. v5 → v6).
   2. Redeploy index.html + sw.js + offline.html + assets.
   3. Clients see “New version available. Refresh”; only then we
      skipWaiting() and reload (never during checkout / dirty forms).
   4. On activate, all non-current gbi-*-v* caches are deleted.

   Scope: relative "./" so GitHub Pages subpath installs work.
   Hash routes (#products, #calculator) stay on index.html offline.
   ═══════════════════════════════════════════════════════════════════ */

const CACHE_VER = 'v14-perf';
const SHELL = 'gbi-shell-' + CACHE_VER;
const PAGES = 'gbi-pages-' + CACHE_VER;
const IMGS  = 'gbi-img-' + CACHE_VER;
const DATA  = 'gbi-data-' + CACHE_VER;
const ALL_CACHES = [SHELL, PAGES, IMGS, DATA];
const IMG_MAX = 60;
const NAV_TIMEOUT_MS = 3000;

/**
 * Phase 5 — install precache = offline shell ONLY.
 * Heavy CSS/JS/images warm after load (or skip on Save-Data).
 */
const SHELL_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './sw.js',
    './src/assets/fonts/offline-fonts.css',
    './src/assets/images/logo.svg',
    './src/assets/images/favicon.svg',
    './src/assets/images/optimized/hero-480.jpg',
    './src/styles/layers.css',
    './src/styles/tokens.css',
    './src/styles/design-system.css',
    './src/styles/base.css',
    './src/styles/app.css',
    './src/styles/pwa-offline.css',
    './src/js/reliability.js',
    './src/js/utils.js',
    './src/js/data.js',
    './src/js/i18n.js',
    './src/js/state.js',
    './src/js/commerce-store.js',
    './src/js/offline-store.js',
    './src/js/pwa.js',
    './src/js/ui.js',
    './src/js/popup-manager.js',
    './src/js/products.js',
    './src/js/cart.js',
    './src/js/main.js'
];

/** Runtime warm cache after window load (posted from pwa.js / idle-loader) */
const RUNTIME_WARM = [
    './src/styles/chrome-premium.css',
    './src/styles/shell-phase2.css',
    './src/styles/pages-phase3.css',
    './src/styles/popups-phase4.css',
    './src/styles/a11y-phase6.css',
    './src/styles/sections.css',
    './src/styles/overlays.css',
    './src/styles/polish-pass.css',
    './src/styles/catalog-premium.css',
    './src/styles/popups.css',
    './src/styles/extras.css',
    './src/styles/mobile-fixes.css',
    './src/styles/refinements.css',
    './src/styles/account.css',
    './src/styles/ops-console.css',
    './src/styles/ux-responsive.css',
    './src/styles/ecommerce.css',
    './src/styles/popup-polish.css',
    './src/styles/interaction-fixes.css',
    './src/styles/compact-catalog-account.css',
    './src/styles/calculator-studio.css',
    './src/styles/fab-stack.css',
    './src/styles/footer-studio.css',
    './src/styles/mobile-scroll-master.css',
    './src/js/action-delegate.js',
    './src/js/interaction-guard.js',
    './src/js/offline-queue.js',
    './src/js/catalog-discovery.js',
    './src/js/calculator.js',
    './src/js/whatsapp-order.js',
    './src/js/pull-to-refresh.js',
    './src/js/idle-loader.js',
    './src/assets/images/logo-new.svg',
    './src/assets/images/favicon.ico',
    './src/assets/images/optimized/product-1-320.jpg',
    './src/assets/images/optimized/product-2-320.jpg',
    './src/assets/images/optimized/product-3-320.jpg'
];

/** Catalogue / rate-card scripts — stale-while-revalidate. */
const DATA_ASSETS = [
    './src/js/data.js',
    './src/js/offline-store.js'
];

const IMG_PLACEHOLDER =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">' +
        '<rect fill="#FAF6F2" width="320" height="240"/>' +
        '<rect x="40" y="70" width="240" height="100" rx="8" fill="#E8E0D8"/>' +
        '<text x="160" y="128" text-anchor="middle" fill="#7B241C" font-family="system-ui,sans-serif" font-size="14">Brick image unavailable offline</text>' +
        '</svg>'
    );

function isSameOrigin(url) {
    try { return new URL(url, self.location.href).origin === self.location.origin; }
    catch (_e) { return false; }
}

function isExternal(url) {
    try {
        const u = new URL(url, self.location.href);
        if (u.origin !== self.location.origin) return true;
        // Treat known third-party hosts as never-cache even if proxied later
        return /googleapis|gstatic|google\.com|maps\.google|analytics|googletagmanager|gsi/i.test(u.hostname);
    } catch (_e) { return true; }
}

function isMutableMethod(method) {
    return method !== 'GET' && method !== 'HEAD';
}

function isImagePath(pathname) {
    return /\.(png|jpe?g|gif|webp|svg|ico|avif)$/i.test(pathname);
}

function isDataPath(url) {
    const p = url.pathname;
    return DATA_ASSETS.some((a) => p.endsWith(a.replace(/^\.\//, '/'))) ||
        /\/src\/js\/data\.js$/i.test(p) ||
        /\.(json)$/i.test(p);
}

function isShellPath(url) {
    const p = url.pathname;
    return /\.(css|js|woff2?|ttf|otf)$/i.test(p) ||
        /manifest\.json$/i.test(p) ||
        /offline\.html$/i.test(p) ||
        /logo-new\.svg$/i.test(p) ||
        /gurukripaLogo/i.test(p);
}

function timeoutFetch(req, ms) {
    return new Promise((resolve, reject) => {
        const ctrl = new AbortController();
        const t = setTimeout(() => {
            try { ctrl.abort(); } catch (_e) { /* ignore */ }
            reject(new Error('timeout'));
        }, ms);
        fetch(req, { signal: ctrl.signal }).then((r) => {
            clearTimeout(t);
            resolve(r);
        }).catch((err) => {
            clearTimeout(t);
            reject(err);
        });
    });
}

async function putLimited(cacheName, request, response, max) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    const keys = await cache.keys();
    if (keys.length <= max) return;
    const overflow = keys.length - max;
    for (let i = 0; i < overflow; i++) {
        await cache.delete(keys[i]); // oldest-first
    }
}

async function precacheList(cacheName, list) {
    const cache = await caches.open(cacheName);
    await Promise.allSettled(list.map(async (url) => {
        try {
            const resp = await fetch(url, { cache: 'reload' });
            if (resp && resp.ok) await cache.put(url, resp);
        } catch (_e) { /* skip missing */ }
    }));
}

// ── Install: precache shell (do NOT skipWaiting — wait for user) ──
self.addEventListener('install', (event) => {
    event.waitUntil(
        precacheList(SHELL, SHELL_ASSETS)
            .then(() => precacheList(DATA, DATA_ASSETS))
    );
});

// ── Activate: drop old versioned caches, claim clients ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k.startsWith('gbi-') || k.startsWith('gurukripa-cache-'))
                .filter((k) => ALL_CACHES.indexOf(k) === -1)
                .map((k) => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// ── Fetch strategies ──
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Never cache POST/PUT/DELETE or auth/payment payloads
    if (isMutableMethod(req.method)) return;

    const url = new URL(req.url);

    // External / third-party: network only, graceful failure left to page
    if (isExternal(req.url)) return;

    // Never put Authorization-bearing or API traffic into shared caches
    if (req.headers.get('authorization') || /\/api\//i.test(url.pathname)) {
        event.respondWith(fetch(req).catch(() => new Response('{"error":"offline"}', {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        })));
        return;
    }

    // Navigation: network-first (3s) → cached index → offline.html
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        event.respondWith((async () => {
            try {
                const fresh = await timeoutFetch(req, NAV_TIMEOUT_MS);
                if (fresh && fresh.ok) {
                    const copy = fresh.clone();
                    caches.open(PAGES).then((c) => c.put('./index.html', copy)).catch(() => {});
                    return fresh;
                }
            } catch (_e) { /* fall through */ }
            const cached = await caches.match('./index.html') ||
                await caches.match('index.html') ||
                await caches.match('./');
            if (cached) return cached;
            const offline = await caches.match('./offline.html');
            return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })());
        return;
    }

    // Images: cache-first, runtime cap ~60, placeholder offline miss
    if (isImagePath(url.pathname)) {
        event.respondWith((async () => {
            const hit = await caches.match(req);
            if (hit) return hit;
            try {
                const resp = await fetch(req);
                if (resp && resp.ok) {
                    await putLimited(IMGS, req, resp.clone(), IMG_MAX);
                }
                return resp;
            } catch (_e) {
                return fetch(IMG_PLACEHOLDER);
            }
        })());
        return;
    }

    // Rate card / catalogue JS|JSON: stale-while-revalidate
    if (isDataPath(url)) {
        event.respondWith((async () => {
            const cache = await caches.open(DATA);
            const cached = await cache.match(req);
            const network = fetch(req).then((resp) => {
                if (resp && resp.ok) cache.put(req, resp.clone());
                return resp;
            }).catch(() => null);
            return cached || (await network) || new Response('{}', { status: 503 });
        })());
        return;
    }

    // App shell CSS/JS/fonts/icons: cache-first
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
                return new Response('Offline', { status: 503 });
            }
        })());
    }
});

// ── Background Sync (Chromium); Safari uses online/visibility paths in pwa.js
self.addEventListener('sync', (event) => {
    if (event.tag === 'gbi-outbox') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                clients.forEach((c) => c.postMessage({ type: 'GBI_SYNC_OUTBOX' }));
            })
        );
    }
});

// ── Push notifications (unchanged contract) ──
self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (_e) {
        payload = { title: 'Gurukripa Bricks', body: event.data ? event.data.text() : '' };
    }
    const title = payload.title || 'Gurukripa Bricks Industry';
    const options = {
        body: payload.body || 'You have a new update from the Jalalpur yard.',
        icon: payload.icon || './src/assets/images/logo.svg',
        badge: './src/assets/images/logo.svg',
        tag: payload.tag || 'gbi-alert',
        renotify: Boolean(payload.renotify),
        data: {
            url: payload.url || './',
            kind: payload.kind || 'general',
            orderId: payload.orderId || ''
        },
        vibrate: [24, 60, 24]
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    if (client.postMessage) {
                        client.postMessage({ type: 'NOTIFICATION_CLICKED', payload: data });
                    }
                    return client.focus();
                }
            }
            const target = data.url && data.url !== './' ? data.url : './';
            return self.clients.openWindow(target);
        })
    );
});

self.addEventListener('message', (event) => {
    const message = event.data || {};
    if (message.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
    // CHANGE: runtime warm cache after first paint (polish §3) — skip on Save-Data
    if (message.type === 'WARM_CACHE') {
        const list = Array.isArray(message.assets) && message.assets.length ? message.assets : RUNTIME_WARM;
        event.waitUntil(precacheList(SHELL, list));
        return;
    }
    if (message.type === 'SHOW_NOTIFICATION') {
        const payload = message.payload || {};
        event.waitUntil(
            self.registration.showNotification(payload.title || 'Gurukripa Bricks Industry', {
                body: payload.body || '',
                icon: payload.icon || './src/assets/images/logo.svg',
                badge: './src/assets/images/logo.svg',
                tag: payload.tag || 'gbi-local',
                data: payload.data || { url: './' }
            })
        );
    }
});
