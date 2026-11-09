'use strict';
/**
 * Centralized storefront pricing authority.
 * PRODUCTS[] is hydrated from this service so homepage, cards, cart, and
 * checkout never maintain separate hardcoded daily rates.
 */
window.GurukripaCatalogPricing = window.GurukripaCatalogPricing || {};

(function (exports) {
    var STORAGE_KEY = 'gb_catalog_prices_v1';
    var HISTORY_KEY = 'gb_price_history_v1';
    var CONFIRM_KEY = 'gb_cart_price_ack';
    var _listeners = [];

    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function readOverlay() {
        return (typeof getSafeStorage === 'function') ? getSafeStorage(STORAGE_KEY, {}) : {};
    }

    function writeOverlay(map) {
        if (typeof setSafeStorage === 'function') setSafeStorage(STORAGE_KEY, map);
    }

    function pushHistory(entry) {
        var list = (typeof getSafeStorage === 'function') ? getSafeStorage(HISTORY_KEY, []) : [];
        list.unshift(entry);
        if (typeof setSafeStorage === 'function') setSafeStorage(HISTORY_KEY, list.slice(0, 200));
    }

    function notify() {
        _listeners.forEach(function (fn) {
            try { fn(exports.snapshot()); } catch (_e) { /* ignore */ }
        });
    }

    exports.onChange = function (fn) {
        if (typeof fn === 'function') _listeners.push(fn);
    };

    /** Apply overlay prices onto the global PRODUCTS array (in place). */
    exports.applyToProducts = function () {
        if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return [];
        var overlay = readOverlay();
        PRODUCTS.forEach(function (p) {
            var o = overlay[String(p.id)];
            if (!o) return;
            if (typeof o.price === 'number' && o.price !== p.price) {
                if (p.oldPrice == null) p.oldPrice = p.price;
                p.price = o.price;
            }
            if (o.oldPrice != null) p.oldPrice = o.oldPrice;
            if (o.wholesalePrice != null) p.wholesalePrice = o.wholesalePrice;
            if (o.retailPrice != null) p.retailPrice = o.retailPrice;
            if (o.bulkPrice != null) p.bulkPrice = o.bulkPrice;
            if (o.minOrderQty != null) p.minOrderQty = o.minOrderQty;
            if (o.stockQty != null) p.stockQty = o.stockQty;
            if (o.priceUpdatedAt) p.priceUpdatedAt = o.priceUpdatedAt;
        });
        return PRODUCTS.slice();
    };

    exports.getProductPrice = function (productId) {
        var overlay = readOverlay();
        var o = overlay[String(productId)];
        if (o && typeof o.price === 'number') return o.price;
        if (typeof PRODUCTS !== 'undefined') {
            var p = PRODUCTS.find(function (x) { return String(x.id) === String(productId); });
            return p ? Number(p.price) : null;
        }
        return null;
    };

    exports.snapshot = function () {
        exports.applyToProducts();
        if (typeof PRODUCTS === 'undefined') return [];
        return PRODUCTS.map(function (p) {
            return {
                id: p.id,
                name: p.name,
                category: p.category,
                price: Number(p.price),
                oldPrice: p.oldPrice != null ? Number(p.oldPrice) : null,
                unit: p.unit,
                img: p.img,
                stock: p.stock,
                priceUpdatedAt: p.priceUpdatedAt || null
            };
        });
    };

    /**
     * Admin / price-manager update — persists overlay + audit history and
     * refreshes PRODUCTS so every UI surface sees the new rate.
     */
    exports.setProductPrice = function (productId, nextPrice, meta) {
        meta = meta || {};
        var price = Number(nextPrice);
        if (isNaN(price) || price < 0) throw new Error('Invalid price');
        var overlay = readOverlay();
        var prev = exports.getProductPrice(productId);
        overlay[String(productId)] = Object.assign({}, overlay[String(productId)] || {}, {
            price: price,
            oldPrice: prev,
            wholesalePrice: meta.wholesalePrice != null ? Number(meta.wholesalePrice) : undefined,
            retailPrice: meta.retailPrice != null ? Number(meta.retailPrice) : price,
            bulkPrice: meta.bulkPrice != null ? Number(meta.bulkPrice) : undefined,
            minOrderQty: meta.minOrderQty != null ? Number(meta.minOrderQty) : undefined,
            stockQty: meta.stockQty != null ? Number(meta.stockQty) : undefined,
            priceUpdatedAt: new Date().toISOString(),
            updatedBy: meta.updatedBy || 'local-admin',
            reason: meta.reason || 'Daily price update'
        });
        writeOverlay(overlay);
        pushHistory({
            productId: String(productId),
            previousPrice: prev,
            newPrice: price,
            reason: meta.reason || 'Daily price update',
            updatedBy: meta.updatedBy || 'local-admin',
            at: new Date().toISOString()
        });
        exports.applyToProducts();
        // Clear cart confirmation when catalogue moves.
        try { sessionStorage.removeItem(CONFIRM_KEY); } catch (_e) { /* ignore */ }
        notify();
        return exports.getProductPrice(productId);
    };

    exports.getHistory = function (productId) {
        var list = (typeof getSafeStorage === 'function') ? getSafeStorage(HISTORY_KEY, []) : [];
        if (!productId) return list;
        return list.filter(function (h) { return String(h.productId) === String(productId); });
    };

    /**
     * Reprice cart lines against current catalogue. Returns change details.
     * Never silently keeps a stale unit price.
     */
    exports.syncCartPrices = function (cartItems) {
        if (!Array.isArray(cartItems)) return { changes: [], cart: [] };
        var changes = [];
        cartItems.forEach(function (item) {
            var current = exports.getProductPrice(item.id);
            if (current == null) return;
            var previous = Number(item.price);
            if (Math.abs(previous - current) > 0.001) {
                changes.push({
                    id: item.id,
                    name: item.name,
                    previousPrice: previous,
                    currentPrice: current
                });
                item.previousPrice = previous;
                item.price = current;
                item.priceChanged = true;
            } else {
                item.priceChanged = false;
            }
        });
        return { changes: changes, cart: cartItems };
    };

    exports.needsCheckoutConfirmation = function (cartItems) {
        var sync = exports.syncCartPrices(cartItems || []);
        if (!sync.changes.length) return false;
        try {
            var ack = sessionStorage.getItem(CONFIRM_KEY);
            if (!ack) return true;
            var parsed = JSON.parse(ack);
            // Require re-ack if prices moved again after last confirmation.
            return JSON.stringify(sync.changes) !== JSON.stringify(parsed.changes || []);
        } catch (_e) {
            return true;
        }
    };

    exports.acknowledgeCartPrices = function (changes) {
        try {
            sessionStorage.setItem(CONFIRM_KEY, JSON.stringify({
                at: Date.now(),
                changes: changes || []
            }));
        } catch (_e) { /* ignore */ }
    };

    /** Pull live catalogue from platform API when gb-api-base is configured. */
    exports.syncFromApi = function (tenantSlug) {
        var slug = tenantSlug || 'gurukripa';
        var baseMeta = document.querySelector('meta[name="gb-api-base"]');
        var base = baseMeta && baseMeta.content ? String(baseMeta.content).replace(/\/$/, '') : '';
        if (!base) {
            exports.applyToProducts();
            return Promise.resolve({ source: 'local', data: exports.snapshot() });
        }
        return fetch(base + '/tenants/' + encodeURIComponent(slug) + '/catalog/prices', {
            headers: { 'Accept': 'application/json' }
        }).then(function (r) {
            if (!r.ok) throw new Error('Catalog sync failed');
            return r.json();
        }).then(function (json) {
            var rows = (json && json.data) || [];
            var overlay = readOverlay();
            rows.forEach(function (row) {
                // Map backend prod ids to numeric storefront ids via category when possible.
                var match = (typeof PRODUCTS !== 'undefined')
                    ? PRODUCTS.find(function (p) {
                        return p.category === row.category ||
                            String(p.name).toLowerCase() === String(row.name || '').toLowerCase();
                    })
                    : null;
                if (!match) return;
                var prev = Number(match.price);
                overlay[String(match.id)] = {
                    price: Number(row.unitPrice),
                    oldPrice: prev !== Number(row.unitPrice) ? prev : match.oldPrice,
                    wholesalePrice: row.wholesalePrice,
                    retailPrice: row.retailPrice,
                    bulkPrice: row.bulkPrice,
                    minOrderQty: row.minOrderQty,
                    stockQty: row.stockQty,
                    priceUpdatedAt: row.priceUpdatedAt || json.updatedAt,
                    updatedBy: 'api',
                    reason: 'Synced from platform catalogue'
                };
            });
            writeOverlay(overlay);
            exports.applyToProducts();
            notify();
            return { source: 'api', data: exports.snapshot() };
        }).catch(function (err) {
            exports.applyToProducts();
            return { source: 'local-fallback', error: String(err && err.message || err), data: exports.snapshot() };
        });
    };

    // Boot: hydrate PRODUCTS from any stored overlay.
    if (typeof document !== 'undefined') {
        var boot = function () { exports.applyToProducts(); };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
    }
})(window.GurukripaCatalogPricing);
