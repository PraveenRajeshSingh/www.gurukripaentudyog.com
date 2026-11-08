/* ══════════════════════════════════════════════════════════════════
   RELIABILITY LAYER — error ring buffer, safe storage/fetch, feature
   detection, clipboard/share fallbacks, Diagnostics copy action.
   CHANGE: new file for polish pass §2 (error handling + network).
   Load FIRST (before utils.js consumers that may throw).
   ══════════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    var MAX_ERRORS = 50;
    var errorRing = [];
    var lastToastAt = 0;
    var DATA_VERSION = 2;
    var DATA_VERSION_KEY = 'gb_data_version';

    function pushError(entry) {
        try {
            errorRing.push(Object.assign({ ts: Date.now() }, entry));
            if (errorRing.length > MAX_ERRORS) errorRing.shift();
        } catch (_e) { /* never throw from logger */ }
    }

    function friendlyToast(msg) {
        var now = Date.now();
        if (now - lastToastAt < 8000) return;
        lastToastAt = now;
        try {
            if (typeof global.showToast === 'function') {
                global.showToast(msg, 'error');
            }
        } catch (_e) { /* ignore */ }
    }

    // ── Global safety net ──────────────────────────────────────────
    global.addEventListener('error', function (e) {
        pushError({
            type: 'error',
            message: String((e && e.message) || 'Unknown error'),
            source: e && e.filename ? String(e.filename) : '',
            line: e && e.lineno || 0,
            col: e && e.colno || 0
        });
        // Resource load failures (img/script) have no e.error — don't toast those.
        if (e && e.error) {
            friendlyToast('Something didn’t load as expected. Your cart and details are safe — try again or call the yard.');
        }
    });

    global.addEventListener('unhandledrejection', function (e) {
        var reason = e && e.reason;
        var msg = reason && reason.message ? reason.message : String(reason || 'Unhandled rejection');
        pushError({ type: 'unhandledrejection', message: msg });
        friendlyToast('Something didn’t finish. Please try again — your saved data is intact.');
        try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (_e) { /* ignore */ }
    });

    // ── Safe JSON / storage ────────────────────────────────────────
    function safeParseJSON(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch (err) {
            pushError({ type: 'json', message: 'JSON.parse failed: ' + (err && err.message) });
            return fallback;
        }
    }

    function storageGet(store, key, fallback) {
        try {
            var raw = store.getItem(key);
            return raw == null ? fallback : raw;
        } catch (err) {
            pushError({ type: 'storage', message: 'getItem failed: ' + (err && err.message) });
            return fallback;
        }
    }

    function storageSet(store, key, value) {
        try {
            store.setItem(key, value);
            return true;
        } catch (err) {
            pushError({ type: 'storage', message: 'setItem failed: ' + (err && err.message) });
            // Quota / private mode — backup corrupt attempt then clear this key only
            try {
                var bak = key + '__bak';
                store.setItem(bak, String(value).slice(0, 2000));
            } catch (_e2) { /* ignore */ }
            return false;
        }
    }

    function storageRemove(store, key) {
        try { store.removeItem(key); return true; }
        catch (err) {
            pushError({ type: 'storage', message: 'removeItem failed: ' + (err && err.message) });
            return false;
        }
    }

    function localGet(key, fallback) {
        try { return storageGet(localStorage, key, fallback); }
        catch (_e) { return fallback; }
    }

    function localSet(key, value) {
        try { return storageSet(localStorage, key, value); }
        catch (_e) { return false; }
    }

    function localGetJSON(key, fallback) {
        var raw = localGet(key, null);
        if (raw == null) return fallback;
        var parsed = safeParseJSON(raw, null);
        if (parsed === null && raw !== 'null') {
            // Corrupt — backup then reset this key only
            try {
                localStorage.setItem(key + '__corrupt_' + Date.now(), String(raw).slice(0, 4000));
                localStorage.removeItem(key);
            } catch (_e) { /* ignore */ }
            pushError({ type: 'storage', message: 'Corrupt JSON for key ' + key + ' — reset' });
            return fallback;
        }
        return parsed;
    }

    function localSetJSON(key, value) {
        try {
            return localSet(key, JSON.stringify(value));
        } catch (err) {
            pushError({ type: 'storage', message: 'JSON stringify/set failed: ' + (err && err.message) });
            return false;
        }
    }

    // ── Data version migration (additive only) ─────────────────────
    function migrateStoredData() {
        var ver = parseInt(localGet(DATA_VERSION_KEY, '1'), 10) || 1;
        if (ver >= DATA_VERSION) return;
        try {
            // v1 → v2: stamp data-version on cart/wishlist blobs if present
            ['gb_cart', 'gb_wishlist', 'gb_orders'].forEach(function (k) {
                var v = localGetJSON(k, null);
                if (v && typeof v === 'object' && !Array.isArray(v) && v.dataVersion == null) {
                    v.dataVersion = DATA_VERSION;
                    localSetJSON(k, v);
                }
            });
            localSet(DATA_VERSION_KEY, String(DATA_VERSION));
        } catch (err) {
            pushError({ type: 'migrate', message: String(err && err.message) });
        }
    }

    // ── Number / Hindi digit normalisation ─────────────────────────
    var HINDI_DIGITS = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };

    function normalizeDigits(str) {
        return String(str == null ? '' : str).replace(/[०-९]/g, function (ch) {
            return HINDI_DIGITS[ch] || ch;
        }).replace(/,/g, '').trim();
    }

    function parseSafeNumber(value, opts) {
        opts = opts || {};
        var n = Number(normalizeDigits(value));
        if (!isFinite(n) || isNaN(n)) return opts.fallback != null ? opts.fallback : 0;
        if (opts.min != null && n < opts.min) n = opts.min;
        if (opts.max != null && n > opts.max) n = opts.max;
        return n;
    }

    // ── Escape for HTML text nodes / attributes ────────────────────
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── Feature detection ──────────────────────────────────────────
    var features = {
        clipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
        share: typeof navigator.share === 'function',
        broadcastChannel: typeof BroadcastChannel === 'function',
        intersectionObserver: typeof IntersectionObserver === 'function',
        resizeObserver: typeof ResizeObserver === 'function',
        visualViewport: !!window.visualViewport,
        requestIdleCallback: typeof requestIdleCallback === 'function',
        containerQueries: (function () {
            try { return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('container-type', 'inline-size'); }
            catch (_e) { return false; }
        })(),
        hasSelector: (function () {
            try { return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('selector(:has(*))'); }
            catch (_e) { return false; }
        })(),
        dvh: (function () {
            try { return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('height', '1dvh'); }
            catch (_e) { return false; }
        })(),
        notifications: 'Notification' in global,
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: !!global.indexedDB
    };

    function idle(fn, timeout) {
        if (features.requestIdleCallback) {
            return requestIdleCallback(fn, { timeout: timeout || 2000 });
        }
        return setTimeout(fn, 1);
    }

    // ── Clipboard / share fallbacks ────────────────────────────────
    function copyText(text) {
        var value = String(text == null ? '' : text);
        if (features.clipboard) {
            return navigator.clipboard.writeText(value).then(function () {
                return true;
            }).catch(function () {
                return copyTextFallback(value);
            });
        }
        return Promise.resolve(copyTextFallback(value));
    }

    function copyTextFallback(value) {
        try {
            var ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (_e) { ok = false; }
            document.body.removeChild(ta);
            return ok;
        } catch (_e2) {
            return false;
        }
    }

    function shareOrCopy(data) {
        data = data || {};
        if (features.share) {
            return navigator.share(data).then(function () { return 'shared'; }).catch(function (err) {
                if (err && err.name === 'AbortError') return 'aborted';
                return copyText(data.url || data.text || '').then(function (ok) {
                    return ok ? 'copied' : 'failed';
                });
            });
        }
        return copyText(data.url || data.text || '').then(function (ok) {
            return ok ? 'copied' : 'failed';
        });
    }

    // ── Safe fetch (8s timeout, 1 retry for GET) ───────────────────
    function safeFetch(url, options) {
        options = options || {};
        var timeoutMs = options.timeout != null ? options.timeout : 8000;
        var method = ((options.method || 'GET') + '').toUpperCase();
        var retries = options.retry != null ? options.retry : (method === 'GET' || method === 'HEAD' ? 1 : 0);
        var attempt = 0;

        function once() {
            attempt += 1;
            if (!navigator.onLine && options.requireOnline !== false) {
                var offlineErr = new Error('You appear to be offline. Reconnect and try again.');
                offlineErr.code = 'OFFLINE';
                return Promise.reject(offlineErr);
            }
            var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            var timer = null;
            var fetchOpts = Object.assign({}, options);
            delete fetchOpts.timeout;
            delete fetchOpts.retry;
            delete fetchOpts.requireOnline;
            if (ctrl) fetchOpts.signal = ctrl.signal;
            if (ctrl) timer = setTimeout(function () { try { ctrl.abort(); } catch (_e) { /* ignore */ } }, timeoutMs);

            return fetch(url, fetchOpts).then(function (res) {
                if (timer) clearTimeout(timer);
                if (!res.ok) {
                    var httpErr = new Error('Request failed (' + res.status + ')');
                    httpErr.status = res.status;
                    httpErr.code = 'HTTP';
                    throw httpErr;
                }
                return res;
            }).catch(function (err) {
                if (timer) clearTimeout(timer);
                var isAbort = err && (err.name === 'AbortError' || err.code === 20);
                if (isAbort) {
                    err = new Error('Request timed out. Please try again.');
                    err.code = 'TIMEOUT';
                }
                if (attempt <= retries && (method === 'GET' || method === 'HEAD')) {
                    var backoff = 300 * attempt;
                    return new Promise(function (resolve) { setTimeout(resolve, backoff); }).then(once);
                }
                pushError({ type: 'fetch', message: String(err && err.message), url: String(url) });
                throw err;
            });
        }
        return once();
    }

    function safeFetchJSON(url, options) {
        return safeFetch(url, options).then(function (res) {
            return res.text().then(function (txt) {
                var data = safeParseJSON(txt, null);
                if (data === null && txt && txt.trim() !== '' && txt.trim() !== 'null') {
                    var err = new Error('Invalid JSON response');
                    err.code = 'BAD_JSON';
                    throw err;
                }
                return data;
            });
        });
    }

    // ── Debounce / throttle ────────────────────────────────────────
    function debounce(fn, wait) {
        var t = null;
        return function () {
            var ctx = this, args = arguments;
            if (t) clearTimeout(t);
            t = setTimeout(function () { t = null; fn.apply(ctx, args); }, wait || 250);
        };
    }

    function throttleRAF(fn) {
        var scheduled = false;
        var lastArgs;
        return function () {
            lastArgs = arguments;
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(function () {
                scheduled = false;
                fn.apply(null, lastArgs);
            });
        };
    }

    // ── Multi-tab sync (storage + BroadcastChannel) ────────────────
    var bc = null;
    if (features.broadcastChannel) {
        try { bc = new BroadcastChannel('gbi-sync'); } catch (_e) { bc = null; }
    }

    function broadcast(type, payload) {
        if (!bc) return;
        try { bc.postMessage({ type: type, payload: payload, ts: Date.now() }); }
        catch (_e) { /* ignore */ }
    }

    function onSync(handler) {
        if (bc) {
            bc.addEventListener('message', function (ev) {
                try { handler(ev.data); } catch (err) {
                    pushError({ type: 'sync', message: String(err && err.message) });
                }
            });
        }
        global.addEventListener('storage', function (ev) {
            if (!ev || !ev.key) return;
            try {
                handler({ type: 'storage', key: ev.key, newValue: ev.newValue, oldValue: ev.oldValue });
            } catch (err) {
                pushError({ type: 'sync', message: String(err && err.message) });
            }
        });
    }

    // ── Diagnostics (Account Settings copy) ────────────────────────
    function getDiagnostics() {
        return {
            ts: new Date().toISOString(),
            ua: navigator.userAgent,
            online: navigator.onLine,
            lang: document.documentElement.lang || '',
            theme: document.documentElement.getAttribute('data-theme') || '',
            viewport: { w: window.innerWidth, h: window.innerHeight },
            features: features,
            dataVersion: localGet(DATA_VERSION_KEY, '1'),
            errors: errorRing.slice()
        };
    }

    function copyDiagnostics() {
        var text = JSON.stringify(getDiagnostics(), null, 2);
        return copyText(text).then(function (ok) {
            if (typeof global.showToast === 'function') {
                global.showToast(ok ? 'Diagnostics copied. Paste into a support message.' : 'Could not copy. Select the text manually.', ok ? 'success' : 'warning');
            }
            return ok;
        });
    }

    // Wire Diagnostics button via delegation (hidden Account Settings action)
    document.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('[data-action="copy-diagnostics"]');
        if (!btn) return;
        e.preventDefault();
        if (btn.dataset.gbBusy === '1') return;
        btn.dataset.gbBusy = '1';
        btn.setAttribute('aria-busy', 'true');
        copyDiagnostics().finally(function () {
            delete btn.dataset.gbBusy;
            btn.removeAttribute('aria-busy');
        });
    });

    // ── Image onerror fallback (neutral brand placeholder) ─────────
    var IMG_PLACEHOLDER =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
            '<rect fill="#FAF6F2" width="640" height="480"/>' +
            '<rect x="220" y="160" width="200" height="120" rx="8" fill="#A93226"/>' +
            '<text x="320" y="320" text-anchor="middle" fill="#7B241C" font-family="system-ui,sans-serif" font-size="18">Gurukripa Bricks</text>' +
            '</svg>'
        );

    function bindImageFallbacks(root) {
        var scope = root || document;
        // CHANGE: :not() — attribute != is not a valid selector and crashed boot
        var imgs = scope.querySelectorAll ? scope.querySelectorAll('img:not([data-fallback="bound"])') : [];
        Array.prototype.forEach.call(imgs, function (img) {
            img.setAttribute('data-fallback', 'bound');
            img.addEventListener('error', function onErr() {
                img.removeEventListener('error', onErr);
                if (img.dataset.fallbackApplied === '1') return;
                img.dataset.fallbackApplied = '1';
                var w = img.getAttribute('width') || img.width || 320;
                var h = img.getAttribute('height') || img.height || 240;
                img.src = IMG_PLACEHOLDER;
                img.removeAttribute('srcset');
                if (!img.getAttribute('width')) img.setAttribute('width', w);
                if (!img.getAttribute('height')) img.setAttribute('height', h);
            });
        });
    }

    // ── Loading state helper with max time ─────────────────────────
    function withLoading(el, promise, maxMs) {
        maxMs = maxMs || 12000;
        if (!el) return promise;
        el.classList.add('is-busy');
        el.setAttribute('aria-busy', 'true');
        var done = false;
        var timer = setTimeout(function () {
            if (done) return;
            done = true;
            el.classList.remove('is-busy');
            el.removeAttribute('aria-busy');
            el.classList.add('is-load-error');
            if (typeof global.showToast === 'function') {
                global.showToast('This is taking too long. Check your connection and retry.', 'error');
            }
        }, maxMs);
        return Promise.resolve(promise).then(function (v) {
            if (done) return v;
            done = true;
            clearTimeout(timer);
            el.classList.remove('is-busy', 'is-load-error');
            el.removeAttribute('aria-busy');
            return v;
        }, function (err) {
            if (!done) {
                done = true;
                clearTimeout(timer);
                el.classList.remove('is-busy');
                el.classList.add('is-load-error');
                el.removeAttribute('aria-busy');
            }
            throw err;
        });
    }

    // Boot migration + image fallbacks when DOM ready
    function boot() {
        migrateStoredData();
        bindImageFallbacks(document);
        if (features.intersectionObserver) {
            // content-visibility hint class already in CSS; no-op observer reserved
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    global.GBI = global.GBI || {};
    global.GBI.Reliability = {
        pushError: pushError,
        getErrors: function () { return errorRing.slice(); },
        getDiagnostics: getDiagnostics,
        copyDiagnostics: copyDiagnostics,
        safeParseJSON: safeParseJSON,
        localGet: localGet,
        localSet: localSet,
        localGetJSON: localGetJSON,
        localSetJSON: localSetJSON,
        storageGet: storageGet,
        storageSet: storageSet,
        storageRemove: storageRemove,
        normalizeDigits: normalizeDigits,
        parseSafeNumber: parseSafeNumber,
        escapeHtml: escapeHtml,
        features: features,
        idle: idle,
        copyText: copyText,
        shareOrCopy: shareOrCopy,
        safeFetch: safeFetch,
        safeFetchJSON: safeFetchJSON,
        debounce: debounce,
        throttleRAF: throttleRAF,
        broadcast: broadcast,
        onSync: onSync,
        bindImageFallbacks: bindImageFallbacks,
        withLoading: withLoading,
        IMG_PLACEHOLDER: IMG_PLACEHOLDER,
        DATA_VERSION: DATA_VERSION
    };

    // Convenience globals used across the app (keep existing names)
    global.escapeHtml = global.escapeHtml || escapeHtml;
    global.safeParseJSON = global.safeParseJSON || safeParseJSON;
    global.gbiSafeFetch = safeFetch;
    global.gbiCopyText = copyText;
    global.gbiDebounce = debounce;
    global.gbiThrottleRAF = throttleRAF;
    global.copyDiagnostics = copyDiagnostics;

})(typeof window !== 'undefined' ? window : self);
