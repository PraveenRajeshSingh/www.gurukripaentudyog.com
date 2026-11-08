/* ══════════════════════════════════════════════════════════════════
   ACTION DELEGATION — data-action handlers for dynamic lists
   (product cards, cart rows, order cards, saved items).
   CHANGE: polish pass §1 — avoid re-binding after every re-render.
   Keeps the same function names; inline onclick may still exist as
   a transitional fallback until fully migrated.
   ══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    function num(v, fallback) {
        if (window.GBI && GBI.Reliability) return GBI.Reliability.parseSafeNumber(v, { fallback: fallback || 0, min: 0 });
        var n = Number(v);
        return isFinite(n) ? n : (fallback || 0);
    }

    function call(name, args) {
        var fn = window[name];
        if (typeof fn === 'function') return fn.apply(null, args || []);
        // Namespaced fallbacks
        if (name.indexOf('.') > -1) {
            var parts = name.split('.');
            var ctx = window;
            for (var i = 0; i < parts.length - 1; i++) {
                ctx = ctx && ctx[parts[i]];
            }
            var method = parts[parts.length - 1];
            if (ctx && typeof ctx[method] === 'function') return ctx[method].apply(ctx, args || []);
        }
        return undefined;
    }

    // Global aliases for namespaced methods used in HTML onclick
    // CHANGE: fix bare closeCompareModal / orderFromCart when called without namespace
    function installAliases() {
        if (window.CatalogDiscovery && typeof CatalogDiscovery.closeCompareModal === 'function') {
            window.closeCompareModal = window.closeCompareModal || function () {
                return CatalogDiscovery.closeCompareModal.apply(CatalogDiscovery, arguments);
            };
        }
        if (window.WhatsAppOrder && typeof WhatsAppOrder.orderFromCart === 'function') {
            window.orderFromCart = window.orderFromCart || function () {
                return WhatsAppOrder.orderFromCart.apply(WhatsAppOrder, arguments);
            };
        }
    }

    var ACTIONS = {
        'add-to-cart': function (el, e) {
            e.preventDefault();
            var id = num(el.getAttribute('data-id'));
            var qty = num(el.getAttribute('data-qty'), 0);
            if (typeof handleAddToCart === 'function') return handleAddToCart(el, id);
            if (typeof addToCart === 'function') return addToCart(id, qty || undefined);
        },
        'open-product': function (el, e) {
            e.preventDefault();
            call('openProductDetail', [num(el.getAttribute('data-id'))]);
        },
        'toggle-wishlist': function (el, e) {
            e.preventDefault();
            call('toggleWishlist', [num(el.getAttribute('data-id'))]);
        },
        'change-qty': function (el, e) {
            e.preventDefault();
            call('changeQty', [num(el.getAttribute('data-id')), num(el.getAttribute('data-delta'), 0)]);
        },
        'remove-from-cart': function (el, e) {
            e.preventDefault();
            call('removeFromCart', [num(el.getAttribute('data-id'))]);
        },
        'remove-coupon': function (el, e) {
            e.preventDefault();
            call('removeCoupon');
        },
        'pd-qty': function (el, e) {
            e.preventDefault();
            call('changePdQty', [num(el.getAttribute('data-delta'), 0)]);
        },
        'filter-products': function (el, e) {
            e.preventDefault();
            call('filterProducts', [el.getAttribute('data-filter') || 'all']);
        },
        'toggle-compare': function (el, e) {
            e.preventDefault();
            if (window.CatalogDiscovery) CatalogDiscovery.toggleCompare(num(el.getAttribute('data-id')));
        },
        'close-compare': function (el, e) {
            e.preventDefault();
            if (window.CatalogDiscovery) CatalogDiscovery.closeCompareModal();
        },
        'open-bulk-quote': function (el, e) {
            e.preventDefault();
            call('openBulkQuoteModal');
        },
        'open-pincode': function (el, e) {
            e.preventDefault();
            call('openPincodeModal', [el.getAttribute('data-name') || '']);
        },
        'reorder': function (el, e) {
            e.preventDefault();
            call('reorderOrder', [el.getAttribute('data-order-id')]);
        },
        'copy-diagnostics': function () { /* handled in reliability.js */ }
    };

    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest && e.target.closest('[data-action]');
        if (!el) return;
        var action = el.getAttribute('data-action');
        var handler = ACTIONS[action];
        if (!handler) return;
        // Double-submit guard for mutating actions
        var mutating = /add-to-cart|remove-from-cart|reorder|toggle-wishlist/.test(action);
        if (mutating && el.dataset.gbBusy === '1') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (mutating) {
            el.dataset.gbBusy = '1';
            el.classList.add('is-busy');
            el.setAttribute('aria-busy', 'true');
            setTimeout(function () {
                delete el.dataset.gbBusy;
                el.classList.remove('is-busy');
                el.removeAttribute('aria-busy');
            }, 1200);
        }
        try {
            handler(el, e);
        } catch (err) {
            if (window.GBI && GBI.Reliability) GBI.Reliability.pushError({ type: 'action', message: String(err && err.message), action: action });
            if (typeof showToast === 'function') showToast('That action could not complete. Please try again.', 'error');
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installAliases);
    } else {
        installAliases();
    }
    // Re-run after deferred scripts
    setTimeout(installAliases, 0);
    setTimeout(installAliases, 500);
})();
