const VERSION = '3.5.2';
const CACHE_NAME = 'gurukripa-cache-v4';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'checkout.html',
    'manifest.json',
    `src/main.js?v=${VERSION}`,
    `src/styles/main.css?v=${VERSION}`,
    `src/styles/modern-ui.css?v=${VERSION}`,
    `src/styles/modern-ui-improvements.css?v=${VERSION}`,
    `src/styles/chatbot.css?v=${VERSION}`,
    `src/utils/ui.js?v=${VERSION}`,
    `src/utils/authService.js?v=${VERSION}`,
    `src/utils/cartService.js?v=${VERSION}`,
    `src/utils/productService.js?v=${VERSION}`,
    `src/utils/translationService.js?v=${VERSION}`,
    `src/utils/chatbot.js?v=${VERSION}`,
    `src/utils/calculator.js?v=${VERSION}`,
    `src/utils/wishlistService.js?v=${VERSION}`,
    'src/js/checkout.js',
    `src/constants/config.js?v=${VERSION}`,
    `src/constants/translations.js?v=${VERSION}`,
    `src/constants/products.js?v=${VERSION}`,
    'src/assets/images/logo-new.svg',
    'src/assets/images/favicon.ico'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ Caching assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Stale-while-revalidate for assets, Network-first for pages
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Stale-while-revalidate for static assets under /src/
    if (requestUrl.pathname.includes('/src/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((response) => {
                    if (response && response.status === 200) {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    }
                    return response;
                }).catch((err) => {
                    console.log("Background fetch failed for static asset:", event.request.url, err);
                });
                return cachedResponse || fetchPromise;
            })
        );
    }
    // Network-first for HTML pages
    else if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
        event.respondWith(
            fetch(event.request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                return caches.match(event.request);
            })
        );
    }
    // Fallback
    else {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});
