// Service Worker for Caching and Offline Support
const CACHE_NAME = 'gurukripa-bricks-v2.0.0';
const RUNTIME_CACHE = 'gurukripa-runtime-v2.0.0';
const FONT_CACHE = 'gurukripa-fonts-v2.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/404.html',
    '/500.html',
    '/assets/resources/css/main.min.css',
    '/assets/vendors/css/normalize.css',
    '/assets/vendors/css/grid.css',
    '/assets/vendors/css/ionicons.min.css',
    '/assets/resources/js/main.min.js',
    '/assets/resources/js/translations.js',
    '/assets/resources/js/cart.js',
    '/assets/resources/js/products.js',
    '/assets/resources/js/chatbot.js',
    '/assets/resources/js/script.js',
    '/assets/vendors/js/jquery.waypoints.min.js',
    '/assets/resources/img/logo-new.svg',
    '/assets/resources/img/gurukripaLogo.jpg',
    '/assets/resources/img/redbrick1.jpg',
    '/assets/resources/img/redbricks.jpg',
    '/assets/resources/img/WhatsApp Image 2024-12-14 at 12.56.23_234101e1.jpg',
    '/assets/resources/img/WhatsApp Image 2024-12-14 at 12.56.24_671074a1.jpg',
    '/assets/resources/img/WhatsApp Image 2024-12-14 at 12.56.25_87175421.jpg',
    '/assets/resources/img/WhatsApp Image 2024-12-14 at 12.56.26_85105217.jpg',
    '/assets/resources/img/WhatsApp Image 2024-12-14 at 12.56.27_65102157.jpg',
    '/assets/resources/img/WhatsApp Image 2024-12-14 at 12.56.28_71502176.jpg'
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

    // Handle different asset types with different strategies
    const url = new URL(event.request.url);
    
    // Font caching strategy
    if (url.pathname.match(/\.(woff|woff2|ttf|eot|otf)$/)) {
        event.respondWith(fontCacheStrategy(event.request));
        return;
    }
    
    // Image caching strategy
    if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        event.respondWith(imageCacheStrategy(event.request));
        return;
    }
    
    // CSS/JS caching strategy
    if (url.pathname.match(/\.(css|js)$/)) {
        event.respondWith(assetCacheStrategy(event.request));
        return;
    }
    
    // HTML caching strategy
    if (event.request.destination === 'document') {
        event.respondWith(htmlCacheStrategy(event.request));
        return;
    }
    
    // Default caching strategy
    event.respondWith(defaultCacheStrategy(event.request));
});

// Font caching strategy - cache first
function fontCacheStrategy(request) {
    return caches.open(FONT_CACHE)
        .then(cache => {
            return cache.match(request)
                .then(response => {
                    if (response) return response;
                    
                    return fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                });
        });
}

// Image caching strategy - cache first for important images
function imageCacheStrategy(request) {
    const importantImages = [
        'logo-new.svg',
        'gurukripaLogo.jpg',
        'redbrick1.jpg',
        'redbricks.jpg'
    ];
    
    const url = new URL(request.url);
    const isImportant = importantImages.some(img => url.pathname.includes(img));
    
    if (isImportant) {
        return caches.open(CACHE_NAME)
            .then(cache => cache.match(request))
            .then(response => response || fetch(request));
    }
    
    return fetch(request);
}

// Asset caching strategy - stale-while-revalidate
function assetCacheStrategy(request) {
    return caches.open(CACHE_NAME)
        .then(cache => {
            return cache.match(request)
                .then(cachedResponse => {
                    // Always fetch fresh version in background
                    const networkResponse = fetch(request)
                        .then(response => {
                            if (response && response.status === 200) {
                                cache.put(request, response.clone());
                            }
                            return response;
                        });
                    
                    // Return cached version immediately if available
                    return cachedResponse || networkResponse;
                });
        });
}

// HTML caching strategy - network first with cache fallback
function htmlCacheStrategy(request) {
    return fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                return caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request, response.clone());
                        return response;
                    });
            }
            throw new Error('Network response was not ok');
        })
        .catch(() => {
            return caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;
                    return caches.match('/404.html');
                });
        });
}

// Default caching strategy
function defaultCacheStrategy(request) {
    return caches.match(request)
        .then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            
            return fetch(request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE)
                        .then(cache => cache.put(request, responseToCache));
                    
                    return response;
                })
                .catch(() => {
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
        });
}

