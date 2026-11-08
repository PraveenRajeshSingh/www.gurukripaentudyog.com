'use strict';
// ══════════════════════════════════════════════════════════════════
// OFFLINE ACTION QUEUE (IndexedDB via OfflineStore)
// Orders / RFQs / contact forms saved as "Pending, not sent yet".
// Syncs when gb-api-base is set; otherwise offers WhatsApp draft.
// Idempotency keys + exponential backoff prevent duplicate sends.
// ══════════════════════════════════════════════════════════════════

const OfflineQueue = (function () {
    const MAX_ATTEMPTS = 8;
    const BASE_DELAY_MS = 4000;
    let flushing = false;

    function apiEnabled() {
        return !!(window.GBApi && typeof GBApi.enabled === 'function' && GBApi.enabled());
    }

    function makeKey(type, ref) {
        return String(type || 'item') + ':' + String(ref || Date.now()) + ':' + Math.random().toString(36).slice(2, 8);
    }

    function enqueue(type, payload, extras) {
        if (!window.OfflineStore) return Promise.resolve(null);
        const row = Object.assign({
            type: type || 'order',
            status: 'pending',
            label: 'Pending, not sent yet',
            createdAt: Date.now(),
            synced: false,
            attempts: 0,
            nextRetryAt: Date.now(),
            idempotencyKey: (extras && extras.idempotencyKey) || makeKey(type, payload && (payload.ref || payload.id)),
            payload: payload || {},
            message: (extras && extras.message) || '',
            waLink: (extras && extras.waLink) || ''
        }, extras || {});
        return OfflineStore.queueOrder(row);
    }

    function listPending() {
        if (!window.OfflineStore) return Promise.resolve([]);
        return OfflineStore.listOutbox(true).then((rows) =>
            (rows || []).filter((r) => !r.synced && r.status !== 'sent')
        );
    }

    function remove(id) {
        if (!window.OfflineStore) return Promise.resolve(false);
        return OfflineStore.removeOutbox(id);
    }

    function backoffMs(attempts) {
        const exp = Math.min(MAX_ATTEMPTS, Math.max(0, attempts | 0));
        return BASE_DELAY_MS * Math.pow(2, exp);
    }

    async function trySendOne(row) {
        if (!row || row.synced) return { ok: true, row };
        if (row.nextRetryAt && row.nextRetryAt > Date.now()) {
            return { ok: false, deferred: true, row };
        }

        // No backend: keep as draft — never pretend it synced
        if (!apiEnabled()) {
            return { ok: false, needsWhatsApp: true, row };
        }

        try {
            const type = row.type || 'order';
            const body = Object.assign({}, row.payload || {}, {
                idempotencyKey: row.idempotencyKey
            });
            if (type === 'rfq' || type === 'enquiry' || type === 'contact') {
                await GBApi.submitEnquiry(body);
            } else if (type === 'order' && GBApi.endpoints && typeof GBApi.request === 'function') {
                // Prefer public/me enquiry envelope for order tokens when orders API needs auth
                try {
                    await GBApi.request('/me/orders', { method: 'POST', body: body });
                } catch (err) {
                    if (err && err.code === 401) await GBApi.submitEnquiry(Object.assign({ source: 'order-token' }, body));
                    else throw err;
                }
            } else {
                await GBApi.submitEnquiry(Object.assign({ source: type }, body));
            }
            row.synced = true;
            row.status = 'sent';
            row.syncedAt = Date.now();
            row.label = 'Sent';
            await OfflineStore.markOutboxSent(row.id);
            // markOutboxSent only flips synced; persist status fields
            await OfflineStore.queueOrder(Object.assign({}, row, { synced: true }));
            return { ok: true, row };
        } catch (err) {
            const network = err && (err.code === 'network' || err.code === 'disabled');
            row.attempts = (row.attempts || 0) + 1;
            row.nextRetryAt = Date.now() + backoffMs(row.attempts);
            row.lastError = err && err.message ? String(err.message) : 'send failed';
            row.status = 'pending';
            row.label = 'Pending, not sent yet';
            await OfflineStore.queueOrder(row);
            return { ok: false, network: !!network, row, error: err };
        }
    }

    function flush(opts) {
        if (flushing) return Promise.resolve({ sent: 0, pending: 0 });
        flushing = true;
        const silent = !!(opts && opts.silent);
        return listPending().then(async (rows) => {
            let sent = 0;
            let pending = 0;
            let needsWa = 0;
            for (const row of rows) {
                const res = await trySendOne(row);
                if (res.ok) sent++;
                else if (res.needsWhatsApp) needsWa++;
                else pending++;
            }
            if (!silent && typeof showToast === 'function') {
                if (sent) showToast('Synced ' + sent + ' waiting item' + (sent > 1 ? 's' : '') + '.', 'success');
                else if (needsWa && !apiEnabled() && rows.length) {
                    /* WhatsApp draft path — UI buttons handle send */
                }
            }
            if (typeof renderOfflineQueueUI === 'function') renderOfflineQueueUI();
            if (window.WhatsAppOrder && typeof WhatsAppOrder.renderQueuedNotice === 'function') {
                WhatsAppOrder.renderQueuedNotice();
            }
            return { sent, pending: pending + needsWa, needsWa };
        }).finally(() => { flushing = false; });
    }

    function openWhatsAppDraft(id) {
        return listPending().then((rows) => {
            const row = rows.find((r) => String(r.id) === String(id)) || rows[0];
            if (!row) {
                if (typeof showToast === 'function') showToast('No pending items to send.', 'info');
                return false;
            }
            if (!navigator.onLine) {
                if (typeof showToast === 'function') {
                    showToast('WhatsApp needs a network connection. Draft is saved on this device.', 'warning');
                }
                return false;
            }
            const link = row.waLink || (row.message && window.WhatsAppOrder
                ? WhatsAppOrder.buildLink(row.message)
                : '');
            if (link && window.WhatsAppOrder) WhatsAppOrder.openLink(link);
            else if (link) window.open(link, '_blank', 'noopener');
            else {
                if (typeof showToast === 'function') showToast('No WhatsApp message on this draft.', 'warning');
                return false;
            }
            return OfflineStore.markOutboxSent(row.id).then(() => {
                if (typeof renderOfflineQueueUI === 'function') renderOfflineQueueUI();
                if (typeof showToast === 'function') showToast('Opened WhatsApp draft. Marked as handed off.', 'success');
                return true;
            });
        });
    }

    function registerBackgroundSync() {
        try {
            if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) return;
            navigator.serviceWorker.ready.then((reg) => {
                if (reg.sync && typeof reg.sync.register === 'function') {
                    reg.sync.register('gbi-outbox').catch(() => {});
                }
            }).catch(() => {});
        } catch (_e) { /* Safari */ }
    }

    function bindAutoFlush() {
        if (bindAutoFlush._done) return;
        bindAutoFlush._done = true;
        window.addEventListener('online', () => { flush({ silent: false }); registerBackgroundSync(); });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && navigator.onLine) flush({ silent: true });
        });
        if (navigator.onLine) setTimeout(() => flush({ silent: true }), 1200);
        registerBackgroundSync();
    }

    return {
        enqueue,
        listPending,
        remove,
        flush,
        openWhatsAppDraft,
        apiEnabled,
        bindAutoFlush,
        registerBackgroundSync
    };
})();

window.OfflineQueue = OfflineQueue;
