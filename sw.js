const CACHE_NAME = 'gurukripa-cache-v2';
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
    '/src/styles/navigation.css',
    '/src/styles/dashboard.css',
    '/src/utils/ui.js',
    '/src/utils/authService.js',
    '/src/utils/cartService.js',
    '/src/utils/productService.js',
    '/src/utils/translationService.js',
    '/src/utils/chatbot.js',
    '/src/constants/config.js',
    '/src/constants/translations.js',
    '/src/constants/products.js',
    '/src/assets/images/logo-new.svg',
    '/src/assets/images/favicon.ico'
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

// Fetch Event - Network first with Cache fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
