const VERSION = '4.4.0';
const CACHE_NAME = `gurukripa-cache-v${VERSION}`;

// Only cache files that actually exist in this SPA
const ASSETS_TO_PRECACHE = [
    './',
    './index.html',
    './manifest.json',
    './sw.js',
    './robots.txt',
    './sitemap.xml',
    './404.html',
    './500.html',
];

// ── Install: precache critical assets ─────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching core assets');
                // addAll fails silently if one asset 404s — use individual puts instead
                return Promise.allSettled(
                    ASSETS_TO_PRECACHE.map(url =>
                        fetch(url, { cache: 'reload' })
                            .then(resp => {
                                if (resp && resp.status === 200) {
                                    return cache.put(url, resp);
                                }
                            })
                            .catch(() => { /* Skip unavailable assets */ })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ── Activate: clear old caches ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: smart caching strategies ───────────────────────────────────
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Skip non-GET and cross-origin requests
    if (req.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // HTML pages: Network-first → fallback to cache → fallback to index.html
    if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(
            fetch(req)
                .then(resp => {
                    if (resp && resp.status === 200) {
                        const clone = resp.clone();
                        caches.open(CACHE_NAME).then(c => c.put(req, clone));
                    }
                    return resp;
                })
                .catch(() =>
                    caches.match(req)
                        .then(cached => cached || caches.match('./index.html'))
                )
        );
        return;
    }

    // Images: Stale-while-revalidate (serve cached immediately, update in background)
    if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(req).then(cached => {
                    const fetchPromise = fetch(req)
                        .then(resp => {
                            if (resp && resp.status === 200) cache.put(req, resp.clone());
                            return resp;
                        })
                        .catch(() => null);
                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // Everything else (fonts, JSON, etc.): Cache-first → network fallback
    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;
            return fetch(req).then(resp => {
                if (resp && resp.status === 200) {
                    caches.open(CACHE_NAME).then(c => c.put(req, resp.clone()));
                }
                return resp;
            }).catch(() => new Response('Offline', { status: 503 }));
        })
    );
});

// ── Push: order status & rate drop alerts ─────────────────────────────
// Payload contract (sent by the push service, see docs/ANDROID-PACKAGING.md):
//   { title, body, tag, url, kind, orderId }
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
        icon: payload.icon || './src/assets/images/gurukripaLogo.jpg',
        badge: './src/assets/images/gurukripaLogo.jpg',
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

// ── Notification tap: focus an open tab, otherwise open the app ───────
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

// ── Page → SW messages (local alerts, manual update) ──────────────────
self.addEventListener('message', (event) => {
    const message = event.data || {};

    if (message.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }

    if (message.type === 'SHOW_NOTIFICATION') {
        const payload = message.payload || {};
        event.waitUntil(
            self.registration.showNotification(payload.title || 'Gurukripa Bricks Industry', {
                body: payload.body || '',
                icon: payload.icon || './src/assets/images/gurukripaLogo.jpg',
                badge: './src/assets/images/gurukripaLogo.jpg',
                tag: payload.tag || 'gbi-local',
                data: payload.data || { url: './' }
            })
        );
    }
});
