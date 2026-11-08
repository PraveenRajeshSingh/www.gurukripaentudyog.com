'use strict';
// ══════════════════════════════════════════════════════════════════
// PWA RUNTIME — SW registration (relative scope), offline banner,
// update toast, rate stamps, third-party offline fallbacks, storage UI
// ══════════════════════════════════════════════════════════════════

const GbiPwa = (function () {
    const RATES_STALE_MS = 7 * 24 * 60 * 60 * 1000;
    let waitingWorker = null;
    let bannerEl = null;

    function safeText(s) {
        if (typeof sanitizeHTML === 'function') return sanitizeHTML(s);
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── 13.1 Registration (relative URL + scope "./") ───────────
    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then((reg) => {
                    if (reg.waiting) promptUpdate(reg.waiting);
                    reg.addEventListener('updatefound', () => {
                        const sw = reg.installing;
                        if (!sw) return;
                        sw.addEventListener('statechange', () => {
                            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                                promptUpdate(sw);
                            }
                        });
                    });
                    // Re-warm shell while online (iOS Safari 7-day eviction)
                    if (navigator.onLine) warmShellCache();
                    ensureRatesCached();
                })
                .catch(() => { /* fail silently */ });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (GbiPwa._reloading) return;
                if (shouldBlockReload()) return;
                GbiPwa._reloading = true;
                location.reload();
            });

            navigator.serviceWorker.addEventListener('message', (event) => {
                const data = event.data || {};
                if (data.type === 'GBI_SYNC_OUTBOX' && window.OfflineQueue) {
                    OfflineQueue.flush({ silent: true });
                }
            });
        });
    }

    function shouldBlockReload() {
        if (document.body && document.body.classList.contains('checkout-open')) return true;
        if (document.getElementById('checkoutModal')?.classList.contains('open')) return true;
        const dirty = document.querySelector('form:not([data-allow-reload]) input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), form textarea');
        // Heuristic: if a modal form is focused/open with non-empty fields
        const openModal = document.querySelector('.modal-overlay.open form');
        if (openModal) {
            const filled = openModal.querySelector('input:not([type="hidden"]):not([value=""]), textarea');
            if (filled && String(filled.value || '').trim()) return true;
        }
        return false;
    }

    function promptUpdate(worker) {
        waitingWorker = worker;
        showUpdateToast();
    }

    function applyUpdate() {
        if (!waitingWorker) {
            location.reload();
            return;
        }
        if (shouldBlockReload()) {
            if (typeof showToast === 'function') {
                showToast('Finish checkout or save the form, then refresh for the new version.', 'warning');
            }
            return;
        }
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        waitingWorker = null;
        hideUpdateToast();
    }

    function showUpdateToast() {
        let el = document.getElementById('gbiUpdateToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'gbiUpdateToast';
            el.className = 'gbi-update-toast';
            el.setAttribute('role', 'status');
            el.innerHTML =
                '<span>New version available.</span>' +
                '<button type="button" class="gbi-update-toast__btn" id="gbiUpdateRefreshBtn">Refresh</button>';
            document.body.appendChild(el);
            el.querySelector('#gbiUpdateRefreshBtn').addEventListener('click', applyUpdate);
        }
        el.hidden = false;
        el.classList.add('is-visible');
    }

    function hideUpdateToast() {
        const el = document.getElementById('gbiUpdateToast');
        if (el) { el.classList.remove('is-visible'); el.hidden = true; }
    }

    function warmShellCache() {
        // Touch key shell URLs so iOS Safari refreshes site data while online
        const urls = ['./', './index.html', './offline.html', './manifest.json'];
        urls.forEach((u) => { try { fetch(u, { cache: 'no-cache' }).catch(() => {}); } catch (_e) {} });
    }

    function ensureRatesCached() {
        if (!window.OfflineStore || typeof PRODUCTS === 'undefined') return;
        OfflineStore.catalogSnapshot().then((snap) => {
            if (!snap || !snap.items || !snap.items.length) {
                OfflineStore.cacheCatalog(PRODUCTS).then(() => refreshRateStamps());
            } else {
                refreshRateStamps();
            }
        }).catch(() => {});
    }

    // ── 13.3 Offline banner ─────────────────────────────────────
    function ensureBanner() {
        if (bannerEl) return bannerEl;
        bannerEl = document.createElement('div');
        bannerEl.id = 'gbiOfflineBanner';
        bannerEl.className = 'gbi-offline-banner';
        bannerEl.setAttribute('role', 'status');
        bannerEl.setAttribute('aria-live', 'polite');
        bannerEl.hidden = true;
        bannerEl.innerHTML =
            '<span class="gbi-offline-banner__text">You\'re offline. Showing saved prices</span>' +
            '<button type="button" class="gbi-offline-banner__dismiss" aria-label="Dismiss offline notice">×</button>';
        document.body.prepend(bannerEl);
        bannerEl.querySelector('.gbi-offline-banner__dismiss').addEventListener('click', () => {
            bannerEl.hidden = true;
            bannerEl.classList.remove('is-visible');
        });
        return bannerEl;
    }

    function setOfflineUi(offline) {
        const b = ensureBanner();
        document.documentElement.classList.toggle('is-offline', offline);
        document.body.classList.toggle('is-offline', offline);
        if (offline) {
            b.hidden = false;
            b.classList.add('is-visible');
            applyOfflineDegradations();
        } else {
            b.hidden = true;
            b.classList.remove('is-visible');
            if (typeof showToast === 'function') showToast('Back online', 'success');
            clearOfflineDegradations();
            if (window.OfflineQueue) OfflineQueue.flush({ silent: false });
        }
        updateNetworkSensitiveButtons();
        refreshRateStamps();
    }

    function bindConnectivity() {
        ensureBanner();
        window.addEventListener('offline', () => setOfflineUi(true));
        window.addEventListener('online', () => setOfflineUi(false));
        if (!navigator.onLine) setOfflineUi(true);
        updateNetworkSensitiveButtons();
    }

    function updateNetworkSensitiveButtons() {
        const online = navigator.onLine;
        document.querySelectorAll('[data-needs-network]').forEach((el) => {
            if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                if (!online) {
                    el.setAttribute('aria-disabled', 'true');
                    el.classList.add('is-offline-disabled');
                    if (!el.dataset.onlineLabel) el.dataset.onlineLabel = el.getAttribute('aria-label') || el.textContent || '';
                    const hint = el.getAttribute('data-offline-label') || 'Needs network — opens when online';
                    el.setAttribute('aria-label', hint);
                    if (el.tagName === 'BUTTON') el.disabled = true;
                } else {
                    el.removeAttribute('aria-disabled');
                    el.classList.remove('is-offline-disabled');
                    el.disabled = false;
                    if (el.dataset.onlineLabel) el.setAttribute('aria-label', el.dataset.onlineLabel);
                }
            }
        });
        // WhatsApp / RFQ primary CTAs: keep clickable for draft queue, but label honestly
        document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach((a) => {
            if (!online) {
                a.classList.add('wa-needs-network');
                a.title = 'WhatsApp opens when you are back online. Message is prepared on this device.';
            } else {
                a.classList.remove('wa-needs-network');
                a.removeAttribute('title');
            }
        });
    }

    // ── Rate stamps (cached catalogue) ──────────────────────────
    function formatRateTime(ts) {
        try {
            return new Date(ts).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (_e) { return ''; }
    }

    function refreshRateStamps() {
        const host = document.getElementById('gbiRatesStamp');
        const stale = document.getElementById('gbiRatesStale');
        if (!window.OfflineStore) return;
        OfflineStore.catalogSnapshot().then((snap) => {
            const ts = snap && snap.savedAt;
            const text = ts
                ? ('Rates updated on ' + formatRateTime(ts) + ' · Confirm with yard')
                : 'Rates from this device catalogue · Confirm with yard';
            document.querySelectorAll('.gbi-rate-stamp').forEach((el) => { el.textContent = text; });
            if (host) host.textContent = text;
            const isStale = ts && (Date.now() - ts > RATES_STALE_MS);
            document.querySelectorAll('.gbi-rate-stale').forEach((el) => {
                el.hidden = !isStale;
            });
            if (stale) stale.hidden = !isStale;
            if (isStale) document.body.classList.add('rates-stale');
            else document.body.classList.remove('rates-stale');
        }).catch(() => {});
    }

    // ── Third-party offline degradations ────────────────────────
    function applyOfflineDegradations() {
        // Maps → static card (contact iframe)
        const frame = document.getElementById('contactMapFrame');
        const wrap = frame && frame.closest('.contact-map-wrap');
        if (wrap && !wrap.querySelector('.gbi-map-offline')) {
            if (frame) frame.setAttribute('data-src-offline', frame.getAttribute('src') || '');
            if (frame) frame.removeAttribute('src');
            const card = document.createElement('div');
            card.className = 'gbi-map-offline';
            card.innerHTML =
                '<strong>Map unavailable offline</strong>' +
                '<p>Kiln &amp; Dispatch Yard · Newada, Jalalpur-Chavri Road, Jaunpur (UP) 222001</p>' +
                '<p>25.6041° N, 82.7939° E</p>' +
                '<a class="btn btn-outline btn-sm" data-needs-network href="https://www.google.com/maps/dir/?api=1&destination=25.6041031,82.7939421" target="_blank" rel="noopener">Open directions (when online)</a>' +
                '<a class="btn btn-outline btn-sm" href="tel:+919198923230">Call the yard</a>';
            wrap.appendChild(card);
            const loading = document.getElementById('contactMapLoading');
            if (loading) loading.hidden = true;
        }
        const tracker = document.getElementById('trackerMapContainer');
        if (tracker && !tracker.querySelector('.gbi-map-offline')) {
            const card = document.createElement('div');
            card.className = 'gbi-map-offline gbi-map-offline--embed';
            card.innerHTML = '<strong>Live map needs network</strong><p>Call or WhatsApp the yard for dispatch status.</p>' +
                '<a href="tel:+919198923230">Call +91 91989 23230</a>';
            tracker.appendChild(card);
        }
        // Google sign-in mounts
        document.querySelectorAll('.google-gsi-mount, #googleGsiBtn, #googleGsiBtnReg').forEach((el) => {
            el.setAttribute('hidden', '');
            let note = el.parentElement && el.parentElement.querySelector('.gbi-gsi-offline');
            if (!note && el.parentElement) {
                note = document.createElement('p');
                note.className = 'gbi-gsi-offline';
                note.textContent = 'Google sign-in needs a network connection. Use email or mobile sign-in saved on this device.';
                el.parentElement.appendChild(note);
            }
        });
        // Chat: leave offline helper; mark status
        const chatNote = document.getElementById('gbiChatOfflineNote');
        if (chatNote) chatNote.hidden = false;
        // Pincode / delivery check that needs server
        document.querySelectorAll('[onclick*="openPincodeModal"], .product-delivery-meta .link-btn').forEach((el) => {
            el.classList.add('is-offline-disabled');
        });
    }

    function clearOfflineDegradations() {
        document.querySelectorAll('.gbi-map-offline').forEach((el) => el.remove());
        const frame = document.getElementById('contactMapFrame');
        if (frame && frame.getAttribute('data-src-offline')) {
            frame.setAttribute('src', frame.getAttribute('data-src-offline'));
            frame.removeAttribute('data-src-offline');
        }
        document.querySelectorAll('.gbi-gsi-offline').forEach((el) => el.remove());
        document.querySelectorAll('.google-gsi-mount').forEach((el) => el.removeAttribute('hidden'));
        const chatNote = document.getElementById('gbiChatOfflineNote');
        if (chatNote) chatNote.hidden = true;
        document.querySelectorAll('.is-offline-disabled').forEach((el) => el.classList.remove('is-offline-disabled'));
    }

    // ── Storage / Offline data settings ─────────────────────────
    function requestPersist() {
        try {
            if (navigator.storage && navigator.storage.persist) {
                navigator.storage.persist().catch(() => false);
            }
        } catch (_e) { /* quiet */ }
        if (window.OfflineStore) OfflineStore.requestPersistence();
    }

    function estimateStorage() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return Promise.resolve({ usage: 0, quota: 0, pct: 0 });
        }
        return navigator.storage.estimate().then((e) => {
            const usage = e.usage || 0;
            const quota = e.quota || 1;
            return { usage, quota, pct: Math.round((usage / quota) * 1000) / 10 };
        }).catch(() => ({ usage: 0, quota: 0, pct: 0 }));
    }

    async function pruneImageCacheIfNeeded() {
        const est = await estimateStorage();
        if (est.pct < 80) return est;
        try {
            if (!('caches' in window)) return est;
            const keys = await caches.keys();
            const imgKey = keys.find((k) => k.indexOf('gbi-img-') === 0);
            if (imgKey) await caches.delete(imgKey);
        } catch (_e) { /* ignore */ }
        return estimateStorage();
    }

    async function clearOfflineData() {
        // Keep public shell caches; clear image runtime + user outbox/photos/estimates optional?
        // Spec: Clear offline data action — prune images + allow clearing pending? Keep catalogue.
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.filter((k) => k.indexOf('gbi-img-') === 0).map((k) => caches.delete(k)));
            }
        } catch (_e) { /* ignore */ }
        if (window.OfflineStore && typeof OfflineStore.clearEstimates === 'function') {
            // Do not wipe catalogue; user asked clear offline data — wipe photos + old outbox sent rows
        }
        if (typeof showToast === 'function') showToast('Offline image cache cleared.', 'success');
        return renderOfflineSettings();
    }

    async function clearUserSpecificData() {
        // On Sign Out: clear user outbox/photos/estimates; keep public catalogue + shell caches
        if (window.OfflineStore && typeof OfflineStore.clearUserData === 'function') {
            try { await OfflineStore.clearUserData(); } catch (_e) { /* ignore */ }
        }
        try {
            localStorage.removeItem('gb_session');
            localStorage.removeItem('gb_api_outbox');
        } catch (_e) { /* ignore */ }
    }

    function updateRatesNow() {
        if (!window.OfflineStore || typeof PRODUCTS === 'undefined') {
            if (typeof showToast === 'function') showToast('Catalogue unavailable.', 'error');
            return Promise.resolve(false);
        }
        if (!navigator.onLine) {
            if (typeof showToast === 'function') showToast('Connect to update rates from the yard.', 'warning');
            return Promise.resolve(false);
        }
        return OfflineStore.cacheCatalog(PRODUCTS).then((res) => {
            refreshRateStamps();
            renderOfflineSettings();
            if (typeof showToast === 'function') {
                showToast((res.count || 0) + ' rates refreshed on this device.', 'success');
            }
            return true;
        });
    }

    function renderOfflineSettings() {
        const root = document.getElementById('gbiOfflineSettings');
        if (!root) return Promise.resolve();
        return Promise.all([
            window.OfflineStore ? OfflineStore.status() : Promise.resolve({}),
            window.OfflineQueue ? OfflineQueue.listPending() : Promise.resolve([]),
            estimateStorage().then(pruneImageCacheIfNeeded)
        ]).then((res) => {
            const st = res[0] || {};
            const pending = res[1] || [];
            const est = res[2] || {};
            const rates = st.savedAt
                ? formatRateTime(st.savedAt)
                : 'Not saved yet';
            const used = est.usage
                ? ((est.usage / (1024 * 1024)).toFixed(1) + ' MB ≈ ' + (est.pct || 0) + '%')
                : 'Unknown';
            const list = pending.map((p) => {
                const title = safeText(p.ref || p.type || 'Item');
                const when = formatRateTime(p.createdAt || Date.now());
                return '<li class="gbi-pending-row">' +
                    '<div><strong>' + title + '</strong> <span class="gbi-badge-waiting">Waiting to send</span>' +
                    '<div class="gbi-pending-meta">' + when + ' · ' + safeText(p.label || 'Pending, not sent yet') + '</div></div>' +
                    '<div class="gbi-pending-actions">' +
                    '<button type="button" class="btn btn-outline btn-sm" onclick="OfflineQueue.flush()">Retry now</button>' +
                    (OfflineQueue.apiEnabled()
                        ? ''
                        : '<button type="button" class="btn btn-outline btn-sm" data-needs-network onclick="OfflineQueue.openWhatsAppDraft(\'' + String(p.id).replace(/'/g, '') + '\')">Send via WhatsApp when online</button>') +
                    '<button type="button" class="btn btn-ghost btn-sm" onclick="OfflineQueue.remove(\'' + String(p.id).replace(/'/g, '') + '\').then(renderOfflineSettings)">Delete</button>' +
                    '</div></li>';
            }).join('');

            root.innerHTML =
                '<div class="gbi-offline-settings">' +
                '<div class="gbi-offline-settings__row"><span>Rates last updated</span><strong id="gbiOfflineRatesAt">' + safeText(rates) + '</strong></div>' +
                '<div class="gbi-offline-settings__row"><span>Items pending to send</span><strong>' + pending.length + '</strong></div>' +
                '<div class="gbi-offline-settings__row"><span>Approximate storage used</span><strong>' + safeText(used) + '</strong></div>' +
                (est.pct >= 80 ? '<p class="gbi-storage-warn">Storage is above 80%. Image cache was pruned. You can clear more offline data below.</p>' : '') +
                '<div class="gbi-offline-settings__actions">' +
                '<button type="button" class="btn btn-primary btn-sm" onclick="GbiPwa.updateRatesNow()">Update rates now</button>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="GbiPwa.clearOfflineData()">Clear offline data</button>' +
                '</div>' +
                (list ? '<ul class="gbi-pending-list">' + list + '</ul>' : '<p class="gbi-pending-empty">No items waiting to send.</p>') +
                '</div>';
        });
    }

    function renderOfflineQueueUI() {
        renderOfflineSettings();
        if (typeof renderEnquiriesInProfile === 'function' &&
            document.getElementById('profileModal')?.classList.contains('open')) {
            try { renderEnquiriesInProfile(); } catch (_e) {}
        }
    }

    function saveDataPause() {
        try {
            return !!(navigator.connection && navigator.connection.saveData);
        } catch (_e) { return false; }
    }

    function init() {
        registerServiceWorker();
        bindConnectivity();
        if (window.OfflineQueue) OfflineQueue.bindAutoFlush();
        // Persist after first estimate / install
        window.addEventListener('appinstalled', () => requestPersist());
        document.addEventListener('gb:estimate-saved', () => requestPersist());
        document.addEventListener('DOMContentLoaded', () => {
            ensureRateStampHosts();
            refreshRateStamps();
            renderOfflineSettings();
            if (!navigator.onLine) applyOfflineDegradations();
        });
        // Also run if DOM already ready
        if (document.readyState !== 'loading') {
            ensureRateStampHosts();
            refreshRateStamps();
            renderOfflineSettings();
        }
    }

    function ensureRateStampHosts() {
        const products = document.getElementById('products');
        if (products && !document.getElementById('gbiRatesStamp')) {
            const bar = document.createElement('div');
            bar.className = 'gbi-rates-bar';
            bar.innerHTML =
                '<span class="gbi-rate-stamp" id="gbiRatesStamp">Rates from this device · Confirm with yard</span>' +
                '<span class="gbi-rate-stale" id="gbiRatesStale" hidden>Rates older than 7 days — confirm with the yard before ordering.</span>';
            const intro = products.querySelector('.products-intro') || products.querySelector('.container');
            if (intro) intro.appendChild(bar);
        }
        const calc = document.getElementById('calcOfflineState');
        if (calc && !document.getElementById('gbiCalcRateStamp')) {
            const s = document.createElement('div');
            s.id = 'gbiCalcRateStamp';
            s.className = 'gbi-rate-stamp';
            calc.parentElement && calc.parentElement.appendChild(s);
        }
    }

    init._started = false;
    function start() {
        if (init._started) return;
        init._started = true;
        init();
    }

    return {
        start,
        applyUpdate,
        updateRatesNow,
        clearOfflineData,
        clearUserSpecificData,
        renderOfflineSettings,
        refreshRateStamps,
        requestPersist,
        estimateStorage,
        saveDataPause
    };
})();

window.GbiPwa = GbiPwa;
window.renderOfflineSettings = function () {
    if (window.GbiPwa) return GbiPwa.renderOfflineSettings();
};
window.renderOfflineQueueUI = function () {
    if (window.GbiPwa) return GbiPwa.renderOfflineSettings();
};

GbiPwa.start();
