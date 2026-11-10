/* ══════════════════════════════════════════════════════════════════
   ACTION DELEGATION — data-action handlers for dynamic lists
   (product cards, cart rows, order cards, saved items).
   Single click + keyboard path. Commerce mutations go through
   GBI.Commerce when available so storage/UI stay consistent.
   ══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var inflight = Object.create(null);

    function num(v, fallback) {
        if (window.GBI && GBI.Reliability) return GBI.Reliability.parseSafeNumber(v, { fallback: fallback || 0, min: 0 });
        var n = Number(v);
        return isFinite(n) ? n : (fallback || 0);
    }

    function call(name, args) {
        var fn = window[name];
        if (typeof fn === 'function') return fn.apply(null, args || []);
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

    function reasonToast(reason) {
        var map = {
            'out-of-stock': 'Out of stock',
            'invalid-qty': 'Enter a valid quantity',
            'invalid-id': 'Product not found',
            'missing-product': 'Product not found',
            'storage-full': 'Could not save — storage is full',
            'busy': 'Please wait…',
            'not-in-cart': 'Item is not in your cart'
        };
        return map[reason] || 'Could not complete that action';
    }

    function lockKey(action, el) {
        return action + ':' + (el.getAttribute('data-id') || el.getAttribute('data-product-id') || el.id || 'x');
    }

    var ACTIONS = {
        'add-to-cart': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            var id = num(el.getAttribute('data-id') || (el.closest('[data-product-id]') && el.closest('[data-product-id]').getAttribute('data-product-id')));
            var qty = num(el.getAttribute('data-qty'), 0);
            if (typeof handleAddToCart === 'function') return handleAddToCart(el, id);
            if (window.GBI && GBI.Commerce) {
                var res = GBI.Commerce.add(id, qty || 1);
                if (!res.ok) {
                    if (typeof showToast === 'function') showToast(reasonToast(res.reason), 'error');
                    return res;
                }
                if (typeof showToast === 'function') {
                    var p = (typeof PRODUCTS !== 'undefined') && PRODUCTS.find(function (x) { return x.id === id; });
                    showToast(typeof t === 'function' ? t('toast.addedToCart', { name: p ? p.name : 'Item' }) : 'Added to cart', 'success');
                }
                if (typeof bounceCartBadges === 'function') bounceCartBadges();
                return res;
            }
            if (typeof addToCart === 'function') return addToCart(id, qty || undefined);
        },
        'open-product': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('openProductDetail', [num(el.getAttribute('data-id'))]);
        },
        'toggle-wishlist': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            var id = num(el.getAttribute('data-id') || el.getAttribute('data-wish-id'));
            if (typeof toggleWishlist === 'function') return toggleWishlist(id, el);
            if (window.GBI && GBI.Commerce) {
                var res = GBI.Commerce.toggle(id);
                if (!res.ok && typeof showToast === 'function') showToast(reasonToast(res.reason), 'error');
                return res;
            }
        },
        'change-qty': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('changeQty', [num(el.getAttribute('data-id')), num(el.getAttribute('data-delta'), 0)]);
        },
        'remove-from-cart': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('removeFromCart', [num(el.getAttribute('data-id'))]);
        },
        'remove-coupon': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('removeCoupon');
        },
        'pd-qty': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('changePdQty', [num(el.getAttribute('data-delta'), 0)]);
        },
        'filter-products': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('filterProducts', [el.getAttribute('data-filter') || 'all']);
        },
        'toggle-compare': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            if (window.CatalogDiscovery) CatalogDiscovery.toggleCompare(num(el.getAttribute('data-id')));
        },
        'close-compare': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            if (window.CatalogDiscovery) CatalogDiscovery.closeCompareModal();
        },
        'open-bulk-quote': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('openBulkQuoteModal');
        },
        'open-pincode': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('openPincodeModal', [el.getAttribute('data-name') || '']);
        },
        'reorder': function (el, e) {
            if (e && e.preventDefault) e.preventDefault();
            call('reorderOrder', [el.getAttribute('data-order-id')]);
        },
        'copy-diagnostics': function () { /* handled in reliability.js */ }
    };

    function runAction(el, e) {
        var action = el.getAttribute('data-action');
        var handler = ACTIONS[action];
        if (!handler) return false;
        var mutating = /add-to-cart|remove-from-cart|reorder|toggle-wishlist|change-qty/.test(action);
        var key = lockKey(action, el);
        if (mutating && inflight[key]) {
            if (e && e.preventDefault) e.preventDefault();
            return true;
        }
        if (mutating) {
            inflight[key] = true;
            el.classList.add('is-busy');
            el.setAttribute('aria-busy', 'true');
        }
        var release = function () {
            delete inflight[key];
            el.classList.remove('is-busy');
            el.removeAttribute('aria-busy');
            delete el.dataset.gbBusy;
        };
        var timer = setTimeout(release, 1500);
        try {
            handler(el, e);
        } catch (err) {
            if (window.GBI && GBI.Reliability) GBI.Reliability.pushError({ type: 'action', message: String(err && err.message), action: action });
            if (typeof showToast === 'function') showToast('Something went wrong, please try again.', 'error');
        } finally {
            clearTimeout(timer);
            if (mutating) setTimeout(release, 200);
        }
        return true;
    }

    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest && e.target.closest('[data-action]');
        if (!el) return;
        // Ignore plain navigation anchors that only carry data-action="wa"
        if (el.getAttribute('data-action') === 'wa' && el.tagName === 'A') return;
        runAction(el, e);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var el = e.target && e.target.closest && e.target.closest('[data-action]');
        if (!el) return;
        if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
            // Native activation for buttons; still run for role=button spans
            if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
        }
        e.preventDefault();
        runAction(el, e);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installAliases);
    } else {
        installAliases();
    }
    setTimeout(installAliases, 0);
    setTimeout(installAliases, 500);
})();
