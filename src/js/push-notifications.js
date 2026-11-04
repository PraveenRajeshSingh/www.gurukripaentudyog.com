'use strict';
// ══════════════════════════════════════════════════════════════════
// PUSH & LOCAL ALERTS
// Gurukripa Bricks Industry — order status + wholesale rate alerts
// ══════════════════════════════════════════════════════════════════
// Two delivery channels, picked automatically:
//
// 1. SERVICE-WORKER PUSH (production)
//    Requires a VAPID key pair and a small subscribe endpoint. Set them in
//    index.html via:
//      <meta name="web-push-public-key" content="B...">
//      <meta name="push-subscribe-endpoint" content="https://api.../push/subscribe">
//    Without those metas the module stays in local-alert mode — nothing is
//    silently "sent" and no fake server traffic is generated.
//
// 2. LOCAL NOTIFICATIONS (always available)
//    The service worker raises the notification itself, so order-token
//    confirmations and rate-drop alerts still work with a flaky signal.
//
// Alert history is kept on the device so the bell always shows what was
// raised, even if the OS suppressed the banner.
// ══════════════════════════════════════════════════════════════════

const PushNotifications = (function () {
    const PREFS_KEY = 'gb_alert_prefs';
    const LOG_KEY = 'gb_alert_log';
    const STATUS_KEY = 'gb_alert_order_status';
    const MAX_LOG = 30;
    const ICON = 'src/assets/images/gurukripaLogo.jpg';

    const DEFAULT_PREFS = { orderUpdates: true, priceDrops: true, permissionAsked: false };

    const ORDER_STAGES = {
        token: {
            title: 'Order token created',
            body: (o) => `Order ${o.id || ''} is logged at the Jalalpur yard. Loading slot confirmation is next.`
        },
        loading: {
            title: 'Bhatta loading started',
            body: (o) => `Order ${o.id || ''} is being loaded on the trolley at the Jalalpur yard.`
        },
        firing: {
            title: 'Bricks in the kiln',
            body: (o) => `Order ${o.id || ''} is queued against a firing chamber at the bhatta. Loading slot follows once the burn completes.`
        },
        dispatched: {
            title: 'Trolley dispatched',
            body: (o) => `Order ${o.id || ''} has been dispatched from the Jalalpur yard. Open Track Orders for driver details.`
        },
        delivered: {
            title: 'Bricks unloaded at site',
            body: (o) => `Order ${o.id || ''} is marked delivered. Thank you for building with Gurukripa.`
        },
        cancelled: {
            title: 'Order cancelled',
            body: (o) => `Order ${o.id || ''} was cancelled. Call the yard if this is unexpected.`
        }
    };

    // ── Preferences & history ────────────────────────────────────
    function prefs() {
        return Object.assign({}, DEFAULT_PREFS, getSafeStorage(PREFS_KEY, {}));
    }

    function savePrefs(patch) {
        const next = Object.assign(prefs(), patch);
        setSafeStorage(PREFS_KEY, next);
        renderSettings();
        return next;
    }

    function history() {
        const rows = getSafeStorage(LOG_KEY, []);
        return Array.isArray(rows) ? rows : [];
    }

    function remember(entry) {
        const rows = history();
        rows.unshift(entry);
        setSafeStorage(LOG_KEY, rows.slice(0, MAX_LOG));
        renderBellBadge();
        renderCenter();
    }

    function unreadCount() {
        return history().filter((n) => !n.read).length;
    }

    // ── Capability helpers ───────────────────────────────────────
    function supported() {
        return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
    }

    function permission() {
        return supported() ? Notification.permission : 'unsupported';
    }

    function swRegistration() {
        if (!('serviceWorker' in navigator)) return Promise.resolve(null);
        return navigator.serviceWorker.ready.catch(() => null);
    }

    function metaContent(name) {
        const tag = document.querySelector(`meta[name="${name}"]`);
        return tag && tag.content ? tag.content.trim() : '';
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
    }

    // ── Delivery ────────────────────────────────────────────────
    function show(title, body, options) {
        const opts = options || {};
        const entry = {
            id: 'n_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            title: title,
            body: body,
            tag: opts.tag || '',
            url: opts.url || '',
            kind: opts.kind || 'general',
            orderId: opts.orderId || '',
            createdAt: Date.now(),
            read: false
        };
        remember(entry);

        if (permission() !== 'granted') {
            // No OS banner possible — fall back to the in-app toast so the
            // builder still learns about it while the app is open.
            if (typeof showToast === 'function' && opts.toast !== false) {
                showToast(`${title} — ${body}`, 'info');
            }
            return Promise.resolve(false);
        }

        return swRegistration().then((reg) => {
            if (!reg || typeof reg.showNotification !== 'function') return false;
            return reg.showNotification(title, {
                body: body,
                icon: ICON,
                badge: ICON,
                tag: entry.tag || entry.id,
                renotify: false,
                data: { url: entry.url, kind: entry.kind, orderId: entry.orderId }
            }).then(() => true).catch(() => false);
        });
    }

    // ── Permission + Web Push subscription ──────────────────────
    function enableAlerts() {
        if (!supported()) {
            if (typeof showToast === 'function') showToast('This browser cannot show notifications. Alerts stay in-app.', 'warning');
            return Promise.resolve('unsupported');
        }
        if (permission() === 'granted') {
            return subscribePush().then((res) => {
                renderSettings();
                if (typeof showToast === 'function') {
                    showToast(res.ok ? 'Push alerts are already enabled.' : 'Alerts enabled on this device.', 'success');
                }
                return 'granted';
            });
        }
        return Notification.requestPermission().then((result) => {
            savePrefs({ permissionAsked: true });
            if (result === 'granted') {
                return subscribePush().then(() => {
                    renderSettings();
                    show('Alerts enabled', 'You will get order status and brick rate drop alerts on this device.', { toast: true });
                    return 'granted';
                });
            }
            renderSettings();
            if (typeof showToast === 'function') {
                showToast(result === 'denied'
                    ? 'Notifications blocked. Allow them in your browser or Android app settings.'
                    : 'Notification permission was dismissed.', 'warning');
            }
            return result;
        }).catch(() => 'denied');
    }

    function subscribePush() {
        const applicationServerKey = metaContent('web-push-public-key');
        const endpoint = metaContent('push-subscribe-endpoint');
        return swRegistration().then((reg) => {
            if (!reg || !reg.pushManager) return { ok: false, reason: 'push-unsupported' };
            if (!applicationServerKey) return { ok: false, reason: 'no-vapid-key' };
            return reg.pushManager.getSubscription().then((existing) => {
                if (existing) return existing;
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
                });
            }).then((subscription) => {
                if (!endpoint) return { ok: false, reason: 'no-subscribe-endpoint', subscription: subscription.toJSON() };
                return fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscription: subscription.toJSON(),
                        customer: typeof user !== 'undefined' && user ? { name: user.name, mobile: user.mobile } : null
                    })
                }).then((res) => ({ ok: res.ok, subscription: subscription.toJSON() }))
                    .catch(() => ({ ok: false, reason: 'subscribe-post-failed', subscription: subscription.toJSON() }));
            }).catch((err) => ({ ok: false, reason: 'subscribe-failed', error: String(err && err.message || err) }));
        });
    }

    // ── Order status alerts ─────────────────────────────────────
    function normaliseStage(status) {
        const s = String(status || '').toLowerCase();
        if (!s) return '';
        if (s.indexOf('deliver') >= 0 || s.indexOf('complete') >= 0 || s.indexOf('unload') >= 0) return 'delivered';
        if (s.indexOf('cancel') >= 0 || s.indexOf('reject') >= 0) return 'cancelled';
        if (s.indexOf('dispatch') >= 0 || s.indexOf('transit') >= 0 || s.indexOf('road') >= 0 || s.indexOf('route') >= 0) return 'dispatched';
        if (s.indexOf('firing') >= 0 || s.indexOf('kiln') >= 0 || s.indexOf('chamber') >= 0) return 'firing';
        if (s.indexOf('load') >= 0) return 'loading';
        if (s.indexOf('process') >= 0 || s.indexOf('pending') >= 0 || s.indexOf('placed') >= 0 || s.indexOf('token') >= 0) return 'token';
        return '';
    }

    function notifyOrderStatus(order, stage) {
        if (!prefs().orderUpdates) return false;
        const def = ORDER_STAGES[stage];
        if (!def) return false;
        show(def.title, def.body(order || {}), {
            tag: 'order-' + ((order && order.id) || ''),
            kind: 'order',
            orderId: (order && order.id) || '',
            url: '#track'
        });
        return true;
    }

    // Watch the locally stored order list. The status field is written by
    // checkout, the ERP logistics module or a remote poll — we only raise an
    // alert when the value genuinely changes between reads.
    function checkOrderStatusChanges() {
        if (typeof orders === 'undefined' || !Array.isArray(orders)) return [];
        const seen = getSafeStorage(STATUS_KEY, {});
        const changed = [];
        orders.slice(0, 10).forEach((o) => {
            const stage = normaliseStage(o && o.status);
            if (!stage) return;
            if (seen[o.id] === stage) return;
            if (Object.prototype.hasOwnProperty.call(seen, o.id)) {
                if (notifyOrderStatus(o, stage)) changed.push(o.id);
            }
            seen[o.id] = stage;
        });
        setSafeStorage(STATUS_KEY, seen);
        return changed;
    }

    // Optional backend poll. Dormant until an endpoint is configured.
    function pollRemoteStatus() {
        const endpoint = metaContent('order-status-endpoint');
        if (!endpoint || typeof orders === 'undefined' || !Array.isArray(orders) || !orders.length) {
            return Promise.resolve([]);
        }
        const ids = orders.slice(0, 10).map((o) => o.id).join(',');
        return fetch(`${endpoint}${endpoint.indexOf('?') >= 0 ? '&' : '?'}ids=${encodeURIComponent(ids)}`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        }).then((res) => (res.ok ? res.json() : null)).then((data) => {
            const rows = data && Array.isArray(data.orders) ? data.orders : [];
            if (!rows.length) return [];
            let dirty = false;
            rows.forEach((remote) => {
                const local = orders.find((o) => String(o.id) === String(remote.id));
                if (!local || !remote.status || local.status === remote.status) return;
                local.status = remote.status;
                dirty = true;
            });
            if (dirty) {
                setSafeStorage('gb_orders', orders);
                if (typeof renderTrackerDetails === 'function') {
                    const open = document.getElementById('trackerModal');
                    if (open && open.classList.contains('open')) renderTrackerDetails(orders[0].id);
                }
            }
            return checkOrderStatusChanges();
        }).catch(() => []);
    }

    // ── Price drop alerts ──────────────────────────────────────
    function diffPrices(previous, live) {
        const drops = [];
        (live || []).forEach((p) => {
            const before = (previous || []).find((x) => String(x.id) === String(p.id));
            if (!before) return;
            const oldPrice = Number(before.price);
            const newPrice = Number(p.price);
            if (!isFinite(oldPrice) || !isFinite(newPrice)) return;
            if (newPrice >= oldPrice) return;
            drops.push({
                id: p.id,
                name: p.name,
                oldPrice: oldPrice,
                newPrice: newPrice,
                drop: Math.round((oldPrice - newPrice) * 100) / 100
            });
        });
        return drops;
    }

    // Compares the cached rate card with live rates, alerts on any decrease,
    // then refreshes the cache so the same drop is never reported twice.
    function checkPriceDrops() {
        if (!window.OfflineStore || typeof PRODUCTS === 'undefined') return Promise.resolve([]);
        return OfflineStore.catalogSnapshot().then((snapshot) => {
            const previous = snapshot && Array.isArray(snapshot.items) ? snapshot.items : null;
            const drops = previous ? diffPrices(previous, PRODUCTS) : [];
            return OfflineStore.cacheCatalog(PRODUCTS).then(() => {
                if (!drops.length) return drops;
                if (prefs().priceDrops) {
                    drops.slice(0, 3).forEach((d) => {
                        show('Wholesale rate dropped',
                            `${d.name}: ₹${d.oldPrice}/pc → ₹${d.newPrice}/pc (₹${d.drop} lower per brick).`,
                            { tag: 'price-' + d.id, kind: 'price', url: '#products' });
                    });
                }
                return drops;
            });
        }).catch(() => []);
    }

    // ── Rate card download (explicit offline action) ───────────
    function downloadRateCard() {
        if (!window.OfflineStore || typeof PRODUCTS === 'undefined') {
            if (typeof showToast === 'function') showToast('Offline storage is unavailable in this browser.', 'error');
            return Promise.resolve(false);
        }
        return OfflineStore.cacheCatalog(PRODUCTS).then((res) => {
            renderSettings();
            renderOfflineChip();
            if (typeof showToast === 'function') {
                showToast(`${res.count} brick rates saved for offline use.`, 'success');
            }
            return true;
        });
    }

    // ── User actions from the notification center ──────────────
    function markAllRead() {
        const rows = history().map((n) => Object.assign({}, n, { read: true }));
        setSafeStorage(LOG_KEY, rows);
        renderBellBadge();
        renderCenter();
    }

    function clearAlerts() {
        setSafeStorage(LOG_KEY, []);
        renderBellBadge();
        renderCenter();
    }

    function toggleAlertPref(key, el) {
        const value = el ? Boolean(el.checked) : !prefs()[key];
        const next = savePrefs({ [key]: value });
        if (typeof showToast === 'function') {
            const label = key === 'orderUpdates' ? 'Order status alerts' : 'Price drop alerts';
            showToast(`${label} ${next[key] ? 'enabled' : 'paused'}.`, 'success');
        }
        return next[key];
    }

    function checkAlertsNow() {
        return Promise.all([checkPriceDrops(), checkOrderStatusChanges(), pollRemoteStatus()]).then((res) => {
            const drops = res[0] || [];
            if (typeof showToast === 'function' && !drops.length) {
                showToast('Rate card is up to date — no drops found.', 'success');
            }
            renderCenter();
            return drops;
        });
    }

    // ── Rendering ──────────────────────────────────────────────
    function timeLabel(ts) {
        try {
            return new Date(ts).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        } catch (_e) {
            return '';
        }
    }

    function renderBellBadge() {
        const badge = document.getElementById('alertBadgeNav');
        if (!badge) return;
        const count = unreadCount();
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.hidden = !count;
    }

    function renderSettings() {
        const stateEl = document.getElementById('alertPermissionState');
        const enableBtn = document.getElementById('alertEnableBtn');
        const orderToggle = document.getElementById('alertPrefOrders');
        const priceToggle = document.getElementById('alertPrefPrices');
        const p = prefs();

        if (orderToggle) orderToggle.checked = Boolean(p.orderUpdates);
        if (priceToggle) priceToggle.checked = Boolean(p.priceDrops);

        if (stateEl) {
            const perm = permission();
            if (perm === 'granted') {
                stateEl.textContent = 'Notifications are ON for this device.';
                stateEl.className = 'alert-state on';
            } else if (perm === 'denied') {
                stateEl.textContent = 'Notifications are blocked. Enable them in browser or app settings.';
                stateEl.className = 'alert-state off';
            } else if (perm === 'unsupported') {
                stateEl.textContent = 'This browser cannot show system notifications — alerts appear inside the app.';
                stateEl.className = 'alert-state off';
            } else {
                stateEl.textContent = 'Notifications are OFF. Enable them to get yard dispatch updates.';
                stateEl.className = 'alert-state off';
            }
            if (enableBtn) enableBtn.textContent = perm === 'granted' ? 'Alerts enabled' : 'Enable notifications';
            if (enableBtn) enableBtn.disabled = perm === 'granted';
        }

        const subNote = document.getElementById('alertChannelNote');
        if (subNote) {
            const hasVapid = Boolean(metaContent('web-push-public-key') && metaContent('push-subscribe-endpoint'));
            subNote.textContent = hasVapid
                ? 'Push server configured — alerts can arrive while the app is closed.'
                : 'Local alerts active. A push server (VAPID key + subscribe endpoint) is required for closed-app delivery.';
        }
    }

    function renderCenter() {
        const list = document.getElementById('alertList');
        if (!list) return;
        const rows = history();
        if (!rows.length) {
            list.innerHTML = '<div class="alert-empty">No alerts yet. Order updates and rate drops will appear here.</div>';
        } else {
            list.innerHTML = rows.map((n) => `
                <button type="button" class="alert-row${n.read ? '' : ' unread'}" onclick="PushNotifications.openAlert('${sanitizeHTML(n.id)}')">
                    <span class="alert-row-dot" aria-hidden="true"></span>
                    <span class="alert-row-body">
                        <span class="alert-row-title">${sanitizeHTML(n.title)}</span>
                        <span class="alert-row-text">${sanitizeHTML(n.body)}</span>
                        <span class="alert-row-time">${timeLabel(n.createdAt)}</span>
                    </span>
                </button>`).join('');
        }

        const countEl = document.getElementById('alertUnreadCount');
        if (countEl) countEl.textContent = unreadCount() ? `${unreadCount()} new` : 'All caught up';

        renderOfflineChip();
    }

    function renderOfflineChip() {
        const el = document.getElementById('offlineStoreState');
        if (!el) return;
        const setText = (text) => { el.textContent = text; };
        if (!window.OfflineStore || !OfflineStore.isAvailable()) {
            setText('Offline storage unavailable in this browser.');
            return;
        }
        OfflineStore.status().then((s) => {
            if (!s.savedAt) {
                setText('No rate card saved yet — download it before heading to a remote site.');
                return;
            }
            setText(`${s.cachedRates} brick rates saved · ${timeLabel(s.savedAt)}${s.queuedOrders ? ` · ${s.queuedOrders} order(s) waiting` : ''}`);
        });
    }

    function openAlert(id) {
        const entry = history().find((n) => n.id === id);
        if (!entry) return;
        const rows = history().map((n) => (n.id === id ? Object.assign({}, n, { read: true }) : n));
        setSafeStorage(LOG_KEY, rows);
        renderBellBadge();
        subscribeAndOpen(entry);
    }

    function subscribeAndOpen(entry) {
        if (entry.kind === 'order') {
            if (typeof closeNotificationCenter === 'function') closeNotificationCenter();
            if (typeof openTrackerModal === 'function') openTrackerModal(entry.orderId || undefined);
            return;
        }
        if (entry.kind === 'price' && typeof closeNotificationCenter === 'function') closeNotificationCenter();
        if (entry.url && entry.url.charAt(0) === '#' && typeof scrollToSection === 'function') {
            const target = entry.url.slice(1);
            if (target === 'track') {
                if (typeof openTrackerModal === 'function') openTrackerModal();
            } else if (document.getElementById(target)) {
                scrollToSection(target);
            }
        }
        renderCenter();
    }

    // ── Service worker messages (notification taps) ────────────
    function listenForServiceWorkerClicks() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.addEventListener('message', (event) => {
            const msg = event.data || {};
            if (msg.type !== 'NOTIFICATION_CLICKED') return;
            const payload = msg.payload || {};
            markAllRead();
            if (payload.kind === 'order' && typeof openTrackerModal === 'function') {
                openTrackerModal(payload.orderId || undefined);
                return;
            }
            if (payload.url && payload.url.charAt(0) === '#' && document.getElementById(payload.url.slice(1))) {
                scrollToSection(payload.url.slice(1));
            }
        });
    }

    // ── Initialisation ─────────────────────────────────────────
    function init() {
        if (typeof document === 'undefined') return;
        listenForServiceWorkerClicks();
        renderBellBadge();
        renderSettings();
        renderCenter();

        if (window.OfflineStore) {
            OfflineStore.requestPersistence();
            // First visit seeds the baseline; later visits diff against it.
            const last = OfflineStore.getMeta('priceCheck');
            OfflineStore.setMeta('priceCheck', Date.now());
            if (!last) {
                OfflineStore.cacheCatalog(typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
            } else {
                checkPriceDrops();
            }
        }

        window.addEventListener('online', () => {
            if (window.OfflineStore) checkPriceDrops();
            pollRemoteStatus();
        });
    }

    return {
        init,
        supported,
        permission,
        prefs,
        savePrefs,
        enableAlerts,
        show,
        notifyOrderStatus,
        checkOrderStatusChanges,
        pollRemoteStatus,
        checkPriceDrops,
        checkAlertsNow,
        downloadRateCard,
        diffPrices,
        normaliseStage,
        unreadCount,
        markAllRead,
        clearAlerts,
        toggleAlertPref,
        openAlert,
        renderCenter,
        renderBellBadge,
        renderSettings
    };
})();

window.PushNotifications = PushNotifications;
