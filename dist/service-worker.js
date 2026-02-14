// Service Worker for Caching and Offline Support
const CACHE_NAME = 'gurukripa-bricks-v1.0.0';
const RUNTIME_CACHE = 'gurukripa-runtime-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/vendors/css/normalize.css',
    '/assets/vendors/css/grid.css',
    '/assets/vendors/css/ionicons.min.css',
    '/assets/resources/css/modern-style.css',
    '/assets/resources/css/animations.css',
    '/assets/resources/css/enhancements.css',
    '/assets/resources/js/translations.js',
    '/assets/resources/js/cart.js',
    '/assets/resources/js/products.js',
    '/assets/resources/js/chatbot.js',
    '/assets/resources/js/enhancements.js',
    '/assets/resources/img/logo-new.svg',
    '/assets/resources/img/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response
                        caches.open(RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If offline and no cache, return offline page
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

