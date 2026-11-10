'use strict';
/**
 * Phase 5 — idle / Save-Data aware secondary asset warm.
 * Does not change business logic; only schedules background work after first paint.
 */
(function () {
    function saveData() {
        try { return !!(navigator.connection && navigator.connection.saveData); }
        catch (_e) { return false; }
    }

    function runIdle(fn, timeout) {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(fn, { timeout: timeout || 2500 });
        } else {
            setTimeout(fn, 1200);
        }
    }

    function warmImages() {
        if (saveData() || !navigator.onLine) return;
        var urls = [
            'src/assets/images/optimized/product-1-320.jpg',
            'src/assets/images/optimized/product-2-320.jpg',
            'src/assets/images/optimized/product-3-320.jpg',
            'src/assets/images/optimized/hero-768.jpg'
        ];
        urls.forEach(function (src) {
            var img = new Image();
            img.decoding = 'async';
            img.src = src;
        });
    }

    function boot() {
        runIdle(function () {
            warmImages();
            if (navigator.serviceWorker && navigator.serviceWorker.controller && !saveData()) {
                try {
                    navigator.serviceWorker.controller.postMessage({ type: 'WARM_CACHE' });
                } catch (_e) { /* ignore */ }
            }
        }, 3000);
    }

    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot);
})();
