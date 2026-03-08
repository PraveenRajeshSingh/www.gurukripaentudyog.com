const CACHE_NAME = 'gurukripa-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/main.js',
    '/src/styles/base.css',
    '/src/styles/variables.css',
    '/src/styles/components.css',
    '/src/styles/sections.css',
    '/src/styles/responsive.css',
    '/src/assets/images/logo-new.svg',
    '/src/assets/images/gurukripaLogo.jpg'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ Caching assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
