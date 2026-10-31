'use strict';
// ══════════════════════════════════════════════════════════════════
// OFFLINE-FIRST STORE (IndexedDB)
// Gurukripa Bricks Industry — device storage for yards with poor signal
// ══════════════════════════════════════════════════════════════════
// What lives here:
//   catalog   — last synced brick rate card (so rates can be read offline)
//   estimates — every wall / house / boundary estimate the builder runs
//   outbox    — orders placed while offline, waiting for a WhatsApp handoff
//   photos    — site inspection photos captured for dispatch planning
//   meta      — small key/value flags (last sync, alert baselines)
//
// Every method returns a Promise. When IndexedDB is unavailable (private
// mode, locked-down WebView) the store transparently falls back to
// localStorage so the estimator keeps working instead of throwing.
// ══════════════════════════════════════════════════════════════════

const OfflineStore = (function () {
    const DB_NAME = 'gurukripa-offline';
    const DB_VERSION = 1;
    const STORE_NAMES = ['catalog', 'estimates', 'outbox', 'photos', 'meta'];
    const LS_PREFIX = 'gb_offline_';
    const MAX_ESTIMATES = 25;

    let dbPromise = null;
    let fallback = false;

    // ── IndexedDB bootstrap ──────────────────────────────────────
    function hasIDB() {
        try {
            return typeof indexedDB !== 'undefined' && indexedDB !== null;
        } catch (_e) {
            return false;
        }
    }

    function open() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve) => {
            if (!hasIDB()) { fallback = true; resolve(null); return; }
            let request;
            try {
                request = indexedDB.open(DB_NAME, DB_VERSION);
            } catch (_e) {
                fallback = true;
                resolve(null);
                return;
            }
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('catalog')) {
                    db.createObjectStore('catalog', { keyPath: 'id' });
                }
                ['estimates', 'outbox', 'photos'].forEach((name) => {
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
                    }
                });
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            };
            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    try { db.close(); } catch (_e) { /* ignore */ }
                    dbPromise = null;
                };
                resolve(db);
            };
            request.onerror = () => { fallback = true; resolve(null); };
            request.onblocked = () => { fallback = true; resolve(null); };
        });
        return dbPromise;
    }

    // ── localStorage fallback (same API, array-per-store) ────────
    function lsRead(name) {
        try {
            const raw = localStorage.getItem(LS_PREFIX + name);
            const rows = raw ? JSON.parse(raw) : [];
            return Array.isArray(rows) ? rows : [];
        } catch (_e) {
            return [];
        }
    }

    function lsWrite(name, rows) {
        try { localStorage.setItem(LS_PREFIX + name, JSON.stringify(rows)); } catch (_e) { /* quota */ }
    }

    // ── Primitive operations ─────────────────────────────────────
    function putRow(name, row) {
        return open().then((db) => {
            if (!db) {
                const rows = lsRead(name);
                if (row.id == null) row.id = 'ls_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                const at = rows.findIndex((r) => String(r.id) === String(row.id));
                if (at >= 0) rows[at] = row; else rows.push(row);
                lsWrite(name, rows);
                return row.id;
            }
            return new Promise((resolve, reject) => {
                let tx;
                try { tx = db.transaction(name, 'readwrite'); } catch (e) { reject(e); return; }
                const req = tx.objectStore(name).put(row);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }).catch(() => null);
    }

    function getRow(name, key) {
        return open().then((db) => {
            if (!db) {
                const rows = lsRead(name);
                return rows.find((r) => String(r.id) === String(key) || String(r.key) === String(key)) || null;
            }
            return new Promise((resolve, reject) => {
                let tx;
                try { tx = db.transaction(name, 'readonly'); } catch (e) { reject(e); return; }
                const req = tx.objectStore(name).get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
        }).catch(() => null);
    }

    function listRows(name) {
        return open().then((db) => {
            if (!db) return lsRead(name);
            return new Promise((resolve, reject) => {
                let tx;
                try { tx = db.transaction(name, 'readonly'); } catch (e) { reject(e); return; }
                const req = tx.objectStore(name).getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            });
        }).catch(() => []);
    }

    function deleteRow(name, key) {
        return open().then((db) => {
            if (!db) {
                lsWrite(name, lsRead(name).filter((r) => String(r.id) !== String(key)));
                return true;
            }
            return new Promise((resolve, reject) => {
                let tx;
                try { tx = db.transaction(name, 'readwrite'); } catch (e) { reject(e); return; }
                tx.objectStore(name).delete(key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        }).catch(() => false);
    }

    // ── Rate card (offline catalog) ──────────────────────────────
    function normaliseProduct(p) {
        return {
            id: p.id,
            name: p.name,
            category: p.category,
            price: Number(p.price) || 0,
            oldPrice: p.oldPrice == null ? null : Number(p.oldPrice),
            unit: p.unit || 'per piece',
            stock: p.stock || 'in-stock'
        };
    }

    function cacheCatalog(products) {
        const items = (products || []).map(normaliseProduct);
        const savedAt = Date.now();
        return putRow('catalog', { id: 'rates', savedAt, items }).then(() => {
            setMeta('lastSync', savedAt);
            return { count: items.length, savedAt };
        });
    }

    function catalogSnapshot() {
        return getRow('catalog', 'rates');
    }

    function getCachedCatalog() {
        return catalogSnapshot().then((snap) => (snap && Array.isArray(snap.items) ? snap.items : []));
    }

    // ── Saved estimates ──────────────────────────────────────────
    function saveEstimate(estimate) {
        const row = Object.assign({ createdAt: Date.now() }, estimate);
        return putRow('estimates', row).then((id) => {
            row.id = id;
            return row;
        });
    }

    function listEstimates(limit) {
        return listRows('estimates').then((rows) => rows
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, limit || MAX_ESTIMATES));
    }

    function clearEstimates() {
        return open().then((db) => {
            if (!db) { lsWrite('estimates', []); return true; }
            return new Promise((resolve, reject) => {
                let tx;
                try { tx = db.transaction('estimates', 'readwrite'); } catch (e) { reject(e); return; }
                tx.objectStore('estimates').clear();
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        }).catch(() => false);
    }

    // ── Offline order outbox ─────────────────────────────────────
    function queueOrder(order) {
        const row = Object.assign({ createdAt: Date.now(), synced: false }, order);
        return putRow('outbox', row).then((id) => {
            row.id = id;
            return row;
        });
    }

    function listOutbox(onlyPending) {
        return listRows('outbox').then((rows) => rows
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
            .filter((r) => (onlyPending ? !r.synced : true)));
    }

    function markOutboxSent(id) {
        return getRow('outbox', id).then((row) => {
            if (!row) return null;
            row.synced = true;
            row.syncedAt = Date.now();
            return putRow('outbox', row);
        });
    }

    function removeOutbox(id) {
        return deleteRow('outbox', id);
    }

    // ── Site inspection photos ───────────────────────────────────
    function savePhoto(photo) {
        const row = Object.assign({ createdAt: Date.now() }, photo);
        return putRow('photos', row).then((id) => {
            row.id = id;
            return row;
        });
    }

    function listPhotos(limit) {
        return listRows('photos').then((rows) => rows
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, limit || 10));
    }

    // ── Meta flags ───────────────────────────────────────────────
    function setMeta(key, value) {
        return putRow('meta', { key, value, updatedAt: Date.now() });
    }

    function getMeta(key) {
        return getRow('meta', key).then((row) => (row ? row.value : null));
    }

    // ── Status for UI badges ─────────────────────────────────────
    function status() {
        return Promise.all([catalogSnapshot(), listOutbox(true)]).then((res) => {
            const snap = res[0];
            const pending = res[1];
            return {
                supported: hasIDB() && !fallback,
                cachedRates: snap && Array.isArray(snap.items) ? snap.items.length : 0,
                savedAt: snap ? snap.savedAt : null,
                queuedOrders: pending.length
            };
        });
    }

    // Keep the request alive across restarts where the browser allows it.
    function requestPersistence() {
        try {
            if (navigator.storage && typeof navigator.storage.persist === 'function') {
                navigator.storage.persist().catch(() => false);
            }
        } catch (_e) { /* unsupported */ }
    }

    return {
        isAvailable: hasIDB,
        requestPersistence,
        cacheCatalog,
        catalogSnapshot,
        getCachedCatalog,
        saveEstimate,
        listEstimates,
        clearEstimates,
        queueOrder,
        listOutbox,
        markOutboxSent,
        removeOutbox,
        savePhoto,
        listPhotos,
        setMeta,
        getMeta,
        status
    };
})();

window.OfflineStore = OfflineStore;
