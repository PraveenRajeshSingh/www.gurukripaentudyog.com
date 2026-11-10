/* ══════════════════════════════════════════════════════════════════
   COMMERCE STORE — single cart + wishlist state layer
   Used by every page/popup. Keeps legacy globals `cart` / `wishlist`
   in sync so existing callers (addToCart, checkout, invoices) keep working.
   Persistence: gbi.cart.v2 / gbi.wishlist.v2 with migration from gb_*.
   ══════════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    var CART_KEY_V2 = 'gbi.cart.v2';
    var WISH_KEY_V2 = 'gbi.wishlist.v2';
    var CART_KEY_V1 = 'gb_cart';
    var WISH_KEY_V1 = 'gb_wishlist';
    var MEM_NOTICE_KEY = 'gbi.storage.memNotice';

    var cartListeners = [];
    var wishListeners = [];
    var inflight = Object.create(null);
    var memoryOnly = false;
    var memCart = null;
    var memWish = null;

    function parseSafeNumber(v, fallback) {
        if (global.GBI && GBI.Reliability && typeof GBI.Reliability.parseSafeNumber === 'function') {
            return GBI.Reliability.parseSafeNumber(v, { fallback: fallback || 0, min: 0 });
        }
        var n = Number(String(v).replace(/[^\d.-]/g, ''));
        return isFinite(n) ? n : (fallback || 0);
    }

    function readRaw(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            memoryOnly = true;
            return null;
        }
    }

    function writeRaw(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            memoryOnly = true;
            maybeNoticeMemory();
            return false;
        }
    }

    function maybeNoticeMemory() {
        try {
            if (sessionStorage.getItem(MEM_NOTICE_KEY)) return;
            sessionStorage.setItem(MEM_NOTICE_KEY, '1');
        } catch (_e) { /* ignore */ }
        if (typeof showToast === 'function') {
            showToast('Your cart won\'t be kept after you close this page (storage unavailable).', 'warning');
        }
    }

    function backupCorrupt(key, raw) {
        try {
            localStorage.setItem(key + '__corrupt_' + Date.now(), String(raw).slice(0, 4000));
            localStorage.removeItem(key);
        } catch (_e) { /* ignore */ }
    }

    function loadJSON(key, fallback) {
        var raw = readRaw(key);
        if (raw == null || raw === '') return fallback;
        try {
            var parsed = JSON.parse(raw);
            return parsed == null ? fallback : parsed;
        } catch (e) {
            backupCorrupt(key, raw);
            return fallback;
        }
    }

    function migrateCart() {
        var v2 = loadJSON(CART_KEY_V2, null);
        if (Array.isArray(v2)) return v2;
        if (v2 && Array.isArray(v2.items)) return v2.items;
        var v1 = loadJSON(CART_KEY_V1, []);
        return Array.isArray(v1) ? v1 : [];
    }

    function migrateWish() {
        var v2 = loadJSON(WISH_KEY_V2, null);
        if (Array.isArray(v2)) return v2;
        if (v2 && Array.isArray(v2.ids)) return v2.ids;
        var v1 = loadJSON(WISH_KEY_V1, []);
        return Array.isArray(v1) ? v1 : [];
    }

    function syncLegacyGlobals() {
        if (typeof global.cart !== 'undefined') {
            // Keep same array reference when possible
            if (Array.isArray(global.cart)) {
                global.cart.length = 0;
                getCartItems().forEach(function (item) { global.cart.push(item); });
            } else {
                global.cart = getCartItems().slice();
            }
        }
        if (typeof global.wishlist !== 'undefined') {
            if (Array.isArray(global.wishlist)) {
                global.wishlist.length = 0;
                getWishIds().forEach(function (id) { global.wishlist.push(id); });
            } else {
                global.wishlist = getWishIds().slice();
            }
        }
    }

    function getCartItems() {
        if (memCart) return memCart;
        return migrateCart();
    }

    function getWishIds() {
        if (memWish) return memWish;
        return migrateWish().map(function (id) { return parseSafeNumber(id, 0); }).filter(function (id) { return id > 0; });
    }

    function persistCart(items) {
        memCart = items.slice();
        var payload = JSON.stringify({ v: 2, items: items, updatedAt: Date.now() });
        var ok = writeRaw(CART_KEY_V2, payload);
        // Keep v1 mirror for older code paths that still read gb_cart directly
        writeRaw(CART_KEY_V1, JSON.stringify(items));
        syncLegacyGlobals();
        return ok;
    }

    function persistWish(ids) {
        memWish = ids.slice();
        var payload = JSON.stringify({ v: 2, ids: ids, updatedAt: Date.now() });
        var ok = writeRaw(WISH_KEY_V2, payload);
        writeRaw(WISH_KEY_V1, JSON.stringify(ids));
        syncLegacyGlobals();
        return ok;
    }

    function notifyCart() {
        var snapshot = getCartItems().slice();
        cartListeners.forEach(function (fn) {
            try { fn(snapshot); } catch (e) {
                if (global.GBI && GBI.Reliability) GBI.Reliability.pushError({ type: 'cart-sub', message: String(e && e.message) });
            }
        });
        if (typeof updateCartUI === 'function') updateCartUI();
        if (typeof updateCatalogMiniCart === 'function') updateCatalogMiniCart();
        if (typeof renderProducts === 'function') {
            /* cards morph via has-qty — light sync without full re-render */
            snapshot.forEach(function (item) {
                var card = document.querySelector('[data-product-id="' + item.id + '"]');
                if (!card) return;
                card.classList.add('has-qty');
                var disp = card.querySelector('[data-qty-display="' + item.id + '"]');
                if (disp) disp.textContent = String(item.qty || 0);
            });
        }
        document.querySelectorAll('[data-product-id]').forEach(function (card) {
            var id = parseSafeNumber(card.getAttribute('data-product-id'), 0);
            var inCart = snapshot.some(function (i) { return i.id === id; });
            if (!inCart) card.classList.remove('has-qty');
        });
    }

    function notifyWish() {
        var ids = getWishIds().slice();
        wishListeners.forEach(function (fn) {
            try { fn(ids); } catch (e) {
                if (global.GBI && GBI.Reliability) GBI.Reliability.pushError({ type: 'wish-sub', message: String(e && e.message) });
            }
        });
        if (typeof syncWishlistUI === 'function') syncWishlistUI();
        else if (typeof updateWishlistBadges === 'function') updateWishlistBadges();
    }

    function findProduct(id) {
        if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return null;
        return PRODUCTS.find(function (p) { return p.id === id; }) || null;
    }

    function livePrice(p) {
        if (global.GurukripaCatalogPricing && typeof GurukripaCatalogPricing.getProductPrice === 'function') {
            var lp = GurukripaCatalogPricing.getProductPrice(p.id);
            if (lp != null && isFinite(Number(lp))) return Number(lp);
        }
        return Number(p.price) || 0;
    }

    function withLock(key, fn) {
        if (inflight[key]) {
            return { ok: false, reason: 'busy', cart: getCartItems(), wishlist: getWishIds() };
        }
        inflight[key] = true;
        var timer = setTimeout(function () { delete inflight[key]; }, 3000);
        try {
            return fn();
        } finally {
            clearTimeout(timer);
            delete inflight[key];
        }
    }

    function add(productId, qty) {
        return withLock('cart:' + productId, function () {
            var id = parseSafeNumber(productId, 0);
            var q = parseSafeNumber(qty, 1);
            if (!id) return { ok: false, reason: 'invalid-id', cart: getCartItems() };
            if (!isFinite(q) || q <= 0) return { ok: false, reason: 'invalid-qty', cart: getCartItems() };
            var p = findProduct(id);
            if (!p) return { ok: false, reason: 'missing-product', cart: getCartItems() };
            if (p.stock === 'out-of-stock') return { ok: false, reason: 'out-of-stock', cart: getCartItems() };

            var items = getCartItems().map(function (x) { return Object.assign({}, x); });
            var existing = items.find(function (i) { return i.id === id; });
            var price = livePrice(p);
            if (existing) {
                existing.qty = parseSafeNumber(existing.qty, 0) + q;
                existing.price = price;
            } else {
                items.push(Object.assign({}, p, { price: price, qty: q }));
            }
            var prev = getCartItems();
            var saved = persistCart(items);
            if (!saved && !memoryOnly) {
                persistCart(prev);
                return { ok: false, reason: 'storage-full', cart: prev };
            }
            notifyCart();
            return { ok: true, reason: '', cart: getCartItems() };
        });
    }

    function setQty(productId, qty) {
        return withLock('cart:' + productId, function () {
            var id = parseSafeNumber(productId, 0);
            var q = parseSafeNumber(qty, 0);
            if (!id) return { ok: false, reason: 'invalid-id', cart: getCartItems() };
            var items = getCartItems().map(function (x) { return Object.assign({}, x); });
            var item = items.find(function (i) { return i.id === id; });
            if (!item) return { ok: false, reason: 'not-in-cart', cart: getCartItems() };
            if (q <= 0) {
                items = items.filter(function (i) { return i.id !== id; });
            } else {
                item.qty = q;
            }
            var saved = persistCart(items);
            if (!saved && !memoryOnly) return { ok: false, reason: 'storage-full', cart: getCartItems() };
            notifyCart();
            return { ok: true, reason: '', cart: getCartItems() };
        });
    }

    function remove(productId) {
        return setQty(productId, 0);
    }

    function clearCart() {
        return withLock('cart:clear', function () {
            var saved = persistCart([]);
            notifyCart();
            return { ok: !!saved || memoryOnly, reason: saved || memoryOnly ? '' : 'storage-full', cart: getCartItems() };
        });
    }

    function toggleWish(productId) {
        return withLock('wish:' + productId, function () {
            var id = parseSafeNumber(productId, 0);
            if (!id) return { ok: false, reason: 'invalid-id', wishlist: getWishIds(), on: false };
            if (!findProduct(id)) return { ok: false, reason: 'missing-product', wishlist: getWishIds(), on: false };
            var ids = getWishIds().slice();
            var on = ids.indexOf(id) === -1;
            if (on) ids.push(id);
            else ids = ids.filter(function (x) { return x !== id; });
            var saved = persistWish(ids);
            if (!saved && !memoryOnly) return { ok: false, reason: 'storage-full', wishlist: getWishIds(), on: !on };
            notifyWish();
            return { ok: true, reason: '', wishlist: getWishIds(), on: on };
        });
    }

    function hasWish(id) {
        return getWishIds().indexOf(parseSafeNumber(id, 0)) !== -1;
    }

    function removeWish(id) {
        var n = parseSafeNumber(id, 0);
        var ids = getWishIds().filter(function (x) { return x !== n; });
        persistWish(ids);
        notifyWish();
        return { ok: true, wishlist: getWishIds() };
    }

    function subscribeCart(fn) {
        if (typeof fn === 'function') cartListeners.push(fn);
        return function () { cartListeners = cartListeners.filter(function (f) { return f !== fn; }); };
    }

    function subscribeWish(fn) {
        if (typeof fn === 'function') wishListeners.push(fn);
        return function () { wishListeners = wishListeners.filter(function (f) { return f !== fn; }); };
    }

    function onStorage(e) {
        if (!e) return;
        if (e.key === CART_KEY_V2 || e.key === CART_KEY_V1) {
            memCart = null;
            syncLegacyGlobals();
            notifyCart();
        }
        if (e.key === WISH_KEY_V2 || e.key === WISH_KEY_V1) {
            memWish = null;
            syncLegacyGlobals();
            notifyWish();
        }
    }

    if (typeof global.addEventListener === 'function') {
        global.addEventListener('storage', onStorage);
    }

    try {
        if (typeof BroadcastChannel !== 'undefined') {
            var bc = new BroadcastChannel('gbi-commerce');
            bc.onmessage = function (ev) {
                if (!ev || !ev.data) return;
                if (ev.data.type === 'cart') { memCart = null; syncLegacyGlobals(); notifyCart(); }
                if (ev.data.type === 'wish') { memWish = null; syncLegacyGlobals(); notifyWish(); }
            };
            var _persistCart = persistCart;
            persistCart = function (items) {
                var ok = _persistCart(items);
                try { bc.postMessage({ type: 'cart' }); } catch (_e) { /* ignore */ }
                return ok;
            };
            var _persistWish = persistWish;
            persistWish = function (ids) {
                var ok = _persistWish(ids);
                try { bc.postMessage({ type: 'wish' }); } catch (_e) { /* ignore */ }
                return ok;
            };
        }
    } catch (_e) { /* ignore */ }

    // Hydrate legacy globals ASAP if already declared
    function boot() {
        try {
            var items = migrateCart();
            var ids = migrateWish();
            persistCart(items);
            persistWish(ids);
            syncLegacyGlobals();
        } catch (e) {
            if (global.GBI && GBI.Reliability) GBI.Reliability.pushError({ type: 'commerce-boot', message: String(e && e.message) });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

    global.GBI = global.GBI || {};
    global.GBI.Commerce = {
        add: add,
        setQty: setQty,
        remove: remove,
        clear: clearCart,
        get: getCartItems,
        subscribe: subscribeCart,
        toggle: toggleWish,
        has: hasWish,
        removeWish: removeWish,
        getWishlist: getWishIds,
        subscribeWishlist: subscribeWish,
        isMemoryOnly: function () { return memoryOnly; },
        keys: { cart: CART_KEY_V2, wishlist: WISH_KEY_V2, cartLegacy: CART_KEY_V1, wishLegacy: WISH_KEY_V1 }
    };
})(typeof window !== 'undefined' ? window : this);
