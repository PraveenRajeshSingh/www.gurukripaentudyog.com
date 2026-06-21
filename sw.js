const VERSION = '4.0.0';
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
